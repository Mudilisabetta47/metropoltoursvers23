/**
 * Zentrale Datenquelle für echte Fahrten/Reisen auf den SEO-Landingpages.
 * Es werden ausschließlich aktive Einträge aus dem Backend geladen –
 * keine erfundenen Termine, Preise oder Verfügbarkeiten.
 */
import { supabase } from "@/integrations/supabase/client";

export type OfferKind = "tour" | "weekend";

export interface LandingOffer {
  id: string;
  kind: OfferKind;
  title: string;
  url: string;
  image: string | null;
  country: string | null;
  location: string | null;
  departureCity: string | null;
  departureDate: string | null;
  returnDate: string | null;
  departureTime: string | null;
  price: number | null;
  seatsLeft: number | null;
  description: string | null;
  /** Alle Suchbegriffe, über die diese Fahrt einer Landingpage zugeordnet wird. */
  tokens: string[];
}

const norm = (v: unknown): string =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .trim();

/** Bekannte Zustiegsorte – daraus werden "ab <Stadt>"-Seiten erkannt. */
const ORIGIN_CITIES = [
  "hannover",
  "bremen",
  "hamburg",
  "berlin",
  "braunschweig",
  "kassel",
  "gottingen",
  "wolfsburg",
  "munchen",
  "wurzburg",
];

/** Länder-/Regionssynonyme für die automatische Kategorisierung. */
const SYNONYMS: Record<string, string[]> = {
  kroatien: ["kroatien", "croatia", "hrvatska", "novalja", "pag", "zadar", "zagreb", "split"],
  italien: ["italien", "italy", "italia", "rom", "rome", "venedig", "gardasee"],
  osterreich: ["osterreich", "austria", "wien", "salzburg"],
  niederlande: ["niederlande", "netherlands", "amsterdam"],
  frankreich: ["frankreich", "france", "paris"],
  tschechien: ["tschechien", "czech", "prag", "praha", "prague"],
  danemark: ["danemark", "denmark", "kopenhagen", "copenhagen"],
  ungarn: ["ungarn", "hungary", "budapest"],
  polen: ["polen", "poland", "krakau", "danzig"],
  spanien: ["spanien", "spain", "barcelona", "madrid"],
  europa: [],
};

const STOPWORDS = new Set([
  "bus",
  "busse",
  "busreise",
  "busreisen",
  "reisebus",
  "mieten",
  "vermietung",
  "busvermietung",
  "busunternehmen",
  "mit",
  "fahrer",
  "charter",
  "und",
  "der",
  "die",
  "das",
  "fur",
  "ab",
  "nach",
]);

export interface OfferMatcher {
  origins: string[];
  targets: string[];
  /** true = keine spezifischen Filter, es werden allgemein aktuelle Reisen gezeigt. */
  generic: boolean;
}

/** Leitet aus dem Slug automatisch ab, welche Fahrten auf die Seite gehören. */
export function offerMatcherForSlug(slug: string): OfferMatcher {
  const tokens = norm(slug).split("-").filter(Boolean);
  const origins: string[] = [];
  const targets: string[] = [];

  tokens.forEach((t, i) => {
    if (STOPWORDS.has(t)) return;
    const prev = tokens[i - 1];
    if (ORIGIN_CITIES.includes(t) && prev !== "nach") {
      origins.push(t);
      return;
    }
    if (t === "europa") return; // Europa = alles
    targets.push(t);
  });

  return { origins, targets, generic: origins.length === 0 && targets.length === 0 };
}

const expand = (values: string[]): string[] => {
  const out = new Set<string>();
  values.forEach((v) => {
    out.add(v);
    (SYNONYMS[v] ?? []).forEach((s) => out.add(s));
    Object.entries(SYNONYMS).forEach(([key, list]) => {
      if (list.includes(v)) out.add(key);
    });
  });
  return [...out];
};

