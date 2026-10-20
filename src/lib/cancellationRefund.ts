export function cancellationRefundSelection(total: number, paid: number, applyFee: boolean, feePercent: number) {
  if (![total, paid, feePercent].every(Number.isFinite) || total < 0 || paid < 0 || feePercent < 0 || feePercent > 100) {
    throw new Error("Ungültiger Betrag oder Stornogebühr (0–100 %)");
  }
  const fee = applyFee ? total * feePercent / 100 : 0;
  const amount = Math.round(Math.max(0, Math.min(total, paid) - fee) * 100) / 100;
  return { refundType: amount === 0 ? "none" as const : "partial" as const, refundAmount: amount };
}