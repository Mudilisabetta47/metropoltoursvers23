import { useEffect, useMemo, useRef, useState } from "react";
import { FerrisWheel, Utensils, Mountain, TrainFront, Plane, Map as MapIcon } from "lucide-react";
import MapboxLocationMap from "@/components/maps/MapboxLocationMap";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


interface Poi {
  name: string;
  kind: string;
  distanceKm: number;
  lat?: number;
  lon?: number;
}

interface Groups {
  attractions: Poi[];
  food: Poi[];
  nature: Poi[];
  transit: Poi[];
  airports: Poi[];
}

const EMPTY: Groups = { attractions: [], food: [], nature: [], transit: [], airports: [] };

// ---- Caching: verhindert wiederholte, langsame OSM-Abfragen ----
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 Tage
type CacheEntry = { groups: Groups; center: { lat: number; lon: number }; ts: number };
const memCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CacheEntry | null>>();

const cacheKey = (q: string) => `metours:surroundings:${q.toLowerCase()}`;

const readCache = (q: string): CacheEntry | null => {
  const mem = memCache.get(q);
  if (mem && Date.now() - mem.ts < CACHE_TTL) return mem;
  try {
    const raw = localStorage.getItem(cacheKey(q));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed?.ts || Date.now() - parsed.ts > CACHE_TTL) return null;
    memCache.set(q, parsed);
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (q: string, entry: CacheEntry) => {
  memCache.set(q, entry);
  try {
    localStorage.setItem(cacheKey(q), JSON.stringify(entry));
  } catch { /* Speicher voll – egal */ }
};

const fetchWithTimeout = async (url: string, init: RequestInit, ms: number) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
};

const haversine = (aLat: number, aLon: number, bLat: number, bLon: number) => {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

const formatDistance = (km: number) => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toLocaleString("de-DE", { maximumFractionDigits: 1 })} km`;
};

interface Props {
  destination: string;
  location?: string | null;
  country?: string | null;
  /** Exakte Hotelposition aus der Datenbank – hat Vorrang vor der Textsuche */
  lat?: number | null;
  lon?: number | null;
  hotelName?: string | null;
  hotelAddress?: string | null;
}

const loadSurroundings = async (
  query: string,
  coords?: { lat: number; lon: number } | null,
): Promise<CacheEntry | null> => {
  const cached = readCache(query);
  if (cached) return cached;
  const running = inflight.get(query);
  if (running) return running;

  const task = (async (): Promise<CacheEntry | null> => {
    let lat: number;
    let lon: number;
    if (coords) {
      lat = coords.lat;
      lon = coords.lon;
    } else {
      const geoRes = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" } },
        6000
      );
      const geo = await geoRes.json();
      if (!Array.isArray(geo) || geo.length === 0) return null;
      lat = parseFloat(geo[0].lat);
      lon = parseFloat(geo[0].lon);
    }


    const overpass = `
