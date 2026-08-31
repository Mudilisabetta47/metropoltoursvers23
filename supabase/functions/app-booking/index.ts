import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

function stripeClient() {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Stripe ist nicht konfiguriert");
  return new Stripe(key, { apiVersion: "2025-08-27.basil" });
}

function str(v: unknown, max = 120): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Serverseitiger Extras-Katalog – Preise werden NIE vom Client übernommen. */
const EXTRAS_CATALOG: Record<string, { label: string; price: number; perPassenger: boolean }> = {
  extra_luggage: { label: "Zusätzliches Gepäckstück", price: 12, perPassenger: true },
  oversize_luggage: { label: "Sperrgepäck (Ski, Rad, Kinderwagen)", price: 19, perPassenger: false },
  priority: { label: "Priority Boarding", price: 6.9, perPassenger: true },
  premium_seat: { label: "Premium-Sitzplatz (extra Beinfreiheit)", price: 9.9, perPassenger: true },
  flex: { label: "Flex-Option (kostenlose Umbuchung)", price: 14.9, perPassenger: true },
};

function resolveExtras(raw: unknown, passengers: number) {
  const ids = Array.isArray(raw)
    ? raw.map((v) => str(v, 40)).filter((id) => id in EXTRAS_CATALOG).slice(0, 10)
    : [];
  const unique = [...new Set(ids)];
  const items = unique.map((id) => {
    const e = EXTRAS_CATALOG[id];
    const qty = e.perPassenger ? passengers : 1;
    return { id, label: e.label, unit_price: e.price, quantity: qty, total: Number((e.price * qty).toFixed(2)) };
  });
  const total = Number(items.reduce((s, i) => s + i.total, 0).toFixed(2));
  return { items, total };
}


