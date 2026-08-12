import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type DispatchStatus =
  | "sent"
  | "accepted"
  | "rejected"
  | "en_route"
  | "paused"
  | "arrived"
  | "cancelled";

export type FleetStatus = "en_route" | "accepted" | "break" | "arrived" | "offline";

export interface DispatchOrder {
  id: string;
  order_number: string;
  title: string;
  driver_user_id: string | null;
  bus_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  origin_name: string | null;
  origin_address: string | null;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_name: string | null;
  destination_address: string | null;
  destination_lat: number | null;
  destination_lng: number | null;
  waypoints: { name: string; address?: string; lat: number; lng: number }[];
  departure_at: string | null;
  notes: string | null;
  status: DispatchStatus;
  priority: string;
  eta: string | null;
  distance_km: number | null;
  duration_min: number | null;
  progress_percent: number;
  reject_reason: string | null;
  accepted_at: string | null;
  started_at: string | null;
  arrived_at: string | null;
  created_at: string;
  route_geometry: GeoJSON.LineString | null;
  route_version: number;
  route_updated_at: string | null;
  route_note: string | null;
}


export interface FleetPosition {
  id: string;
  driver_user_id: string;
  bus_id: string | null;
  order_id: string | null;
  latitude: number;
  longitude: number;
  heading: number;
  speed_kmh: number;
  status: FleetStatus;
  source: string;
  is_demo: boolean;
  updated_at: string;
}

