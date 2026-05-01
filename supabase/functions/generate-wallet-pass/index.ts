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

function toPassDisplay(bookingType: string, booking: any) {
  return {
    ticket_number: bookingType === "tour" ? booking?.booking_number : booking?.ticket_number,
    passenger_first_name: bookingType === "tour" ? booking?.contact_first_name : booking?.passenger_first_name,
    passenger_last_name: bookingType === "tour" ? booking?.contact_last_name : booking?.passenger_last_name,
    status: booking?.status,
  };
}

function renderPassHtml(b: any) {
  const ticketNumber = String(b.ticket_number ?? "—");
  const qrValue = encodeURIComponent(ticketNumber);
  const safeTicket = escapeHtml(ticketNumber);
  const safeFirstName = escapeHtml(b.passenger_first_name);
  const safeLastName = escapeHtml(b.passenger_last_name);
  const safeStatus = escapeHtml(b.status ?? "—");

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Boarding Pass · ${safeTicket}</title>
<style>
body{margin:0;font-family:-apple-system,system-ui,sans-serif;background:#0f1218;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
.pass{width:100%;max-width:380px;background:linear-gradient(160deg,#00CC36 0%,#019b29 100%);border-radius:24px;padding:24px;color:#000;box-shadow:0 30px 80px rgba(0,0,0,.5)}
.brand{font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:2px;opacity:.7}
.label{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;opacity:.6;margin-top:14px}
.value{font-size:20px;font-weight:700;margin-top:2px}
.row{display:flex;gap:24px;justify-content:space-between}
.qr{margin-top:24px;background:#fff;padding:16px;border-radius:12px;text-align:center}
.qr img{width:200px;height:200px}
.barcode{font-family:'Courier New',monospace;font-weight:bold;font-size:11px;letter-spacing:2px;margin-top:8px}
</style></head><body>
<div class="pass">
  <div class="brand">Metropol Tours · Boarding Pass</div>
  <div class="label">Passagier</div>
  <div class="value">${safeFirstName} ${safeLastName}</div>
  <div class="row">
    <div><div class="label">Ticket</div><div class="value">${safeTicket}</div></div>
    <div><div class="label">Status</div><div class="value">${safeStatus}</div></div>
  </div>
  <div class="qr">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrValue}" alt="QR">
    <div class="barcode">${safeTicket}</div>
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
          .select("booking_number, contact_first_name, contact_last_name, status")
          .eq("id", pass.tour_booking_id).maybeSingle();
        b = toPassDisplay("tour", data);
      } else {
        const { data } = await admin.from("bookings")
          .select("ticket_number, passenger_first_name, passenger_last_name, status")
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
        .select("id, user_id, booking_number, contact_email")
        .eq("id", booking_id).maybeSingle();
      if (data) {
        booking = data;
        ownerId = data.user_id;
        ticketNumber = data.booking_number;
        bookingEmail = data.contact_email;
      }
    } else {
      const { data } = await admin.from("bookings")
        .select("id, user_id, ticket_number, passenger_email")
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

    return new Response(JSON.stringify({
      ok: true, pass_url: pass!.pass_url, serial: pass!.serial_number, pass_type,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("generate-wallet-pass failed", err);
    return new Response(JSON.stringify({ error: err.message || "Wallet-Pass konnte nicht erstellt werden" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
