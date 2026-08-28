import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppTrip {
  id: string;
  departure_date: string;
  departure_time: string | null;
  arrival_time: string | null;
  arrival_date: string | null;
  base_price: number;
  title: string | null;
  trip_category: string;
  bus_id: string | null;
  route_id: string;
  route_name: string;
}

export interface AppStop {
  id: string;
  name: string;
  city: string | null;
  stop_order: number;
  price_from_start: number;
}

export interface AppSeat {
  id: string;
  seat_number: string;
  row_number: number;
  column_number: number;
  seat_type: string | null;
  available: boolean;
}

export const TRIP_CATEGORY_LABEL: Record<string, string> = {
  line: "Linienfahrt",
  charter: "Charterfahrt",
  private: "Individuelle Fahrt",
  group: "Gruppenfahrt",
  special: "Sonderfahrt",
  maiden: "Jungfernfahrt",
};

/** Buchbare Fahrten – Linien-, Charter- und Individualfahrten. */
export function useBookableTrips() {
  const [trips, setTrips] = useState<AppTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("trips")
        .select(
          "id, departure_date, departure_time, arrival_time, arrival_date, base_price, title, trip_category, bus_id, route_id, routes(name)",
        )
        .eq("is_active", true)
        .gte("departure_date", today)
        .order("departure_date")
        .limit(60);

      setTrips(
        ((data ?? []) as any[]).map((t) => ({
          ...t,
          route_name: t.routes?.name ?? t.title ?? "Fahrt",
        })),
      );
      setLoading(false);
    })();
  }, []);

  return { trips, loading };
}

/** Haltestellen einer Route. */
export function useRouteStops(routeId?: string | null) {
  const [stops, setStops] = useState<AppStop[]>([]);

  useEffect(() => {
    if (!routeId) {
      setStops([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("stops")
        .select("id, name, city, stop_order, price_from_start")
        .eq("route_id", routeId)
        .order("stop_order");
      setStops((data ?? []) as AppStop[]);
    })();
  }, [routeId]);

  return stops;
}

/** Sitzplätze inkl. Verfügbarkeit für den gewählten Abschnitt. */
export function useTripSeats(
  tripId?: string | null,
  busId?: string | null,
  originOrder?: number,
  destinationOrder?: number,
) {
  const [seats, setSeats] = useState<AppSeat[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!tripId || !busId || originOrder == null || destinationOrder == null) {
      setSeats([]);
      return;
    }
    setLoading(true);

    const [{ data: seatRows }, { data: bookings }, { data: holds }] = await Promise.all([
      supabase
        .from("seats")
        .select("id, seat_number, row_number, column_number, seat_type")
        .eq("bus_id", busId)
        .eq("is_active", true)
        .order("row_number")
        .order("column_number"),
      supabase
        .from("bookings")
        .select("seat_id, origin_stop_id, destination_stop_id, status")
        .eq("trip_id", tripId)
        .in("status", ["pending", "confirmed"]),
      supabase.rpc("list_seat_hold_availability"),
    ]);

    const blocked = new Set<string>();
    ((bookings ?? []) as any[]).forEach((b) => b.seat_id && blocked.add(b.seat_id));
    ((holds ?? []) as any[])
      .filter((h) => h.trip_id === tripId && !h.is_own_hold)
      .forEach((h) => h.seat_id && blocked.add(h.seat_id));

    setSeats(
      ((seatRows ?? []) as any[]).map((s) => ({
        ...s,
        available: !blocked.has(s.id),
      })),
    );
    setLoading(false);
  }, [tripId, busId, originOrder, destinationOrder]);

  useEffect(() => {
    load();
  }, [load]);

  return { seats, loading, reload: load };
}
