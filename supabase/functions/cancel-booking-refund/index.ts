// Storno mit automatischer Stripe-Refund-Berechnung nach Stufenmodell
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { booking_id, reason } = await req.json();
    if (!booking_id || typeof booking_id !== "string") {
      return new Response(JSON.stringify({ error: "booking_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: booking, error: bErr } = await admin.from("bookings")
      .select("id, user_id, ticket_number, price_paid, status, passenger_email, trip_id, extras")
      .eq("id", booking_id).maybeSingle();
    if (bErr || !booking) throw new Error(bErr?.message || "Buchung nicht gefunden");

    // Authz: Eigentümer ODER Office/Admin
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const isStaff = (roles ?? []).some(r => ["admin","office"].includes(r.role));
    if (booking.user_id !== user.id && !isStaff) {
      return new Response(JSON.stringify({ error: "forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (booking.status === "cancelled") {
      return new Response(JSON.stringify({ error: "Buchung bereits storniert" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Refund-Stufe ermitteln
    const { data: refundRow } = await admin.rpc("calculate_refund", { p_booking_id: booking_id });
    const refund = Array.isArray(refundRow) ? refundRow[0] : refundRow;
    const refundAmount = Number(refund?.refund_amount ?? 0);
    const refundPercent = Number(refund?.refund_percent ?? 0);

    // Stripe-Refund
    let stripeRefundId: string | null = null;
    const piId = (booking.extras as any)?.payment_intent_id;
    if (piId && refundAmount > 0) {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
      try {
        const r = await stripe.refunds.create({
          payment_intent: piId,
          amount: Math.round(refundAmount * 100),
          reason: "requested_by_customer",
          metadata: { booking_id, ticket: booking.ticket_number, percent: String(refundPercent) },
        });
        stripeRefundId = r.id;
      } catch (e) {
        console.error("Stripe refund failed", e);
      }
    }

    // Status setzen
    await admin.from("bookings").update({ status: "cancelled" }).eq("id", booking_id);

    // Timeline-Eintrag mit Detail
    await admin.from("booking_changes").insert({
      booking_id,
      actor_id: user.id,
      actor_type: isStaff ? "staff" : "customer",
      event_type: "cancelled",
      description: `Storno: ${refundPercent}% (${refundAmount.toFixed(2)} €) – ${refund?.tier_label ?? ""}${reason ? " · " + reason : ""}`,
      metadata: { refund_amount: refundAmount, refund_percent: refundPercent, stripe_refund_id: stripeRefundId, reason },
    });

    // Wartelistensystem: erste Person auf Trip benachrichtigen
    await admin.functions.invoke("waitlist-notify", { body: { trip_id: booking.trip_id } }).catch(() => {});

    return new Response(JSON.stringify({
      ok: true, refund_percent: refundPercent, refund_amount: refundAmount,
      tier_label: refund?.tier_label, stripe_refund_id: stripeRefundId,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
