import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hmacSign(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sendWebhookWithRetry(
  url: string,
  secret: string,
  payload: Record<string, unknown>,
  eventId: string,
  ticketId: string,
  supabase: any,
  maxRetries = 3
) {
  const body = JSON.stringify(payload);
  const signature = await hmacSign(secret, body);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Event-Id": eventId,
          "X-Signature": `sha256=${signature}`,
        },
        body,
      });

      const responseBody = await res.text();
      const success = res.status >= 200 && res.status < 300;

      await supabase.from("webhook_logs").insert({
        event_id: eventId,
        ticket_id: ticketId,
        url,
        status_code: res.status,
        response_body: responseBody.slice(0, 2000),
        success,
        retry_count: attempt,
        payload,
      });

      if (success) return;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    } catch (err: any) {
      await supabase.from("webhook_logs").insert({
        event_id: eventId,
        ticket_id: ticketId,
        url,
        status_code: 0,
        response_body: null,
        success: false,
        retry_count: attempt,
        payload,
        error_message: err.message,
      });

      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const webhookUrl = Deno.env.get("WEBHOOK_URL");
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET");

    // Verify user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { qr_payload } = await req.json();
    if (!qr_payload || typeof qr_payload !== "string") {
      return new Response(JSON.stringify({ error: "qr_payload required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find ticket by qr_payload
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*, bookings(id, passenger_first_name, passenger_last_name, passenger_email, status, price_paid, trip_id), trips(id, route_id, departure_date, departure_time, routes(name))")
      .eq("qr_payload", qr_payload.trim())
      .maybeSingle();

    if (ticketError) throw ticketError;

    // Also try matching by ticket_number in bookings if no ticket found
    let resolvedTicket = ticket;
    if (!resolvedTicket) {
      // Try finding by ticket_number in bookings table
      const { data: booking } = await supabase
        .from("bookings")
        .select("id, ticket_number, passenger_first_name, passenger_last_name, passenger_email, status, price_paid, trip_id, trips(id, route_id, departure_date, departure_time, routes(name))")
        .eq("ticket_number", qr_payload.trim().toUpperCase())
        .maybeSingle();

      if (booking) {
        // Auto-create ticket record
        const { data: newTicket, error: createErr } = await supabase
          .from("tickets")
          .insert({
            booking_id: booking.id,
            trip_id: booking.trip_id,
            qr_payload: qr_payload.trim().toUpperCase(),
            status: "valid",
          })
          .select("*, bookings(id, passenger_first_name, passenger_last_name, passenger_email, status, price_paid, trip_id), trips(id, route_id, departure_date, departure_time, routes(name))")
          .single();

        if (!createErr) resolvedTicket = newTicket;
      }
    }

    if (!resolvedTicket) {
      // Log failed scan
      await supabase.from("scan_logs").insert({
        user_id: user.id,
        qr_payload: qr_payload.trim(),
        result: "not_found",
        message: "Ticket nicht gefunden",
      });

      return new Response(
        JSON.stringify({ result: "not_found", message: "Ticket nicht gefunden", color: "red" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const booking = resolvedTicket.bookings;
    const trip = resolvedTicket.trips;

    // Validate
    if (resolvedTicket.status === "cancelled" || resolvedTicket.status === "refunded") {
      await supabase.from("scan_logs").insert({
        ticket_id: resolvedTicket.id,
        booking_id: booking?.id,
        trip_id: trip?.id,
        user_id: user.id,
        qr_payload: qr_payload.trim(),
        result: "invalid",
        message: `Ticket ${resolvedTicket.status === "cancelled" ? "storniert" : "erstattet"}`,
      });

      return new Response(
        JSON.stringify({
          result: "invalid",
          message: resolvedTicket.status === "cancelled" ? "Ticket storniert" : "Ticket erstattet",
          color: "red",
          ticket: resolvedTicket,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (resolvedTicket.status === "checked_in") {
      await supabase.from("scan_logs").insert({
        ticket_id: resolvedTicket.id,
        booking_id: booking?.id,
        trip_id: trip?.id,
        user_id: user.id,
        qr_payload: qr_payload.trim(),
        result: "already_checked_in",
        message: `Bereits eingecheckt um ${resolvedTicket.checked_in_at}`,
      });

      return new Response(
        JSON.stringify({
          result: "already_checked_in",
          message: "Ticket bereits eingecheckt",
          color: "yellow",
          ticket: resolvedTicket,
          checked_in_at: resolvedTicket.checked_in_at,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Valid! Check in
    const now = new Date().toISOString();
    await supabase
      .from("tickets")
      .update({
        status: "checked_in",
        checked_in_at: now,
        checked_in_by: user.id,
        updated_at: now,
      })
      .eq("id", resolvedTicket.id);

    // Log scan
    await supabase.from("scan_logs").insert({
      ticket_id: resolvedTicket.id,
      booking_id: booking?.id,
      trip_id: trip?.id,
      user_id: user.id,
      qr_payload: qr_payload.trim(),
      result: "checked_in",
      message: "Erfolgreich eingecheckt",
    });

    // Also update scanner_events for ops dashboard compatibility
    await supabase.from("scanner_events").insert({
      scanner_user_id: user.id,
      ticket_number: qr_payload.trim(),
      booking_id: booking?.id,
      result: "valid",
      scan_type: "check_in",
      trip_id: trip?.id,
    });

    // Send webhook (async, don't block response)
    const eventId = crypto.randomUUID();

    if (webhookUrl && webhookSecret) {
      // Check idempotency
      const { data: existingLog } = await supabase
        .from("webhook_logs")
        .select("id")
        .eq("ticket_id", resolvedTicket.id)
        .eq("success", true)
        .maybeSingle();

      if (!existingLog) {
        const webhookPayload = {
          event: "ticket_scanned",
          event_id: eventId,
          scanned_at: now,
          scanner_user: {
            id: user.id,
            email: user.email,
          },
          ticket: {
            ticket_id: resolvedTicket.id,
            status: "checked_in",
            checked_in_at: now,
            qr_payload: resolvedTicket.qr_payload,
          },
          booking: {
            booking_id: booking?.id,
            status: booking?.status,
            customer_name: booking ? `${booking.passenger_first_name} ${booking.passenger_last_name}` : null,
            customer_email: booking?.passenger_email,
            passengers: 1,
            price: booking?.price_paid,
          },
          trip: {
            trip_id: trip?.id,
            route_name: trip?.routes?.name,
            trip_date: trip?.departure_date,
            departure_time: trip?.departure_time,
          },
        };

        // Fire and forget with retries
        sendWebhookWithRetry(webhookUrl, webhookSecret, webhookPayload, eventId, resolvedTicket.id, supabase)
          .catch((e) => console.error("Webhook error:", e));
      }
    }

    return new Response(
      JSON.stringify({
        result: "checked_in",
        message: "Ticket gültig – eingecheckt ✓",
        color: "green",
        ticket: {
          id: resolvedTicket.id,
          qr_payload: resolvedTicket.qr_payload,
          checked_in_at: now,
        },
        passenger: booking
          ? `${booking.passenger_first_name} ${booking.passenger_last_name}`
          : null,
        trip: trip
          ? { route: trip.routes?.name, date: trip.departure_date, time: trip.departure_time }
          : null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Scan error:", err);
    return new Response(
      JSON.stringify({ error: err.message, result: "error", color: "red" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
