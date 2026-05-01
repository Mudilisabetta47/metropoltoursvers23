// Generiert Wallet-Pass-URL (Apple .pkpass / Google JWT) für Buchung – via PassKit-kompatibler JSON
// Hinweis: Echte .pkpass-Signatur erfordert Apple-Zertifikate. Hier wird ein universeller Pass-Generator genutzt
// (z.B. PassKit/Walletpasses), Fallback ist eine browserkompatible Pass-Page.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function randomToken(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateDE(d: any): string {
  if (!d) return "—";
  try {
    const dt = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return String(d); }
}
function formatTimeDE(t: any): string {
  if (!t) return "—";
  const s = String(t);
  // "HH:MM:SS" or "HH:MM"
  const m = s.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : s;
}

function toPassDisplay(bookingType: string, booking: any) {
  if (bookingType === "tour") {
    const td = booking?.tour_dates ?? {};
    const tour = booking?.package_tours ?? {};
    const pickup = booking?.pickup_stops ?? null;
    return {
      ticket_number: booking?.booking_number,
      passenger_first_name: booking?.contact_first_name,
      passenger_last_name: booking?.contact_last_name,
      status: booking?.status,
      date: formatDateDE(td.departure_date),
      from_label: pickup?.city || pickup?.name || "Abfahrtsort",
      to_label: tour?.destination || tour?.title || tour?.name || "Reiseziel",
      depart_time: formatTimeDE(td.departure_time) ?? "—",
      arrive_time: formatDateDE(td.return_date),
      bus_label: tour?.title || tour?.name || "Pauschalreise",
      seat_label: `${booking?.participants ?? 1} Pers.`,
    };
  }
  const trip = booking?.trips ?? {};
  const route = trip?.routes ?? {};
  const origin = booking?.origin_stop ?? {};
  const dest = booking?.destination_stop ?? {};
  const seat = booking?.seats ?? {};
  return {
    ticket_number: booking?.ticket_number,
    passenger_first_name: booking?.passenger_first_name,
    passenger_last_name: booking?.passenger_last_name,
    status: booking?.status,
    date: formatDateDE(trip?.departure_date),
    from_label: origin?.city || origin?.name || "Abfahrt",
    to_label: dest?.city || dest?.name || "Ziel",
    depart_time: formatTimeDE(trip?.departure_time),
    arrive_time: formatTimeDE(trip?.arrival_time),
    bus_label: route?.name || "Linie",
    seat_label: seat?.seat_number || "—",
  };
}

