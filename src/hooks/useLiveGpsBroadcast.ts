import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Options {
  /** Fahrt, für die die Position veröffentlicht wird. */
  tripId?: string | null;
  /** Wenn true, startet der Standortversand automatisch. */
  active: boolean;
  /** Status, der an die Gästeansicht übertragen wird. */
  status?: string;
  /** Mindestabstand zwischen zwei Server-Updates in ms. */
  minIntervalMs?: number;
}

export interface LiveGpsState {
  sharing: boolean;
  error: string | null;
  lastSentAt: number | null;
  coords: { lat: number; lng: number; speedKmh: number; heading: number | null } | null;
}

/**
 * Teilt die echten GPS-Daten des Fahrers mit der öffentlichen Live-Verfolgung.
 * Der Versand läuft serverseitig über die Edge Function `update-bus-position`
 * (Rollen- und Zuweisungsprüfung), nicht per direktem Tabellen-Upsert.
 */
export function useLiveGpsBroadcast({ tripId, active, status = "on_route", minIntervalMs = 10000 }: Options): LiveGpsState {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [coords, setCoords] = useState<LiveGpsState["coords"]>(null);
  const lastPush = useRef(0);
  const inFlight = useRef(false);

  const push = useCallback(
    async (lat: number, lng: number, speedKmh: number, heading: number | null) => {
      if (!tripId || inFlight.current) return;
      inFlight.current = true;
      try {
        const { error: fnError } = await supabase.functions.invoke("update-bus-position", {
          body: {
            trip_id: tripId,
            lat,
            lng,
            speed_kmh: Math.round(speedKmh),
            heading,
            status,
          },
        });
        if (fnError) setError("Position konnte nicht übertragen werden");
        else {
          setError(null);
          setLastSentAt(Date.now());
        }
      } finally {
        inFlight.current = false;
      }
    },
    [tripId, status],
  );

  useEffect(() => {
    if (!active || !tripId) {
      setSharing(false);
      return;
    }
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setError("Kein GPS auf diesem Gerät verfügbar");
      return;
    }

    setSharing(true);
    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        const speedKmh = p.coords.speed != null && p.coords.speed >= 0 ? p.coords.speed * 3.6 : 0;
        const heading = p.coords.heading != null && !Number.isNaN(p.coords.heading) ? p.coords.heading : null;
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude, speedKmh, heading });
        const now = Date.now();
        if (now - lastPush.current < minIntervalMs) return;
        lastPush.current = now;
        void push(p.coords.latitude, p.coords.longitude, speedKmh, heading);
      },
      (err) => setError(err.message || "Standort konnte nicht ermittelt werden"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setSharing(false);
    };
  }, [active, tripId, minIntervalMs, push]);

  return { sharing, error, lastSentAt, coords };
}
