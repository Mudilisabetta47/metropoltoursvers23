import { supabase } from "@/integrations/supabase/client";

export type TripCategory = "line" | "charter" | "private" | "group" | "special" | "maiden";

export const CHARTER_SOURCE_TYPES = [
  "charter_trip",
  "private_trip",
  "group_trip",
  "special_trip",
  "maiden_trip",
];

export const TRIP_CATEGORY_LABELS: Record<string, string> = {
  line: "Linienfahrt",
  charter: "Individuelle Busreise",
  private: "Private Fahrt",
  group: "Gruppenfahrt",
  special: "Sonderfahrt",
  maiden: "Jungfernfahrt",
  package_tour_date: "Pauschalreise",
};

export const STOP_TYPE_LABELS: Record<string, string> = {
  departure: "Abfahrt",
  stop: "Zwischenhalt",
  break: "Pause",
  border: "Grenzübergang",
  arrival: "Ankunft",
};

export interface ScheduleStopInput {
  label: string;
  location?: string;
  stop_type: keyof typeof STOP_TYPE_LABELS;
  planned_arrival?: string | null;
  planned_departure?: string | null;
  notes?: string | null;
}

export interface CharterTripInput {
  title: string;
  category: TripCategory;
  busId: string;
  driverUserId?: string | null;
  guideUserId?: string | null;
  seatCapacity?: number | null;
  internalNotes?: string | null;
  basePrice?: number;
  origin: string;
  destination: string;
  intermediates: string[];
  departureDate: string; // yyyy-MM-dd
  departureTime: string; // HH:mm
  arrivalDate?: string | null;
  arrivalTime: string;
  hasReturn: boolean;
  returnDate?: string | null;
  returnDepartureTime?: string | null;
  returnArrivalDate?: string | null;
  returnArrivalTime?: string | null;
}

const iso = (date?: string | null, time?: string | null) => {
  if (!date || !time) return null;
  return new Date(`${date}T${time.length === 5 ? time : time.slice(0, 5)}:00`).toISOString();
};

/** Stellt sicher, dass für den Bus Sitzplätze existieren (aus dem Layout generiert). */
export async function ensureSeats(busId: string) {
  const { count } = await supabase
    .from("seats")
    .select("id", { count: "exact", head: true })
    .eq("bus_id", busId);
  if ((count || 0) > 0) return;

  const { data: bus } = await supabase.from("buses").select("*").eq("id", busId).maybeSingle();
  if (!bus) return;
  const layout: any = bus.layout || {};
  const perRow = Number(layout.seatsPerRow) || 4;
  const total = Number(bus.total_seats) || 48;
  const rows = Number(layout.rows) || Math.ceil(total / perRow);
  const letters = ["A", "B", "C", "D", "E"];
  const seats: any[] = [];
  let n = 0;
  for (let r = 1; r <= rows && n < total; r++) {
    for (let c = 1; c <= perRow && n < total; c++) {
      n++;
      seats.push({
        bus_id: busId,
        seat_number: `${r}${letters[c - 1] || c}`,
        row_number: r,
        column_number: c,
        seat_type: "standard",
        is_active: true,
      });
    }
  }
  if (seats.length) await supabase.from("seats").insert(seats);
}

/**
 * Legt eine individuelle Fahrt als vollwertige Fahrt an:
 * Route → Halte → Hin-/Rückfahrt → Fahrplan → Sitzplätze → Trip-Registry (via Trigger).
 */
export async function createCharterTrip(input: CharterTripInput): Promise<{ tripId: string; returnTripId: string | null }> {
  const { data: route, error: routeErr } = await supabase
    .from("routes")
    .insert({
      name: input.title,
      description: `${input.origin} → ${input.destination}`,
      base_price: input.basePrice ?? 0,
      is_active: true,
      trip_category: input.category,
      is_charter: true,
    } as any)
    .select()
    .single();
  if (routeErr) throw routeErr;

  const stopNames = [input.origin, ...input.intermediates.filter(Boolean), input.destination];
  const { data: stops, error: stopsErr } = await supabase
    .from("stops")
    .insert(
      stopNames.map((name, i) => ({
        route_id: route.id,
        name,
        city: name,
        stop_order: i + 1,
        price_from_start: 0,
      }))
    )
    .select();
  if (stopsErr) throw stopsErr;

  await ensureSeats(input.busId);

  const baseTrip = {
    route_id: route.id,
    bus_id: input.busId,
    base_price: input.basePrice ?? 0,
    is_active: true,
    title: input.title,
    trip_category: input.category,
    internal_notes: input.internalNotes || null,
    driver_user_id: input.driverUserId || null,
    guide_user_id: input.guideUserId || null,
    seat_capacity: input.seatCapacity || null,
    status: "planned",
  };

  const { data: outbound, error: tripErr } = await supabase
    .from("trips")
    .insert({
      ...baseTrip,
      departure_date: input.departureDate,
      departure_time: input.departureTime,
      arrival_date: input.arrivalDate || input.departureDate,
      arrival_time: input.arrivalTime,
      direction: "outbound",
    } as any)
    .select()
    .single();
  if (tripErr) throw tripErr;

  let returnTripId: string | null = null;
  if (input.hasReturn && input.returnDate && input.returnDepartureTime) {
    const { data: back, error: backErr } = await supabase
      .from("trips")
      .insert({
        ...baseTrip,
        title: `${input.title} · Rückfahrt`,
        departure_date: input.returnDate,
        departure_time: input.returnDepartureTime,
        arrival_date: input.returnArrivalDate || input.returnDate,
        arrival_time: input.returnArrivalTime || input.returnDepartureTime,
        direction: "return",
      } as any)
      .select()
      .single();
    if (backErr) throw backErr;
    returnTripId = back.id;
    await supabase.from("trips").update({ return_trip_id: back.id } as any).eq("id", outbound.id);
    await supabase.from("trips").update({ return_trip_id: outbound.id } as any).eq("id", back.id);

    const reversed = [...(stops || [])].reverse();
    await supabase.from("trip_schedule_stops").insert(
      reversed.map((s: any, i: number) => ({
        trip_id: back.id,
        stop_id: s.id,
        label: s.name,
        location: s.city,
        stop_type: i === 0 ? "departure" : i === reversed.length - 1 ? "arrival" : "stop",
        planned_departure: i === 0 ? iso(input.returnDate, input.returnDepartureTime) : null,
        planned_arrival:
          i === reversed.length - 1
            ? iso(input.returnArrivalDate || input.returnDate, input.returnArrivalTime || input.returnDepartureTime)
            : null,
        sort_order: i,
      })) as any
    );
  }

  await supabase.from("trip_schedule_stops").insert(
    (stops || []).map((s: any, i: number) => ({
      trip_id: outbound.id,
      stop_id: s.id,
      label: s.name,
      location: s.city,
      stop_type: i === 0 ? "departure" : i === (stops || []).length - 1 ? "arrival" : "stop",
      planned_departure: i === 0 ? iso(input.departureDate, input.departureTime) : null,
      planned_arrival:
        i === (stops || []).length - 1
          ? iso(input.arrivalDate || input.departureDate, input.arrivalTime)
          : null,
      sort_order: i,
    })) as any
  );

  return { tripId: outbound.id, returnTripId };
}

export async function getTripUid(tripId: string): Promise<string | null> {
  const { data } = await supabase
    .from("trip_registry")
    .select("trip_uid")
    .eq("source_id", tripId)
    .in("source_type", CHARTER_SOURCE_TYPES)
    .maybeSingle();
  return data?.trip_uid || null;
}
