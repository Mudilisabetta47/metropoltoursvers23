// Mollie-Zahlungs-Webhook: Mollie ruft diese Funktion bei jeder Statusänderung auf.
// Wichtig für asynchrone Zahlungsarten (SEPA, Klarna, Überweisung).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getMolliePayment } from "../_shared/mollie.ts";
import { confirmTourBookingPaid } from "../_shared/tour-booking-confirm.ts";
import { confirmBusBookingsPaid } from "../_shared/bus-booking-confirm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    // Mollie sendet application/x-www-form-urlencoded mit id=tr_...
    const text = await req.text();
    const id = new URLSearchParams(text).get("id") ?? "";
    if (!id.startsWith("tr_")) {
      return new Response(JSON.stringify({ error: "invalid id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payment = await getMolliePayment(id);
    const meta = (payment.metadata ?? {}) as { type?: string; booking_id?: string; booking_number?: string; booking_ids?: string[] };

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (payment.status === "paid") {
      if (meta.type === "tour" && meta.booking_id) {
        // Doppelbestätigung vermeiden
        const { data: existing } = await admin.from("tour_bookings").select("payment_status").eq("id", meta.booking_id).single();
        if (existing?.payment_status !== "paid") {
          await confirmTourBookingPaid(admin, meta.booking_id, meta.booking_number ?? "", "mollie", payment.id, corsHeaders);
          try { await admin.functions.invoke("generate-tour-documents", { body: { bookingId: meta.booking_id } }); } catch (e) { console.error("doc gen failed", e); }
        }
      } else if (meta.type === "bus" && Array.isArray(meta.booking_ids)) {
        const { data: existing } = await admin.from("bookings").select("payment_status").in("id", meta.booking_ids);
        if ((existing ?? []).some((b) => b.payment_status !== "paid")) {
          await confirmBusBookingsPaid(admin, meta.booking_ids, "mollie", payment.id, corsHeaders);
        }
      }
    } else if (["failed", "canceled", "expired"].includes(payment.status)) {
      if (meta.type === "tour" && meta.booking_id) {
        await admin.from("tour_bookings").update({ payment_status: "failed" }).eq("id", meta.booking_id).neq("payment_status", "paid");
      } else if (meta.type === "bus" && Array.isArray(meta.booking_ids)) {
        await admin.from("bookings").update({ payment_status: "failed" }).in("id", meta.booking_ids).neq("payment_status", "paid");
      }
    }

    // Mollie erwartet schlicht 200
    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("mollie-webhook error:", error);
    // Trotzdem 200, damit Mollie nicht endlos wiederholt; Fehler sind geloggt
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
});
