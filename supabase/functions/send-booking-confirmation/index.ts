import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  email: string;
  firstName: string;
  lastName: string;
  bookingNumber: string;
  from: string;
  to: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  passengers: number;
  totalPrice: number;
  extras: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const booking: BookingConfirmationRequest = await req.json();
    
    console.log("Sending booking confirmation to:", booking.email);
    console.log("Booking details:", JSON.stringify(booking, null, 2));

    const extrasHtml = booking.extras.length > 0 
      ? `<p><strong>Zusatzleistungen:</strong> ${booking.extras.join(", ")}</p>`
      : "";

    const emailResponse = await resend.emails.send({
      from: "GreenBus <onboarding@resend.dev>",
      to: [booking.email],
      subject: `Buchungsbestätigung ${booking.bookingNumber} - ${booking.from} → ${booking.to}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
            .booking-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .route { display: flex; align-items: center; justify-content: center; gap: 15px; font-size: 20px; font-weight: bold; margin: 15px 0; }
            .arrow { color: #22c55e; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
            .detail-row:last-child { border-bottom: none; }
            .label { color: #6b7280; }
            .value { font-weight: 600; }
            .total { background: #22c55e; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚌 Buchung bestätigt!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Vielen Dank für Ihre Buchung bei GreenBus</p>
            </div>
            <div class="content">
              <p>Hallo ${booking.firstName} ${booking.lastName},</p>
              <p>Ihre Busreise wurde erfolgreich gebucht! Hier sind Ihre Buchungsdetails:</p>
              
              <div class="booking-box">
                <div style="text-align: center; margin-bottom: 15px;">
                  <span style="background: #22c55e; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px;">
                    Buchungsnummer: ${booking.bookingNumber}
                  </span>
                </div>
                
                <div class="route">
                  <span>${booking.from}</span>
                  <span class="arrow">→</span>
                  <span>${booking.to}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Datum</span>
                  <span class="value">${booking.departureDate}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Abfahrt</span>
                  <span class="value">${booking.departureTime}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Ankunft</span>
                  <span class="value">${booking.arrivalTime}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Reisende</span>
                  <span class="value">${booking.passengers} Person(en)</span>
                </div>
                ${extrasHtml}
              </div>
              
              <div class="total">
                Gesamtpreis: €${booking.totalPrice.toFixed(2)}
              </div>
              
              <p style="margin-top: 20px;">Bitte zeigen Sie diese Bestätigung oder Ihre Buchungsnummer beim Einsteigen vor.</p>
              <p>Wir wünschen Ihnen eine angenehme Reise!</p>
              <p>Ihr GreenBus Team</p>
            </div>
            <div class="footer">
              <p>Bei Fragen kontaktieren Sie uns unter support@greenbus.de</p>
              <p>© 2024 GreenBus - Nachhaltig reisen</p>
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
