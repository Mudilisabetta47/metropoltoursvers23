import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Allowlist for bookable extras (server side pricing – never trust the client)
const EXTRA_PRICES: Record<string, number> = {
  luggage: 9.99,
  pet: 14.99,
  insurance: 7.99,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { bookingIds, returnPath, method } = await req.json().catch(() => ({}));
    if (!Array.isArray(bookingIds) || bookingIds.length === 0 || bookingIds.length > 10 || !bookingIds.every((b) => typeof b === "string" && UUID.test(b))) {
      return new Response(JSON.stringify({ error: "Invalid bookingIds" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Require an authenticated caller and verify ownership
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401,
      });
    }

    const { data: bookings, error: bErr } = await admin
      .from("bookings")
      .select("id, user_id, ticket_number, trip_id, origin_stop_id, destination_stop_id, extras, status, payment_status, passenger_email")
      .in("id", bookingIds);
    if (bErr) throw bErr;
    if (!bookings || bookings.length !== bookingIds.length) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404,
      });
    }
    if (bookings.some((b) => b.user_id !== user.id)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403,
      });
    }
    if (bookings.some((b) => b.payment_status === "paid")) {
      return new Response(JSON.stringify({ error: "Bereits bezahlt" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409,
      });
    }

    // Recompute the price on the server for every booking
    let total = 0;
    for (const b of bookings) {
      const { data: base, error: pErr } = await admin.rpc("calculate_trip_price", {
        p_trip_id: b.trip_id,
        p_origin_stop_id: b.origin_stop_id,
        p_destination_stop_id: b.destination_stop_id,
      });
      if (pErr) throw pErr;
      let amount = Number(base ?? 0);
      const extras = Array.isArray(b.extras) ? b.extras : [];
      for (const e of extras) {
        const price = EXTRA_PRICES[String((e as { id?: string })?.id ?? "")];
        if (price) amount += price;
      }
      if (!(amount > 0)) {
        return new Response(JSON.stringify({ error: "Preis konnte nicht ermittelt werden" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 422,
        });
      }
      await admin.from("bookings").update({ price_paid: amount }).eq("id", b.id);
      total += amount;
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://www.metours.de";
    const safeReturn = typeof returnPath === "string" && /^\/[A-Za-z0-9\-_/?&=.]*$/.test(returnPath) ? returnPath : "/checkout";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: method === "paypal" ? ["paypal"] : ["card"],
      customer_email: bookings[0].passenger_email,
      line_items: [{
        price_data: {
          currency: "eur",
          unit_amount: Math.round(total * 100),
          product_data: { name: `Busreise – ${bookings.map((b) => b.ticket_number).join(", ")}` },
        },
        quantity: 1,
      }],
      success_url: `${origin}${safeReturn}${safeReturn.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${safeReturn}${safeReturn.includes("?") ? "&" : "?"}payment=cancelled`,
      metadata: { booking_ids: bookingIds.join(","), user_id: user.id },
    });

    await admin.from("bookings").update({ stripe_session_id: session.id }).in("id", bookingIds);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-bus-payment error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
