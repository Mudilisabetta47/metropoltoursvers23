import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketRequest {
  bookingId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { bookingId }: TicketRequest = await req.json();

    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: "Booking ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch booking with all related data
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        trip:trips(
          departure_date,
          departure_time,
          arrival_time,
          route:routes(name)
        ),
        origin_stop:stops!bookings_origin_stop_id_fkey(name, city),
        destination_stop:stops!bookings_destination_stop_id_fkey(name, city),
        seat:seats(seat_number)
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Booking fetch error:", bookingError);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate QR Code as base64
    const qrData = JSON.stringify({
      ticketNumber: booking.ticket_number,
      bookingId: booking.id,
      passenger: `${booking.passenger_first_name} ${booking.passenger_last_name}`,
    });
    
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 150,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    // Format date and time
    const departureDate = new Date(booking.trip.departure_date);
    const formattedDate = departureDate.toLocaleDateString("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formatTime = (time: string) => time.slice(0, 5);

    // Parse extras
    const extras = booking.extras || [];
    const extrasHtml = extras.length > 0
      ? extras.map((e: any) => `<div style="display: inline-block; background: #e8f5e9; padding: 4px 12px; border-radius: 12px; margin: 2px; font-size: 12px;">${e.name}</div>`).join("")
      : '<span style="color: #666;">Keine</span>';

    // Generate HTML ticket
    const ticketHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .ticket {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    .header .subtitle {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .ticket-number {
      background: rgba(255,255,255,0.2);
      padding: 8px 16px;
      border-radius: 20px;
      display: inline-block;
      margin-top: 12px;
      font-weight: 600;
      font-size: 16px;
      letter-spacing: 1px;
    }
    
    .content {
      padding: 24px;
    }
    
    .route-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    
    .location {
      text-align: center;
      flex: 1;
    }
    
    .location .city {
      font-size: 20px;
      font-weight: 700;
      color: #1a5f2a;
    }
    
    .location .stop {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
    
    .location .time {
      font-size: 24px;
      font-weight: 600;
      margin-top: 8px;
    }
    
    .arrow {
      flex: 0 0 60px;
      text-align: center;
      font-size: 24px;
      color: #1a5f2a;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .info-item {
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .info-item .label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .info-item .value {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .qr-section {
      text-align: center;
      padding: 20px;
      border-top: 2px dashed #e0e0e0;
      margin-top: 20px;
    }
    
    .qr-section img {
      width: 150px;
      height: 150px;
    }
    
    .qr-section .hint {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }
    
    .footer {
      background: #f8f9fa;
      padding: 16px 24px;
      text-align: center;
      font-size: 11px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    
    .extras-section {
      margin-top: 16px;
    }
    
    .price-highlight {
      background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%);
      color: white;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      margin-top: 20px;
    }
    
    .price-highlight .amount {
      font-size: 28px;
      font-weight: 700;
    }
    
    .price-highlight .label {
      font-size: 12px;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <h1>🚌 CroatiaGo</h1>
      <div class="subtitle">Elektronisches Ticket</div>
      <div class="ticket-number">${booking.ticket_number}</div>
    </div>
    
    <div class="content">
      <div class="route-section">
        <div class="location">
          <div class="city">${booking.origin_stop.city}</div>
          <div class="stop">${booking.origin_stop.name}</div>
          <div class="time">${formatTime(booking.trip.departure_time)}</div>
        </div>
        <div class="arrow">→</div>
        <div class="location">
          <div class="city">${booking.destination_stop.city}</div>
          <div class="stop">${booking.destination_stop.name}</div>
          <div class="time">${formatTime(booking.trip.arrival_time)}</div>
        </div>
      </div>
      
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Fahrgast</div>
          <div class="value">${booking.passenger_first_name} ${booking.passenger_last_name}</div>
        </div>
        <div class="info-item">
          <div class="label">Datum</div>
          <div class="value">${formattedDate}</div>
        </div>
        <div class="info-item">
          <div class="label">Sitzplatz</div>
          <div class="value">${booking.seat.seat_number}</div>
        </div>
        <div class="info-item">
          <div class="label">Route</div>
          <div class="value">${booking.trip.route.name}</div>
        </div>
      </div>
      
      <div class="extras-section">
        <div class="info-item">
          <div class="label">Extras</div>
          <div class="value">${extrasHtml}</div>
        </div>
      </div>
      
      <div class="price-highlight">
        <div class="label">Bezahlter Betrag</div>
        <div class="amount">${booking.price_paid.toFixed(2)} €</div>
      </div>
      
      <div class="qr-section">
        <img src="${qrCodeDataUrl}" alt="QR Code" />
        <div class="hint">Bitte diesen QR-Code bei der Kontrolle vorzeigen</div>
      </div>
    </div>
    
    <div class="footer">
      <p>Buchungsdatum: ${new Date(booking.created_at).toLocaleDateString("de-DE")} | Buchungs-ID: ${booking.id.slice(0, 8)}</p>
      <p style="margin-top: 8px;">Bitte erscheinen Sie mindestens 15 Minuten vor Abfahrt am Abfahrtsort.</p>
    </div>
  </div>
</body>
</html>`;

    console.log("Ticket PDF generated successfully for booking:", bookingId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ticketHtml,
        ticketNumber: booking.ticket_number,
        booking: {
          id: booking.id,
          passengerName: `${booking.passenger_first_name} ${booking.passenger_last_name}`,
          origin: booking.origin_stop.city,
          destination: booking.destination_stop.city,
          date: formattedDate,
          seatNumber: booking.seat.seat_number,
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error generating ticket:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
