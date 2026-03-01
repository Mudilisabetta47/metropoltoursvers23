import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, couponCode } = await req.json();

    if (!bookingId) {
      throw new Error("bookingId is required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("tour_bookings")
      .select("*, package_tours(destination, country)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let totalAmount = Math.round(booking.total_price * 100); // cents
    let discountDescription = "";
    let couponId: string | null = null;

    // Apply coupon if provided
    if (couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (!coupon) {
        return new Response(
          JSON.stringify({ error: "Ungültiger Gutscheincode" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Check validity
      const now = new Date();
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return new Response(
          JSON.stringify({ error: "Gutschein ist abgelaufen" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
        return new Response(
          JSON.stringify({ error: "Gutschein wurde bereits vollständig eingelöst" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      if (coupon.min_amount && booking.total_price < coupon.min_amount) {
        return new Response(
          JSON.stringify({ error: `Mindestbestellwert: ${coupon.min_amount}€` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Calculate discount
      if (coupon.percent_off) {
        const discount = Math.round(totalAmount * (coupon.percent_off / 100));
        totalAmount -= discount;
        discountDescription = `-${coupon.percent_off}% (${(discount / 100).toFixed(2)}€)`;
      } else if (coupon.amount_off) {
        const discount = Math.round(coupon.amount_off * 100);
        totalAmount = Math.max(totalAmount - discount, 50); // min 50 cents
        discountDescription = `-${coupon.amount_off}€`;
      }

      couponId = coupon.id;

      // Increment redemptions
      await supabaseAdmin
        .from("coupons")
        .update({ times_redeemed: coupon.times_redeemed + 1 })
        .eq("id", coupon.id);

      // Update booking with discount
      await supabaseAdmin
        .from("tour_bookings")
        .update({
          discount_code: couponCode.toUpperCase().trim(),
          discount_amount: (booking.total_price * 100 - totalAmount) / 100,
        })
        .eq("id", bookingId);
    }

    // Check for existing Stripe customer
    const email = booking.contact_email;
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const tourName = booking.package_tours?.destination || "Pauschalreise";
    const origin = req.headers.get("origin") || "https://app.metours.de";

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Metropol Tours – ${tourName}`,
              description: `${booking.participants} Teilnehmer${discountDescription ? ` | Gutschein: ${discountDescription}` : ""}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/tour-checkout?tour=${booking.tour_id}&date=${booking.tour_date_id}&tariff=${booking.tariff_id}&pax=${booking.participants}&payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/tour-checkout?tour=${booking.tour_id}&date=${booking.tour_date_id}&tariff=${booking.tariff_id}&pax=${booking.participants}&payment=cancelled`,
      metadata: {
        booking_id: bookingId,
        booking_number: booking.booking_number,
        coupon_code: couponCode || "",
      },
      payment_intent_data: {
        metadata: {
          booking_id: bookingId,
          booking_number: booking.booking_number,
        },
      },
    });

    // Store Stripe session ID on booking
    await supabaseAdmin
      .from("tour_bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", bookingId);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
