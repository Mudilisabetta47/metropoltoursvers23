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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const requestData = await req.json();
    const { bookingId, tourBookingId } = requestData;

    // Determine booking type
    if (tourBookingId) {
      // ── TOUR BOOKING CONFIRMATION ──
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

      // Verify ownership
      if (booking.user_id && booking.user_id !== user.id) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
          status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
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

      const safeFirst = escapeHtml(booking.contact_first_name);
      const safeLast = escapeHtml(booking.contact_last_name);
      const safeDest = escapeHtml(tour?.destination || "");
      const safeBookingNum = escapeHtml(booking.booking_number);

      const emailResponse = await resend.emails.send({
        from: "METROPOL TOURS <buchungsbestätigung@app.metours.de>",
        to: [booking.contact_email],
        subject: `Buchungsbestätigung ${safeBookingNum} – ${safeDest}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8">
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
  .cta { display: inline-block; background: #1a5f2a; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
</style></head><body>
<div class="container">
  <div class="header">
    <h1>🚌 Buchung bestätigt!</h1>
    <p style="margin:8px 0 0; opacity:0.9;">Vielen Dank für Ihre Buchung bei METROPOL TOURS</p>
    <div class="badge">${safeBookingNum}</div>
  </div>
  <div class="content">
    <p>Hallo ${safeFirst} ${safeLast},</p>
    <p>Ihre Pauschalreise wurde erfolgreich gebucht! Hier sind Ihre Reisedetails:</p>
    <div class="booking-box">
      <div class="detail-row"><span class="label">Reiseziel</span><span class="value">${safeDest}</span></div>
      <div class="detail-row"><span class="label">Ort</span><span class="value">${escapeHtml(tour?.location || "")} • ${escapeHtml(tour?.country || "")}</span></div>
      <div class="detail-row"><span class="label">Hinreise</span><span class="value">${date ? formatShortDate(date.departure_date) : "-"}</span></div>
      <div class="detail-row"><span class="label">Rückreise</span><span class="value">${date ? formatShortDate(date.return_date) : "-"}</span></div>
      <div class="detail-row"><span class="label">Dauer</span><span class="value">${date?.duration_days || tour?.duration_days || "-"} Tage</span></div>
      <div class="detail-row"><span class="label">Tarif</span><span class="value">${escapeHtml(tariff?.name || "")}</span></div>
      <div class="detail-row"><span class="label">Teilnehmer</span><span class="value">${booking.participants}</span></div>
      ${pickup ? `<div class="detail-row"><span class="label">Zustieg</span><span class="value">${escapeHtml(pickup.city)} – ${pickup.departure_time?.slice(0, 5)} Uhr</span></div>` : ""}
    </div>
    <div class="total">${booking.total_price.toFixed(2)} €</div>
    <p style="margin-top:20px;">Ihre vollständigen Reiseunterlagen (Bestätigung, Rechnung & Hotel-Voucher) können Sie jederzeit in Ihrem Buchungsbereich herunterladen.</p>
    <p>Bitte erscheinen Sie mindestens <strong>15 Minuten vor Abfahrt</strong> am Treffpunkt.</p>
    <p>Wir wünschen Ihnen eine wunderbare Reise! 🌍</p>
    <p>Ihr METROPOL TOURS Team</p>
  </div>
  <div class="footer">
    <p>Bei Fragen: support@metropol-tours.de</p>
    <p>© ${new Date().getFullYear()} METROPOL TOURS – Komfortabel reisen</p>
  </div>
</div></body></html>`,
      });

      console.log("Tour booking confirmation email sent:", emailResponse);
      return new Response(JSON.stringify({ success: true, data: emailResponse }), {
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

      const { data: booking, error: bookingError } = await supabaseUser
        .from("bookings")
        .select(`*, trip:trips(departure_date, departure_time, arrival_time, route:routes(name)), origin_stop:stops!bookings_origin_stop_id_fkey(city, name), destination_stop:stops!bookings_destination_stop_id_fkey(city, name)`)
        .eq("id", bookingId)
        .single();

      if (bookingError || !booking) {
        return new Response(JSON.stringify({ success: false, error: "Booking not found" }), {
          status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (booking.user_id && booking.user_id !== user.id) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
          status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const safeFirst = escapeHtml(booking.passenger_first_name);
      const safeLast = escapeHtml(booking.passenger_last_name);
      const safeFrom = escapeHtml(booking.origin_stop?.city || "");
      const safeTo = escapeHtml(booking.destination_stop?.city || "");
      const safeTicket = escapeHtml(booking.ticket_number);

      const emailResponse = await resend.emails.send({
        from: "METROPOL TOURS <buchungsbestätigung@app.metours.de>",
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
