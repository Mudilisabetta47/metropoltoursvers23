import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { sendMail, FROM_BOOKING } from "../_shared/mailer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_URL = "https://app.metours.de";
const PAYPAL_API = "https://api-m.paypal.com";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function paypalToken(): Promise<string | null> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_SECRET");
  if (!clientId || !secret) return null;
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    console.error("paypal auth failed", res.status, (await res.text()).slice(0, 300));
    return null;
  }
  return (await res.json()).access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const action: string = body.action;
    const bookingId: string = body.bookingId;
    const accessToken: string | undefined = body.accessToken;

    if (!["cancel", "rebook"].includes(action)) return json({ error: "Ungültige Aktion" }, 400);
    if (!bookingId || !UUID_RE.test(bookingId)) return json({ error: "Ungültige Buchung" }, 400);

    const { data: booking } = await admin
      .from("tour_bookings")
      .select("*, package_tours(destination)")
      .eq("id", bookingId)
      .maybeSingle();
    if (!booking) return json({ error: "Buchung nicht gefunden" }, 404);

    // ── Authorization: guest token or logged-in owner/staff ──
    let actorEmail: string | null = null;
    let actorId: string | null = null;
    let allowed = false;

    if (accessToken) {
      const { data: tokenRow } = await admin
        .from("booking_access_tokens")
        .select("email, expires_at")
        .eq("token", accessToken)
        .maybeSingle();
      if (
        tokenRow &&
        new Date(tokenRow.expires_at) > new Date() &&
        tokenRow.email.toLowerCase() === String(booking.contact_email ?? "").toLowerCase()
      ) {
        allowed = true;
        actorEmail = tokenRow.email;
      }
    }

    if (!allowed) {
      const bearer = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
      if (bearer && bearer !== anonKey) {
        const { data: userData } = await createClient(supabaseUrl, anonKey).auth.getUser(bearer);
        const user = userData?.user;
        if (user) {
          actorId = user.id;
          actorEmail = user.email ?? null;
          const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
          const isStaff = (roles ?? []).some((r: any) => ["admin", "office"].includes(r.role));
          const isOwner =
            (booking.user_id && booking.user_id === user.id) ||
            String(booking.contact_email ?? "").toLowerCase() === (user.email ?? "").toLowerCase();
          allowed = isStaff || isOwner;
        }
      }
    }

    if (!allowed) return json({ error: "Nicht autorisiert" }, 403);

    const logEvent = (payload: Record<string, unknown>) =>
      admin.from("booking_status_events").insert({
        booking_id: booking.id,
        booking_number: booking.booking_number,
        actor_id: actorId,
        actor_email: actorEmail,
        ...payload,
      });

    // ── REBOOKING REQUEST ──────────────────────────────────────────
    if (action === "rebook") {
      const wish = String(body.message ?? "").slice(0, 1000);
      const preferredDate = String(body.preferredDate ?? "").slice(0, 40);
      if (booking.status === "cancelled") return json({ error: "Stornierte Buchungen können nicht umgebucht werden." }, 409);

      await admin.from("rebooking_requests").insert({
        booking_id: booking.id,
        user_id: booking.user_id,
        status: "pending",
        notes: `Wunschtermin: ${preferredDate || "offen"}\n${wish}`,
      });

      await logEvent({
        source: "booking",
        event_type: "rebooking_requested",
        old_status: booking.status,
        new_status: booking.status,
        note: `Umbuchungswunsch: ${preferredDate || "offen"}`,
        metadata: { message: wish },
      });

      await sendMail(admin, {
        from: FROM_BOOKING,
        to: booking.contact_email,
        subject: `Umbuchungsanfrage erhalten – ${booking.booking_number}`,
        template: "rebooking_request_customer",
        bookingId: booking.id,
        bookingNumber: booking.booking_number,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#00CC36;padding:20px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:20px;">METROPOL TOURS</h1></div>
            <div style="padding:24px;color:#333;line-height:1.6;">
              <h2 style="font-size:18px;">Ihre Umbuchungsanfrage</h2>
              <p>Wir haben Ihre Umbuchungsanfrage zur Buchung <strong>${booking.booking_number}</strong> erhalten und melden uns innerhalb von 24 Stunden (Mo–Fr).</p>
              <p><strong>Wunschtermin:</strong> ${preferredDate || "offen"}</p>
              <p style="text-align:center;margin:24px 0;"><a href="${APP_URL}/meine-buchungen" style="background:#00CC36;color:#fff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:700;">Buchung ansehen</a></p>
              <p style="font-size:12px;color:#999;">Referenz: ${booking.booking_number}</p>
            </div>
          </div>`,
      });

      await sendMail(admin, {
        from: FROM_BOOKING,
        to: "buchung@metours.de",
        subject: `Umbuchungsanfrage ${booking.booking_number}`,
        template: "rebooking_request_internal",
        bookingId: booking.id,
        bookingNumber: booking.booking_number,
        html: `<p>Umbuchungsanfrage zu <strong>${booking.booking_number}</strong> (${booking.contact_email})</p>
               <p>Wunschtermin: ${preferredDate || "offen"}</p><p>${wish || "-"}</p>`,
      });

      return json({ success: true, message: "Umbuchungsanfrage wurde übermittelt." });
    }

    // ── CANCELLATION ───────────────────────────────────────────────
    if (booking.status === "cancelled") return json({ error: "Buchung ist bereits storniert." }, 409);
    const reason = String(body.reason ?? "").slice(0, 500);

    let refundAmount = 0;
    let refundReference: string | null = null;
    let refundError: string | null = null;

    if (booking.paid_at && booking.payment_method === "paypal" && booking.paypal_capture_id) {
      const token = await paypalToken();
      if (token) {
        const res = await fetch(`${PAYPAL_API}/v2/payments/captures/${booking.paypal_capture_id}/refund`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: { value: Number(booking.total_price).toFixed(2), currency_code: "EUR" },
            note_to_payer: `Stornierung ${booking.booking_number}`,
          }),
        });
        const refundData = await res.json().catch(() => ({}));
        if (res.ok && refundData?.status) {
          refundAmount = Number(refundData?.amount?.value ?? booking.total_price);
          refundReference = refundData.id ?? null;
        } else {
          refundError = JSON.stringify(refundData).slice(0, 400);
          console.error("paypal refund failed", res.status, refundError);
        }

        await admin.from("payment_audit_log").insert({
          booking_id: booking.id,
          user_id: booking.user_id,
          provider: "paypal",
          operation: "refund",
          order_id: booking.paypal_order_id,
          capture_id: booking.paypal_capture_id,
          expected_amount: Number(booking.total_price),
          actual_amount: refundAmount || null,
          currency: "EUR",
          paypal_status: refundError ? "FAILED" : "COMPLETED",
          result_status: refundError ? "failure" : "success",
          error_message: refundError,
          metadata: { refund_id: refundReference, reason },
        });
      } else {
        refundError = "PayPal nicht konfiguriert";
      }
    }

    await admin
      .from("tour_bookings")
      .update({
        status: "cancelled",
        payment_status: refundAmount > 0 ? "refunded" : booking.payment_status,
        internal_notes: [
          booking.internal_notes || "",
          `--- Storno am ${new Date().toLocaleDateString("de-DE")} durch ${actorEmail ?? "Kunde"} ---`,
          reason ? `Grund: ${reason}` : "",
          refundAmount > 0
            ? `PayPal-Rückerstattung ${refundAmount.toFixed(2)} € (${refundReference})`
            : refundError
              ? `Rückerstattung fehlgeschlagen: ${refundError}`
              : "Keine automatische Rückerstattung",
        ]
          .filter(Boolean)
          .join("\n"),
      })
      .eq("id", booking.id);

    await logEvent({
      source: "booking",
      event_type: "cancelled",
      old_status: booking.status,
      new_status: "cancelled",
      note: reason || "Stornierung durch Kunde",
    });

    if (refundAmount > 0 || refundError) {
      await logEvent({
        source: "payment",
        event_type: refundAmount > 0 ? "refunded" : "refund_failed",
        old_status: booking.payment_status ?? "paid",
        new_status: refundAmount > 0 ? "refunded" : "failed",
        provider: "paypal",
        reference: refundReference,
        amount: refundAmount || null,
        note: refundError,
      });
    }

    // Free up seats
    if (booking.tour_date_id) {
      const { data: dateRow } = await admin
        .from("tour_dates")
        .select("booked_seats")
        .eq("id", booking.tour_date_id)
        .maybeSingle();
      if (dateRow) {
        await admin
          .from("tour_dates")
          .update({ booked_seats: Math.max(0, (dateRow.booked_seats || 0) - booking.participants) })
          .eq("id", booking.tour_date_id);
      }
    }

    // Mark original invoice as cancelled + create Stornorechnung
    await admin
      .from("tour_invoices")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("booking_id", booking.id)
      .eq("invoice_type", "invoice");

    let cancellationInvoice: string | null = null;
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-invoice-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
        body: JSON.stringify({ bookingId: booking.id, type: "cancellation", force: true }),
      });
      const data = await res.json();
      cancellationInvoice = data?.invoiceNumber ?? null;
    } catch (e) {
      console.error("cancellation invoice failed", e);
    }

    const destination = (booking as any).package_tours?.destination ?? "Ihre Reise";
    await sendMail(admin, {
      from: FROM_BOOKING,
      to: booking.contact_email,
      subject: `Stornierungsbestätigung – ${booking.booking_number}`,
      template: "cancellation_confirmation",
      bookingId: booking.id,
      bookingNumber: booking.booking_number,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#00CC36;padding:20px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:20px;">METROPOL TOURS</h1></div>
          <div style="padding:24px;color:#333;line-height:1.6;">
            <h2 style="font-size:18px;">Stornierungsbestätigung</h2>
            <p>Ihre Buchung <strong>${booking.booking_number}</strong> für <strong>${destination}</strong> wurde storniert.</p>
            ${
              refundAmount > 0
                ? `<p><strong>Rückerstattung:</strong> ${refundAmount.toFixed(2)} € werden auf Ihr PayPal-Konto zurückgebucht (5–10 Werktage).</p>`
                : `<p>Eine mögliche Rückerstattung prüfen wir gemäß unseren Stornobedingungen und melden uns.</p>`
            }
            ${cancellationInvoice ? `<p>Ihre Stornorechnung <strong>${cancellationInvoice}</strong> steht in Ihrer Buchungsübersicht zum Download bereit.</p>` : ""}
            <p style="text-align:center;margin:24px 0;"><a href="${APP_URL}/meine-buchungen" style="background:#00CC36;color:#fff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:700;">Meine Buchungen</a></p>
            <p style="font-size:12px;color:#999;">Referenz: ${booking.booking_number} · <a href="${APP_URL}/terms" style="color:#00CC36;">AGB</a></p>
          </div>
        </div>`,
    });

    await sendMail(admin, {
      from: FROM_BOOKING,
      to: "buchung@metours.de",
      subject: `Storno ${booking.booking_number} (${destination})`,
      template: "cancellation_internal",
      bookingId: booking.id,
      bookingNumber: booking.booking_number,
      html: `<p>Buchung <strong>${booking.booking_number}</strong> storniert durch ${actorEmail ?? "Kunde"}.</p>
             <p>Rückerstattung: ${refundAmount > 0 ? refundAmount.toFixed(2) + " €" : refundError || "keine"}</p>
             <p>Grund: ${reason || "-"}</p>`,
    });

    return json({
      success: true,
      refundAmount,
      refundReference,
      refundError,
      cancellationInvoice,
      message:
        refundAmount > 0
          ? `Buchung storniert – ${refundAmount.toFixed(2)} € werden erstattet.`
          : "Buchung wurde storniert.",
    });
  } catch (error: any) {
    console.error("booking-self-service error", error);
    return json({ error: error?.message ?? "Aktion fehlgeschlagen" }, 500);
  }
});
