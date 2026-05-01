// Update Bus-Position (vom Driver-App) – upserted bus_positions_live
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { trip_id, lat, lng, heading, speed_kmh, next_stop_id, eta_next_stop, delay_minutes, status } = await req.json();
    if (!trip_id || lat == null || lng == null) {
      return new Response(JSON.stringify({ error: "trip_id, lat, lng required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error } = await admin.from("bus_positions_live").upsert({
      trip_id, lat, lng, heading, speed_kmh, next_stop_id, eta_next_stop,
      delay_minutes: delay_minutes ?? 0,
      status: status ?? "on_route",
      driver_id: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "trip_id" });
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