[out:json][timeout:10];
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

    const endpoints = [
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass-api.de/api/interpreter",
      "https://overpass.osm.ch/api/interpreter",
      "https://overpass.private.coffee/api/interpreter",
    ];

    // Alle Spiegel parallel anfragen – der schnellste gewinnt
    let op: any = null;
    try {
      op = await new Promise<any>((resolve, reject) => {
        let failed = 0;
        endpoints.forEach((url) => {
          fetchWithTimeout(url, { method: "POST", body: overpass }, 9000)
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
            .then((json) => {
              if (json?.elements) resolve(json);
              else throw new Error("empty");
            })
            .catch(() => {
              failed += 1;
              if (failed === endpoints.length) reject(new Error("all mirrors failed"));
            });
        });
      });
    } catch {
      op = null;
    }

    const center = { lat, lon };
    if (!op) return { groups: EMPTY, center, ts: Date.now() };

    const next: Groups = { attractions: [], food: [], nature: [], transit: [], airports: [] };
    const seen = new Set<string>();

    for (const el of op.elements || []) {
      const t = el.tags || {};
      const name: string | undefined = t.name;
      const eLat = el.lat ?? el.center?.lat;
      const eLon = el.lon ?? el.center?.lon;
      if (!name || eLat == null || eLon == null) continue;
      const key = `${name}-${t.amenity || t.tourism || t.natural || t.aeroway || t.railway || t.highway}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const distanceKm = haversine(lat, lon, eLat, eLon);
      const pos = { lat: eLat as number, lon: eLon as number };

      if (t.aeroway === "aerodrome") {
        next.airports.push({ name, kind: "Flughafen", distanceKm, ...pos });
      } else if (t.railway === "station") {
        next.transit.push({ name, kind: "Bahnhof", distanceKm, ...pos });
      } else if (t.highway === "bus_stop") {
        next.transit.push({ name, kind: "Bus", distanceKm, ...pos });
      } else if (t.amenity === "restaurant" || t.amenity === "cafe") {
        next.food.push({ name, kind: t.amenity === "cafe" ? "Café" : "Restaurant", distanceKm, ...pos });
      } else if (t.natural) {
        const kind = t.natural === "beach" ? "Strand" : t.natural === "peak" ? "Gipfel" : "Wald";
        next.nature.push({ name, kind, distanceKm, ...pos });
      } else {
        const kind =
          t.tourism === "museum"
            ? "Museum"
            : t.tourism === "viewpoint"
            ? "Aussichtspunkt"
            : t.historic
            ? "Sehenswürdigkeit"
            : "Attraktion";
        next.attractions.push({ name, kind, distanceKm, ...pos });
      }
    }

    const sortTrim = (arr: Poi[], n: number) => arr.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, n);
    const rank: Record<string, number> = { Museum: 0, Attraktion: 0, Aussichtspunkt: 1, Sehenswürdigkeit: 2 };

    const groups: Groups = {
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

    const entry: CacheEntry = { groups, center, ts: Date.now() };
    writeCache(query, entry);
    return entry;
  })().finally(() => inflight.delete(query));

  inflight.set(query, task);
  return task;
};

const TourSurroundingsSection = ({
  destination,
  location,
  country,
  lat,
  lon,
  hotelName,
  hotelAddress,
}: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const coords = useMemo(
    () => (Number.isFinite(lat) && Number.isFinite(lon) ? { lat: lat as number, lon: lon as number } : null),
    [lat, lon]
  );

  const query = useMemo(
    () =>
      coords
        ? `geo:${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`
        : [hotelAddress, location, destination, country].filter(Boolean).join(", "),
    [coords, hotelAddress, location, destination, country]
  );

  const cached = query ? readCache(query) : null;
  const [loading, setLoading] = useState(!cached);
  const [groups, setGroups] = useState<Groups>(cached?.groups ?? EMPTY);
  const [center, setCenter] = useState<{ lat: number; lon: number } | null>(cached?.center ?? coords);

  // Erst laden, wenn der Abschnitt in Sichtweite kommt
  useEffect(() => {
    const el = containerRef.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!query) return;
    const hit = readCache(query);
    if (hit) {
      setGroups(hit.groups);
      setCenter(hit.center);
      setLoading(false);
      return;
    }
    if (!visible) return;

    let cancelled = false;
    setLoading(true);
    loadSurroundings(query, coords)
      .then((entry) => {
        if (cancelled) return;
        setGroups(entry?.groups ?? EMPTY);
        setCenter(entry?.center ?? coords);
      })
      .catch(() => {
        if (!cancelled) setGroups(EMPTY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, visible]);


  const hasAny =
    groups.attractions.length + groups.food.length + groups.nature.length +
    groups.transit.length + groups.airports.length > 0;

  if (!loading && !hasAny && visible) return <div ref={containerRef} className="hidden" />;

  const List = ({
    title,
    icon: Icon,
    items,
    showKind = true,
  }: { title: string; icon: any; items: Poi[]; showKind?: boolean }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-5 h-5 text-foreground" />
          <h3 className="font-bold text-foreground">{title}</h3>
        </div>
        <ul className="space-y-2.5">
          {items.map((p, i) => (
            <li key={`${p.name}-${i}`} className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-foreground">
                {showKind && <span className="text-muted-foreground">{p.kind} · </span>}
                {p.name}
              </span>
              <span className="text-muted-foreground whitespace-nowrap">{formatDistance(p.distanceKm)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <section ref={containerRef} className="bg-card border border-border rounded-xl p-6 scroll-mt-36">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h2 className="text-2xl font-bold text-foreground">Umgebung</h2>
      </div>
      {center && (
        <div className="mt-4 mb-6 rounded-xl overflow-hidden border border-border">
          <MapboxLocationMap
            lat={center.lat}
            lon={center.lon}
            zoom={12}
            className="w-full h-[280px] md:h-[340px]"
          />
        </div>
      )}


      {loading ? (
        <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-4" aria-busy="true">
          {Array.from({ length: 3 }).map((_, col) => (
            <div key={col} className="space-y-3">
              <div className="h-5 w-40 rounded bg-muted animate-pulse" />
              {Array.from({ length: 4 }).map((__, i) => (
                <div key={i} className="h-4 w-full rounded bg-muted/70 animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 mt-4">
          <div>
            <List title="Top-Attraktionen" icon={FerrisWheel} items={groups.attractions} showKind={false} />
          </div>
          <div>
            <List title="Restaurants & Cafés" icon={Utensils} items={groups.food} />
            <List title="Landschaft und Natur" icon={Mountain} items={groups.nature} />
          </div>
          <div>
            <List title="Öffentlicher Nahverkehr" icon={TrainFront} items={groups.transit} />
            <List title="Nächstgelegene Flughäfen" icon={Plane} items={groups.airports} showKind={false} />
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        Die kürzeste geschätzte Luftlinie wird angezeigt, die tatsächlichen Entfernungen können abweichen. Daten: OpenStreetMap.
      </p>
    </section>
  );
};

export default TourSurroundingsSection;
