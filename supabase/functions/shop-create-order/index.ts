import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

interface AddressInput {
  first_name?: string; last_name?: string; company?: string;
  street?: string; house_number?: string; zip?: string; city?: string; country?: string;
}

function cleanAddress(a: AddressInput | undefined) {
  const t = (v: unknown, max = 120) => String(v ?? "").trim().slice(0, max);
  return {
    first_name: t(a?.first_name), last_name: t(a?.last_name), company: t(a?.company),
    street: t(a?.street), house_number: t(a?.house_number, 20),
    zip: t(a?.zip, 12), city: t(a?.city), country: t(a?.country, 60) || "Deutschland",
  };
}

function addressValid(a: ReturnType<typeof cleanAddress>) {
  return !!(a.first_name && a.last_name && a.street && a.zip && a.city);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Ungültige Anfrage" }, 400);

    // ---- Authenticated user (optional – guest checkout allowed) ----
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    // ---- Basic input validation ----
    const email = String(body.email ?? "").trim().toLowerCase().slice(0, 255);
    if (!EMAIL_RE.test(email)) return json({ error: "Ungültige E-Mail-Adresse" }, 400);
    const phone = String(body.phone ?? "").trim().slice(0, 40);
    const customerNote = String(body.customer_note ?? "").trim().slice(0, 1000);

    const billing = cleanAddress(body.billing_address);
    const shipping = body.shipping_same ? billing : cleanAddress(body.shipping_address);
    if (!addressValid(billing)) return json({ error: "Rechnungsadresse unvollständig" }, 400);

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0 || items.length > 50) return json({ error: "Warenkorb ungültig" }, 400);

    // ---- Load products server-side (never trust client prices) ----
    const productIds = [...new Set(items.map((i: { product_id?: string }) => i.product_id))];
    if (productIds.some((id) => typeof id !== "string" || !UUID_RE.test(id))) {
      return json({ error: "Ungültige Produkt-ID" }, 400);
    }

    const { data: products, error: prodErr } = await supabase
      .from("shop_products")
      .select("id, name, price, stock, track_stock, images, sku, is_published")
      .in("id", productIds as string[]);
    if (prodErr) throw prodErr;

    const { data: variants } = await supabase
      .from("shop_product_variants")
      .select("id, product_id, option_name, option_value, price_modifier, stock, is_active")
      .in("product_id", productIds as string[]);

    let subtotal = 0;
    const orderItems: Record<string, unknown>[] = [];
    const stockUpdates: { table: string; id: string; newStock: number }[] = [];

    for (const raw of items) {
      const qty = Math.floor(Number(raw.quantity));
      if (!Number.isFinite(qty) || qty < 1 || qty > 99) return json({ error: "Ungültige Menge" }, 400);

      const product = products?.find((p) => p.id === raw.product_id);
      if (!product || !product.is_published) return json({ error: "Produkt nicht verfügbar" }, 400);

      let variant = null;
      if (raw.variant_id) {
        if (!UUID_RE.test(String(raw.variant_id))) return json({ error: "Ungültige Variante" }, 400);
        variant = variants?.find((v) => v.id === raw.variant_id && v.product_id === product.id) ?? null;
        if (!variant || !variant.is_active) return json({ error: "Variante nicht verfügbar" }, 400);
      }

      // Stock check
      if (variant) {
        if (variant.stock < qty) return json({ error: `"${product.name}" ist nicht in ausreichender Stückzahl verfügbar` }, 409);
        stockUpdates.push({ table: "shop_product_variants", id: variant.id, newStock: variant.stock - qty });
      } else if (product.track_stock) {
        if (product.stock < qty) return json({ error: `"${product.name}" ist nicht in ausreichender Stückzahl verfügbar` }, 409);
        stockUpdates.push({ table: "shop_products", id: product.id, newStock: product.stock - qty });
      }

      const unitPrice = Number(product.price) + Number(variant?.price_modifier ?? 0);
      const lineTotal = Math.round(unitPrice * qty * 100) / 100;
      subtotal += lineTotal;

      const imgs = Array.isArray(product.images) ? product.images : [];
      orderItems.push({
        product_id: product.id,
        variant_id: variant?.id ?? null,
        product_name: product.name,
        variant_label: variant ? `${variant.option_name}: ${variant.option_value}` : null,
        sku: product.sku,
        unit_price: unitPrice,
        quantity: qty,
        line_total: lineTotal,
        image_url: typeof imgs[0] === "string" ? imgs[0] : null,
      });
    }
    subtotal = Math.round(subtotal * 100) / 100;

    // ---- Shipping ----
    let shippingCost = 0;
    let shippingName: string | null = null;
    let shippingId: string | null = null;
    if (body.shipping_method_id) {
      if (!UUID_RE.test(String(body.shipping_method_id))) return json({ error: "Ungültige Versandart" }, 400);
      const { data: sm } = await supabase
        .from("shop_shipping_methods")
        .select("id, name, price, free_above, is_active")
        .eq("id", body.shipping_method_id)
        .maybeSingle();
      if (!sm || !sm.is_active) return json({ error: "Versandart nicht verfügbar" }, 400);
      shippingId = sm.id;
      shippingName = sm.name;
      shippingCost = sm.free_above !== null && subtotal >= Number(sm.free_above) ? 0 : Number(sm.price);
    }

    // ---- Coupon ----
    let discount = 0;
    let couponCode: string | null = null;
    if (body.coupon_code) {
      const code = String(body.coupon_code).trim().slice(0, 60);
      const { data: cRows } = await supabase.rpc("validate_shop_coupon", { _code: code, _subtotal: subtotal });
      const c = Array.isArray(cRows) ? cRows[0] : null;
      if (c?.valid) {
        couponCode = c.code;
        discount = c.percent_off ? (subtotal * Number(c.percent_off)) / 100 : Number(c.amount_off ?? 0);
        discount = Math.min(Math.round(discount * 100) / 100, subtotal);
      }
    }

    // ---- Payment method ----
    const paymentCode = String(body.payment_method ?? "").trim().slice(0, 40);
    const { data: pm } = await supabase
      .from("shop_payment_methods")
      .select("code, name, is_active, surcharge")
      .eq("code", paymentCode)
      .maybeSingle();
    if (!pm || !pm.is_active) return json({ error: "Zahlungsart nicht verfügbar" }, 400);

    const total = Math.round((subtotal - discount + shippingCost + Number(pm.surcharge ?? 0)) * 100) / 100;

    // ---- Order number ----
    const { data: numData, error: numErr } = await supabase.rpc("generate_shop_order_number");
    if (numErr) throw numErr;
    const orderNumber = numData as string;

    const { data: order, error: orderErr } = await supabase
      .from("shop_orders")
      .insert({
        order_number: orderNumber,
        user_id: userId,
        email,
        phone,
        billing_address: billing,
        shipping_address: addressValid(shipping) ? shipping : billing,
        shipping_method_id: shippingId,
        shipping_method_name: shippingName,
        shipping_cost: shippingCost,
        subtotal,
        discount_amount: discount,
        coupon_code: couponCode,
        total,
        payment_method: pm.code,
        payment_status: pm.code === "banktransfer" ? "awaiting_payment" : "pending",
        status: "new",
        customer_note: customerNote,
      })
      .select()
      .single();
    if (orderErr) throw orderErr;

    const { error: itemsErr } = await supabase
      .from("shop_order_items")
      .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));
    if (itemsErr) {
      await supabase.from("shop_orders").delete().eq("id", order.id);
      throw itemsErr;
    }

    // ---- Stock decrement ----
    for (const u of stockUpdates) {
      await supabase.from(u.table).update({ stock: u.newStock }).eq("id", u.id);
    }
    if (couponCode) {
      const { data: cRow } = await supabase.from("shop_coupons").select("id, redemptions").ilike("code", couponCode).maybeSingle();
      if (cRow) await supabase.from("shop_coupons").update({ redemptions: (cRow.redemptions ?? 0) + 1 }).eq("id", cRow.id);
    }

    // ---- E-Mail ----
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const rows = orderItems
          .map((i) => `<tr><td style="padding:8px 0">${esc(i.product_name)}${i.variant_label ? ` <span style="color:#64748b">(${esc(i.variant_label)})</span>` : ""}<br><span style="color:#64748b;font-size:12px">${i.quantity} × ${eur(Number(i.unit_price))}</span></td><td align="right" style="padding:8px 0"><strong>${eur(Number(i.line_total))}</strong></td></tr>`)
          .join("");
        const html = `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
  <div style="background:#00CC36;padding:24px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">Bestellbestätigung</h1>
    <p style="color:#eafff0;margin:6px 0 0">METROPOL TOURS Shop</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:0;padding:24px;border-radius:0 0 12px 12px">
    <p>Hallo ${esc(billing.first_name)},</p>
    <p>vielen Dank für deine Bestellung <strong>${esc(orderNumber)}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}
      <tr><td style="padding-top:12px;border-top:1px solid #e2e8f0">Zwischensumme</td><td align="right" style="padding-top:12px;border-top:1px solid #e2e8f0">${eur(subtotal)}</td></tr>
      ${discount > 0 ? `<tr><td>Rabatt (${esc(couponCode)})</td><td align="right">-${eur(discount)}</td></tr>` : ""}
      <tr><td>Versand${shippingName ? ` (${esc(shippingName)})` : ""}</td><td align="right">${eur(shippingCost)}</td></tr>
      <tr><td style="padding-top:8px;font-size:18px"><strong>Gesamt</strong></td><td align="right" style="padding-top:8px;font-size:18px"><strong>${eur(total)}</strong></td></tr>
    </table>
    <p style="color:#475569;font-size:14px">Zahlungsart: <strong>${esc(pm.name)}</strong></p>
    <p style="color:#475569;font-size:14px">Lieferadresse:<br>${esc(shipping.first_name)} ${esc(shipping.last_name)}<br>${esc(shipping.street)} ${esc(shipping.house_number)}<br>${esc(shipping.zip)} ${esc(shipping.city)}<br>${esc(shipping.country)}</p>
    <p style="color:#94a3b8;font-size:12px;margin-top:24px">METROPOL TOURS · metours.de</p>
  </div>
</div>`;
        await resend.emails.send({
          from: "METROPOL TOURS Shop <shop@app.metours.de>",
          to: [email],
          bcc: ["info@metours.de"],
          subject: `Bestellbestätigung ${orderNumber}`,
          html,
        });
      } catch (e) {
        console.error("shop order email failed", e);
      }
    }

    return json({ success: true, order_number: orderNumber, order_id: order.id, total });
  } catch (e) {
    console.error("shop-create-order error", e);
    return json({ error: "Bestellung konnte nicht abgeschlossen werden" }, 500);
  }
});
