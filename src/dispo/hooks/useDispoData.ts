import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export interface DispoOrder {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  passengers: number;
  origin: string | null;
  destination: string | null;
  waypoints: any[];
  departure_date: string | null;
  departure_time: string | null;
  return_date: string | null;
  return_time: string | null;
  distance_km: number | null;
  duration_min: number | null;
  bus_id: string | null;
  driver_user_id: string | null;
  second_driver_user_id: string | null;
  price_net: number;
  vat_rate: number;
  price_gross: number;
  platform_fee: number;
  payout: number;
  estimated_cost: number;
  margin: number;
  calculation: any;
  luggage: string | null;
  requirements: string | null;
  notes: string | null;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface DispoDriver {
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface DispoEmail {
  id: string;
  folder: string;
  direction: string;
  from_name: string | null;
  from_email: string | null;
  to_email: string | null;
  subject: string | null;
  body_text: string | null;
  received_at: string;
  is_read: boolean;
  is_inquiry: boolean;
  ai_status: string;
  ai_confidence: number | null;
  extracted: any;
  order_id: string | null;
}

export function useDispoData() {
  const [orders, setOrders] = useState<DispoOrder[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<DispoDriver[]>([]);
  const [emails, setEmails] = useState<DispoEmail[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [ordRes, custRes, busRes, roleRes, mailRes, offRes] = await Promise.all([
      db.from("dispo_orders").select("*").order("departure_date", { ascending: true }),
      db.from("dispo_customers").select("*").order("name"),
      db.from("buses").select("*").order("name"),
      db.from("user_roles").select("user_id").eq("role", "driver"),
      db.from("dispo_emails").select("*").order("received_at", { ascending: false }).limit(300),
      db.from("dispo_offers").select("*").order("created_at", { ascending: false }),
    ]);

    const driverIds: string[] = (roleRes.data ?? []).map((r: any) => r.user_id);
    let driverList: DispoDriver[] = [];
    if (driverIds.length) {
      const { data: profs } = await db
        .from("profiles")
        .select("user_id, first_name, last_name, email, phone")
        .in("user_id", driverIds);
      const map = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
      driverList = driverIds.map((id) => {
        const p: any = map.get(id);
        const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
        return { user_id: id, name: name || p?.email || `Fahrer ${id.slice(0, 6)}`, email: p?.email ?? null, phone: p?.phone ?? null };
      });
    }

    setOrders((ordRes.data ?? []) as DispoOrder[]);
    setCustomers(custRes.data ?? []);
    setBuses(busRes.data ?? []);
    setDrivers(driverList);
    setEmails((mailRes.data ?? []) as DispoEmail[]);
    setOffers(offRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`dispo-cockpit-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "dispo_orders" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "dispo_emails" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { orders, customers, buses, drivers, emails, offers, loading, reload: load };
}

export const busName = (buses: any[], id?: string | null) =>
  buses.find((b) => b.id === id)?.name ?? null;

export const driverName = (drivers: DispoDriver[], id?: string | null) =>
  drivers.find((d) => d.user_id === id)?.name ?? null;
