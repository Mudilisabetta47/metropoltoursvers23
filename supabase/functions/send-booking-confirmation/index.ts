import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Input validation
function validateInput(data: any): { valid: boolean; error?: string } {
  if (!data.bookingId || typeof data.bookingId !== 'string') {
    return { valid: false, error: 'Missing or invalid bookingId' };
  }
  // UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(data.bookingId)) {
    return { valid: false, error: 'Invalid bookingId format' };
  }
  return { valid: true };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT - get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const requestData = await req.json();
    
    // Validate input
    const validation = validateInput(requestData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch booking from database to verify it exists and belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        trip:trips(
          departure_date,
          departure_time,
          arrival_time,
          route:routes(name)
        ),
        origin_stop:stops!bookings_origin_stop_id_fkey(city, name),
        destination_stop:stops!bookings_destination_stop_id_fkey(city, name)
      `)
      .eq('id', requestData.bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found:", bookingError);
      return new Response(
        JSON.stringify({ success: false, error: 'Booking not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify user owns this booking or is authorized
    if (booking.user_id && booking.user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized to access this booking' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Prepare sanitized data for email
    const safeFirstName = escapeHtml(booking.passenger_first_name);
    const safeLastName = escapeHtml(booking.passenger_last_name);
    const safeFrom = escapeHtml(booking.origin_stop?.city || 'Unknown');
    const safeTo = escapeHtml(booking.destination_stop?.city || 'Unknown');
    const safeTicketNumber = escapeHtml(booking.ticket_number);
    const departureDate = booking.trip?.departure_date || 'Unknown';
    const departureTime = booking.trip?.departure_time || 'Unknown';
    const arrivalTime = booking.trip?.arrival_time || 'Unknown';
    const totalPrice = booking.price_paid || 0;
    const extras = Array.isArray(booking.extras) ? booking.extras.map((e: string) => escapeHtml(e)) : [];

    console.log("Sending booking confirmation to:", booking.passenger_email);
    console.log("Booking ID:", requestData.bookingId);
    
    const extrasHtml = extras.length > 0 
      ? `<p><strong>Zusatzleistungen:</strong> ${extras.join(", ")}</p>`
      : "";

    const emailResponse = await resend.emails.send({
      from: "METROPOL TOURS <onboarding@resend.dev>",
      to: [booking.passenger_email],
      subject: `Buchungsbestätigung ${safeTicketNumber} - ${safeFrom} → ${safeTo}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
            .booking-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .route { display: flex; align-items: center; justify-content: center; gap: 15px; font-size: 20px; font-weight: bold; margin: 15px 0; }
            .arrow { color: #1e40af; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
            .detail-row:last-child { border-bottom: none; }
            .label { color: #6b7280; }
            .value { font-weight: 600; }
            .total { background: #1e40af; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚌 Buchung bestätigt!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Vielen Dank für Ihre Buchung bei METROPOL TOURS</p>
            </div>
            <div class="content">
              <p>Hallo ${safeFirstName} ${safeLastName},</p>
              <p>Ihre Busreise wurde erfolgreich gebucht! Hier sind Ihre Buchungsdetails:</p>
              
              <div class="booking-box">
                <div style="text-align: center; margin-bottom: 15px;">
                  <span style="background: #1e40af; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px;">
                    Buchungsnummer: ${safeTicketNumber}
                  </span>
                </div>
                
                <div class="route">
                  <span>${safeFrom}</span>
                  <span class="arrow">→</span>
                  <span>${safeTo}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Datum</span>
                  <span class="value">${departureDate}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Abfahrt</span>
                  <span class="value">${departureTime}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Ankunft</span>
                  <span class="value">${arrivalTime}</span>
                </div>
                ${extrasHtml}
              </div>
              
              <div class="total">
                Gesamtpreis: €${totalPrice.toFixed(2)}
              </div>
              
              <p style="margin-top: 20px;">Bitte zeigen Sie diese Bestätigung oder Ihre Buchungsnummer beim Einsteigen vor.</p>
              <p>Wir wünschen Ihnen eine angenehme Reise!</p>
              <p>Ihr METROPOL TOURS Team</p>
            </div>
            <div class="footer">
              <p>Bei Fragen kontaktieren Sie uns unter support@metropol-tours.de</p>
              <p>© 2024 METROPOL TOURS - Komfortabel reisen</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending booking confirmation:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
