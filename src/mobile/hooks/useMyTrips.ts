import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { APP_STORE_KEYS, deviceStore } from "@/mobile/lib/native";

export interface MyTripInvoice {
  invoice_number: string;
  invoice_type: string | null;
  status: string | null;
  amount: number | null;
  pdf_path: string | null;
}

export interface MyTrip {
  id: string;
  booking_number: string;
  status: string;
  participants: number;
  total_price: number;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_email: string | null;
  tour: { id: string; destination: string; country: string | null; hero_image_url: string | null } | null;
  tour_date: { id: string; departure_date: string; return_date: string | null } | null;
  /** Echter Zustiegsort (Stadt) des Kunden – nie hart codieren. */
  origin: string | null;
  invoices: MyTripInvoice[];
  events: any[];
}

const OFFLINE_KEY = APP_STORE_KEYS.offlineTickets;

const num = (v: unknown) => Number(v ?? 0) || 0;

/**
 * Buchungen des Kunden.
 * - Angemeldet: direkte, RLS-geschützte Abfragen auf `tour_bookings` UND `bookings`
 *   (Linien-/Charter-/Individualfahrten werden gruppiert nach Buchungsnummer).
 * - Ohne Konto: Gast-Zugangstoken über die Edge Function `my-bookings`.
 * Ergebnisse werden zusätzlich reduziert für die Offline-Ticketansicht gespeichert.
 */
