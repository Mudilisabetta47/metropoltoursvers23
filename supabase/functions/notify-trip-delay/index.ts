import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildEmail(opts: {
  firstName?: string; tripUid: string; origin: string; destination: string;
  delayMin: number; reason: string; originalDep: string; newDep: string;
}) {
  const trackUrl = `https://www.metours.de/verfolge/${encodeURIComponent(opts.tripUid)}`;
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto">
    <tr><td style="background:#00CC36;padding:20px 24px;color:#fff;font-weight:800;font-size:20px">METROPOL TOURS</td></tr>
    <tr><td style="padding:28px 24px">
      <div style="display:inline-block;background:#fee2e2;color:#991b1b;padding:6px 12px;border-radius:6px;font-weight:700;font-size:13px;margin-bottom:16px">
        Verspätung +${opts.delayMin} Minuten
      </div>
      <h1 style="font-size:22px;margin:0 0 12px">Deine Fahrt verspätet sich, ${esc(opts.firstName || "lieber Fahrgast")}.</h1>
      <p style="color:#555;line-height:1.6;margin:0 0 20px">
        Leider gibt es bei deiner Fahrt <strong>${esc(opts.origin)} → ${esc(opts.destination)}</strong> eine Verzögerung.
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;background:#f4f4f5;border-radius:10px;padding:16px;margin-bottom:20px">
        <tr><td style="padding:6px 12px;color:#666;font-size:13px">Fahrt-ID</td><td style="padding:6px 12px;font-weight:700">${esc(opts.tripUid)}</td></tr>
        <tr><td style="padding:6px 12px;color:#666;font-size:13px">Geplant</td><td style="padding:6px 12px"><s>${esc(opts.originalDep)}</s></td></tr>
        <tr><td style="padding:6px 12px;color:#666;font-size:13px">Neu erwartet</td><td style="padding:6px 12px;color:#991b1b;font-weight:700">${esc(opts.newDep)}</td></tr>
        ${opts.reason ? `<tr><td style="padding:6px 12px;color:#666;font-size:13px">Grund</td><td style="padding:6px 12px">${esc(opts.reason)}</td></tr>` : ""}
      </table>
      <a href="${trackUrl}" style="display:inline-block;background:#00CC36;color:#fff;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:700">Fahrt live verfolgen</a>
      <p style="color:#888;font-size:13px;line-height:1.6;margin-top:24px">
        Wir entschuldigen uns für die Unannehmlichkeit und halten dich auf der Verfolgungsseite live auf dem Laufenden.
      </p>
    </td></tr>
    <tr><td style="background:#0f1218;color:#9ca3af;padding:16px 24px;font-size:12px;text-align:center">
      METROPOL TOURS GmbH · kundenservice@metours.de · www.metours.de
    </td></tr>
  </table></body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { trip_uid, event_id } = await req.json();
    if (!trip_uid || typeof trip_uid !== "string") {
      return new Response(JSON.stringify({ error: "trip_uid required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: reg } = await supabase.from("trip_registry").select("*").eq("trip_uid", trip_uid).maybeSingle();
    if (!reg) return new Response(JSON.stringify({ error: "Trip not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const recipients: Array<{ email: string; firstName?: string }> = [];

    if (reg.source_type === "package_tour_date") {
      const { data: bookings } = await supabase
        .from("tour_bookings")
        .select("contact_email, contact_first_name, status")
        .eq("tour_date_id", reg.source_id)
        .in("status", ["confirmed", "pending", "paid"]);
      (bookings || []).forEach((b: any) => b.contact_email && recipients.push({ email: b.contact_email, firstName: b.contact_first_name }));
    } else if (reg.source_type === "line_trip") {
      // Line trips: passengers booked via the bookings table linked via trip_id (legacy) — best-effort
      const { data: bookings } = await supabase
        .from("bookings")
        .select("passenger_email, passenger_first_name, status")
        .eq("trip_id", reg.source_id)
        .in("status", ["confirmed", "pending"]);
      (bookings || []).forEach((b: any) => b.passenger_email && recipients.push({ email: b.passenger_email, firstName: b.passenger_first_name }));
    }

    const dedup = Array.from(new Map(recipients.map(r => [r.email.toLowerCase(), r])).values());

    const originalDep = reg.departure_at ? new Date(reg.departure_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" }) : "—";
    const newDep = reg.departure_at ? new Date(new Date(reg.departure_at).getTime() + (reg.current_delay_min || 0) * 60000).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" }) : "—";

    let sent = 0;
    for (const r of dedup) {
      try {
        await resend.emails.send({
          from: "METROPOL TOURS <kundenservice@metours.de>",
          to: [r.email],
          subject: `Verspätung +${reg.current_delay_min} Min · Fahrt ${trip_uid}`,
          html: buildEmail({
            firstName: r.firstName, tripUid: trip_uid,
            origin: reg.origin || "—", destination: reg.destination || "—",
            delayMin: reg.current_delay_min || 0, reason: reg.delay_reason || "",
            originalDep, newDep,
          }),
        });
        sent++;
      } catch (e) {
        console.error("send failed", r.email, e);
      }
    }

    if (event_id) {
      await supabase.from("trip_delay_events").update({ notified_count: sent }).eq("id", event_id);
    }

    return new Response(JSON.stringify({ ok: true, notified: sent, total: dedup.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
