import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAYPAL_API = "https://api-m.paypal.com";

function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatShortDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return dateStr; }
}

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
    const body = await req.json().catch(() => ({}));
    const { orderId, bookingId: expectedBookingId } = body ?? {};
    if (!orderId || typeof orderId !== "string" || !/^[A-Z0-9-]{6,64}$/i.test(orderId)) {
      return new Response(JSON.stringify({ error: "Invalid orderId" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }
    if (expectedBookingId !== undefined && (typeof expectedBookingId !== "string" || !/^[0-9a-f-]{36}$/i.test(expectedBookingId))) {
      return new Response(JSON.stringify({ error: "Invalid bookingId" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authentication / authorization — REQUIRED
    const authHeader = req.headers.get("Authorization");
    let callerId: string | null = null;
    let isStaff = false;
    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        callerId = user.id;
        const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id);
        isStaff = (roles ?? []).some((r: any) => ["admin", "office", "agent"].includes(r.role));
      }
    }
    if (!callerId) {
      return new Response(JSON.stringify({ error: "Authentifizierung erforderlich." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }

    const accessToken = await getPayPalAccessToken();

    // STEP 1: Fetch the order from PayPal BEFORE capturing, to verify metadata
    const lookupRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!lookupRes.ok) {
      return new Response(JSON.stringify({ error: "PayPal Order nicht gefunden." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 });
    }
    const orderData = await lookupRes.json();
    const orderBookingId = orderData.purchase_units?.[0]?.reference_id;
    const orderAmount = parseFloat(orderData.purchase_units?.[0]?.amount?.value ?? "0");
    const orderCurrency = orderData.purchase_units?.[0]?.amount?.currency_code;

    if (!orderBookingId) {
      return new Response(JSON.stringify({ error: "Order ohne Buchungsreferenz." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }
    if (expectedBookingId && expectedBookingId !== orderBookingId) {
      return new Response(JSON.stringify({ error: "Order gehört nicht zur erwarteten Buchung." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 });
    }
    if (orderCurrency !== "EUR") {
      return new Response(JSON.stringify({ error: "Ungültige Währung." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }
    if (!["CREATED", "APPROVED", "SAVED"].includes(orderData.status)) {
      return new Response(JSON.stringify({ error: `Order Status ungültig: ${orderData.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 });
    }

    // STEP 2: Verify booking exists, belongs to caller, is in payable state, and amount matches
    const { data: existing } = await supabaseAdmin
      .from("tour_bookings")
      .select("user_id, status, paid_at, total_price, discount_amount, payment_reference")
      .eq("id", orderBookingId)
      .single();

    if (!existing) {
      return new Response(JSON.stringify({ error: "Buchung nicht gefunden." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 });
    }
    if (existing.user_id && !isStaff && existing.user_id !== callerId) {
      return new Response(JSON.stringify({ error: "Nicht berechtigt für diese Buchung." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 });
    }
    if (existing.status !== "pending" || existing.paid_at) {
      return new Response(JSON.stringify({ error: "Buchung ist nicht mehr bezahlbar." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 });
    }
    // The order must have been created by our own create-paypal-order function (which stamps payment_reference)
    if (existing.payment_reference !== `paypal:${orderId}`) {
      return new Response(JSON.stringify({ error: "Order wurde nicht für diese Buchung initiiert." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 });
    }
    // Verify amount matches expected total (price - discount), tolerate 1ct rounding
    const expectedAmount = Number(existing.total_price) - Number(existing.discount_amount ?? 0);
    if (Math.abs(orderAmount - expectedAmount) > 0.01) {
      console.error("Amount mismatch", { orderAmount, expectedAmount, bookingId: orderBookingId });
      return new Response(JSON.stringify({ error: "Zahlungsbetrag stimmt nicht mit Buchung überein." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 });
    }

    // STEP 3: Capture
    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });
    const captureData = await captureRes.json();
    if (captureData.status !== "COMPLETED") {
      return new Response(
        JSON.stringify({ success: false, status: captureData.status, details: captureData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bookingId = orderBookingId;
    const bookingNumber = captureData.purchase_units?.[0]?.custom_id;
    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const captureId = capture?.id;
    const capturedAmount = parseFloat(capture?.amount?.value ?? "0");
    const capturedCurrency = capture?.amount?.currency_code;

    if (capturedCurrency !== "EUR" || Math.abs(capturedAmount - expectedAmount) > 0.01) {
      console.error("Captured amount mismatch", { capturedAmount, expectedAmount });
      return new Response(JSON.stringify({ error: "Erfasster Betrag weicht ab. Bitte Support kontaktieren." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 });
    }

    // Idempotent update: only flip pending → confirmed once
    const { data: updatedBooking } = await supabaseAdmin
      .from("tour_bookings")
      .update({
        status: "confirmed",
        payment_method: "paypal",
        payment_reference: captureId || `paypal:${orderId}`,
        paid_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .eq("status", "pending")
      .is("paid_at", null)
      .select()
      .single();




    // Send confirmation email (same as Stripe flow)
    try {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey && updatedBooking) {
        const resend = new Resend(resendKey);

        const [tourRes, dateRes, tariffRes, pickupRes] = await Promise.all([
          supabaseAdmin.from("package_tours").select("destination, location, country, duration_days").eq("id", updatedBooking.tour_id).single(),
          supabaseAdmin.from("tour_dates").select("departure_date, return_date, duration_days").eq("id", updatedBooking.tour_date_id).single(),
          supabaseAdmin.from("tour_tariffs").select("name").eq("id", updatedBooking.tariff_id).single(),
          updatedBooking.pickup_stop_id
            ? supabaseAdmin.from("tour_pickup_stops").select("city, location_name, departure_time").eq("id", updatedBooking.pickup_stop_id).single()
            : Promise.resolve({ data: null }),
        ]);

        const tour = tourRes.data;
        const date = dateRes.data;
        const tariff = tariffRes.data;
        const pickup = pickupRes.data;

        const safeFirst = escapeHtml(updatedBooking.contact_first_name);
        const safeLast = escapeHtml(updatedBooking.contact_last_name);
        const safeDest = escapeHtml(tour?.destination || "");
        const safeBookingNum = escapeHtml(updatedBooking.booking_number);

        await resend.emails.send({
          from: "METROPOL TOURS <booking@app.metours.de>",
          to: [updatedBooking.contact_email],
          subject: `Buchungsbestätigung ${safeBookingNum} – ${safeDest}`,
          html: `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
  .container { max-width: 600px; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
  .header h1 { margin: 0; font-size: 22px; }
  .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
  .booking-box { background: #f0fdf4; border-radius: 10px; padding: 20px; margin: 20px 0; }
  .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8f5e9; }
  .detail-row:last-child { border-bottom: none; }
  .label { color: #666; }
  .value { font-weight: 600; }
  .total { background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%); color: white; padding: 16px; border-radius: 10px; text-align: center; font-size: 20px; font-weight: 700; margin-top: 20px; }
  .badge { background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: 600; letter-spacing: 1px; }
  .footer { text-align: center; padding: 20px; color: #888; font-size: 13px; }
  .paid-badge { background: #22c55e; color: white; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; display: inline-block; margin-top: 8px; }
</style></head><body>
<div class="container">
  <div class="header">
    <h1>🚌 Buchung bestätigt!</h1>
    <p style="margin:8px 0 0; opacity:0.9;">Vielen Dank für Ihre Buchung bei METROPOL TOURS</p>
    <div class="badge">${safeBookingNum}</div>
  </div>
  <div class="content">
    <p>Hallo ${safeFirst} ${safeLast},</p>
    <p>Ihre PayPal-Zahlung wurde erfolgreich verarbeitet und Ihre Reise ist damit <strong>fest gebucht</strong>!</p>
    <div style="text-align:center;"><span class="paid-badge">✓ Bezahlt via PayPal – ${updatedBooking.total_price.toFixed(2)} €</span></div>
    <div class="booking-box">
      <div class="detail-row"><span class="label">Reiseziel</span><span class="value">${safeDest}</span></div>
      <div class="detail-row"><span class="label">Ort</span><span class="value">${escapeHtml(tour?.location || "")} • ${escapeHtml(tour?.country || "")}</span></div>
      <div class="detail-row"><span class="label">Hinreise</span><span class="value">${date ? formatShortDate(date.departure_date) : "-"}</span></div>
      <div class="detail-row"><span class="label">Rückreise</span><span class="value">${date ? formatShortDate(date.return_date) : "-"}</span></div>
      <div class="detail-row"><span class="label">Dauer</span><span class="value">${date?.duration_days || tour?.duration_days || "-"} Tage</span></div>
      <div class="detail-row"><span class="label">Tarif</span><span class="value">${escapeHtml(tariff?.name || "")}</span></div>
      <div class="detail-row"><span class="label">Teilnehmer</span><span class="value">${updatedBooking.participants}</span></div>
      ${pickup ? `<div class="detail-row"><span class="label">Zustieg</span><span class="value">${escapeHtml(pickup.city)} – ${pickup.departure_time?.slice(0, 5)} Uhr</span></div>` : ""}
    </div>
    <div class="total">Gesamtpreis: ${updatedBooking.total_price.toFixed(2)} €</div>
    <p style="margin-top:20px;">Ihre vollständigen Reiseunterlagen erhalten Sie ca. 7 Tage vor Abreise per E-Mail.</p>
    <p>Bitte erscheinen Sie mindestens <strong>15 Minuten vor Abfahrt</strong> am Treffpunkt.</p>
    <p>Wir wünschen Ihnen eine wunderbare Reise! 🌍</p>
    <p>Ihr METROPOL TOURS Team</p>
  </div>
  <div class="footer">
    <p>Bei Fragen: kundenservice@metours.de | Tel: +49 176 47144200</p>
    <p>© ${new Date().getFullYear()} METROPOL TOURS – Komfortabel reisen</p>
  </div>
</div></body></html>`,
        });
        console.log("PayPal confirmation email sent to", updatedBooking.contact_email);
      }
    } catch (emailErr) {
      console.error("Email sending failed (non-blocking):", emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookingId,
        bookingNumber,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("PayPal capture error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
