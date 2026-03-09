import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    // Authenticate admin user
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Nicht autorisiert");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("Nicht autorisiert");

    // Check admin role
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Nur Admins können Buchungen stornieren");

    const { bookingId, reason, refundType } = await req.json();
    if (!bookingId) throw new Error("bookingId ist erforderlich");

    // Get booking
    const { data: booking, error: bErr } = await admin
      .from("tour_bookings")
      .select("*, package_tours(destination)")
      .eq("id", bookingId)
      .single();

    if (bErr || !booking) throw new Error("Buchung nicht gefunden");
    if (booking.status === "cancelled") throw new Error("Buchung ist bereits storniert");

    let refundResult = null;
    let refundAmount = 0;

    // Process Stripe refund if payment was made via Stripe
    if (stripeKey && booking.stripe_payment_intent_id && booking.paid_at) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      try {
        if (refundType === "full") {
          const refund = await stripe.refunds.create({
            payment_intent: booking.stripe_payment_intent_id,
          });
          refundResult = { id: refund.id, status: refund.status, amount: refund.amount };
          refundAmount = refund.amount / 100;
        } else if (refundType === "partial" && req.body) {
          // Partial refund with custom amount
          const body = await req.json().catch(() => ({}));
          const partialAmount = body.refundAmount || 0;
          if (partialAmount > 0) {
            const refund = await stripe.refunds.create({
              payment_intent: booking.stripe_payment_intent_id,
              amount: Math.round(partialAmount * 100),
            });
            refundResult = { id: refund.id, status: refund.status, amount: refund.amount };
            refundAmount = refund.amount / 100;
          }
        }
      } catch (stripeErr: any) {
        console.error("Stripe refund error:", stripeErr);
        // Continue with cancellation even if refund fails
        refundResult = { error: stripeErr.message };
      }
    }

    // Update booking status
    await admin
      .from("tour_bookings")
      .update({
        status: "cancelled",
        internal_notes: [
          booking.internal_notes || "",
          `\n--- Stornierung am ${new Date().toLocaleDateString("de-DE")} ---`,
          reason ? `Grund: ${reason}` : "",
          refundResult ? `Rückerstattung: ${refundAmount}€ (${JSON.stringify(refundResult)})` : "Keine Rückerstattung",
          `Storniert von: ${user.email}`,
        ]
          .filter(Boolean)
          .join("\n"),
      })
      .eq("id", bookingId);

    // Update booked_seats count
    if (booking.tour_date_id) {
      const { data: dateData } = await admin
        .from("tour_dates")
        .select("booked_seats")
        .eq("id", booking.tour_date_id)
        .single();

      if (dateData) {
        await admin
          .from("tour_dates")
          .update({
            booked_seats: Math.max(0, (dateData.booked_seats || 0) - booking.participants),
          })
          .eq("id", booking.tour_date_id);
      }
    }

    // Log audit entry
    await admin.from("tour_booking_audit").insert({
      booking_id: bookingId,
      action: "cancellation",
      field_name: "status",
      old_value: booking.status,
      new_value: "cancelled",
      performed_by: user.id,
      performed_by_email: user.email,
    });

    // Send cancellation confirmation email
    const origin = req.headers.get("origin") || "https://app.metours.de";
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const tour = (booking as any).package_tours;
      const green = "#00CC36";
      const name = booking.contact_first_name || "Kunde";

      const htmlBody = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
          <div style="background:${green};padding:20px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">METROPOL TOURS</h1>
          </div>
          <div style="padding:24px;">
            <h2 style="color:#333;">Stornierungsbestätigung</h2>
            <p style="color:#555;line-height:1.6;">Hallo ${name},</p>
            <p style="color:#555;line-height:1.6;">Ihre Buchung <strong>${booking.booking_number}</strong> für <strong>${tour?.destination || "Ihre Reise"}</strong> wurde storniert.</p>
            ${
              refundAmount > 0
                ? `<div style="background:#f0faf0;border:1px solid ${green}33;border-radius:8px;padding:16px;margin:16px 0;">
                    <p style="font-size:14px;color:#444;margin:0;"><strong>Rückerstattung:</strong> ${refundAmount.toFixed(2)} € werden auf Ihr Zahlungsmittel zurückerstattet.</p>
                    <p style="font-size:12px;color:#999;margin:8px 0 0 0;">Die Gutschrift kann 5-10 Werktage dauern.</p>
                  </div>`
                : `<p style="color:#555;font-size:14px;">Es wurde keine Rückerstattung vorgenommen.</p>`
            }
            ${reason ? `<p style="color:#555;font-size:14px;"><strong>Grund:</strong> ${reason}</p>` : ""}
            <p style="color:#555;font-size:14px;">Bei Fragen kontaktieren Sie uns gerne unter info@metours.de.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="color:#999;font-size:11px;text-align:center;">
              METROPOL TOURS Reiseorganisation<br/>
              Buchungsnummer: ${booking.booking_number}
            </p>
          </div>
        </div>
      `;

      // Send to customer
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "METROPOL TOURS <booking@app.metours.de>",
          to: [booking.contact_email],
          subject: `Stornierungsbestätigung – ${booking.booking_number}`,
          html: htmlBody,
        }),
      });

      // Send notification to admin emails
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "METROPOL TOURS <booking@app.metours.de>",
          to: ["info@metours.de", "buchung@metours.de"],
          subject: `⚠️ Stornierung: ${booking.booking_number} – ${tour?.destination}`,
          html: `<p>Buchung <strong>${booking.booking_number}</strong> wurde von ${user.email} storniert.</p>
                 <p>Kunde: ${booking.contact_first_name} ${booking.contact_last_name} (${booking.contact_email})</p>
                 <p>Rückerstattung: ${refundAmount > 0 ? refundAmount.toFixed(2) + " €" : "Keine"}</p>
                 ${reason ? `<p>Grund: ${reason}</p>` : ""}`,
        }),
      });

      // Log email
      await admin.from("automation_email_log").insert({
        booking_id: bookingId,
        email_type: "cancellation_confirmation",
        recipient_email: booking.contact_email,
        status: "sent",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        refund: refundResult,
        refundAmount,
        message: `Buchung ${booking.booking_number} wurde storniert${refundAmount > 0 ? ` und ${refundAmount.toFixed(2)}€ zurückerstattet` : ""}.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Cancel booking error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
