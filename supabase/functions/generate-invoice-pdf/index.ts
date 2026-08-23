import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { buildInvoicePdf, resolveBillingAddress } from "../_shared/invoice-pdf.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const bookingId: string | undefined = body.bookingId;
    const bookingNumber: string | undefined = body.bookingNumber;
    const accessToken: string | undefined = body.accessToken;
    const type: "invoice" | "cancellation" =
      body.type === "cancellation" ? "cancellation" : "invoice";
    const force = body.force === true;

    if (!bookingId && !bookingNumber) return json({ error: "bookingId oder bookingNumber erforderlich" }, 400);
    if (bookingId && !UUID_RE.test(bookingId)) return json({ error: "Ungültige bookingId" }, 400);

    let query = admin.from("tour_bookings").select("*");
    query = bookingId ? query.eq("id", bookingId) : query.eq("booking_number", bookingNumber!);
    const { data: booking } = await query.maybeSingle();
    if (!booking) return json({ error: "Buchung nicht gefunden" }, 404);

    // ── Authorization ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const bearer = authHeader.replace("Bearer ", "").trim();
    let allowed = bearer === serviceKey;
    let actorEmail: string | null = null;

    if (!allowed && accessToken) {
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

    if (!allowed && bearer && bearer !== anonKey) {
      const authClient = createClient(supabaseUrl, anonKey);
      const { data: userData } = await authClient.auth.getUser(bearer);
      const user = userData?.user;
      if (user) {
        actorEmail = user.email ?? null;
        const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
        const isStaff = (roles ?? []).some((r: any) => ["admin", "office", "agent"].includes(r.role));
        const isOwner =
          (booking.user_id && booking.user_id === user.id) ||
          String(booking.contact_email ?? "").toLowerCase() === (user.email ?? "").toLowerCase();
        allowed = isStaff || isOwner;
      }
    }

    if (!allowed) return json({ error: "Nicht autorisiert" }, 403);

    // ── Related data ───────────────────────────────────────────────
    const [tourRes, dateRes, tariffRes, pickupRes] = await Promise.all([
      admin.from("package_tours").select("*").eq("id", booking.tour_id).maybeSingle(),
      admin.from("tour_dates").select("*").eq("id", booking.tour_date_id).maybeSingle(),
      admin.from("tour_tariffs").select("*").eq("id", booking.tariff_id).maybeSingle(),
      booking.pickup_stop_id
        ? admin.from("tour_pickup_stops").select("*").eq("id", booking.pickup_stop_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);

    const year = new Date(booking.created_at ?? Date.now()).getFullYear();
    const suffix = String(booking.booking_number ?? booking.id).replace(/^MT-\d{4}-?/, "").replace(/^MT-/, "");
    const invoiceNumber =
      type === "cancellation" ? `ST-${year}-${suffix}` : `RE-${year}-${suffix}`;
    const storagePath = `${booking.booking_number ?? booking.id}/${invoiceNumber}.pdf`;

    // Reuse stored PDF unless regeneration is requested
    const { data: existing } = await admin
      .from("tour_invoices")
      .select("*")
      .eq("booking_id", booking.id)
      .eq("invoice_type", type)
      .maybeSingle();

    if (!existing || !existing.pdf_path || force) {
      const pdfBytes = await buildInvoicePdf({
        booking,
        tour: tourRes.data,
        date: dateRes.data,
        tariff: tariffRes.data,
        pickupStop: pickupRes.data,
        invoiceNumber,
        isCancellation: type === "cancellation",
      });

      const { error: uploadErr } = await admin.storage
        .from("invoices")
        .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });
      if (uploadErr) {
        console.error("invoice upload failed", uploadErr);
        return json({ error: "Rechnung konnte nicht gespeichert werden", details: uploadErr.message }, 500);
      }

      const gross = Number(booking.total_price ?? 0) * (type === "cancellation" ? -1 : 1);
      const net = gross / 1.19;

      const record = {
        booking_id: booking.id,
        booking_number: booking.booking_number,
        invoice_number: invoiceNumber,
        invoice_type: type,
        amount: gross,
        net_amount: Number(net.toFixed(2)),
        tax_rate: 19,
        tax_amount: Number((gross - net).toFixed(2)),
        status:
          type === "cancellation"
            ? "cancelled"
            : booking.paid_at || booking.status === "confirmed"
              ? "paid"
              : "open",
        billing_address: resolveBillingAddress(booking),
        pdf_path: storagePath,
        currency: "EUR",
        issued_at: existing?.issued_at ?? new Date().toISOString(),
        paid_at: booking.paid_at ?? null,
        cancelled_at: type === "cancellation" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await admin
        .from("tour_invoices")
        .upsert(record, { onConflict: "booking_id,invoice_type" });
      if (upsertErr) console.error("invoice record upsert failed", upsertErr);
    }

    const { data: signed, error: signErr } = await admin.storage
      .from("invoices")
      .createSignedUrl(storagePath, 60 * 60, { download: `${invoiceNumber}.pdf` });

    if (signErr || !signed?.signedUrl) {
      return json({ error: "Download-Link konnte nicht erstellt werden" }, 500);
    }

    console.log(`invoice ${invoiceNumber} served for ${booking.booking_number} (${actorEmail ?? "service"})`);

    return json({
      success: true,
      invoiceNumber,
      bookingNumber: booking.booking_number,
      type,
      path: storagePath,
      url: signed.signedUrl,
    });
  } catch (error: any) {
    console.error("generate-invoice-pdf error", error);
    return json({ error: error?.message ?? "Unbekannter Fehler" }, 500);
  }
});