async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) throw new Error("Nicht angemeldet");
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) throw new Error("Nicht angemeldet");
  return data.user;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = str(body?.action, 30);

    if (action === "config") {
      return json({
        stripePublishableKey: Deno.env.get("STRIPE_PUBLISHABLE_KEY") ?? null,
      });
    }

    const user = await requireUser(req);
    const db = admin();

    /* ---------------------------------------------------------- CREATE */
    /* ----------------------------------------------------- CREATE TOUR */
    if (action === "create" && str(body?.type, 20) === "tour") {
      const tourId = str(body?.tourId, 40);
      const tourDateId = str(body?.tourDateId, 40);
      const tariffId = str(body?.tariffId, 40);
      const pickupStopId = str(body?.pickupStopId, 40);
      const participants = Math.max(1, Math.min(20, Number(body?.participants) || 1));
      const passengers = Array.isArray(body?.passengers) ? body.passengers.slice(0, 20) : [];

      if (![tourId, tourDateId, tariffId].every((id) => UUID.test(id))) {
        return json({ error: "Ungültige Reiseauswahl" }, 400);
      }
      if (passengers.length !== participants) {
        return json({ error: "Bitte alle Reisenden erfassen" }, 400);
      }

      const cleanPassengers = passengers.map((p: any) => ({
        first_name: str(p?.firstName, 80),
        last_name: str(p?.lastName, 80),
        date_of_birth: str(p?.dateOfBirth, 10) || null,
      }));
      if (cleanPassengers.some((p) => !p.first_name || !p.last_name || !p.date_of_birth)) {
        return json({ error: "Bitte Name und Geburtsdatum aller Reisenden angeben" }, 400);
      }

      const [{ data: tourDate }, { data: tariff }, { data: pickup }] = await Promise.all([
        db.from("tour_dates").select("*").eq("id", tourDateId).eq("tour_id", tourId).maybeSingle(),
        db.from("tour_tariffs").select("*").eq("id", tariffId).eq("tour_id", tourId).maybeSingle(),
        UUID.test(pickupStopId)
          ? db.from("tour_pickup_stops").select("id, surcharge").eq("id", pickupStopId).maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      if (!tourDate || !tariff) return json({ error: "Reisetermin nicht gefunden" }, 404);

      const basePrice =
        tariff.slug === "smart"
          ? tourDate.price_smart ?? tourDate.price_basic
          : tariff.slug === "flex"
            ? tourDate.price_flex ?? tourDate.price_basic
            : tariff.slug === "business"
              ? tourDate.price_business ?? tourDate.price_basic
              : tourDate.price_basic;
      const perPerson = Number(basePrice ?? 0) + Number(tariff.price_modifier ?? 0);
      const surcharge = Number(pickup?.surcharge ?? 0);
      const total = Number(((perPerson + surcharge) * participants).toFixed(2));
      if (!(total > 0)) return json({ error: "Preis konnte nicht ermittelt werden" }, 400);

      const { data: reserved, error: reserveErr } = await db.rpc("reserve_tour_seats", {
        p_tour_date_id: tourDateId,
        p_seats: participants,
      });
      if (reserveErr) throw reserveErr;
      if (!reserved) return json({ error: "Nicht genügend freie Plätze" }, 409);

      const contactEmail = str(body?.contactEmail, 160).toLowerCase() || user.email || "";
      const { data: bookingNumber, error: bnErr } = await db.rpc("next_booking_number");
      if (bnErr) throw bnErr;

      const { data: tourBooking, error: tbErr } = await db
        .from("tour_bookings")
        .insert({
          booking_number: bookingNumber,
          tour_id: tourId,
          tour_date_id: tourDateId,
          tariff_id: tariffId,
          pickup_stop_id: UUID.test(pickupStopId) ? pickupStopId : null,
          user_id: user.id,
          participants,
          passenger_details: cleanPassengers,
          contact_first_name: cleanPassengers[0].first_name,
          contact_last_name: cleanPassengers[0].last_name,
          contact_email: contactEmail,
          contact_phone: str(body?.contactPhone, 40) || null,
          base_price: perPerson,
          pickup_surcharge: surcharge,
          total_price: total,
          status: "pending",
          payment_status: "unpaid",
          payment_method: "stripe",
          booking_type: "app",
        })
        .select("id, booking_number, total_price")
        .single();
      if (tbErr) throw tbErr;

      return json({
        type: "tour",
        bookingNumber: tourBooking.booking_number,
        bookingIds: [tourBooking.id],
        unitPrice: perPerson + surcharge,
        total,
      });
    }

    /* ---------------------------------------------------------- CREATE */
    if (action === "create") {

      const tripId = str(body?.tripId, 40);
      const originStopId = str(body?.originStopId, 40);
      const destinationStopId = str(body?.destinationStopId, 40);
      const seatIds: string[] = Array.isArray(body?.seatIds)
        ? body.seatIds.filter((s: unknown) => typeof s === "string" && UUID.test(s)).slice(0, 20)
        : [];
      const passengers = Array.isArray(body?.passengers) ? body.passengers.slice(0, 20) : [];
      const paymentMethod = ["card", "invoice"].includes(str(body?.paymentMethod, 20))
        ? str(body?.paymentMethod, 20)
        : "card";

      if (![tripId, originStopId, destinationStopId].every((id) => UUID.test(id))) {
        return json({ error: "Ungültige Fahrt- oder Streckenauswahl" }, 400);
      }
      if (originStopId === destinationStopId) {
        return json({ error: "Start und Ziel dürfen nicht identisch sein" }, 400);
      }
      if (!seatIds.length || seatIds.length !== passengers.length) {
        return json({ error: "Sitzplätze und Fahrgastdaten stimmen nicht überein" }, 400);
      }
      if (new Set(seatIds).size !== seatIds.length) {
        return json({ error: "Ein Sitzplatz wurde mehrfach gewählt" }, 400);
      }

      const cleanPassengers = passengers.map((p: any) => ({
        first_name: str(p?.firstName, 80),
        last_name: str(p?.lastName, 80),
        email: str(p?.email, 160).toLowerCase(),
        phone: str(p?.phone, 40),
      }));
      if (cleanPassengers.some((p) => !p.first_name || !p.last_name)) {
        return json({ error: "Bitte alle Fahrgastnamen angeben" }, 400);
      }
      const contactEmail = str(body?.contactEmail, 160).toLowerCase() || user.email || "";
      if (!contactEmail.includes("@")) return json({ error: "Ungültige E-Mail-Adresse" }, 400);

      const [{ data: trip }, { data: origin }, { data: destination }] = await Promise.all([
        db.from("trips").select("id, bus_id, departure_date, status, is_active").eq("id", tripId).maybeSingle(),
        db.from("stops").select("id, stop_order, route_id").eq("id", originStopId).maybeSingle(),
        db.from("stops").select("id, stop_order, route_id").eq("id", destinationStopId).maybeSingle(),
      ]);
      if (!trip) return json({ error: "Fahrt nicht gefunden" }, 404);
      if (!origin || !destination || origin.stop_order >= destination.stop_order) {
        return json({ error: "Ungültige Streckenauswahl" }, 400);
      }

      // Sitzplatzverfügbarkeit serverseitig prüfen
      for (const seatId of seatIds) {
        const { data: ok, error: availErr } = await db.rpc("check_seat_availability", {
          p_trip_id: tripId,
          p_seat_id: seatId,
          p_origin_stop_order: origin.stop_order,
          p_destination_stop_order: destination.stop_order,
        });
        if (availErr) throw availErr;
        if (!ok) return json({ error: "Ein gewählter Sitzplatz ist nicht mehr verfügbar" }, 409);
      }

      // Preis ausschließlich serverseitig ermitteln
      const { data: unitPrice, error: priceErr } = await db.rpc("calculate_trip_price", {
        p_trip_id: tripId,
        p_origin_stop_id: originStopId,
        p_destination_stop_id: destinationStopId,
      });
      if (priceErr) throw priceErr;
      const perSeat = Number(unitPrice ?? 0);
      if (!(perSeat > 0)) return json({ error: "Preis konnte nicht ermittelt werden" }, 400);

      const { data: bookingNumber, error: bnErr } = await db.rpc("next_booking_number");
      if (bnErr) throw bnErr;

      const rows: any[] = [];
      for (let i = 0; i < seatIds.length; i++) {
        const { data: ticketNumber, error: tnErr } = await db.rpc("generate_ticket_number");
        if (tnErr) throw tnErr;
        rows.push({
          ticket_number: ticketNumber,
          booking_number: bookingNumber,
          user_id: user.id,
          trip_id: tripId,
          origin_stop_id: originStopId,
          destination_stop_id: destinationStopId,
          seat_id: seatIds[i],
          passenger_first_name: cleanPassengers[i].first_name,
          passenger_last_name: cleanPassengers[i].last_name,
          passenger_email: cleanPassengers[i].email || contactEmail,
          passenger_phone: cleanPassengers[i].phone || str(body?.contactPhone, 40) || null,
          price_paid: perSeat,
          status: "pending",
          payment_status: "unpaid",
          payment_method: paymentMethod === "invoice" ? "invoice" : "stripe",
        });
      }

      const { data: created, error: insertErr } = await db
        .from("bookings")
        .insert(rows)
        .select("id, ticket_number, booking_number, price_paid, seat_id");
      if (insertErr) throw insertErr;

      // Tickets über die bestehende Ticket-Logik erzeugen (QR = Ticketnummer)
      const { error: ticketErr } = await db.from("tickets").insert(
        (created ?? []).map((b) => ({
          booking_id: b.id,
          trip_id: tripId,
          qr_payload: b.ticket_number,
          status: "valid",
        })),
      );
      if (ticketErr) throw ticketErr;

      const total = Number((perSeat * seatIds.length).toFixed(2));
      return json({
        bookingNumber,
        bookingIds: (created ?? []).map((b) => b.id),
        tickets: created,
        unitPrice: perSeat,
        total,
        paymentMethod,
      });
    }

    /* ------------------------------------------- PAY / CONFIRM / CANCEL */
    const bookingNumber = str(body?.bookingNumber, 40);
    if (["pay", "confirm", "cancel"].includes(action)) {
      if (!/^MT-\d{4}-\d{6}$/.test(bookingNumber)) {
        return json({ error: "Ungültige Buchungsnummer" }, 400);
      }

      // Buchungsgruppe finden – Linien-/Individualfahrten oder Pauschalreise
      const { data: tripRows } = await db
        .from("bookings")
        .select("id, user_id, price_paid, payment_status, stripe_session_id")
        .eq("booking_number", bookingNumber);

      let table: "bookings" | "tour_bookings" = "bookings";
      let rows: any[] = tripRows ?? [];

      if (!rows.length) {
        const { data: tourRows } = await db
          .from("tour_bookings")
          .select("id, user_id, total_price, payment_status, stripe_payment_intent_id")
          .eq("booking_number", bookingNumber);
        if (!tourRows?.length) return json({ error: "Buchung nicht gefunden" }, 404);
        table = "tour_bookings";
        rows = tourRows;
      }

      if (rows.some((b) => b.user_id !== user.id)) return json({ error: "Kein Zugriff" }, 403);
      const amountEur = rows.reduce(
        (sum, b) => sum + Number(table === "bookings" ? b.price_paid : b.total_price) || 0,
        0,
      );
      const intentField = table === "bookings" ? "stripe_session_id" : "stripe_payment_intent_id";

      if (action === "pay") {
        if (rows.every((b) => b.payment_status === "paid")) return json({ alreadyPaid: true });
        const amount = Math.round(amountEur * 100);
        if (amount < 50) return json({ error: "Ungültiger Zahlbetrag" }, 400);

        const stripe = stripeClient();
        const intent = await stripe.paymentIntents.create({
          amount,
          currency: "eur",
          automatic_payment_methods: { enabled: true },
          receipt_email: user.email ?? undefined,
          metadata: { booking_number: bookingNumber, user_id: user.id, channel: "mobile_app" },
        });

        await db
          .from(table)
          .update({ payment_status: "pending", [intentField]: intent.id })
          .eq("booking_number", bookingNumber);

        return json({ clientSecret: intent.client_secret, paymentIntentId: intent.id, amount });
      }

      if (action === "confirm") {
        const intentId = rows[0][intentField];
        if (!intentId) return json({ error: "Keine Zahlung gestartet" }, 400);
        const stripe = stripeClient();
        const intent = await stripe.paymentIntents.retrieve(intentId);

        // Zahlungsstatus wird ausschließlich serverseitig aus Stripe übernommen
        if (intent.status === "succeeded") {
          await db
            .from(table)
            .update({
              payment_status: "paid",
              status: "confirmed",
              payment_method: "stripe",
              payment_reference: intent.id,
              paid_at: new Date().toISOString(),
            })
            .eq("booking_number", bookingNumber);
          return json({ paymentStatus: "paid", status: "confirmed", bookingNumber });
        }

        if (["requires_payment_method", "canceled"].includes(intent.status)) {
          await db.from(table).update({ payment_status: "failed" }).eq("booking_number", bookingNumber);
          return json({ paymentStatus: "failed", status: "pending" });
        }

        return json({ paymentStatus: "pending", status: "pending", stripeStatus: intent.status });
      }

      // cancel
      if (rows.some((b) => b.payment_status === "paid")) {
        return json({ error: "Bezahlte Buchungen bitte über den Kundenservice stornieren" }, 400);
      }
      await db.from(table).update({ status: "cancelled" }).eq("booking_number", bookingNumber);
      if (table === "bookings") {
        await db
          .from("tickets")
          .update({ status: "cancelled" })
          .in("booking_id", rows.map((b) => b.id));
      }
      return json({ status: "cancelled" });
    }


    return json({ error: "Unbekannte Aktion" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error("app-booking error:", message);
    const status = message === "Nicht angemeldet" ? 401 : 500;
    return json({ error: message }, status);
  }
});
