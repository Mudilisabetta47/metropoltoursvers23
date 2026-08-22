import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sessionId } = await req.json().catch(() => ({}));
    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid sessionId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const bookingIds = (session.metadata?.booking_ids ?? "").split(",").filter(Boolean);
    if (bookingIds.length === 0) throw new Error("No booking_ids in session metadata");

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ success: false, status: session.payment_status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: updated, error } = await admin
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        payment_method: "card",
        payment_reference: String(session.payment_intent ?? session.id),
        paid_at: new Date().toISOString(),
      })
      .in("id", bookingIds)
      .select("id, ticket_number");
    if (error) throw error;

    for (const b of updated ?? []) {
      try {
        await admin.functions.invoke("send-booking-confirmation", { body: { bookingId: b.id } });
      } catch (e) {
        console.error("confirmation mail failed", e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      bookingIds,
      ticketNumbers: (updated ?? []).map((b) => b.ticket_number),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("verify-bus-payment error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
