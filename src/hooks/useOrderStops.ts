import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export interface OrderStop {
  id: string;
  order_id: string;
  sort_order: number;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  stop_type: string;
  planned_arrival: string | null;
  planned_departure: string | null;
  actual_arrival: string | null;
  actual_departure: string | null;
  dwell_minutes: number;
  notes: string | null;
}

export interface OrderToll {
  id: string;
  order_id: string;
  sort_order: number;
  name: string;
  country_code: string | null;
  lat: number | null;
  lng: number | null;
  distance_from_start_km: number | null;
  expected_cost: number | null;
  currency: string | null;
  requires_transponder: boolean | null;
  is_estimated: boolean;
}

export const STOP_TYPE_LABEL: Record<string, string> = {
  stop: "Haltestelle",
  pickup: "Zustieg",
  dropoff: "Ausstieg",
  break: "Pausenhalt",
  toll: "Mautstelle",
  border: "Grenzübergang",
  destination: "Ziel",
};

/** Haltestellen, Mautabschnitte und Verspätung eines Fahrauftrags – mit Realtime. */
export const useOrderStops = (orderId: string | undefined | null) => {
  const [stops, setStops] = useState<OrderStop[]>([]);
  const [tolls, setTolls] = useState<OrderToll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orderId) {
      setStops([]);
      setTolls([]);
      setIsLoading(false);
      return;
    }
    const [stopRes, tollRes] = await Promise.all([
      db.from("dispatch_order_stops").select("*").eq("order_id", orderId).order("sort_order"),
      db.from("dispatch_order_tolls").select("*").eq("order_id", orderId).order("sort_order"),
    ]);
    setStops((stopRes.data ?? []) as OrderStop[]);
    setTolls((tollRes.data ?? []) as OrderToll[]);
    setIsLoading(false);
  }, [orderId]);

  useEffect(() => {
    load();
    if (!orderId) return;
    const channel = supabase
      .channel(`order-stops-${orderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dispatch_order_stops", filter: `order_id=eq.${orderId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, load]);

  const nextStop = useMemo(
    () => stops.find((s) => !s.actual_departure) ?? null,
    [stops],
  );

  const markArrival = useCallback(
    async (stopId: string) => {
      const { error } = await db
        .from("dispatch_order_stops")
        .update({ actual_arrival: new Date().toISOString() })
        .eq("id", stopId);
      if (error) throw error;
      await load();
    },
    [load],
  );

  const markDeparture = useCallback(
    async (stopId: string) => {
      const stop = stops.find((s) => s.id === stopId);
      const patch: Record<string, any> = { actual_departure: new Date().toISOString() };
      if (!stop?.actual_arrival) patch.actual_arrival = new Date().toISOString();
      const { error } = await db.from("dispatch_order_stops").update(patch).eq("id", stopId);
      if (error) throw error;
      await load();
    },
    [stops, load],
  );

  /** Erwartete Ankunft je Halt inkl. aktueller Verspätung. */
  const expectedArrival = useCallback(
    (stop: OrderStop, delayMinutes: number) => {
      if (stop.actual_arrival) return new Date(stop.actual_arrival);
      if (!stop.planned_arrival) return null;
      return new Date(new Date(stop.planned_arrival).getTime() + delayMinutes * 60000);
    },
    [],
  );

  return { stops, tolls, nextStop, isLoading, reload: load, markArrival, markDeparture, expectedArrival };
};

/** Mautabschnitte einer berechneten Route für den Auftrag speichern. */
export const saveRouteTolls = async (
  orderId: string,
  segments: {
    name: string;
    countryCode: string | null;
    lat: number | null;
    lng: number | null;
    distanceFromStartKm: number;
  }[],
  cost: { currency: string; cash: number | null; electronic: number | null } | null,
  available: boolean,
) => {
  await db.from("dispatch_order_tolls").delete().eq("order_id", orderId);
  if (segments.length) {
    await db.from("dispatch_order_tolls").insert(
      segments.map((s, i) => ({
        order_id: orderId,
        sort_order: i,
        name: s.name,
        country_code: s.countryCode,
        lat: s.lat,
        lng: s.lng,
        distance_from_start_km: s.distanceFromStartKm,
        expected_cost: i === 0 ? cost?.electronic ?? cost?.cash ?? null : null,
        currency: i === 0 ? cost?.currency ?? null : null,
        requires_transponder: cost?.electronic != null ? true : null,
        is_estimated: true,
      })),
    );
  }
  await db.from("dispatch_orders").update({ toll_data_available: available }).eq("id", orderId);
};
