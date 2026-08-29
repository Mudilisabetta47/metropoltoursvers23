import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limiter (per edge function instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // max 30 scans per minute per user

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// Input sanitization
function sanitizePayload(input: string): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  // Max 200 chars, only allow alphanumeric, hyphens, underscores, dots
  if (trimmed.length === 0 || trimmed.length > 200) return null;
  if (!/^[a-zA-Z0-9\-_.]+$/.test(trimmed)) return null;
  return trimmed;
}

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
        error_message: err.message?.slice(0, 500),
      });

      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
}

function buildPassenger(booking: any, originStop: any, destStop: any) {
  if (!booking) return null;
  const ex = booking.extras && typeof booking.extras === "object" ? booking.extras : {};
  const dob = booking.contact_date_of_birth ?? ex.date_of_birth ?? ex.birth_date ?? null;
  const street = [booking.billing_street, booking.billing_house_number].filter(Boolean).join(" ");
  const cityLine = [booking.billing_zip, booking.billing_city].filter(Boolean).join(" ");
  const address =
    booking.invoice_address ||
    [street, cityLine, booking.billing_country].filter(Boolean).join(", ") ||
    ex.address ||
    null;
  return {
    name: `${booking.passenger_first_name ?? ""} ${booking.passenger_last_name ?? ""}`.trim(),
    first_name: booking.passenger_first_name ?? null,
    last_name: booking.passenger_last_name ?? null,
    email: booking.passenger_email ?? null,
    phone: booking.passenger_phone ?? null,
    date_of_birth: dob,
    address,
    billing_company: booking.billing_company ?? null,
    booking_number: booking.booking_number ?? null,
    seat: booking.seats?.seat_number || null,
    price: booking.price_paid ?? null,
    extras: booking.extras ?? null,
    origin: originStop ? `${originStop.name} (${originStop.city})` : null,
    destination: destStop ? `${destStop.name} (${destStop.city})` : null,
  };
}