export interface DispatchMessage {
  id: string;
  order_id: string | null;
  driver_user_id: string;
  sender_id: string | null;
  sender_role: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface FleetDriver {
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export const FLEET_STATUS_LABEL: Record<FleetStatus, string> = {
  en_route: "Unterwegs",
  accepted: "Auftrag angenommen",
  break: "Pause",
  arrived: "Angekommen",
  offline: "Offline",
};

export const FLEET_STATUS_COLOR: Record<FleetStatus, string> = {
  en_route: "#10b981",
  accepted: "#3b82f6",
  break: "#f59e0b",
  arrived: "#8b5cf6",
  offline: "#6b7280",
};

export const ORDER_STATUS_LABEL: Record<DispatchStatus, string> = {
  sent: "Gesendet",
  accepted: "Angenommen",
  rejected: "Abgelehnt",
  en_route: "Unterwegs",
  paused: "Pause",
  arrived: "Angekommen",
  cancelled: "Storniert",
};

/** Leitstellen-Daten: Fahrer, Busse, Positionen, Auftraege – mit Realtime. */
export const useFleetOverview = () => {
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [positions, setPositions] = useState<FleetPosition[]>([]);
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const [rolesRes, busRes, posRes, orderRes] = await Promise.all([
      db.from("user_roles").select("user_id").eq("role", "driver"),
      db.from("buses").select("*").order("name"),
      db.from("fleet_positions").select("*"),
      db.from("dispatch_orders").select("*").order("created_at", { ascending: false }).limit(200),
    ]);

    const driverIds: string[] = (rolesRes.data ?? []).map((r: any) => r.user_id);
    let driverList: FleetDriver[] = [];
    if (driverIds.length) {
      const { data: profs } = await db
        .from("profiles")
        .select("user_id, first_name, last_name, email, phone")
        .in("user_id", driverIds);
      const map = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
      driverList = driverIds.map((id) => {
        const p: any = map.get(id);
        const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
        return {
          user_id: id,
          name: name || p?.email || `Fahrer ${id.slice(0, 6)}`,
          email: p?.email ?? null,
          phone: p?.phone ?? null,
        };
      });
      // Duplikate nach Name/ID entfernen
      const seen = new Set<string>();
      driverList = driverList.filter((d) => (seen.has(d.user_id) ? false : seen.add(d.user_id)));
    }

    setDrivers(driverList);
    setBuses(busRes.data ?? []);
    setPositions((posRes.data ?? []) as FleetPosition[]);
    setOrders((orderRes.data ?? []) as DispatchOrder[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("fleet-control")
      .on("postgres_changes", { event: "*", schema: "public", table: "fleet_positions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "dispatch_orders" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { drivers, buses, positions, orders, isLoading, reload: load };
};

/** Auftraege des angemeldeten Fahrers. */
export const useDriverOrders = (userId: string | undefined) => {
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await db
      .from("dispatch_orders")
      .select("*")
      .eq("driver_user_id", userId)
      .not("status", "in", "(cancelled,rejected)")
      .order("created_at", { ascending: false })
      .limit(30);
    setOrders((data ?? []) as DispatchOrder[]);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    load();
    const channel = supabase
      .channel(`driver-orders-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dispatch_orders", filter: `driver_user_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  return { orders, isLoading, reload: load };
};

/** Chat Disponent <-> Fahrer. */
export const useDispatchMessages = (driverUserId: string | undefined) => {
  const [messages, setMessages] = useState<DispatchMessage[]>([]);

  const load = useCallback(async () => {
    if (!driverUserId) return;
    const { data } = await db
      .from("dispatch_messages")
      .select("*")
      .eq("driver_user_id", driverUserId)
      .order("created_at", { ascending: true })
      .limit(100);
    setMessages((data ?? []) as DispatchMessage[]);
  }, [driverUserId]);

  useEffect(() => {
    if (!driverUserId) return;
    load();
    const channel = supabase
      .channel(`dispatch-msg-${driverUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dispatch_messages", filter: `driver_user_id=eq.${driverUserId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverUserId, load]);

  const send = useCallback(
    async (body: string, senderId: string, senderRole: "dispatcher" | "driver", orderId?: string | null) => {
      if (!driverUserId || !body.trim()) return;
      await db.from("dispatch_messages").insert({
        driver_user_id: driverUserId,
        sender_id: senderId,
        sender_role: senderRole,
        body: body.trim(),
        order_id: orderId ?? null,
      });
    },
    [driverUserId],
  );

  return { messages, send, reload: load };
};

export const updateOrderStatus = async (
  orderId: string,
  status: DispatchStatus,
  extra: Record<string, any> = {},
) => {
  const patch: Record<string, any> = { status, ...extra };
  if (status === "accepted") patch.accepted_at = new Date().toISOString();
  if (status === "en_route") patch.started_at = new Date().toISOString();
  if (status === "arrived") {
    patch.arrived_at = new Date().toISOString();
    patch.progress_percent = 100;
  }
  const { error } = await db.from("dispatch_orders").update(patch).eq("id", orderId);
  if (error) throw error;
};

/**
 * Route eines Auftrags aus dem OPS Center neu setzen.
 * Erhoeht `route_version` – die Fahrer-Navi uebernimmt die Route dadurch
 * automatisch per Supabase Realtime (mit kurzer Ansage, ohne Bedienung).
 */
export const pushRouteUpdate = async (
  order: DispatchOrder,
  payload: {
    waypoints: { name: string; address?: string; lat: number; lng: number }[];
    destination: { name: string; address?: string; lat: number; lng: number };
    geometry: GeoJSON.LineString;
    distanceKm: number;
    durationMin: number;
    note?: string;
  },
) => {
  const { error } = await db
    .from("dispatch_orders")
    .update({
      waypoints: payload.waypoints,
      destination_name: payload.destination.name,
      destination_address: payload.destination.address ?? payload.destination.name,
      destination_lat: payload.destination.lat,
      destination_lng: payload.destination.lng,
      route_geometry: payload.geometry,
      route_version: (order.route_version ?? 1) + 1,
      route_updated_at: new Date().toISOString(),
      route_note: payload.note ?? "Neue Route vom OPS Center.",
      distance_km: payload.distanceKm,
      duration_min: payload.durationMin,
      eta: new Date(Date.now() + payload.durationMin * 60000).toISOString(),
    })
    .eq("id", order.id);
  if (error) throw error;
};
