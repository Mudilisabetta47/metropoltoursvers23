// Umbuchung: prüft Sitzverfügbarkeit, berechnet Preisdifferenz, aktualisiert Buchung
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { booking_id, new_trip_id, new_seat_id } = await req.json();
    if (!booking_id || !new_trip_id) {
      return new Response(JSON.stringify({ error: "booking_id and new_trip_id required" }),
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

    const { data: booking } = await admin.from("bookings")
      .select("*").eq("id", booking_id).maybeSingle();
    if (!booking) throw new Error("Buchung nicht gefunden");

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const isStaff = (roles ?? []).some(r => ["admin","office","agent"].includes(r.role));
    if (booking.user_id !== user.id && !isStaff) {
      return new Response(JSON.stringify({ error: "forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Neuer Sitzplatz – falls nicht angegeben, alten beibehalten
    const seatId = new_seat_id ?? booking.seat_id;

    // Preisdifferenz berechnen
    const { data: priceRow } = await admin.rpc("calculate_trip_price", {
      p_trip_id: new_trip_id,
      p_origin_stop_id: booking.origin_stop_id,
      p_destination_stop_id: booking.destination_stop_id,
    });
    const newPrice = Number(priceRow ?? booking.price_paid);
    const diff = +(newPrice - Number(booking.price_paid)).toFixed(2);

    // Anfrage anlegen (offen, falls Bezahlung nötig); bei diff <= 0 sofort durchführen
    const reqIns = await admin.from("rebooking_requests").insert({
      booking_id,
      user_id: booking.user_id,
      current_trip_id: booking.trip_id,
      new_trip_id,
      new_seat_id: seatId,
      price_difference: diff,
      rebooking_fee: 0,
      status: diff > 0 ? "pending_payment" : "completed",
    }).select().single();

    if (diff <= 0) {
      // Direkt umbuchen (Trigger loggt change)
      const upd = await admin.from("bookings")
        .update({ trip_id: new_trip_id, seat_id: seatId, price_paid: newPrice })
        .eq("id", booking_id);
      if (upd.error) throw upd.error;
      await admin.from("rebooking_requests").update({ processed_at: new Date().toISOString(), processed_by: user.id })
        .eq("id", reqIns.data.id);
    }

    return new Response(JSON.stringify({
      ok: true, request_id: reqIns.data.id, price_difference: diff, new_price: newPrice,
      requires_payment: diff > 0,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
