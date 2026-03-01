import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatShortDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return dateStr; }
}

// Bank details
const BANK = {
  recipient: "METROPOL TOURS GmbH",
  iban: "DE89 3704 0044 0532 0130 00",
  bic: "COBADEFFXXX",
  bank: "Commerzbank",
};

// Admin email addresses
const ADMIN_EMAILS = ["info@metours.de", "buchung@metours.de"];

function buildCustomerEmailHtml(booking: any, tour: any, date: any, tariff: any, pickup: any): string {
  const safeFirst = escapeHtml(booking.contact_first_name);
  const safeLast = escapeHtml(booking.contact_last_name);
  const safeDest = escapeHtml(tour?.destination || "");
  const safeBookingNum = escapeHtml(booking.booking_number);
  const isPaid = booking.status === "confirmed" || booking.status === "paid";
  const statusLabel = isPaid ? "✓ Bezahlt" : "⏳ Offen – Überweisung ausstehend";
  const statusColor = isPaid ? "#22c55e" : "#f59e0b";

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
  .container { max-width: 600px; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
  .header h1 { margin: 0; font-size: 22px; }
  .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
  .booking-box { background: #f0fdf4; border-radius: 10px; padding: 20px; margin: 20px 0; }
  .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8f5e9; }
  .detail-row:last-child { border-bottom: none; }
  .label { color: #666; }
  .value { font-weight: 600; }
  .total { background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%); color: white; padding: 16px; border-radius: 10px; text-align: center; font-size: 20px; font-weight: 700; margin-top: 20px; }
  .badge { background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: 600; letter-spacing: 1px; }
  .footer { text-align: center; padding: 20px; color: #888; font-size: 13px; }
  .bank-box { background: #fffbeb; border: 2px solid #f59e0b; border-radius: 10px; padding: 20px; margin: 20px 0; }
  .bank-row { display: flex; justify-content: space-between; padding: 6px 0; }
  .bank-label { color: #92400e; font-size: 13px; }
  .bank-value { font-weight: 700; color: #78350f; }
  .status-badge { padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; display: inline-block; margin-top: 8px; color: white; }
</style></head><body>
<div class="container">
  <div class="header">
    <h1>🚌 Buchung eingegangen!</h1>
    <p style="margin:8px 0 0; opacity:0.9;">Vielen Dank für Ihre Buchung bei METROPOL TOURS</p>
    <div class="badge">${safeBookingNum}</div>
  </div>
  <div class="content">
    <p>Hallo ${safeFirst} ${safeLast},</p>
    <p>Ihre Pauschalreise wurde erfolgreich gebucht! Bitte überweisen Sie den Betrag innerhalb von 5 Werktagen.</p>
    
    <div style="text-align:center;">
      <span class="status-badge" style="background:${statusColor};">${statusLabel}</span>
    </div>

    <div class="booking-box">
      <div class="detail-row"><span class="label">Reiseziel</span><span class="value">${safeDest}</span></div>
      <div class="detail-row"><span class="label">Ort</span><span class="value">${escapeHtml(tour?.location || "")} • ${escapeHtml(tour?.country || "")}</span></div>
      <div class="detail-row"><span class="label">Hinreise</span><span class="value">${date ? formatShortDate(date.departure_date) : "-"}</span></div>
      <div class="detail-row"><span class="label">Rückreise</span><span class="value">${date ? formatShortDate(date.return_date) : "-"}</span></div>
      <div class="detail-row"><span class="label">Dauer</span><span class="value">${date?.duration_days || tour?.duration_days || "-"} Tage</span></div>
      <div class="detail-row"><span class="label">Tarif</span><span class="value">${escapeHtml(tariff?.name || "")}</span></div>
      <div class="detail-row"><span class="label">Teilnehmer</span><span class="value">${booking.participants}</span></div>
      ${pickup ? `<div class="detail-row"><span class="label">Zustieg</span><span class="value">${escapeHtml(pickup.city)} – ${pickup.departure_time?.slice(0, 5)} Uhr</span></div>` : ""}
      <div class="detail-row"><span class="label">Zahlungsart</span><span class="value">Überweisung</span></div>
    </div>

    <div class="bank-box">
      <h3 style="margin:0 0 12px; color:#92400e; font-size:16px;">💳 Überweisungsdaten</h3>
      <div class="bank-row"><span class="bank-label">Empfänger</span><span class="bank-value">${BANK.recipient}</span></div>
      <div class="bank-row"><span class="bank-label">IBAN</span><span class="bank-value">${BANK.iban}</span></div>
      <div class="bank-row"><span class="bank-label">BIC</span><span class="bank-value">${BANK.bic}</span></div>
      <div class="bank-row"><span class="bank-label">Bank</span><span class="bank-value">${BANK.bank}</span></div>
      <div class="bank-row"><span class="bank-label">Verwendungszweck</span><span class="bank-value">Buchung ${safeBookingNum}</span></div>
      <div class="bank-row"><span class="bank-label">Betrag</span><span class="bank-value">${booking.total_price.toFixed(2)} €</span></div>
    </div>

    <div class="total">Gesamtpreis: ${booking.total_price.toFixed(2)} €</div>

    <p style="margin-top:20px;">Nach Zahlungseingang erhalten Sie eine Bestätigung und Ihre vollständigen Reiseunterlagen per E-Mail.</p>
    <p>Bitte erscheinen Sie mindestens <strong>15 Minuten vor Abfahrt</strong> am Treffpunkt.</p>
    <p>Wir wünschen Ihnen eine wunderbare Reise! 🌍</p>
    <p>Ihr METROPOL TOURS Team</p>
  </div>
  <div class="footer">
    <p>Bei Fragen: info@metours.de | Tel: +49 176 47144200</p>
    <p>© ${new Date().getFullYear()} METROPOL TOURS – Komfortabel reisen</p>
  </div>
</div></body></html>`;
}

function buildAdminEmailHtml(booking: any, tour: any, date: any, tariff: any, pickup: any): string {
  const passengers = Array.isArray(booking.passenger_details) ? booking.passenger_details : [];

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; line-height: 1.5; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
  .container { max-width: 600px; margin: 0 auto; }
  .header { background: #1e293b; color: white; padding: 24px; text-align: center; border-radius: 12px 12px 0 0; }
  .content { background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
  .section { margin: 16px 0; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
  .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
  .label { color: #64748b; }
  .value { font-weight: 600; }
  .total-box { background: #dc2626; color: white; padding: 16px; border-radius: 8px; text-align: center; font-size: 20px; font-weight: 700; margin-top: 16px; }
  h3 { margin: 0 0 8px; font-size: 15px; color: #1e293b; }
</style></head><body>
<div class="container">
  <div class="header">
    <h1 style="margin:0; font-size:20px;">🔔 Neue Buchung eingegangen</h1>
    <p style="margin:8px 0 0; opacity:0.8; font-size:14px;">${escapeHtml(booking.booking_number)} – ${escapeHtml(tour?.destination || "")}</p>
  </div>
  <div class="content">
    <div class="section">
      <h3>📋 Buchungsdaten</h3>
      <div class="row"><span class="label">Buchungsnummer</span><span class="value">${escapeHtml(booking.booking_number)}</span></div>
      <div class="row"><span class="label">Status</span><span class="value" style="color:#f59e0b;">⏳ Ausstehend (Überweisung)</span></div>
      <div class="row"><span class="label">Buchungsdatum</span><span class="value">${new Date(booking.created_at).toLocaleDateString("de-DE")} ${new Date(booking.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</span></div>
      <div class="row"><span class="label">Zahlungsart</span><span class="value">Überweisung</span></div>
    </div>

    <div class="section">
      <h3>🚌 Reisedaten</h3>
      <div class="row"><span class="label">Reise</span><span class="value">${escapeHtml(tour?.destination || "")}</span></div>
      <div class="row"><span class="label">Hin</span><span class="value">${date ? formatShortDate(date.departure_date) : "-"}</span></div>
      <div class="row"><span class="label">Rück</span><span class="value">${date ? formatShortDate(date.return_date) : "-"}</span></div>
      <div class="row"><span class="label">Tarif</span><span class="value">${escapeHtml(tariff?.name || "")}</span></div>
      <div class="row"><span class="label">Teilnehmer</span><span class="value">${booking.participants}</span></div>
      ${pickup ? `<div class="row"><span class="label">Zustieg</span><span class="value">${escapeHtml(pickup.city)} – ${pickup.departure_time?.slice(0, 5)}</span></div>` : ""}
    </div>

    <div class="section">
      <h3>👤 Kontakt</h3>
      <div class="row"><span class="label">Name</span><span class="value">${escapeHtml(booking.contact_first_name)} ${escapeHtml(booking.contact_last_name)}</span></div>
      <div class="row"><span class="label">E-Mail</span><span class="value">${escapeHtml(booking.contact_email)}</span></div>
      <div class="row"><span class="label">Telefon</span><span class="value">${escapeHtml(booking.contact_phone || "-")}</span></div>
    </div>

    ${passengers.length > 1 ? `
    <div class="section">
      <h3>👥 Alle Reisenden</h3>
      ${passengers.map((p: any, i: number) => `
        <div class="row"><span class="label">Person ${i + 1}</span><span class="value">${escapeHtml(p.firstName)} ${escapeHtml(p.lastName)}</span></div>
      `).join("")}
    </div>
    ` : ""}

    <div class="section">
      <h3>💰 Preisdetails</h3>
      <div class="row"><span class="label">Grundpreis</span><span class="value">${booking.base_price.toFixed(2)} € p.P.</span></div>
      ${booking.pickup_surcharge > 0 ? `<div class="row"><span class="label">Zustiegsaufpreis</span><span class="value">+${booking.pickup_surcharge.toFixed(2)} €</span></div>` : ""}
      ${booking.discount_amount > 0 ? `<div class="row"><span class="label">Gutschein (${escapeHtml(booking.discount_code || "")})</span><span class="value" style="color:#16a34a;">-${booking.discount_amount.toFixed(2)} €</span></div>` : ""}
    </div>

    <div class="total-box">Gesamtbetrag: ${booking.total_price.toFixed(2)} €</div>

    <p style="margin-top:16px; color:#64748b; font-size:13px; text-align:center;">
      Aktion erforderlich: Zahlungseingang prüfen und Buchung bestätigen im Admin-Panel.
    </p>
  </div>
</div></body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData = await req.json();
    const { bookingId, tourBookingId } = requestData;

    if (tourBookingId) {
      // ── TOUR BOOKING CONFIRMATION ──
      const { data: booking, error: bookingError } = await supabase
        .from("tour_bookings")
        .select("*")
        .eq("id", tourBookingId)
        .single();

      if (bookingError || !booking) {
        return new Response(JSON.stringify({ success: false, error: "Tour booking not found" }), {
          status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Fetch related data
      const [tourRes, dateRes, tariffRes, pickupRes] = await Promise.all([
        supabase.from("package_tours").select("destination, location, country, duration_days").eq("id", booking.tour_id).single(),
        supabase.from("tour_dates").select("departure_date, return_date, duration_days").eq("id", booking.tour_date_id).single(),
        supabase.from("tour_tariffs").select("name").eq("id", booking.tariff_id).single(),
        booking.pickup_stop_id
          ? supabase.from("tour_pickup_stops").select("city, location_name, departure_time").eq("id", booking.pickup_stop_id).single()
          : Promise.resolve({ data: null }),
      ]);

      const tour = tourRes.data;
      const date = dateRes.data;
      const tariff = tariffRes.data;
      const pickup = pickupRes.data;

      const safeDest = escapeHtml(tour?.destination || "");
      const safeBookingNum = escapeHtml(booking.booking_number);

      // 1) Send customer email with bank details
      const customerEmailRes = await resend.emails.send({
        from: "METROPOL TOURS <booking@app.metours.de>",
        to: [booking.contact_email],
        subject: `Buchungsbestätigung ${safeBookingNum} – ${safeDest}`,
        html: buildCustomerEmailHtml(booking, tour, date, tariff, pickup),
      });
      console.log("Customer email sent:", customerEmailRes);

      // 2) Send admin notification to both addresses
      const adminEmailRes = await resend.emails.send({
        from: "METROPOL TOURS System <booking@app.metours.de>",
        to: ADMIN_EMAILS,
        subject: `🔔 Neue Buchung ${safeBookingNum} – ${safeDest} – ${booking.total_price.toFixed(2)}€`,
        html: buildAdminEmailHtml(booking, tour, date, tariff, pickup),
      });
      console.log("Admin email sent:", adminEmailRes);

      return new Response(JSON.stringify({ success: true, data: { customer: customerEmailRes, admin: adminEmailRes } }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } else if (bookingId) {
      // ── REGULAR LINE BOOKING CONFIRMATION (existing logic) ──
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(bookingId)) {
        return new Response(JSON.stringify({ success: false, error: "Invalid bookingId" }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select(`*, trip:trips(departure_date, departure_time, arrival_time, route:routes(name)), origin_stop:stops!bookings_origin_stop_id_fkey(city, name), destination_stop:stops!bookings_destination_stop_id_fkey(city, name)`)
        .eq("id", bookingId)
        .single();

      if (bookingError || !booking) {
        return new Response(JSON.stringify({ success: false, error: "Booking not found" }), {
          status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const safeFirst = escapeHtml(booking.passenger_first_name);
      const safeLast = escapeHtml(booking.passenger_last_name);
      const safeFrom = escapeHtml(booking.origin_stop?.city || "");
      const safeTo = escapeHtml(booking.destination_stop?.city || "");
      const safeTicket = escapeHtml(booking.ticket_number);

      const emailResponse = await resend.emails.send({
        from: "METROPOL TOURS <booking@app.metours.de>",
        to: [booking.passenger_email],
        subject: `Buchungsbestätigung ${safeTicket} – ${safeFrom} → ${safeTo}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
  .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
  .booking-box { background: #f0fdf4; border-radius: 10px; padding: 20px; margin: 20px 0; }
  .route { text-align: center; font-size: 20px; font-weight: bold; margin: 15px 0; }
  .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8f5e9; }
  .total { background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%); color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; margin-top: 20px; }
  .footer { text-align: center; padding: 20px; color: #888; font-size: 13px; }
</style></head><body>
<div class="container">
  <div class="header"><h1>🚌 Buchung bestätigt!</h1><p style="margin:10px 0 0; opacity:0.9;">Vielen Dank für Ihre Buchung</p></div>
  <div class="content">
    <p>Hallo ${safeFirst} ${safeLast},</p>
    <p>Ihre Busreise wurde erfolgreich gebucht!</p>
    <div class="booking-box">
      <div style="text-align:center; margin-bottom:12px;"><span style="background:#1a5f2a; color:white; padding:5px 15px; border-radius:20px; font-size:14px;">${safeTicket}</span></div>
      <div class="route">${safeFrom} → ${safeTo}</div>
      <div class="detail-row"><span>Datum</span><span style="font-weight:600">${booking.trip?.departure_date || ""}</span></div>
      <div class="detail-row"><span>Abfahrt</span><span style="font-weight:600">${booking.trip?.departure_time || ""}</span></div>
      <div class="detail-row"><span>Ankunft</span><span style="font-weight:600">${booking.trip?.arrival_time || ""}</span></div>
    </div>
    <div class="total">Gesamtpreis: €${(booking.price_paid || 0).toFixed(2)}</div>
    <p style="margin-top:20px;">Bitte zeigen Sie diese Bestätigung beim Einsteigen vor.</p>
    <p>Ihr METROPOL TOURS Team</p>
  </div>
  <div class="footer"><p>support@metropol-tours.de</p><p>© ${new Date().getFullYear()} METROPOL TOURS</p></div>
</div></body></html>`,
      });

      return new Response(JSON.stringify({ success: true, data: emailResponse }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "bookingId or tourBookingId required" }), {
      status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending booking confirmation:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
