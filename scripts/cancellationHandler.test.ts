import { test, expect } from "bun:test";
import { z } from "zod";
import { cancellationRefundAmount } from "../supabase/functions/_shared/cancellation-refund";

const source = await Bun.file("supabase/functions/cancel-tour-booking/index.ts").text();
const code = new Bun.Transpiler({ loader: "ts" }).transformSync(source.replace(/^import .*;\n/gm, ""));
const bookingId = "11111111-1111-4111-8111-111111111111";

async function run(body: Record<string, unknown>, fail = false) {
  const payouts: number[] = [];
  const entries: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];
  const booking = { id: bookingId, status: "confirmed", total_price: 100, payment_method: "mollie", paid_at: "2026-10-20", stripe_session_id: "tr_test", booking_number: "test" };
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
  new Function("serve", "Stripe", "createClient", "createMollieRefund", "corsHeaders", "z", "cancellationRefundAmount", "Deno", code)(
    (fn: typeof handler) => { handler = fn; }, null, () => client,
    async (_id: string, amount: number) => {
      payouts.push(amount);
      if (fail) throw new Error("provider refused");
      return { id: "re_test", status: "queued", amount: { value: amount.toFixed(2) } };
    }, {}, z, cancellationRefundAmount, { env: { get: (key: string) => key === "RESEND_API_KEY" ? undefined : "test" } },
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