export function matchesOffer(offer: LandingOffer, matcher: OfferMatcher): boolean {
  if (matcher.generic) return true;
  const hay = offer.tokens;
  const has = (values: string[]) =>
    expand(values).some((v) => hay.some((h) => h.includes(v) || v.includes(h)));

  if (matcher.origins.length && !has(matcher.origins)) return false;
  if (matcher.targets.length && !has(matcher.targets)) return false;
  return true;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Lädt alle veröffentlichten Reisen (Pauschalreisen + Wochenendtrips). */
export async function fetchLandingOffers(): Promise<LandingOffer[]> {
  const today = todayIso();

  const [tours, dates, weekend] = await Promise.all([
    supabase
      .from("package_tours")
      .select(
        "id, destination, location, country, slug, short_description, description, image_url, hero_image_url, price_from, tags, category, departure_date, return_date, max_participants, current_participants",
      )
      .eq("is_active", true),
    supabase
      .from("tour_dates")
      .select("tour_id, departure_date, return_date, price_basic, total_seats, booked_seats, status")
      .eq("is_active", true)
      .gte("departure_date", today)
      .order("departure_date", { ascending: true }),
    supabase
      .from("weekend_trips")
      .select(
        "id, destination, slug, country, short_description, image_url, hero_image_url, base_price, departure_city, departure_point, departure_time, via_stops, tags, duration",
      )
      .eq("is_active", true),
  ]);

  const offers: LandingOffer[] = [];

  const nextDate = new Map<string, NonNullable<typeof dates.data>[number]>();
  (dates.data ?? []).forEach((d) => {
    if (d.status === "cancelled" || d.status === "soldout") return;
    if (!nextDate.has(d.tour_id)) nextDate.set(d.tour_id, d);
  });

  (tours.data ?? []).forEach((t) => {
    const d = nextDate.get(t.id);
    const departure = d?.departure_date ?? t.departure_date ?? null;
    if (departure && departure < today) return; // vergangene Reisen nicht anzeigen
    const seats =
      d && d.total_seats != null
        ? Math.max(0, Number(d.total_seats) - Number(d.booked_seats ?? 0))
        : t.max_participants != null
          ? Math.max(0, Number(t.max_participants) - Number(t.current_participants ?? 0))
          : null;

    offers.push({
      id: t.id,
      kind: "tour",
      title: t.destination,
      url: `/reisen/${t.slug ?? t.id}`,
      image: t.hero_image_url ?? t.image_url ?? null,
      country: t.country ?? null,
      location: t.location ?? null,
      departureCity: null,
      departureDate: departure,
      returnDate: d?.return_date ?? t.return_date ?? null,
      departureTime: null,
      price: d?.price_basic != null ? Number(d.price_basic) : t.price_from != null ? Number(t.price_from) : null,
      seatsLeft: seats,
      description: t.short_description ?? t.description ?? null,
      tokens: [t.destination, t.location, t.country, t.category, ...(t.tags ?? [])]
        .map(norm)
        .filter(Boolean),
    });
  });

  (weekend.data ?? []).forEach((w) => {
    const via = Array.isArray(w.via_stops)
      ? (w.via_stops as unknown[]).map((s) =>
          typeof s === "string" ? s : ((s as { name?: string })?.name ?? ""),
        )
      : [];
    offers.push({
      id: w.id,
      kind: "weekend",
      title: w.destination,
      url: `/wochenendtrips/${w.slug ?? w.id}`,
      image: w.hero_image_url ?? w.image_url ?? null,
      country: w.country ?? null,
      location: w.destination ?? null,
      departureCity: w.departure_city ?? null,
      departureDate: null,
      returnDate: null,
      departureTime: w.departure_time ?? null,
      price: w.base_price != null ? Number(w.base_price) : null,
      seatsLeft: null,
      description: w.short_description ?? null,
      tokens: [w.destination, w.country, w.departure_city, w.departure_point, ...via, ...(w.tags ?? [])]
        .map(norm)
        .filter(Boolean),
    });
  });

  return offers;
}
