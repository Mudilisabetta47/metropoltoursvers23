import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export interface ManifestRow {
  stop_id: string;
  stop_name: string;
  stop_city: string | null;
  sort_order: number;
  booking_id: string;
  booking_number: string;
  ticket_number: string;
  passenger_first_name: string | null;
  passenger_last_name: string | null;
  passenger_phone: string | null;
  seat_number: string | null;
  booking_status: string;
  boarded: boolean;
}

export interface ManifestStop {
  stop_id: string;
  stop_name: string;
  stop_city: string | null;
  sort_order: number;
  passengers: ManifestRow[];
  boardedCount: number;
}

export interface ManifestTrip {
  id: string;
  title: string | null;
  departure_date: string;
  departure_time: string | null;
}

/**
 * Zustiegsliste (Manifest) für die Fahrt des Fahrers an einem Datum.
 * Findet die Fahrt über direkte Fahrer-Zuweisung oder Schicht-Zuweisung
 * und lädt die Passagiere pro Einstiegshalt über get_trip_manifest (RLS-sicher).
 * Aktualisiert sich live, wenn Buchungen hinzukommen oder Tickets gescannt werden.
 */
export const useTripManifest = (userId: string | undefined | null, date: string | undefined | null) => {
  const [trip, setTrip] = useState<ManifestTrip | null>(null);
  const [rows, setRows] = useState<ManifestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId || !date) {
      setTrip(null);
      setRows([]);
      setIsLoading(false);
      return;
    }

    // 1) Fahrt des Tages finden: direkte Zuweisung am Trip oder über die Schicht
    const [tripRes, shiftRes] = await Promise.all([
      db
        .from("trips")
        .select("id, title, departure_date, departure_time")
        .eq("driver_user_id", userId)
        .eq("departure_date", date)
        .order("departure_time", { ascending: true })
        .limit(1)
        .maybeSingle(),
      db
        .from("employee_shifts")
        .select("assigned_trip_id")
        .eq("user_id", userId)
        .eq("shift_date", date)
        .not("assigned_trip_id", "is", null)
        .limit(1)
        .maybeSingle(),
    ]);

    let found: ManifestTrip | null = tripRes.data ?? null;
    if (!found && shiftRes.data?.assigned_trip_id) {
      const { data } = await db
        .from("trips")
        .select("id, title, departure_date, departure_time")
        .eq("id", shiftRes.data.assigned_trip_id)
        .maybeSingle();
      found = data ?? null;
    }
    setTrip(found);

    // 2) Manifest laden (Zugriff serverseitig abgesichert)
    if (found) {
      const { data, error } = await supabase.rpc("get_trip_manifest", { p_trip_id: found.id } as any);
      if (!error) setRows((data ?? []) as ManifestRow[]);
      else setRows([]);
    } else {
      setRows([]);
    }
    setIsLoading(false);
  }, [userId, date]);

  useEffect(() => {
    load();
    if (!userId || !date) return;
    const channel = supabase
      .channel(`trip-manifest-${userId}-${date}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "scan_logs" }, () => load())
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_shifts", filter: `user_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, date, load]);

  /** Nach Einstiegshalt gruppiert, in Fahrtrichtung sortiert. */
  const stops: ManifestStop[] = useMemo(() => {
    const map = new Map<string, ManifestStop>();
    for (const row of rows) {
      const key = row.stop_id;
      const existing = map.get(key);
      if (existing) {
        existing.passengers.push(row);
        if (row.boarded) existing.boardedCount += 1;
        continue;
      }
      map.set(key, {
        stop_id: row.stop_id,
        stop_name: row.stop_name,
        stop_city: row.stop_city,
        sort_order: row.sort_order,
        passengers: [row],
        boardedCount: row.boarded ? 1 : 0,
      });
    }
    return [...map.values()].sort((a, b) => a.sort_order - b.sort_order);
  }, [rows]);

  const totalPassengers = rows.length;
  const totalBoarded = rows.filter((r) => r.boarded).length;

  return { trip, stops, totalPassengers, totalBoarded, isLoading, reload: load };
};
