import { describe, expect, test } from "bun:test";
import { cancellationRefundSelection } from "../src/lib/cancellationRefund";
import { busPaymentReturnSession, BUS_PAYMENT_STORAGE_KEY } from "../src/lib/busPaymentReturn";
import { cancellationRefundAmount } from "../supabase/functions/_shared/cancellation-refund";

describe("tour cancellation refunds", () => {
  test("20% fee on a 100 euro paid booking refunds only 80 euro", () => {
    const selection = cancellationRefundSelection(100, 100, true, 20);
    expect(selection).toEqual({ refundType: "partial", refundAmount: 80 });
    expect(cancellationRefundAmount(selection.refundType, selection.refundAmount, 100)).toBe(80);
  });
  test("no refund selection and 100% fee never trigger a payout", () => {
    expect(cancellationRefundAmount("none", undefined, 100)).toBe(0);
    expect(cancellationRefundSelection(100, 100, true, 100)).toEqual({ refundType: "none", refundAmount: 0 });
  });
  test("full refund explicitly returns the full price", () => {
    expect(cancellationRefundAmount("full", undefined, 100)).toBe(100);
  });
  test("partial refund requires a valid positive amount", () => {
    for (const amount of [undefined, 0, -1, 101, NaN, "80", 0.001]) {
      expect(() => cancellationRefundAmount("partial", amount, 100)).toThrow();
    }
  });
  test("refund is capped at payments received and fees must be within 0–100%", () => {
    expect(cancellationRefundSelection(100, 50, true, 20).refundAmount).toBe(30);
    expect(() => cancellationRefundSelection(100, 100, true, 101)).toThrow();
  });
});

describe("bus payment return", () => {
  const storage = () => {
    const values = new Map([[BUS_PAYMENT_STORAGE_KEY, "tr_previous"]]);
    return { getItem: (key: string) => values.get(key) ?? null, removeItem: (key: string) => { values.delete(key); } };
  };
  test("a new checkout ignores the old stored payment", () => {
    expect(busPaymentReturnSession(new URLSearchParams("tripId=new"), storage())).toBeNull();
  });
  test("Mollie return consumes the ID and a second trip cannot reopen it", () => {
    const tab = storage();
    expect(busPaymentReturnSession(new URLSearchParams("mollie_bus=1"), tab)).toBe("tr_previous");
    expect(tab.getItem(BUS_PAYMENT_STORAGE_KEY)).toBeNull();
    expect(busPaymentReturnSession(new URLSearchParams("tripId=next"), tab)).toBeNull();
  });
  test("cancellation clears the saved payment without verifying it", () => {
    const tab = storage();
    expect(busPaymentReturnSession(new URLSearchParams("payment=cancelled"), tab)).toBeNull();
    expect(tab.getItem(BUS_PAYMENT_STORAGE_KEY)).toBeNull();
  });
  test("Stripe return continues to use its explicit session ID", () => {
    expect(busPaymentReturnSession(new URLSearchParams("session_id=cs_123"), storage())).toBe("cs_123");
  });
});