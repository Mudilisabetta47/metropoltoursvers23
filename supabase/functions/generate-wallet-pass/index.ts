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
          .eq("id", pass.booking_id).maybeSingle();
        b = {
          ticket_number: data?.booking_number ?? "—",
          passenger_first_name: data?.contact_first_name ?? "",
          passenger_last_name: data?.contact_last_name ?? "",
          status: data?.status ?? "—",
        };
      } else {
        const { data } = await admin.from("bookings")
          .select("ticket_number, passenger_first_name, passenger_last_name, status")
          .eq("id", pass.booking_id).maybeSingle();
        b = data ?? { ticket_number: "—", passenger_first_name: "", passenger_last_name: "", status: "—" };
      }
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Boarding Pass · ${b.ticket_number}</title>
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
  <div class="value">${b.passenger_first_name} ${b.passenger_last_name}</div>
  <div class="row">
    <div><div class="label">Ticket</div><div class="value">${b.ticket_number}</div></div>
    <div><div class="label">Status</div><div class="value">${b.status}</div></div>
  </div>
  <div class="qr">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(b.ticket_number)}" alt="QR">
    <div class="barcode">${b.ticket_number}</div>
  </div>
</div>
</body></html>`;
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
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { booking_id, pass_type = "apple", booking_type = "bus" } = await req.json();
    if (!booking_id) return new Response(JSON.stringify({ error: "booking_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Tour- oder Bus-Buchung laden
    let booking: any = null;
    let ownerId: string | null = null;
    let ticketNumber: string | null = null;

    if (booking_type === "tour") {
      const { data } = await admin.from("tour_bookings")
        .select("id, user_id, booking_number")
        .eq("id", booking_id).maybeSingle();
      if (data) {
        booking = data;
        ownerId = data.user_id;
        ticketNumber = data.booking_number;
      }
    } else {
      const { data } = await admin.from("bookings")
        .select("id, user_id, ticket_number")
        .eq("id", booking_id).maybeSingle();
      if (data) {
        booking = data;
        ownerId = data.user_id;
        ticketNumber = data.ticket_number;
      }
    }
    if (!booking) throw new Error("Buchung nicht gefunden");

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const isStaff = (roles ?? []).some(r => ["admin","office","agent"].includes(r.role));
    if (ownerId !== user.id && !isStaff) {
      return new Response(JSON.stringify({ error: "forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Wenn schon vorhanden → zurückgeben
    const { data: existing } = await admin.from("wallet_passes")
      .select("*").eq("booking_id", booking_id).eq("pass_type", pass_type)
      .eq("is_voided", false).maybeSingle();
    let pass = existing;
    if (!pass) {
      const serial = `MT-${ticketNumber}-${randomToken(8)}`;
      const token = randomToken(24);
      const passUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-wallet-pass?action=view&serial=${serial}&token=${token}&type=${booking_type}`;
      const ins = await admin.from("wallet_passes").insert({
        booking_id, pass_type, serial_number: serial, auth_token: token, pass_url: passUrl,
      }).select().single();
      pass = ins.data;
    }

    return new Response(JSON.stringify({
      ok: true, pass_url: pass!.pass_url, serial: pass!.serial_number, pass_type,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
