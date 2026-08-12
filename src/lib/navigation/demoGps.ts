import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DispatchOrder, FleetPosition } from "@/hooks/useFleet";
import { GeoPoint, requestRoute } from "./routing";

const db = supabase as any;

interface Track {
  coords: [number, number][];
  index: number;
}

/**
 * Demo-GPS-Simulation (klar gekennzeichnet, schreibt is_demo = true).
 * Bewegt Fahrer entlang der echten Mapbox-Route ihres aktiven Auftrags.
 */
export const useDemoGps = (
  enabled: boolean,
  token: string | null,
  orders: DispatchOrder[],
  positions: FleetPosition[],
) => {
  const tracks = useRef<Record<string, Track>>({});
  const [tickCount, setTickCount] = useState(0);

  useEffect(() => {
    if (!enabled || !token) return;
    let cancelled = false;

    const activeOrders = orders.filter(
      (o) =>
        o.driver_user_id &&
        o.origin_lat != null &&
        o.destination_lat != null &&
        ["sent", "accepted", "en_route", "paused"].includes(o.status),
    );

    const prepare = async () => {
      for (const o of activeOrders) {
        const key = o.driver_user_id!;
        if (tracks.current[key]) continue;
        try {
          const points: GeoPoint[] = [
            { lat: Number(o.origin_lat), lng: Number(o.origin_lng) },
            ...(o.waypoints ?? []).map((w) => ({ lat: Number(w.lat), lng: Number(w.lng) })),
            { lat: Number(o.destination_lat), lng: Number(o.destination_lng) },
          ];
          const route = await requestRoute(token, points);
          if (cancelled) return;
          tracks.current[key] = { coords: route.geometry.coordinates as [number, number][], index: 0 };
        } catch {
          /* Route nicht verfuegbar – Fahrer wird uebersprungen */
        }
      }
    };
    prepare();

    const interval = setInterval(async () => {
      for (const o of activeOrders) {
        const key = o.driver_user_id!;
        const track = tracks.current[key];
        if (!track || track.coords.length < 2) continue;

        track.index = Math.min(track.index + 3, track.coords.length - 1);
        const [lng, lat] = track.coords[track.index];
        const prev = track.coords[Math.max(0, track.index - 1)];
        const heading = (Math.atan2(lng - prev[0], lat - prev[1]) * 180) / Math.PI;
        const done = track.index >= track.coords.length - 1;

        await db.from("fleet_positions").upsert(
          {
            driver_user_id: key,
            bus_id: o.bus_id,
            order_id: o.id,
            latitude: lat,
            longitude: lng,
            heading: (heading + 360) % 360,
            speed_kmh: done ? 0 : 55 + Math.round(Math.random() * 25),
            status: done ? "arrived" : "en_route",
            source: "demo",
            is_demo: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "driver_user_id" },
        );

        const progress = Math.round((track.index / (track.coords.length - 1)) * 100);
        await db
          .from("dispatch_orders")
          .update({ progress_percent: progress, status: done ? "arrived" : "en_route" })
          .eq("id", o.id);
      }
      setTickCount((c) => c + 1);
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [enabled, token, orders]);

  useEffect(() => {
    if (!enabled) tracks.current = {};
  }, [enabled]);

  return { tickCount, demoCount: positions.filter((p) => p.is_demo).length };
};
