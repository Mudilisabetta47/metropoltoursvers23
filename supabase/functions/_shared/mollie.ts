// Minimal Mollie Payments API helper (v2). No SDK – plain fetch.
const MOLLIE_API = "https://api.mollie.com/v2";

export interface MolliePayment {
  id: string;
  status: string; // open | pending | authorized | paid | failed | canceled | expired
  amount: { currency: string; value: string };
  metadata?: Record<string, unknown>;
  _links?: { checkout?: { href: string } };
  [key: string]: unknown;
}

function apiKey(): string {
  const key = Deno.env.get("MOLLIE_API_KEY") ?? "";
  if (!key) throw new Error("MOLLIE_API_KEY ist nicht konfiguriert");
  return key;
}

async function mollieFetch(path: string, init: RequestInit): Promise<MolliePayment> {
  const res = await fetch(`${MOLLIE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`Mollie API error [${res.status}]: ${body}`);
    throw new Error(`Mollie-Fehler (${res.status})`);
  }
  return JSON.parse(body) as MolliePayment;
}

export function createMolliePayment(params: {
  amountEur: number;
  description: string;
  redirectUrl: string;
  webhookUrl: string;
  metadata: Record<string, unknown>;
  locale?: string;
}): Promise<MolliePayment> {
  return mollieFetch("/payments", {
    method: "POST",
    body: JSON.stringify({
      amount: { currency: "EUR", value: params.amountEur.toFixed(2) },
      description: params.description,
      redirectUrl: params.redirectUrl,
      webhookUrl: params.webhookUrl,
      locale: params.locale ?? "de_DE",
      metadata: params.metadata,
    }),
  });
}

export function getMolliePayment(id: string): Promise<MolliePayment> {
  if (!/^tr_[A-Za-z0-9]+$/.test(id)) throw new Error("Ungültige Mollie-Zahlungs-ID");
  return mollieFetch(`/payments/${encodeURIComponent(id)}`, { method: "GET" });
}

export function mollieWebhookUrl(): string {
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/mollie-webhook`;
}
