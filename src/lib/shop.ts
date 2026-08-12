import { supabase } from "@/integrations/supabase/client";

export const SHOP_BUCKET = "shop-products";

export interface ShopCategory {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ShopVariant {
  id: string;
  product_id: string;
  option_name: string;
  option_value: string;
  sku: string | null;
  price_modifier: number;
  stock: number;
  is_active: boolean;
  sort_order: number;
}

export interface ShopProduct {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  sku: string | null;
  short_description: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  tax_rate: number;
  stock: number;
  track_stock: boolean;
  images: string[];
  is_new: boolean;
  is_bestseller: boolean;
  is_sale: boolean;
  is_published: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at?: string;
}

export interface ShopOrderItem {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  sku: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  image_url: string | null;
}

export interface ShopOrder {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  phone: string | null;
  billing_address: Record<string, string>;
  shipping_address: Record<string, string>;
  shipping_method_name: string | null;
  shipping_cost: number;
  subtotal: number;
  discount_amount: number;
  coupon_code: string | null;
  total: number;
  payment_method: string | null;
  payment_status: string;
  status: string;
  tracking_number: string | null;
  customer_note: string | null;
  internal_note: string | null;
  created_at: string;
  shop_order_items?: ShopOrderItem[];
}

export const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  new: { label: "Neu", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  processing: { label: "In Bearbeitung", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  shipped: { label: "Versendet", className: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  delivered: { label: "Zugestellt", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  cancelled: { label: "Storniert", className: "bg-red-500/15 text-red-600 dark:text-red-400" },
};

export const PAYMENT_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Offen", className: "bg-slate-500/15 text-slate-600 dark:text-slate-300" },
  awaiting_payment: { label: "Zahlung ausstehend", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  paid: { label: "Bezahlt", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  refunded: { label: "Erstattet", className: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  failed: { label: "Fehlgeschlagen", className: "bg-red-500/15 text-red-600 dark:text-red-400" },
};

export const formatEur = (value: number | null | undefined) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value ?? 0));

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const signedCache = new Map<string, string>();

/** Resolves a stored image reference (absolute URL or storage path) to a displayable URL. */
export async function resolveShopImage(ref: string | null | undefined): Promise<string | null> {
  if (!ref) return null;
  if (/^(https?:)?\/\//.test(ref) || ref.startsWith("data:")) return ref;
  if (signedCache.has(ref)) return signedCache.get(ref)!;
  const { data } = await supabase.storage.from(SHOP_BUCKET).createSignedUrl(ref, 60 * 60 * 24 * 7);
  if (data?.signedUrl) {
    signedCache.set(ref, data.signedUrl);
    return data.signedUrl;
  }
  return null;
}

export async function resolveShopImages(refs: (string | null | undefined)[]): Promise<string[]> {
  const out = await Promise.all(refs.map((r) => resolveShopImage(r)));
  return out.filter((u): u is string => !!u);
}

export function normalizeImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}
