import { test, expect } from "bun:test";
import { z } from "zod";
import { cancellationRefundAmount } from "../supabase/functions/_shared/cancellation-refund";

const source = await Bun.file("supabase/functions/cancel-tour-booking/index.ts").text();
const code = new Bun.Transpiler({ loader: "ts" }).transformSync(source.replace(/^import .*;\n/gm, ""));
const bookingId = "11111111-1111-4111-8111-111111111111";

async function run(body: Record<string, unknown>, fail = false, options: { paid?: number; discount?: number; refunded?: number; stripe?: boolean } = {}) {
  const payouts: number[] = [];
  const entries: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];
  const booking = { id: bookingId, status: "confirmed", total_price: 100, discount_amount: options.discount ?? 0, payment_method: options.stripe ? "stripe" : "mollie", stripe_payment_intent_id: options.stripe ? "pi_test" : null, paid_at: "2026-10-20", stripe_session_id: "tr_test", booking_number: "test" };
  const paid = options.paid ?? 100;
  const remaining = paid - (options.refunded ?? 0);
  const stripeMock = class {
    paymentIntents = { retrieve: async () => ({ currency: "eur", latest_charge: { amount: paid * 100, amount_refunded: (options.refunded ?? 0) * 100 } }) };
    refunds = { create: async (params: { amount?: number }) => {
      const amount = (params.amount ?? remaining * 100) / 100;
      payouts.push(amount);
      if (fail || amount > remaining) throw new Error("provider refused");
      return { id: "re_test", status: "succeeded", amount: amount * 100 };
    } };
  };
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: bookingId } } }) },
    from: (table: string) => {
      const query: any = {
        select: () => query, eq: () => query,
        maybeSingle: async () => ({ data: { role: "admin" } }),
        single: async () => ({ data: booking }),
        update: (value: Record<string, unknown>) => { updates.push(value); return query; },
        insert: async (value: Record<string, unknown>) => { if (table === "tour_payment_entries") entries.push(value); return { error: null }; },
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve),
      };
      return query;
    },
  };
  let handler: ((req: Request) => Promise<Response>) | undefined;
  new Function("serve", "Stripe", "createClient", "createMollieRefund", "getMolliePayment", "corsHeaders", "z", "cancellationRefundAmount", "Deno", code)(
    (fn: typeof handler) => { handler = fn; }, stripeMock, () => client,
    async (_id: string, amount: number) => {
      payouts.push(amount);
      if (fail || amount > remaining) throw new Error("provider refused");
      return { id: "re_test", status: "queued", amount: { value: amount.toFixed(2) } };
    }, async () => ({ status: "paid", amount: { currency: "EUR", value: paid.toFixed(2) }, amountRemaining: { value: remaining.toFixed(2) } }), {}, z, cancellationRefundAmount, { env: { get: (key: string) => key === "RESEND_API_KEY" ? undefined : "test" } },
  );
  if (!handler) throw new Error("Handler not registered");
  const response = await handler(new Request("https://example.invalid", { method: "POST", headers: { Authorization: "Bearer test" }, body: JSON.stringify({ bookingId, ...body }) }));
  return { response, result: await response.json(), payouts, entries, updates };
}

test("Mollie partial cancellation reads body once and records only the actual 80 euro payout", async () => {
  const state = await run({ refundType: "partial", refundAmount: 80 });
  expect(state.response.status).toBe(200);
  expect(state.payouts).toEqual([80]);
  expect(state.entries).toHaveLength(1);
  expect(state.entries[0]?.amount).toBe(-80);
  expect(state.result.refundAmount).toBe(80);
});
test("missing refund selection cancels without any payout or refund entry", async () => {
  const state = await run({});
  expect(state.response.status).toBe(200);
  expect(state.payouts).toEqual([]);
  expect(state.entries).toEqual([]);
});
test("explicit full refund pays and records exactly 100 euro", async () => {
  const state = await run({ refundType: "full" });
  expect(state.payouts).toEqual([100]);
  expect(state.entries[0]?.amount).toBe(-100);
});
test("zero partial amount cannot fall back to a full refund", async () => {
  const state = await run({ refundType: "partial", refundAmount: 0 });
  expect(state.response.status).toBe(400);
  expect(state.payouts).toEqual([]);
  expect(state.updates).toEqual([]);
});
test("provider rejection records no refund and leaves the booking uncancelled", async () => {
  const state = await run({ refundType: "partial", refundAmount: 80 }, true);
  expect(state.response.status).toBe(400);
  expect(state.entries).toEqual([]);
  expect(state.updates).toEqual([]);
});

for (const stripe of [false, true]) {
  const provider = stripe ? "Stripe" : "Mollie";
  test(`${provider} coupon cancellation refunds 70 without fee or 50 with a 20 euro fee`, async () => {
    for (const amount of [70, 50]) {
      const state = await run({ refundType: "partial", refundAmount: amount }, false, { paid: 70, discount: 30, stripe });
      expect(state.response.status).toBe(200);
      expect(state.payouts).toEqual([amount]);
      expect(state.entries[0]?.amount).toBe(-amount);
      expect(state.updates.some(update => update.status === "cancelled")).toBe(true);
    }
  });
  test(`${provider} full coupon refund uses remaining provider balance after a previous refund`, async () => {
    const state = await run({ refundType: "full" }, false, { paid: 70, discount: 30, refunded: 10, stripe });
    expect(state.response.status).toBe(200);
    expect(state.payouts).toEqual([60]);
    expect(state.entries[0]?.amount).toBe(-60);
  });
  test(`${provider} rejects an undiscounted refund before sending money`, async () => {
    const state = await run({ refundType: "partial", refundAmount: 80 }, false, { paid: 70, discount: 30, stripe });
    expect(state.response.status).toBe(400);
    expect(state.payouts).toEqual([]);
    expect(state.entries).toEqual([]);
    expect(state.updates).toEqual([]);
  });
}