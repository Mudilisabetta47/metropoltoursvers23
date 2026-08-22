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
            arrival_date,
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
            arrival_date,
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

    // Generate QR Code as base64 — use plain ticket number so the scanner can read it
    const qrData = booking.ticket_number;
    
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    // ---- Company contact data from system settings (never hardcoded in the frontend) ----
    const settingsClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: generalSettings } = await settingsClient
      .from("app_settings")
      .select("settings")
      .eq("section_key", "general")
      .maybeSingle();
    const company = (generalSettings?.settings ?? {}) as Record<string, string>;
    const companyName = escapeHtml(company.name || "METROPOL TOURS");
    const companyPhone = escapeHtml(company.phone || "");
    const companyEmail = escapeHtml(company.email || "");
    const companyWeb = escapeHtml(company.website || "");

    // ---- Dates / times (fully dynamic, overnight aware) ----
    const dFmt = (d: Date) =>
      d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    const dFmtLong = (d: Date) =>
      d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "long", year: "numeric" });
    const formatTime = (time: string | null) => (time ? String(time).slice(0, 5) : "--:--");

    const departureDate = new Date(`${booking.trip.departure_date}T00:00:00`);
    let arrivalDate: Date;
    if (booking.trip.arrival_date) {
      arrivalDate = new Date(`${booking.trip.arrival_date}T00:00:00`);
    } else {
      arrivalDate = new Date(departureDate);
      const dep = formatTime(booking.trip.departure_time);
      const arr = formatTime(booking.trip.arrival_time);
      if (arr !== "--:--" && dep !== "--:--" && arr <= dep) {
        arrivalDate.setDate(arrivalDate.getDate() + 1);
      }
    }
    const overnightDays = Math.round(
      (arrivalDate.getTime() - departureDate.getTime()) / 86400000,
    );

    // Escape user-provided data
    const safeFirstName = escapeHtml(booking.passenger_first_name);
    const safeLastName = escapeHtml(booking.passenger_last_name);
    const originCity = booking.origin_stop?.city || booking.origin_stop?.name || "";
    const destCity = booking.destination_stop?.city || booking.destination_stop?.name || "";
    const safeOriginCity = escapeHtml(originCity);
    const safeDestCity = escapeHtml(destCity);
    const safeOriginStop = escapeHtml(booking.origin_stop?.name || "");
    const safeDestStop = escapeHtml(booking.destination_stop?.name || "");
    const safeSeatNumber = escapeHtml(booking.seat?.seat_number || "");
    const safeTicketNumber = escapeHtml(booking.ticket_number);
    const safeBookingNumber = escapeHtml(booking.booking_number || "");

    // Route: always the concrete origin -> destination of THIS booking
    const routeLabel = `${safeOriginCity} → ${safeDestCity}`;

    // Payment method (dynamic)
    const paymentLabels: Record<string, string> = {
      card: "Kreditkarte",
      creditcard: "Kreditkarte",
      paypal: "PayPal",
      stripe: "Kreditkarte",
      invoice: "Rechnung",
      test: "Testzahlung (Sandbox)",
    };
    const paymentLabel = escapeHtml(
      paymentLabels[String(booking.payment_method || "").toLowerCase()] ||
        booking.payment_method ||
        "—",
    );

    // Luggage (dynamic; fallback to the configured standard allowance)
    const luggage = Array.isArray(booking.luggage) ? booking.luggage : [];
    const luggageItems: string[] = luggage.length > 0
      ? luggage.map((l: any) =>
          `${escapeHtml(String(l.quantity ?? 1))} × ${escapeHtml(l.name || l.type || "Gepäckstück")}`)
      : ["1 × Reisegepäck (max. 20 kg)", "1 × Handgepäck"];

    // Optional extras – only rendered when present
    const extras = Array.isArray(booking.extras) ? booking.extras : [];
    const extrasHtml = extras.length > 0
      ? extras.map((e: any) => `<span class="chip">${escapeHtml(e.name || "")}</span>`).join("")
      : "";

    const isTest = booking.is_test === true;

    const ticketHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ticket ${safeTicketNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    :root { --green:#00892c; --green-dark:#0b5c26; --ink:#101512; --muted:#6b7280; --line:#e6e8ea; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif; background:#f2f4f3; color:var(--ink); padding:20px 12px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .ticket { max-width:620px; margin:0 auto; background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,.09); }
    .header { background:linear-gradient(135deg,var(--green-dark) 0%,var(--green) 100%); color:#fff; padding:26px 24px; text-align:center; }
    .header .brand { font-size:22px; font-weight:800; letter-spacing:2px; }
    .header .subtitle { font-size:13px; opacity:.92; margin-top:4px; }
    .header .tnr { display:inline-block; margin-top:14px; background:rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.28); padding:7px 16px; border-radius:999px; font-weight:600; font-size:14px; letter-spacing:1px; }
    .testbadge { display:inline-block; margin-top:10px; background:#b45309; color:#fff; padding:5px 14px; border-radius:999px; font-size:12px; font-weight:700; letter-spacing:1px; }
    .content { padding:22px 24px 8px; }
    .route-head { text-align:center; padding:18px 12px; border:1px solid var(--line); border-radius:14px; background:#fafbfa; }
    .route-head .cities { font-size:26px; font-weight:800; text-transform:uppercase; letter-spacing:.5px; color:var(--green-dark); line-height:1.25; }
    .legs { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:14px; }
    .leg { border:1px solid var(--line); border-radius:14px; padding:14px 16px; }
    .leg .lbl { font-size:11px; font-weight:700; letter-spacing:1px; color:var(--green); text-transform:uppercase; }
    .leg .stop { font-size:15px; font-weight:600; margin-top:6px; }
    .leg .date { font-size:13px; color:var(--muted); margin-top:4px; }
    .leg .time { font-size:26px; font-weight:800; margin-top:6px; line-height:1; }
    .nextday { display:inline-block; margin-top:8px; background:#fff4e5; color:#9a5b00; border:1px solid #ffd9a8; font-size:11px; font-weight:700; padding:3px 9px; border-radius:999px; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px; }
    .box { border:1px solid var(--line); border-radius:14px; padding:14px 16px; }
    .box .lbl { font-size:11px; font-weight:700; letter-spacing:1px; color:var(--muted); text-transform:uppercase; }
    .box .val { font-size:17px; font-weight:700; margin-top:5px; }
    .box ul { list-style:none; margin-top:6px; }
    .box li { font-size:14px; font-weight:500; padding:3px 0; }
    .chip { display:inline-block; background:#e9f7ee; color:var(--green-dark); padding:4px 11px; border-radius:999px; margin:3px 4px 0 0; font-size:12px; font-weight:600; }
    .price { margin-top:14px; background:linear-gradient(135deg,var(--green-dark) 0%,var(--green) 100%); color:#fff; border-radius:14px; padding:18px; text-align:center; }
    .price .lbl { font-size:11px; letter-spacing:1.5px; text-transform:uppercase; opacity:.9; font-weight:700; }
    .price .amount { font-size:32px; font-weight:800; margin-top:4px; }
    .price .pm { font-size:13px; opacity:.95; margin-top:6px; }
    .qr { text-align:center; margin-top:18px; padding:22px 16px 6px; border-top:2px dashed var(--line); }
    .qr img { width:190px; height:190px; }
    .qr .hint { font-size:13px; font-weight:600; margin-top:10px; }
    .nrs { display:flex; justify-content:center; gap:22px; flex-wrap:wrap; margin-top:14px; font-size:12px; color:var(--muted); }
    .nrs strong { color:var(--ink); }
    .notice { margin:16px 0 0; font-size:12px; color:var(--muted); text-align:center; line-height:1.6; }
    .footer { margin-top:18px; background:#0f1512; color:#cfd6d1; padding:18px 24px; text-align:center; font-size:12px; line-height:1.7; }
    .footer .fname { color:#fff; font-weight:700; letter-spacing:1.5px; font-size:13px; }
    @media (max-width:520px) { .legs,.grid { grid-template-columns:1fr; } .route-head .cities { font-size:21px; } }
    @media print { body { background:#fff; padding:0; } .ticket { box-shadow:none; max-width:100%; } }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <img src="https://www.metours.de/brand/metropol-logo-light.png" alt="${companyName} Logo" style="display:block;margin:0 auto 8px;width:200px;max-width:70%;height:auto;" />
      <div class="brand" style="font-size:13px;letter-spacing:3px;opacity:.85;">${companyName}</div>
      <div class="subtitle">🚌 Elektronisches Ticket</div>
      <div class="tnr">${safeTicketNumber}</div>
      ${isTest ? '<div class="testbadge">TESTBUCHUNG – NICHT GÜLTIG</div>' : ""}
    </div>

    <div class="content">
      <div class="route-head">
        <div class="cities">${routeLabel}</div>
      </div>

      <div class="legs">
        <div class="leg">
          <div class="lbl">Abfahrt</div>
          <div class="stop">${safeOriginStop || safeOriginCity}</div>
          <div class="date">${dFmtLong(departureDate)}</div>
          <div class="time">${formatTime(booking.trip.departure_time)}</div>
        </div>
        <div class="leg">
          <div class="lbl">Ankunft</div>
          <div class="stop">${safeDestStop || safeDestCity}</div>
          <div class="date">${dFmtLong(arrivalDate)}</div>
          <div class="time">${formatTime(booking.trip.arrival_time)}</div>
          ${overnightDays > 0 ? `<div class="nextday">Ankunft am ${dFmt(arrivalDate)} (+${overnightDays} Tag${overnightDays > 1 ? "e" : ""})</div>` : ""}
        </div>
      </div>

      <div class="grid">
        <div class="box">
          <div class="lbl">Fahrgast</div>
          <div class="val">${safeFirstName} ${safeLastName}</div>
        </div>
        <div class="box">
          <div class="lbl">Sitzplatz</div>
          <div class="val">${safeSeatNumber || "Freie Platzwahl"}</div>
        </div>
        <div class="box">
          <div class="lbl">Gepäck</div>
          <ul>${luggageItems.map((t) => `<li>🧳 ${t}</li>`).join("")}</ul>
        </div>
        <div class="box">
          <div class="lbl">Route</div>
          <div class="val" style="font-size:15px">${routeLabel}</div>
        </div>
      </div>

      ${extrasHtml ? `<div class="box" style="margin-top:12px"><div class="lbl">Extras</div><div>${extrasHtml}</div></div>` : ""}

      <div class="price">
        <div class="lbl">Bezahlter Betrag</div>
        <div class="amount">${Number(booking.price_paid ?? 0).toFixed(2).replace(".", ",")} €</div>
        <div class="pm">Zahlungsmethode: ${paymentLabel}</div>
      </div>

      <div class="qr">
        <img src="${qrCodeDataUrl}" alt="QR-Code ${safeTicketNumber}" />
        <div class="hint">Bitte QR-Code beim Einstieg vorzeigen.</div>
        <div class="nrs">
          <span>Ticket-Nr.: <strong>${safeTicketNumber}</strong></span>
          ${safeBookingNumber ? `<span>Buchungs-Nr.: <strong>${safeBookingNumber}</strong></span>` : ""}
        </div>
      </div>

      <p class="notice">
        Dieses Ticket ist nur für den angegebenen Fahrgast und die angegebene Fahrt gültig.<br>
        Bitte halten Sie das Ticket beim Einstieg digital oder ausgedruckt bereit.<br>
        Bitte seien Sie mindestens 15 Minuten vor Abfahrt am Abfahrtsort.
      </p>
    </div>

    <div class="footer">
      <div class="fname">${companyName}</div>
      <div>Kundenservice${companyPhone ? ` · ${companyPhone}` : ""}${companyEmail ? ` · ${companyEmail}` : ""}${companyWeb ? ` · ${companyWeb}` : ""}</div>
      <div style="opacity:.7;margin-top:6px">Buchungsdatum: ${dFmt(new Date(booking.created_at))}</div>
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
