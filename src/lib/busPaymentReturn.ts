export const BUS_PAYMENT_STORAGE_KEY = "mt_mollie_payment";

export function busPaymentReturnSession(params: URLSearchParams, storage: Pick<Storage, "getItem" | "removeItem">): string | null {
  const cancelled = params.get("payment") === "cancelled";
  const mollieReturn = params.get("mollie_bus") === "1";
  const session = params.get("session_id") || (mollieReturn ? storage.getItem(BUS_PAYMENT_STORAGE_KEY) : null);
  // Consume the saved ID once, also on cancellation. Ordinary visits ignore stale IDs.
  if (cancelled || mollieReturn || session) storage.removeItem(BUS_PAYMENT_STORAGE_KEY);
  return cancelled ? null : session;
}