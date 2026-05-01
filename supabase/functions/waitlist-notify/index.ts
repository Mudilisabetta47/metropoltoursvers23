// Benachrichtigt erste wartende Person bei freiem Platz (E-Mail + Push)
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { trip_id, tour_date_id } = await req.json().catch(() => ({}));
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let query = admin.from("waitlist_entries").select("*")
      .eq("status", "waiting")
      .order("position", { ascending: true })
      .limit(1);
    if (trip_id) query = query.eq("trip_id", trip_id);
    else if (tour_date_id) query = query.eq("tour_date_id", tour_date_id);
    else return new Response(JSON.stringify({ error: "trip_id or tour_date_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: entries } = await query;
    const entry = entries?.[0];
    if (!entry) return new Response(JSON.stringify({ ok: true, notified: 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // 24h Reservierung
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await admin.from("waitlist_entries")
      .update({ status: "notified", notified_at: new Date().toISOString(), expires_at: expiresAt })
      .eq("id", entry.id);

    // E-Mail per Resend
    if (entry.notify_email && entry.email) {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (RESEND_API_KEY && LOVABLE_API_KEY) {
        await fetch("https://connector-gateway.lovable.dev/resend/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: "Metropol Tours <booking@app.metours.de>",
            to: [entry.email],
            subject: "🎉 Dein Wartelisten-Platz ist frei – jetzt zuschlagen",
            html: `
              <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:24px;background:#0f1218;color:#fff;border-radius:16px">
                <h1 style="color:#00CC36">Platz frei!</h1>
                <p>Hallo ${entry.first_name ?? ""},</p>
                <p>für deine gewünschte Reise ist gerade <strong>${entry.pax} Platz/Plätze</strong> frei geworden.</p>
                <p>Du hast <strong>24 Stunden</strong> Zeit, um zu buchen, bevor wir die nächste Person auf der Liste benachrichtigen.</p>
                <a href="https://app.metours.de/buchen?from_waitlist=${entry.id}" style="display:inline-block;background:#00CC36;color:#000;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;margin-top:16px">Jetzt buchen</a>
                <p style="color:#888;font-size:12px;margin-top:24px">Du erhältst diese Mail, weil du dich auf die Warteliste gesetzt hast.</p>
              </div>`,
          }),
        }).catch(e => console.error("waitlist email", e));
      }
    }

    return new Response(JSON.stringify({ ok: true, notified: 1, entry_id: entry.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
