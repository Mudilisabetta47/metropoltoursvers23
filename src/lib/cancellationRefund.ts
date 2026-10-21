// Online checkout stores the provider-applied discount separately from total_price.
// Positive ledger entries take precedence; negative entries are prior refunds.
export function cancellationPaidAmount(total: number, discount: number | null, entries: readonly { amount: number }[], providerPaid: boolean): number {
  const positive = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.amount)), 0);
  const refunded = entries.reduce((sum, entry) => sum + Math.max(0, -Number(entry.amount)), 0);
  const received = positive > 0 ? positive : providerPaid ? Math.max(0, total - (discount ?? 0)) : 0;
  return Math.round(Math.max(0, received - refunded) * 100) / 100;
}

export function cancellationRefundSelection(total: number, paid: number, applyFee: boolean, feePercent: number) {
  if (![total, paid, feePercent].every(Number.isFinite) || total < 0 || paid < 0 || feePercent < 0 || feePercent > 100) {
    throw new Error("Ungültiger Betrag oder Stornogebühr (0–100 %)");
  }
  const fee = applyFee ? total * feePercent / 100 : 0;
  const amount = Math.round(Math.max(0, Math.min(total, paid) - fee) * 100) / 100;
  return { refundType: amount === 0 ? "none" as const : "partial" as const, refundAmount: amount };
}