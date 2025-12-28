import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 ticket downloads per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }
  
  record.count++;
  return { allowed: true };
}

// Input validation
function validateInput(data: any): { valid: boolean; error?: string; mode: 'authenticated' | 'guest' } {
  // Mode 1: Authenticated with bookingId
  if (data.bookingId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data.bookingId)) {
      return { valid: false, error: 'Invalid booking ID format', mode: 'authenticated' };
    }
    return { valid: true, mode: 'authenticated' };
  }
  
  // Mode 2: Guest with ticket number + email
  if (data.ticketNumber && data.email) {
    const ticketRegex = /^TKT-\d{4}-\d{6}$/;
    if (!ticketRegex.test(data.ticketNumber.toUpperCase())) {
      return { valid: false, error: 'Invalid ticket number format', mode: 'guest' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { valid: false, error: 'Invalid email format', mode: 'guest' };
    }
    
    return { valid: true, mode: 'guest' };
  }
  
  return { valid: false, error: 'Missing required fields', mode: 'authenticated' };
}

// HTML escape function
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    const rateLimitResult = checkRateLimit(clientIp);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfter || 60),
            ...corsHeaders 
          } 
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const requestData = await req.json();
    
    // Validate input
    const validation = validateInput(requestData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let booking: any = null;
    let isAuthorized = false;

    if (validation.mode === 'authenticated') {
      // Authenticated mode: Verify JWT and check ownership
      const authHeader = req.headers.get('Authorization');
      
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create client with user's JWT
      const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      // Verify user
      const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch booking using service role
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: bookingData, error: bookingError } = await supabaseAdmin
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
        .eq("id", requestData.bookingId)
        .single();

      if (bookingError || !bookingData) {
        return new Response(
          JSON.stringify({ error: 'Ticket not found' }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      booking = bookingData;

      // Check ownership or role
      if (booking.user_id === user.id) {
        isAuthorized = true;
      } else {
        // Check if user is agent/admin
        const { data: roles } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        isAuthorized = roles?.some(r => ['agent', 'admin'].includes(r.role)) || false;
      }

      if (!isAuthorized) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

    } else {
      // Guest mode: Verify ticket number + email
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      const ticketNumber = requestData.ticketNumber.toUpperCase().trim();
      const email = requestData.email.toLowerCase().trim();

      const { data: bookingData, error: bookingError } = await supabaseAdmin
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
        .eq("ticket_number", ticketNumber)
        .single();

      if (bookingError || !bookingData) {
        return new Response(
          JSON.stringify({ error: 'Ticket not found. Please verify your details.' }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify email matches
      if (bookingData.passenger_email.toLowerCase() !== email) {
        return new Response(
          JSON.stringify({ error: 'Ticket not found. Please verify your details.' }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      booking = bookingData;
      isAuthorized = true;
    }

    // Generate QR Code as base64 (minimal data)
    const qrData = JSON.stringify({
      t: booking.ticket_number,
      s: booking.seat.seat_number,
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

    // Escape user-provided data
    const safeFirstName = escapeHtml(booking.passenger_first_name);
    const safeLastName = escapeHtml(booking.passenger_last_name);
    const safeOriginCity = escapeHtml(booking.origin_stop.city);
    const safeDestCity = escapeHtml(booking.destination_stop.city);
    const safeOriginStop = escapeHtml(booking.origin_stop.name);
    const safeDestStop = escapeHtml(booking.destination_stop.name);
    const safeSeatNumber = escapeHtml(booking.seat.seat_number);
    const safeRouteName = escapeHtml(booking.trip.route.name);
    const safeTicketNumber = escapeHtml(booking.ticket_number);

    // Parse extras safely
    const extras = booking.extras || [];
    const extrasHtml = extras.length > 0
      ? extras.map((e: any) => `<div style="display: inline-block; background: #e8f5e9; padding: 4px 12px; border-radius: 12px; margin: 2px; font-size: 12px;">${escapeHtml(e.name || '')}</div>`).join("")
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
      <h1>🚌 METROPOL TOURS</h1>
      <div class="subtitle">Elektronisches Ticket</div>
      <div class="ticket-number">${safeTicketNumber}</div>
    </div>
    
    <div class="content">
      <div class="route-section">
        <div class="location">
          <div class="city">${safeOriginCity}</div>
          <div class="stop">${safeOriginStop}</div>
          <div class="time">${formatTime(booking.trip.departure_time)}</div>
        </div>
        <div class="arrow">→</div>
        <div class="location">
          <div class="city">${safeDestCity}</div>
          <div class="stop">${safeDestStop}</div>
          <div class="time">${formatTime(booking.trip.arrival_time)}</div>
        </div>
      </div>
      
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Fahrgast</div>
          <div class="value">${safeFirstName} ${safeLastName}</div>
        </div>
        <div class="info-item">
          <div class="label">Datum</div>
          <div class="value">${formattedDate}</div>
        </div>
        <div class="info-item">
          <div class="label">Sitzplatz</div>
          <div class="value">${safeSeatNumber}</div>
        </div>
        <div class="info-item">
          <div class="label">Route</div>
          <div class="value">${safeRouteName}</div>
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
      <p>Buchungsdatum: ${new Date(booking.created_at).toLocaleDateString("de-DE")}</p>
      <p style="margin-top: 8px;">Bitte erscheinen Sie mindestens 15 Minuten vor Abfahrt am Abfahrtsort.</p>
    </div>
  </div>
</body>
</html>`;

    console.log("Ticket PDF generated for:", safeTicketNumber);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ticketHtml,
        ticketNumber: booking.ticket_number,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error generating ticket:", error);
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