function renderPassHtml(b: any) {
  const ticketNumber = String(b.ticket_number ?? "—");
  const qrValue = encodeURIComponent(ticketNumber);
  const safeTicket = escapeHtml(ticketNumber);
  const safeFirstName = escapeHtml(b.passenger_first_name);
  const safeLastName = escapeHtml(b.passenger_last_name);
  const safeDate = escapeHtml(b.date ?? "—");
  const safeFrom = escapeHtml(b.from_label ?? "—");
  const safeTo = escapeHtml(b.to_label ?? "—");
  const safeDepart = escapeHtml(b.depart_time ?? "—");
  const safeArrive = escapeHtml(b.arrive_time ?? "—");
  const safeBus = escapeHtml(b.bus_label ?? "—");
  const safeSeat = escapeHtml(b.seat_label ?? "—");

  // FlixBus-style boarding pass: white card, green labels, bus icon, two-column times
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Boarding Pass · ${safeTicket}</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",system-ui,sans-serif;background:#1c1c1e;color:#000;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:16px;-webkit-font-smoothing:antialiased}
.pass{width:100%;max-width:360px;background:#fff;border-radius:20px;padding:22px 22px 26px;box-shadow:0 30px 80px rgba(0,0,0,.5)}
.head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px}
.brand{font-size:26px;font-weight:900;color:#00CC36;letter-spacing:-0.5px;line-height:1}
.brand span{color:#00CC36}
.head .right{text-align:right}
.lbl{font-size:11px;font-weight:800;color:#00CC36;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px}
.val{font-size:22px;font-weight:500;color:#1a1a1a;line-height:1.1}
.route{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;margin:6px 0 18px}
.route .col{min-width:0}
.route .col.right{text-align:right}
.route .stop-lbl{font-size:11px;font-weight:800;color:#00CC36;letter-spacing:.8px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.route .stop-time{font-size:34px;font-weight:400;color:#1a1a1a;line-height:1;margin-top:6px}
.bus-icon{display:flex;align-items:center;justify-content:center;width:52px;height:40px}
.bus-icon svg{width:48px;height:38px;fill:#00CC36}
.section{margin-top:14px}
.section .lbl{margin-bottom:3px}
.section .val{font-size:18px}
.qr-wrap{margin-top:26px;display:flex;flex-direction:column;align-items:center}
.qr-wrap img{width:200px;height:200px;display:block}
.foot{text-align:center;font-size:13px;color:#8a8a8e;margin-top:14px;font-weight:400}
</style></head><body>
<div class="pass">
  <div class="head">
    <div class="brand">ME<span>tours</span></div>
    <div class="right">
      <div class="lbl">Datum</div>
      <div class="val">${safeDate}</div>
    </div>
  </div>

  <div class="route">
    <div class="col">
      <div class="stop-lbl">${safeFrom}</div>
      <div class="stop-time">${safeDepart}</div>
    </div>
    <div class="bus-icon">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>
    </div>
    <div class="col right">
      <div class="stop-lbl">${safeTo}</div>
      <div class="stop-time">${safeArrive}</div>
    </div>
  </div>

  <div class="section">
    <div class="lbl">Bus</div>
    <div class="val">${safeBus}</div>
  </div>

  <div style="display:flex;justify-content:space-between;gap:16px;margin-top:14px">
    <div style="min-width:0;flex:1">
      <div class="lbl">Fahrgast</div>
      <div class="val" style="font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${safeFirstName} ${safeLastName}</div>
    </div>
    <div style="text-align:right">
      <div class="lbl">Sitz</div>
      <div class="val" style="font-size:18px">${safeSeat}</div>
    </div>
  </div>

  <div class="qr-wrap">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${qrValue}" alt="QR">
    <div class="foot">${safeTicket}</div>
  </div>
</div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "create";
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (action === "view") {
      // Public Pass-Ansicht (per Serial)
      const serial = url.searchParams.get("serial");
      const token = url.searchParams.get("token");
      const type = url.searchParams.get("type") ?? "bus";
      if (!serial || !token) return new Response("Missing params", { status: 400, headers: corsHeaders });
      const { data: pass } = await admin.from("wallet_passes")
        .select("*")
        .eq("serial_number", serial).eq("auth_token", token).maybeSingle();
      if (!pass) return new Response("Pass not found", { status: 404, headers: corsHeaders });

      let b: any = {};
      if (type === "tour") {
        const { data } = await admin.from("tour_bookings")
          .select(`booking_number, contact_first_name, contact_last_name, status, participants,
                   tour_dates ( departure_date, return_date ),
                   package_tours ( title, destination ),
                   pickup_stops:tour_pickup_stops!tour_bookings_pickup_stop_id_fkey ( name, city )`)
          .eq("id", pass.tour_booking_id).maybeSingle();
        b = toPassDisplay("tour", data);
      } else {
        const { data } = await admin.from("bookings")
          .select(`ticket_number, passenger_first_name, passenger_last_name, status,
                   trips ( departure_date, departure_time, arrival_time, routes ( name ) ),
                   origin_stop:stops!bookings_origin_stop_id_fkey ( name, city ),
                   destination_stop:stops!bookings_destination_stop_id_fkey ( name, city ),
                   seats ( seat_number )`)
          .eq("id", pass.booking_id).maybeSingle();
        b = toPassDisplay("bus", data);
      }
      const html = renderPassHtml(b);
      return new Response(html, { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });
    }

    // create
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();

    const { booking_id, ticket_number, email, pass_type = "apple", booking_type = "bus" } = await req.json();
    if (!booking_id) return new Response(JSON.stringify({ error: "booking_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Tour- oder Bus-Buchung laden
    let booking: any = null;
    let ownerId: string | null = null;
    let ticketNumber: string | null = null;
    let bookingEmail: string | null = null;

    if (booking_type === "tour") {
      const { data } = await admin.from("tour_bookings")
        .select("id, user_id, booking_number, contact_email, contact_first_name, contact_last_name, status")
        .eq("id", booking_id).maybeSingle();
      if (data) {
        booking = data;
        ownerId = data.user_id;
        ticketNumber = data.booking_number;
        bookingEmail = data.contact_email;
      }
    } else {
      const { data } = await admin.from("bookings")
        .select("id, user_id, ticket_number, passenger_email, passenger_first_name, passenger_last_name, status")
        .eq("id", booking_id).maybeSingle();
      if (data) {
        booking = data;
        ownerId = data.user_id;
        ticketNumber = data.ticket_number;
        bookingEmail = data.passenger_email;
      }
    }
    if (!booking) return new Response(JSON.stringify({ error: "Buchung nicht gefunden" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const requestedEmail = String(email ?? "").trim().toLowerCase();
    const emailMatchesBooking = !!requestedEmail && requestedEmail === String(bookingEmail ?? "").trim().toLowerCase();
    const ticketMatchesBooking = !ticket_number || String(ticket_number).trim().toUpperCase() === String(ticketNumber ?? "").trim().toUpperCase();
    let isStaff = false;
    if (user) {
      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
      isStaff = (roles ?? []).some(r => ["admin","office","agent"].includes(r.role));
    }
    const userEmailMatches = !!user?.email && String(user.email).trim().toLowerCase() === String(bookingEmail ?? "").trim().toLowerCase();
    const allowed = isStaff || (!!user && (ownerId === user.id || userEmailMatches)) || (emailMatchesBooking && ticketMatchesBooking);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Kein Zugriff auf diese Buchung" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Wenn schon vorhanden → zurückgeben
    let existingQuery = admin.from("wallet_passes")
      .select("*").eq("booking_type", booking_type).eq("pass_type", pass_type)
      .eq("is_voided", false)
      .order("last_updated", { ascending: false })
      .limit(1);
    existingQuery = booking_type === "tour"
      ? existingQuery.eq("tour_booking_id", booking_id)
      : existingQuery.eq("booking_id", booking_id);
    const { data: existing } = await existingQuery.maybeSingle();
    let pass = existing;
    if (!pass) {
      const serial = `MT-${ticketNumber}-${randomToken(8)}`;
      const token = randomToken(24);
      const passUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-wallet-pass?action=view&serial=${serial}&token=${token}&type=${booking_type}`;
      const ins = await admin.from("wallet_passes").insert({
        booking_id: booking_type === "bus" ? booking_id : null,
        tour_booking_id: booking_type === "tour" ? booking_id : null,
        booking_type, pass_type, serial_number: serial, auth_token: token, pass_url: passUrl,
      }).select().single();
      if (ins.error) throw ins.error;
      pass = ins.data;
    }

    const previewHtml = renderPassHtml(toPassDisplay(booking_type, booking));
    return new Response(JSON.stringify({
      ok: true,
      pass_url: pass!.pass_url,
      pass_html: previewHtml,
      serial: pass!.serial_number,
      pass_type,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("generate-wallet-pass failed", err);
    return new Response(JSON.stringify({ error: err.message || "Wallet-Pass konnte nicht erstellt werden" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
