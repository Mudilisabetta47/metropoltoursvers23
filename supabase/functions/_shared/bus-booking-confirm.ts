// Bestätigt bezahlte Bus-Buchungen (Einzelfahrten/Wochenendtrips): Status setzen + Ticket-E-Mail.
// deno-lint-ignore no-explicit-any
export async function confirmBusBookingsPaid(
  supabaseAdmin: any,
  bookingIds: string[],
  paymentMethod: string,
  paymentReference: string,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const { data: updated, error } = await supabaseAdmin
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "paid",
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      paid_at: new Date().toISOString(),
    })
    .in("id", bookingIds)
    .select("id, ticket_number");
  if (error) throw error;

  for (const b of updated ?? []) {
    try {
      await supabaseAdmin.functions.invoke("send-booking-confirmation", { body: { bookingId: b.id } });
    } catch (e) {
      console.error("confirmation mail failed", e);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    bookingIds,
    ticketNumbers: (updated ?? []).map((b: { ticket_number: string }) => b.ticket_number),
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
