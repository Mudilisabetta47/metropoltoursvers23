import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MyTicket {
  id: string;
  ticket_number: string;
  booking_number: string | null;
  status: string;
  payment_status: string | null;
  price_paid: number | null;
  passenger_name: string;
  seat_number: string | null;
  trip_id: string | null;
  trip_title: string;
  trip_category: string | null;
  departure_date: string | null;
  departure_time: string | null;
  return_date: string | null;
  origin: string | null;
  destination: string | null;
}

/** Alle Tickets des angemeldeten Nutzers (Linien-, Charter- und Individualfahrten). */
export function useMyTickets() {
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setAuthed(false);
      setTickets([]);
      setLoading(false);
      return;
    }
    setAuthed(true);

    const { data } = await supabase
      .from("bookings")
      .select(
        `id, ticket_number, booking_number, status, payment_status, price_paid,
         passenger_first_name, passenger_last_name, trip_id,
         seats:seat_id ( seat_number ),
         origin:origin_stop_id ( name ),
         destination:destination_stop_id ( name ),
         trips:trip_id ( title, trip_category, departure_date, departure_time, return_date, routes ( name ) )`,
      )
      .eq("user_id", session.session.user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    setTickets(
      ((data ?? []) as any[]).map((b) => ({
        id: b.id,
        ticket_number: b.ticket_number,
        booking_number: b.booking_number,
        status: b.status,
        payment_status: b.payment_status,
        price_paid: b.price_paid,
        passenger_name: `${b.passenger_first_name ?? ""} ${b.passenger_last_name ?? ""}`.trim(),
        seat_number: b.seats?.seat_number ?? null,
        trip_id: b.trip_id,
        trip_title: b.trips?.title || b.trips?.routes?.name || "Fahrt",
        trip_category: b.trips?.trip_category ?? null,
        departure_date: b.trips?.departure_date ?? null,
        departure_time: b.trips?.departure_time ?? null,
        return_date: b.trips?.return_date ?? null,
        origin: b.origin?.name ?? null,
        destination: b.destination?.name ?? null,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { tickets, loading, authed, reload: load };
}

export const ticketStatusMeta = (
  status: string,
  paymentStatus: string | null,
): { label: string; className: string } => {
  if (status === "cancelled") return { label: "Storniert", className: "bg-destructive/15 text-destructive" };
  if (paymentStatus === "paid" || status === "confirmed")
    return { label: "Zahlung erfolgreich", className: "bg-primary/15 text-primary" };
  if (paymentStatus === "failed")
    return { label: "Zahlung fehlgeschlagen", className: "bg-destructive/15 text-destructive" };
  return { label: "Buchung offen", className: "bg-muted text-muted-foreground" };
};
