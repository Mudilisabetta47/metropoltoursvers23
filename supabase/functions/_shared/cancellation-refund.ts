export type RefundType = "none" | "full" | "partial";

// Never let a missing or invalid partial amount become a full provider refund.
export function cancellationRefundAmount(type: RefundType, amount: unknown, total: number): number {
  if (type === "none") return 0;
  if (!Number.isFinite(total) || total <= 0) throw new Error("Ungültiger Buchungsbetrag");
  if (type === "full") return Math.round(total * 100) / 100;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > total) {
    throw new Error("Teilbetrag muss größer als 0 und höchstens der Buchungsbetrag sein");
  }
  const rounded = Math.round(amount * 100) / 100;
  if (rounded <= 0) throw new Error("Teilbetrag muss mindestens 0,01 € sein");
  return rounded;
}