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
  invoices: MyTripInvoice[];
  events: any[];
}

const OFFLINE_KEY = APP_STORE_KEYS.offlineTickets;

/**
 * Buchungen des Kunden – über die bestehende Edge Function `my-bookings`.
 * Funktioniert mit angemeldetem Konto ODER mit dem Gast-Zugangstoken.
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

      if (!sessionData.session && !guestToken) {
        setTrips([]);
        setLoading(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke("my-bookings", {
        body: guestToken && !sessionData.session ? { accessToken: guestToken } : {},
      });

      if (fnError) throw fnError;
      if ((data as any)?.error) throw new Error((data as any).error);

      const list = ((data as any)?.bookings ?? []) as MyTrip[];
      setTrips(list);
      setEmail((data as any)?.email ?? null);
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
