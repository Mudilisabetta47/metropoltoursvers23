import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailType = "booking_confirmation" | "payment_reminder" | "pre_departure" | "post_trip_review" | "data_completion";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { booking_id, email_type, force } = await req.json() as {
      booking_id: string;
      email_type: EmailType;
      force?: boolean;
    };

    if (!booking_id || !email_type) throw new Error("booking_id and email_type required");

    // Check if already sent (unless forced)
    if (!force) {
      const { data: existing } = await adminClient
        .from("automation_email_log")
        .select("id")
        .eq("booking_id", booking_id)
        .eq("email_type", email_type)
        .eq("status", "sent")
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ success: true, skipped: true, message: "Already sent" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get booking with tour info
    const { data: booking, error: bErr } = await adminClient
      .from("tour_bookings")
      .select("*, tour_dates(*), package_tours(destination, location, country)")
      .eq("id", booking_id)
      .single();

    if (bErr || !booking) throw new Error("Booking not found");

    const tour = (booking as any).package_tours;
    const tourDate = (booking as any).tour_dates;
    const depDate = new Date(tourDate?.departure_date).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
    const retDate = new Date(tourDate?.return_date).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

    let subject = "";
    let htmlBody = "";
    const name = booking.contact_first_name || "Kunde";
    const green = "#00CC36";

    const header = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:0;">
        <div style="background:${green};padding:20px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">METROPOL TOURS</h1>
        </div>
        <div style="padding:24px;">
    `;
    const footer = `
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#999;font-size:11px;text-align:center;">
            METROPOL TOURS Reiseorganisation<br/>
            Buchungsnummer: ${booking.booking_number}
          </p>
        </div>
      </div>
    `;

    switch (email_type) {
      case "booking_confirmation":
        subject = `Buchungsbestätigung ${booking.booking_number} – ${tour?.destination}`;
        htmlBody = `${header}
          <h2 style="color:#333;">Hallo ${name},</h2>
          <p style="color:#555;line-height:1.6;">vielen Dank für Ihre Buchung! Hier Ihre Buchungsdetails:</p>
          <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin:16px 0;">
            <table style="width:100%;font-size:14px;color:#444;">
              <tr><td style="padding:4px 0;font-weight:bold;">Reiseziel:</td><td>${tour?.destination}</td></tr>
              <tr><td style="padding:4px 0;font-weight:bold;">Hinfahrt:</td><td>${depDate}</td></tr>
              <tr><td style="padding:4px 0;font-weight:bold;">Rückfahrt:</td><td>${retDate}</td></tr>
              <tr><td style="padding:4px 0;font-weight:bold;">Teilnehmer:</td><td>${booking.participants}</td></tr>
              <tr><td style="padding:4px 0;font-weight:bold;">Gesamtpreis:</td><td><strong>${Number(booking.total_price).toFixed(2)} €</strong></td></tr>
            </table>
          </div>
          <h3 style="color:#333;">Zahlungsinformationen</h3>
          <div style="background:#f0faf0;border:1px solid ${green}33;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="font-size:14px;color:#444;margin:0 0 8px 0;">Bitte überweisen Sie den Betrag an:</p>
            <table style="font-size:14px;color:#444;">
              <tr><td style="padding:2px 12px 2px 0;font-weight:bold;">IBAN:</td><td>DE XX XXXX XXXX XXXX XXXX XX</td></tr>
              <tr><td style="padding:2px 12px 2px 0;font-weight:bold;">BIC:</td><td>XXXXXXXX</td></tr>
              <tr><td style="padding:2px 12px 2px 0;font-weight:bold;">Verwendungszweck:</td><td>${booking.booking_number}</td></tr>
            </table>
          </div>
          <p style="color:#555;font-size:14px;">Wir freuen uns auf Ihre Reise!</p>
        ${footer}`;
        break;

      case "payment_reminder":
        subject = `Zahlungserinnerung – ${booking.booking_number}`;
        htmlBody = `${header}
          <h2 style="color:#333;">Hallo ${name},</h2>
          <p style="color:#555;line-height:1.6;">wir möchten Sie freundlich daran erinnern, dass die Zahlung für Ihre Buchung <strong>${booking.booking_number}</strong> noch aussteht.</p>
          <div style="background:#fff8e1;border:1px solid #ffc107;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="font-size:14px;color:#444;margin:0;"><strong>Offener Betrag:</strong> ${Number(booking.total_price).toFixed(2)} €</p>
            <p style="font-size:14px;color:#444;margin:8px 0 0 0;"><strong>Verwendungszweck:</strong> ${booking.booking_number}</p>
          </div>
          <p style="color:#555;font-size:14px;">Bitte überweisen Sie den Betrag zeitnah, damit Ihre Buchung bestätigt werden kann.</p>
        ${footer}`;
        break;

      case "pre_departure": {
        // Get pickup stop info
        let pickupInfo = "";
        if (booking.pickup_stop_id) {
          const { data: stop } = await adminClient
            .from("tour_pickup_stops")
            .select("city, location_name, address, meeting_point, departure_time")
            .eq("id", booking.pickup_stop_id)
            .single();
          if (stop) {
            pickupInfo = `
              <tr><td style="padding:4px 0;font-weight:bold;">Abfahrtsort:</td><td>${stop.city} – ${stop.location_name}</td></tr>
              ${stop.address ? `<tr><td style="padding:4px 0;font-weight:bold;">Adresse:</td><td>${stop.address}</td></tr>` : ""}
              ${stop.meeting_point ? `<tr><td style="padding:4px 0;font-weight:bold;">Treffpunkt:</td><td>${stop.meeting_point}</td></tr>` : ""}
              <tr><td style="padding:4px 0;font-weight:bold;">Abfahrt:</td><td>${stop.departure_time} Uhr</td></tr>
            `;
          }
        }

        subject = `Ihre Reise steht bevor! – ${tour?.destination}`;
        htmlBody = `${header}
          <h2 style="color:#333;">Hallo ${name},</h2>
          <p style="color:#555;line-height:1.6;">in wenigen Tagen geht es los! Hier nochmal alle wichtigen Infos:</p>
          <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin:16px 0;">
            <table style="width:100%;font-size:14px;color:#444;">
              <tr><td style="padding:4px 0;font-weight:bold;">Reiseziel:</td><td>${tour?.destination}</td></tr>
              <tr><td style="padding:4px 0;font-weight:bold;">Hinfahrt:</td><td>${depDate}</td></tr>
              ${pickupInfo}
            </table>
          </div>
          <h3 style="color:#333;">📋 Checkliste</h3>
          <ul style="color:#555;font-size:14px;line-height:2;">
            <li>Personalausweis / Reisepass mitnehmen</li>
            <li>Buchungsbestätigung (digital oder ausgedruckt)</li>
            <li>Bequeme Kleidung für die Busfahrt</li>
            <li>Handy-Ladegerät</li>
            <li>Snacks & Getränke für die Fahrt</li>
          </ul>
          <p style="color:#555;font-size:14px;">Wir wünschen Ihnen eine fantastische Reise! 🌍</p>
        ${footer}`;
        break;
      }

      case "post_trip_review":
        subject = `Wie war Ihre Reise nach ${tour?.destination}?`;
        htmlBody = `${header}
          <h2 style="color:#333;">Hallo ${name},</h2>
          <p style="color:#555;line-height:1.6;">wir hoffen, Sie hatten eine wunderbare Reise nach <strong>${tour?.destination}</strong>!</p>
          <p style="color:#555;line-height:1.6;">Ihre Meinung ist uns sehr wichtig. Wie war Ihr Erlebnis?</p>
          <div style="text-align:center;margin:24px 0;">
            <p style="font-size:28px;margin:0;">⭐⭐⭐⭐⭐</p>
            <p style="color:#999;font-size:12px;">Antworten Sie einfach auf diese E-Mail mit Ihrem Feedback!</p>
          </div>
          <p style="color:#555;font-size:14px;">Vielen Dank und bis zur nächsten Reise!</p>
        ${footer}`;
        break;

      case "data_completion": {
        // Create completion token
        const { data: token } = await adminClient
          .from("passenger_data_tokens")
          .insert({ booking_id })
          .select("token")
          .single();

        const baseUrl = req.headers.get("origin") || "https://metropoltours2312admin.lovable.app";
        const completionUrl = `${baseUrl}/passagierdaten?token=${token?.token}`;

        subject = `Bitte ergänzen Sie Ihre Passagierdaten – ${booking.booking_number}`;
        htmlBody = `${header}
          <h2 style="color:#333;">Hallo ${name},</h2>
          <p style="color:#555;line-height:1.6;">für Ihre Buchung fehlen noch Passagierdaten. Bitte ergänzen Sie diese über den folgenden Link:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${completionUrl}" style="display:inline-block;background:${green};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
              Daten ergänzen →
            </a>
          </div>
          <p style="color:#999;font-size:12px;text-align:center;">Der Link ist 7 Tage gültig.</p>
        ${footer}`;
        break;
      }

      default:
        throw new Error(`Unknown email type: ${email_type}`);
    }

    // Send via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "METROPOL TOURS <booking@app.metours.de>",
        to: [booking.contact_email],
        subject,
        html: htmlBody,
      }),
    });

    const emailResult = await emailRes.json();
    const status = emailRes.ok ? "sent" : "failed";

    // Log
    await adminClient.from("automation_email_log").insert({
      booking_id,
      email_type,
      recipient_email: booking.contact_email,
      status,
      error_message: emailRes.ok ? null : JSON.stringify(emailResult),
    });

    if (!emailRes.ok) throw new Error(`Email failed: ${JSON.stringify(emailResult)}`);

    return new Response(JSON.stringify({ success: true, email_type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-automation-email error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
