// Erstellt (oder findet) einen Apple-Wallet-Pass-Datensatz und liefert die .pkpass-Download-URL.

const randomToken = (len = 24) =>
  Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map((b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36])
    .join("");

export async function ensureWalletUrl(
  admin: any,
  bookingId: string,
  ticketNumber: string,
  bookingType: "bus" | "tour" = "bus",
): Promise<string | null> {
  try {
    if (!bookingId) return null;
    const idColumn = bookingType === "tour" ? "tour_booking_id" : "booking_id";
    const { data: existing } = await admin
      .from("wallet_passes")
      .select("id, serial_number, auth_token, pass_url")
      .eq(idColumn, bookingId)
      .eq("booking_type", bookingType)
      .eq("pass_type", "apple")
      .eq("is_voided", false)
      .order("last_updated", { ascending: false })
      .limit(1)
      .maybeSingle();

    const base = `${Deno.env.get("SUPABASE_URL")}/functions/v1/apple-wallet-pass`;
    if (existing) {
      const url = `${base}?serial=${existing.serial_number}&token=${existing.auth_token}`;
      if (existing.pass_url !== url) await admin.from("wallet_passes").update({ pass_url: url }).eq("id", existing.id);
      return url;
    }

    const serial = `MT-${ticketNumber || "TKT"}-${randomToken(8)}`;
    const token = randomToken(24);
    const url = `${base}?serial=${serial}&token=${token}`;
    const ins = await admin
      .from("wallet_passes")
      .insert({
        booking_id: bookingType === "bus" ? bookingId : null,
        tour_booking_id: bookingType === "tour" ? bookingId : null,
        booking_type: bookingType,
        pass_type: "apple",
        serial_number: serial,
        auth_token: token,
        pass_url: url,
      })
      .select("id")
      .single();
    if (ins.error) return null;
    return url;
  } catch {
    return null;
  }
}
