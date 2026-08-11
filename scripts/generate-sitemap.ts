/**
 * Generiert public/sitemap.xml.
 * Läuft automatisch vor `vite dev` und `vite build` (predev/prebuild).
 *
 * Enthält nur öffentliche, indexierbare URLs. Admin-, Checkout-, Login-,
 * Tracking- und NoIndex-Seiten werden bewusst nicht aufgenommen.
 */

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://www.metours.de";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/busreisen", changefreq: "weekly", priority: "0.9" },
  { path: "/business", changefreq: "monthly", priority: "0.9" },
  { path: "/wochenendtrips", changefreq: "weekly", priority: "0.8" },
  { path: "/reisen", changefreq: "monthly", priority: "0.7" },
  { path: "/service", changefreq: "monthly", priority: "0.7" },
  { path: "/karriere", changefreq: "weekly", priority: "0.6" },
  { path: "/imprint", changefreq: "yearly", priority: "0.2" },
  { path: "/privacy", changefreq: "yearly", priority: "0.2" },
  { path: "/terms", changefreq: "yearly", priority: "0.2" },
  { path: "/widerruf", changefreq: "yearly", priority: "0.2" },
];

async function loadDynamicEntries(): Promise<SitemapEntry[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("sitemap: keine Supabase-Zugangsdaten – nur statische Routen.");
    return [];
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const entries: SitemapEntry[] = [];

  // Wochenendtrips (öffentlich sichtbar = is_active)
  const { data: trips, error: tripsError } = await supabase
    .from("weekend_trips")
    .select("slug")
    .eq("is_active", true);
  if (tripsError) console.warn("sitemap: weekend_trips:", tripsError.message);
  for (const t of trips || []) {
    if (t.slug) entries.push({ path: `/wochenendtrips/${t.slug}`, changefreq: "weekly", priority: "0.7" });
  }

  // Veröffentlichte Pauschalreisen ohne noindex
  const { data: tours, error: toursError } = await supabase
    .from("package_tours")
    .select("slug, id, publish_status, is_active, seo_noindex")
    .eq("is_active", true)
    .eq("publish_status", "published");
  if (toursError) console.warn("sitemap: package_tours:", toursError.message);
  for (const t of tours || []) {
    if (t.seo_noindex) continue;
    const slug = t.slug || t.id;
    if (slug) entries.push({ path: `/reisen/${slug}`, changefreq: "weekly", priority: "0.7" });
  }

  return entries;
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

async function main() {
  let dynamicEntries: SitemapEntry[] = [];
  try {
    dynamicEntries = await loadDynamicEntries();
  } catch (err) {
    console.warn("sitemap: dynamische Routen konnten nicht geladen werden:", err);
  }

  const seen = new Set<string>();
  const entries = [...staticEntries, ...dynamicEntries].filter((e) => {
    if (seen.has(e.path)) return false;
    seen.add(e.path);
    return true;
  });

  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries) + "\n");
  console.log(`sitemap.xml geschrieben (${entries.length} URLs)`);
}

main();
