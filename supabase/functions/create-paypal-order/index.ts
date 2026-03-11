import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAYPAL_API = "https://api-m.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_SECRET");
  if (!clientId || !secret) throw new Error("PayPal credentials not configured");

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed [${res.status}]: ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, couponCode } = await req.json();
    if (!bookingId) throw new Error("bookingId is required");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("tour_bookings")
      .select("*, package_tours(destination, country)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) throw new Error("Booking not found");

    let totalAmount = booking.total_price;
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

      if (coupon.percent_off) {
        totalAmount = totalAmount - (totalAmount * coupon.percent_off / 100);
      } else if (coupon.amount_off) {
        totalAmount = Math.max(totalAmount - coupon.amount_off, 0.50);
      }

      couponId = coupon.id;

      await supabaseAdmin
        .from("coupons")
        .update({ times_redeemed: coupon.times_redeemed + 1 })
        .eq("id", coupon.id);

      await supabaseAdmin
        .from("tour_bookings")
        .update({
          discount_code: couponCode.toUpperCase().trim(),
          discount_amount: booking.total_price - totalAmount,
        })
        .eq("id", bookingId);
    }

    const tourName = booking.package_tours?.destination || "Pauschalreise";
    const origin = req.headers.get("origin") || "https://app.metours.de";

    const accessToken = await getPayPalAccessToken();

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: bookingId,
            description: `Metropol Tours – ${tourName} (${booking.participants} Teilnehmer)`,
            custom_id: booking.booking_number,
            amount: {
              currency_code: "EUR",
              value: totalAmount.toFixed(2),
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "METROPOL TOURS",
              locale: "de-DE",
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
              return_url: `${origin}/tour-checkout?tour=${booking.tour_id}&date=${booking.tour_date_id}&tariff=${booking.tariff_id}&pax=${booking.participants}&payment=paypal_success&paypal_order_id={ORDER_ID}`,
              cancel_url: `${origin}/tour-checkout?tour=${booking.tour_id}&date=${booking.tour_date_id}&tariff=${booking.tariff_id}&pax=${booking.participants}&payment=cancelled`,
            },
          },
        },
      }),
    });

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      throw new Error(`PayPal order creation failed [${orderRes.status}]: ${errText}`);
    }

    const order = await orderRes.json();

    // Store PayPal order ID on booking
    await supabaseAdmin
      .from("tour_bookings")
      .update({ payment_reference: `paypal:${order.id}` })
      .eq("id", bookingId);

    // Find the approve link
    const approveLink = order.links?.find((l: any) => l.rel === "payer-action" || l.rel === "approve")?.href;

    return new Response(
      JSON.stringify({ orderId: order.id, approveUrl: approveLink || null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("PayPal order error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