function errorResponse(status: number, message: string, extra?: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ error: message, ...extra }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }

  try {
    // 1. Auth: verify JWT via getClaims
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(401, "Unauthorized");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const webhookUrl = Deno.env.get("WEBHOOK_URL");
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return errorResponse(401, "Invalid or expired token");
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    // 2. Rate limiting
    if (!checkRateLimit(userId)) {
      return errorResponse(429, "Zu viele Anfragen. Bitte warten Sie einen Moment.", {
        result: "rate_limited",
        color: "red",
      });
    }

    // 3. Role check: only staff (admin, agent, driver) can scan
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const userRoles = (roles || []).map((r: any) => r.role);
    const allowedRoles = ["admin", "agent", "driver"];
    const hasStaffRole = userRoles.some((r: string) => allowedRoles.includes(r));

    if (!hasStaffRole) {
      return errorResponse(403, "Keine Berechtigung zum Scannen", {
        result: "forbidden",
        color: "red",
      });
    }

    // 4. Parse and validate input
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse(400, "Ungültiger Request Body");
    }

    const qrPayload = sanitizePayload(body?.qr_payload);
    if (!qrPayload) {
      return errorResponse(400, "Ungültiger QR-Code / Ticket-Nummer", {
        result: "invalid_input",
        color: "red",
      });
    }

    // 5. Find ticket by qr_payload
    const bookingSelect = `id, contact_date_of_birth, billing_company, billing_first_name, billing_last_name, billing_street, billing_house_number, billing_zip, billing_city, billing_country, invoice_address, booking_number, passenger_first_name, passenger_last_name, passenger_email, passenger_phone, status, price_paid, trip_id, extras, origin_stop_id, destination_stop_id, seat_id, seats(seat_number), origin_stop:stops!bookings_origin_stop_id_fkey(name, city), destination_stop:stops!bookings_destination_stop_id_fkey(name, city)`;
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(`*, bookings(${bookingSelect}), trips(id, route_id, departure_date, departure_time, arrival_time, routes(name))`)
      .eq("qr_payload", qrPayload)
      .maybeSingle();

    if (ticketError) throw ticketError;

    // Fallback: try matching by ticket_number in bookings
    let resolvedTicket = ticket;
    if (!resolvedTicket) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("id, ticket_number, contact_date_of_birth, billing_company, billing_first_name, billing_last_name, billing_street, billing_house_number, billing_zip, billing_city, billing_country, invoice_address, booking_number, passenger_first_name, passenger_last_name, passenger_email, passenger_phone, status, price_paid, trip_id, extras, origin_stop_id, destination_stop_id, seat_id, seats(seat_number), origin_stop:stops!bookings_origin_stop_id_fkey(name, city), destination_stop:stops!bookings_destination_stop_id_fkey(name, city), trips(id, route_id, departure_date, departure_time, arrival_time, routes(name))")
        .eq("ticket_number", qrPayload.toUpperCase())
        .maybeSingle();

      if (booking) {
        const { data: newTicket, error: createErr } = await supabase
          .from("tickets")
          .insert({
            booking_id: booking.id,
            trip_id: booking.trip_id,
            qr_payload: qrPayload.toUpperCase(),
            status: "valid",
          })
          .select(`*, bookings(${bookingSelect}), trips(id, route_id, departure_date, departure_time, arrival_time, routes(name))`)
          .single();

        if (!createErr) resolvedTicket = newTicket;
      }
    }

    // 5b. Fallback: Pauschalreise-/Tour-Buchung per Buchungsnummer (MT-YYYY-XXXXXX)
    if (!resolvedTicket) {
      const bookingNumber = qrPayload.toUpperCase();
      const { data: tourBooking } = await supabase
        .from("tour_bookings")
        .select(
          "id, booking_number, contact_first_name, contact_last_name, contact_phone, participants, status, payment_status, total_price, tour_date_id, tour_dates(departure_date, return_date, package_tours(destination, title))",
        )
        .eq("booking_number", bookingNumber)
        .maybeSingle();

      if (tourBooking) {
        const cancelled = ["cancelled", "storniert", "refunded"].includes(
          String(tourBooking.status ?? "").toLowerCase(),
        );
        const td: any = tourBooking.tour_dates;
        const tripInfo = {
          route: td?.package_tours?.destination || td?.package_tours?.title || "Pauschalreise",
          date: td?.departure_date ?? null,
          time: null,
        };
        const passengerInfo = {
          name: `${tourBooking.contact_first_name ?? ""} ${tourBooking.contact_last_name ?? ""}`.trim(),
          phone: tourBooking.contact_phone ?? null,
          seat: null,
          price: tourBooking.total_price,
          participants: tourBooking.participants,
        };

        if (cancelled) {
          await supabase.from("scan_logs").insert({
            user_id: userId,
            qr_payload: qrPayload,
            result: "invalid",
            message: "Buchung storniert",
          });
          return new Response(
            JSON.stringify({ result: "invalid", message: "Buchung storniert", color: "red", passenger: passengerInfo, trip: tripInfo }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        const { data: previous } = await supabase
          .from("scan_logs")
          .select("id, scan_time")
          .eq("qr_payload", bookingNumber)
          .eq("result", "checked_in")
          .order("scan_time", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (previous) {
          await supabase.from("scan_logs").insert({
            user_id: userId,
            qr_payload: bookingNumber,
            result: "already_checked_in",
            message: "Bereits eingecheckt",
          });
          return new Response(
            JSON.stringify({
              result: "already_checked_in",
              message: "Bereits eingecheckt",
              color: "yellow",
              checked_in_at: previous.scan_time,
              passenger: passengerInfo,
              trip: tripInfo,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        await supabase.from("scan_logs").insert({
          user_id: userId,
          qr_payload: bookingNumber,
          result: "checked_in",
          message: "Erfolgreich eingecheckt (Pauschalreise)",
        });
        await supabase.from("scanner_events").insert({
          scanner_user_id: userId,
          ticket_number: bookingNumber,
          result: "valid",
          scan_type: "check_in",
        });

        return new Response(
          JSON.stringify({
            result: "checked_in",
            message: "Ticket gültig – eingecheckt ✓",
            color: "green",
            ticket: { qr_payload: bookingNumber, checked_in_at: new Date().toISOString() },
            passenger: passengerInfo,
            trip: tripInfo,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }


    if (!resolvedTicket) {
      await supabase.from("scan_logs").insert({
        user_id: userId,
        qr_payload: qrPayload,
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

    // 6. Validate ticket status
    if (resolvedTicket.status === "cancelled" || resolvedTicket.status === "refunded") {
      await supabase.from("scan_logs").insert({
        ticket_id: resolvedTicket.id,
        booking_id: booking?.id,
        trip_id: trip?.id,
        user_id: userId,
        qr_payload: qrPayload,
        result: "invalid",
        message: `Ticket ${resolvedTicket.status === "cancelled" ? "storniert" : "erstattet"}`,
      });

      return new Response(
        JSON.stringify({
          result: "invalid",
          message: resolvedTicket.status === "cancelled" ? "Ticket storniert" : "Ticket erstattet",
          color: "red",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (resolvedTicket.status === "checked_in") {
      await supabase.from("scan_logs").insert({
        ticket_id: resolvedTicket.id,
        booking_id: booking?.id,
        trip_id: trip?.id,
        user_id: userId,
        qr_payload: qrPayload,
        result: "already_checked_in",
        message: `Bereits eingecheckt um ${resolvedTicket.checked_in_at}`,
      });

      const originStopDup = booking?.origin_stop;
      const destStopDup = booking?.destination_stop;
      
      return new Response(
        JSON.stringify({
          result: "already_checked_in",
          message: "Ticket bereits eingecheckt",
          color: "yellow",
          checked_in_at: resolvedTicket.checked_in_at,
          passenger: buildPassenger(booking, originStopDup, destStopDup),
          trip: trip
            ? { route: trip.routes?.name, date: trip.departure_date, time: trip.departure_time }
            : null,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Check in!
    const now = new Date().toISOString();
    await supabase
      .from("tickets")
      .update({
        status: "checked_in",
        checked_in_at: now,
        checked_in_by: userId,
        updated_at: now,
      })
      .eq("id", resolvedTicket.id);

    await supabase.from("scan_logs").insert({
      ticket_id: resolvedTicket.id,
      booking_id: booking?.id,
      trip_id: trip?.id,
      user_id: userId,
      qr_payload: qrPayload,
      result: "checked_in",
      message: "Erfolgreich eingecheckt",
    });

    // Ops dashboard compatibility
    await supabase.from("scanner_events").insert({
      scanner_user_id: userId,
      ticket_number: qrPayload,
      booking_id: booking?.id,
      result: "valid",
      scan_type: "check_in",
      trip_id: trip?.id,
    });

    // 8. Webhook (idempotent, async)
    const eventId = crypto.randomUUID();

    if (webhookUrl && webhookSecret) {
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
          scanner_user: { id: userId, email: userEmail },
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

        sendWebhookWithRetry(webhookUrl, webhookSecret, webhookPayload, eventId, resolvedTicket.id, supabase)
          .catch((e) => console.error("Webhook error:", e));
      }
    }

    // 9. Return success with extended driver info
    const originStop = booking?.origin_stop;
    const destStop = booking?.destination_stop;
    
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
        passenger: buildPassenger(booking, originStop, destStop),
        trip: trip
          ? { 
              route: trip.routes?.name, 
              date: trip.departure_date, 
              time: trip.departure_time,
              arrival: trip.arrival_time,
            }
          : null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Scan error:", err);
    // Don't leak internal error details
    return new Response(
      JSON.stringify({ error: "Interner Fehler", result: "error", color: "red" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
