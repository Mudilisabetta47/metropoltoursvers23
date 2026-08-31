import { supabase } from "@/integrations/supabase/client";

export type AppPaymentStatus = "unpaid" | "pending" | "paid" | "failed";

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("app-booking", { body });
  if (error) {
    // Edge-Function-Fehlermeldung (JSON) sichtbar machen
    const ctx = (error as any)?.context;
    try {
      const parsed = ctx ? await ctx.json() : null;
      if (parsed?.error) throw new Error(parsed.error);
    } catch (e) {
      if (e instanceof Error && e.message && e.message !== "Unexpected end of JSON input") throw e;
    }
    throw error;
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export interface PassengerInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface AppExtra {
  id: string;
  label: string;
  price: number;
  perPassenger: boolean;
}

export interface CreateResult {
  bookingNumber: string;
  bookingIds: string[];
  unitPrice: number;
  farePrice?: number;
  extrasTotal?: number;
  total: number;
  tickets?: { id: string; ticket_number: string; seat_id: string }[];
}

/** Fahrt-Buchung (Linien-, Charter- und Individualfahrten) serverseitig anlegen. */
export function createTripBooking(input: {
  tripId: string;
  originStopId: string;
  destinationStopId: string;
  seatIds: string[];
  passengers: PassengerInput[];
  contactEmail: string;
  contactPhone?: string;
  paymentMethod: "card" | "invoice";
  extras?: string[];
}) {
  return call<CreateResult>({ action: "create", type: "trip", ...input });
}

/** Pauschalreise-Buchung serverseitig anlegen. */
export function createTourBooking(input: {
  tourId: string;
  tourDateId: string;
  tariffId: string;
  pickupStopId?: string | null;
  participants: number;
  passengers: PassengerInput[];
  contactEmail: string;
  contactPhone?: string;
}) {
  return call<CreateResult>({ action: "create", type: "tour", ...input });
}

export function startPayment(bookingNumber: string) {
  return call<{ clientSecret?: string; paymentIntentId?: string; amount?: number; alreadyPaid?: boolean }>({
    action: "pay",
    bookingNumber,
  });
}

export function confirmPayment(bookingNumber: string) {
  return call<{ paymentStatus: AppPaymentStatus; status: string }>({
    action: "confirm",
    bookingNumber,
  });
}

export function cancelBooking(bookingNumber: string) {
  return call<{ status: string }>({ action: "cancel", bookingNumber });
}

export function getPaymentConfig() {
  return call<{ stripePublishableKey: string | null; extras?: AppExtra[] }>({ action: "config" });
}

export const money = (value: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value ?? 0);