export function useMyTrips() {
  const [trips, setTrips] = useState<MyTrip[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const guestToken = await deviceStore.get(APP_STORE_KEYS.guestToken);
      const session = sessionData.session;

      if (!session && !guestToken) {
        setTrips([]);
        setEmail(null);
        setLoading(false);
        return;
      }

      let list: MyTrip[] = [];

      if (session) {
        const userId = session.user.id;
        setEmail(session.user.email ?? null);

        const [tourRes, tripRes] = await Promise.all([
          supabase
            .from("tour_bookings")
            .select(
              "id, booking_number, status, participants, total_price, payment_method, paid_at, created_at, contact_first_name, contact_last_name, contact_email, package_tours:tour_id (id, destination, country, hero_image_url), tour_dates:tour_date_id (id, departure_date, return_date), tour_pickup_stops:pickup_stop_id (city, location_name)",
            )
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(100),
          supabase
            .from("bookings")
            .select(
              "id, booking_number, ticket_number, status, payment_status, payment_method, price_paid, created_at, passenger_first_name, passenger_last_name, passenger_email, stops:origin_stop_id (city, name), trips:trip_id (id, title, departure_date, arrival_date, routes (name))",
            )
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(200),
        ]);

        // Konkreter Fehler statt leerer Seite
        if (tourRes.error && tripRes.error) throw new Error(tourRes.error.message);

        const tourTrips: MyTrip[] = ((tourRes.data ?? []) as any[]).map((b) => ({
          id: b.id,
          booking_number: b.booking_number,
          status: b.status,
          participants: b.participants ?? 1,
          total_price: num(b.total_price),
          payment_method: b.payment_method ?? null,
          paid_at: b.paid_at ?? null,
          created_at: b.created_at,
          contact_first_name: b.contact_first_name,
          contact_last_name: b.contact_last_name,
          contact_email: b.contact_email,
          tour: b.package_tours ?? null,
          tour_date: b.tour_dates ?? null,
          invoices: [],
          events: [],
        }));

        // Fahrten je Buchungsnummer bündeln
        const grouped = new Map<string, MyTrip>();
        for (const b of (tripRes.data ?? []) as any[]) {
          const key = b.booking_number ?? b.ticket_number ?? b.id;
          const existing = grouped.get(key);
          if (existing) {
            existing.participants += 1;
            existing.total_price = Number((existing.total_price + num(b.price_paid)).toFixed(2));
            continue;
          }
          grouped.set(key, {
            id: b.id,
            booking_number: key,
            status: b.status,
            participants: 1,
            total_price: num(b.price_paid),
            payment_method: b.payment_method ?? null,
            paid_at: null,
            created_at: b.created_at,
            contact_first_name: b.passenger_first_name,
            contact_last_name: b.passenger_last_name,
            contact_email: b.passenger_email,
            tour: {
              id: b.trips?.id ?? "",
              destination: b.trips?.title || b.trips?.routes?.name || "Fahrt",
              country: null,
              hero_image_url: null,
            },
            tour_date: b.trips?.departure_date
              ? { id: b.trips.id, departure_date: b.trips.departure_date, return_date: b.trips.arrival_date ?? null }
              : null,
            invoices: [],
            events: [],
          });
        }

        list = [...tourTrips, ...grouped.values()].sort((a, b) =>
          (b.created_at ?? "").localeCompare(a.created_at ?? ""),
        );

        // Rechnungen ergänzen (optional – Fehler brechen die Liste nicht ab)
        const tourIds = tourTrips.map((t) => t.id);
        if (tourIds.length) {
          const { data: inv } = await supabase
            .from("tour_invoices")
            .select("booking_id, invoice_number, invoice_type, status, amount, pdf_path")
            .in("booking_id", tourIds);
          for (const t of list) {
            t.invoices = ((inv ?? []) as any[]).filter((i) => i.booking_id === t.id);
          }
        }
      } else {
        const { data, error: fnError } = await supabase.functions.invoke("my-bookings", {
          body: { accessToken: guestToken },
        });
        if (fnError) throw fnError;
        if ((data as any)?.error) throw new Error((data as any).error);
        list = ((data as any)?.bookings ?? []) as MyTrip[];
        setEmail((data as any)?.email ?? null);
      }

      setTrips(list);
      setOffline(false);

      await deviceStore.set(
        OFFLINE_KEY,
        JSON.stringify(
          list.map((b) => ({
            booking_number: b.booking_number,
            status: b.status,
            participants: b.participants,
            contact_first_name: b.contact_first_name,
            contact_last_name: b.contact_last_name,
            destination: b.tour?.destination ?? null,
            departure_date: b.tour_date?.departure_date ?? null,
            return_date: b.tour_date?.return_date ?? null,
          })),
        ),
      );
    } catch (e: any) {
      // Offline-Fallback: gespeicherte Ticketdaten anzeigen
      const cached = await deviceStore.get(OFFLINE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as any[];
          setTrips(
            parsed.map((c) => ({
              id: c.booking_number,
              booking_number: c.booking_number,
              status: c.status,
              participants: c.participants,
              total_price: 0,
              payment_method: null,
              paid_at: null,
              created_at: "",
              contact_first_name: c.contact_first_name,
              contact_last_name: c.contact_last_name,
              contact_email: null,
              tour: c.destination
                ? { id: "", destination: c.destination, country: null, hero_image_url: null }
                : null,
              tour_date: c.departure_date
                ? { id: "", departure_date: c.departure_date, return_date: c.return_date }
                : null,
              invoices: [],
              events: [],
            })),
          );
          setOffline(true);
        } catch {
          /* ignore */
        }
      }
      setError(e?.message ?? "Buchungen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onRefresh = () => void load();
    window.addEventListener("metours:native-refresh", onRefresh);
    const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
    return () => {
      window.removeEventListener("metours:native-refresh", onRefresh);
      sub.subscription.unsubscribe();
    };
  }, [load]);

  return { trips, email, loading, error, offline, reload: load };
}

/** Gast-Zugang anfordern (bestehende Edge Function `request-booking-access`). */
export async function requestGuestAccess(mail: string) {
  const { data, error } = await supabase.functions.invoke("request-booking-access", {
    body: { email: mail.trim().toLowerCase() },
  });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  await deviceStore.set(APP_STORE_KEYS.guestEmail, mail.trim().toLowerCase());
  return data;
}
