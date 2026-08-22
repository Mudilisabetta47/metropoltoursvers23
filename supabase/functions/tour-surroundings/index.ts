// Umgebungs-POIs (OpenStreetMap/Overpass) serverseitig – umgeht Browser-CORS/CSP-Blockaden
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface Poi { name: string; kind: string; distanceKm: number; lat: number; lon: number }

const haversine = (aLat: number, aLon: number, bLat: number, bLon: number) => {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

const fetchWithTimeout = async (url: string, init: RequestInit, ms: number) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...init, signal: ctrl.signal }); }
  finally { clearTimeout(timer); }
};

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// Kurzlebiger In-Memory-Cache pro Instanz (6h)
const memCache = new Map<string, { data: any; ts: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of memCache) if (now - v.ts > 6 * 60 * 60 * 1000) memCache.delete(k);
}, 30 * 60 * 1000);


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    let lat = Number(body?.lat);
    let lon = Number(body?.lon);
    const query = String(body?.query ?? "").trim();

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      if (!query) {
        return new Response(JSON.stringify({ error: "lat/lon oder query erforderlich" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const geoRes = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json", "User-Agent": "MetropolTours/1.0 (info@metours.de)" } },
        8000,
      );
      const geo = await geoRes.json().catch(() => null);
      if (!Array.isArray(geo) || geo.length === 0) {
        return new Response(JSON.stringify({ error: "Ort nicht gefunden" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      lat = parseFloat(geo[0].lat);
      lon = parseFloat(geo[0].lon);
    }

    const overpass = `
[out:json][timeout:20];
(
  node(around:5000,${lat},${lon})["tourism"~"^(attraction|museum|viewpoint|theme_park|zoo)$"]["name"];
  node(around:5000,${lat},${lon})["historic"~"^(castle|monument|ruins)$"]["name"];
  node(around:1200,${lat},${lon})["amenity"~"^(restaurant|cafe)$"]["name"];
  node(around:12000,${lat},${lon})["natural"~"^(beach|peak)$"]["name"];
  node(around:6000,${lat},${lon})["railway"="station"]["name"];
  node(around:2000,${lat},${lon})["highway"="bus_stop"]["name"];
  node(around:40000,${lat},${lon})["aeroway"="aerodrome"]["name"]["iata"];
);
out center;`;

    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    const SB_URL = Deno.env.get("SUPABASE_URL")!;
    const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const restHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

    let op: any = memCache.get(cacheKey)?.data ?? null;

    if (!op) {
      // Persistenter DB-Cache (30 Tage)
      try {
        const r = await fetch(
          `${SB_URL}/rest/v1/surroundings_cache?select=payload,updated_at&cache_key=eq.${encodeURIComponent(cacheKey)}&limit=1`,
          { headers: restHeaders },
        );
        const rows = await r.json().catch(() => []);
        const row = Array.isArray(rows) ? rows[0] : null;
        if (row && Date.now() - new Date(row.updated_at).getTime() < 30 * 24 * 3600 * 1000) {
          op = row.payload;
          memCache.set(cacheKey, { data: op, ts: Date.now() });
        }
      } catch (_) { /* Cache optional */ }
    }

    if (!op) {
      const attempts = ENDPOINTS.map((url) =>
        fetchWithTimeout(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "MetropolTours/1.0 (info@metours.de)",
          },
          body: `data=${encodeURIComponent(overpass)}`,
        }, 15000)
          .then(async (res) => {
            if (!res.ok) throw new Error(`status ${res.status}`);
            const json = await res.json();
            if (!Array.isArray(json?.elements) || json.elements.length === 0) throw new Error("empty");
            return json;
          })
          .catch((e) => { console.log("mirror fail", url, String(e)); throw e; })
      );
      op = await Promise.any(attempts).catch(() => null);
      if (op) {
        memCache.set(cacheKey, { data: op, ts: Date.now() });
        fetch(`${SB_URL}/rest/v1/surroundings_cache?on_conflict=cache_key`, {
          method: "POST",
          headers: { ...restHeaders, Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ cache_key: cacheKey, lat, lon, payload: op, updated_at: new Date().toISOString() }),
        }).catch(() => {});
      }
    }




    if (!op) {
      return new Response(JSON.stringify({ error: "Kartendaten aktuell nicht verfügbar", center: { lat, lon } }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const next = { attractions: [] as Poi[], food: [] as Poi[], nature: [] as Poi[], transit: [] as Poi[], airports: [] as Poi[] };
    const seen = new Set<string>();
    for (const el of op.elements ?? []) {
      const t = el.tags ?? {};
      const name = t.name as string | undefined;
      const eLat = el.lat ?? el.center?.lat;
      const eLon = el.lon ?? el.center?.lon;
      if (!name || eLat == null || eLon == null) continue;
      const key = `${name}-${t.amenity || t.tourism || t.natural || t.aeroway || t.railway || t.highway}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const p = { name, distanceKm: haversine(lat, lon, eLat, eLon), lat: eLat, lon: eLon };
      if (t.aeroway === "aerodrome") next.airports.push({ ...p, kind: "Flughafen" });
      else if (t.railway === "station") next.transit.push({ ...p, kind: "Bahnhof" });
      else if (t.highway === "bus_stop") next.transit.push({ ...p, kind: "Bus" });
      else if (t.amenity === "restaurant" || t.amenity === "cafe") next.food.push({ ...p, kind: t.amenity === "cafe" ? "Café" : "Restaurant" });
      else if (t.natural) next.nature.push({ ...p, kind: t.natural === "beach" ? "Strand" : t.natural === "peak" ? "Gipfel" : "Natur" });
      else next.attractions.push({
        ...p,
        kind: t.tourism === "museum" ? "Museum" : t.tourism === "viewpoint" ? "Aussichtspunkt" : t.historic ? "Sehenswürdigkeit" : "Attraktion",
      });
    }

    const sortTrim = (arr: Poi[], n: number) => arr.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, n);
    const rank: Record<string, number> = { Museum: 0, Attraktion: 0, Aussichtspunkt: 1, Sehenswürdigkeit: 2 };

    const groups = {
      attractions: next.attractions
        .sort((a, b) => (rank[a.kind] ?? 3) - (rank[b.kind] ?? 3) || a.distanceKm - b.distanceKm)
        .slice(0, 10)
        .sort((a, b) => a.distanceKm - b.distanceKm),
      food: sortTrim(next.food, 6),
      nature: sortTrim(next.nature, 5),
      transit: [
        ...sortTrim(next.transit.filter((t) => t.kind === "Bahnhof"), 3),
        ...sortTrim(next.transit.filter((t) => t.kind !== "Bahnhof"), 3),
      ],
      airports: sortTrim(next.airports, 3),
    };

    return new Response(JSON.stringify({ ok: true, center: { lat, lon }, groups }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" },
    });
  } catch (err: any) {
    console.error("tour-surroundings failed", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Fehler" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
