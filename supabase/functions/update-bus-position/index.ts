// Update Bus-Position (vom Driver-App) – upserted bus_positions_live
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { requireStaff } from "../_shared/authz.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { trip_id, lat, lng, heading, speed_kmh, next_stop_id, eta_next_stop, delay_minutes, status } =
      await req.json();

    if (!trip_id || !UUID_RE.test(String(trip_id)) || lat == null || lng == null) {
      return json({ error: "trip_id (uuid), lat, lng required" }, 400);
    }
    const latNum = Number(lat), lngNum = Number(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || Math.abs(latNum) > 90 || Math.abs(lngNum) > 180) {
      return json({ error: "invalid coordinates" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // --- AuthZ: nur Fahrer/Disposition/Admin ---
    const auth = await requireStaff(req, admin, ["driver", "office", "admin"], { allowServiceRole: false });
    if (!auth.ok) return json({ error: auth.error }, auth.status);

    const isStaffOps = auth.roles.some((r) => r === "office" || r === "admin");

    // Fahrer dürfen nur die ihnen zugewiesene Fahrt aktualisieren
    if (!isStaffOps) {
      const [{ data: trip }, { data: existing }] = await Promise.all([
        admin.from("trips").select("id, driver_user_id").eq("id", trip_id).maybeSingle(),
        admin.from("bus_positions_live").select("driver_id").eq("trip_id", trip_id).maybeSingle(),
      ]);
      const assigned =
        (trip && trip.driver_user_id === auth.userId) ||
        (existing && existing.driver_id === auth.userId);
      if (!assigned) return json({ error: "forbidden: not assigned to this trip" }, 403);
    }

    const { error } = await admin.from("bus_positions_live").upsert({
      trip_id,
      lat: latNum,
      lng: lngNum,
      heading,
      speed_kmh,
      next_stop_id,
      eta_next_stop,
      delay_minutes: delay_minutes ?? 0,
      status: status ?? "on_route",
      driver_id: auth.userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "trip_id" });
    if (error) throw error;

    return json({ ok: true });
  } catch (err) {
    console.error("update-bus-position error:", err);
    return json({ error: "Position konnte nicht gespeichert werden." }, 500);
  }
});
