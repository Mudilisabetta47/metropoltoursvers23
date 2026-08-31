import { supabase } from "@/integrations/supabase/client";

export type AppPaymentStatus = "unpaid" | "pending" | "paid" | "failed";

/** Liest die Fehlermeldung aus dem Kontext eines Edge-Function-Fehlers – egal in welcher Form. */
async function readErrorMessage(error: unknown): Promise<string | null> {
  const ctx = (error as any)?.context;
  if (!ctx) return null;
  try {
    // FunctionsHttpError liefert eine echte Response (mit .json/.text)
    if (typeof ctx.json === "function") {
      const parsed = await ctx.json();
      return parsed?.error ?? parsed?.message ?? null;
    }
    if (typeof ctx.text === "function") {
      const txt = await ctx.text();
      try {
        const parsed = JSON.parse(txt);
        return parsed?.error ?? parsed?.message ?? txt ?? null;
      } catch {
        return txt || null;
      }
    }
    // Kontext ist ein einfaches Objekt (FunctionsFetchError / Relay)
    if (typeof ctx === "object") return ctx.error ?? ctx.message ?? null;
    if (typeof ctx === "string") return ctx;
  } catch {
    /* Fehlerkontext nicht lesbar – Originalfehler verwenden */
  }
  return null;
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("app-booking", { body });
  if (error) {
    const message = await readErrorMessage(error);
    throw new Error(message || (error as any)?.message || "Buchung fehlgeschlagen");
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
  paymentMethod: "invoice";
  paymentStatus: "open";
}

const MOBILE_INVOICE_PAYMENT = {
  paymentMethod: "invoice",
  payment_method: "invoice",
  paymentStatus: "open",
  payment_status: "open",
} as const;

/** Fahrt-Buchung (Linien-, Charter- und Individualfahrten) serverseitig anlegen. */
export function createTripBooking(input: {
  tripId: string;
  originStopId: string;
  destinationStopId: string;
  seatIds: string[];
  passengers: PassengerInput[];
  contactEmail: string;
  contactPhone?: string;
  extras?: string[];
}) {
  return call<CreateResult>({ action: "create", type: "trip", ...input, ...MOBILE_INVOICE_PAYMENT });
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
  return call<CreateResult>({ action: "create", type: "tour", ...input, ...MOBILE_INVOICE_PAYMENT });
}

export function cancelBooking(bookingNumber: string) {
  return call<{ status: string }>({ action: "cancel", bookingNumber });
}

export function getPaymentConfig() {
  return call<{ extras?: AppExtra[] }>({ action: "config" });
}

export const money = (value: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value ?? 0);
