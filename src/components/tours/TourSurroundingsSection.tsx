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
    // Serverseitig laden (Overpass/Nominatim sind im Browser durch CORS/CSP blockiert)
    const { data, error } = await supabase.functions.invoke("tour-surroundings", {
      body: coords ? { lat: coords.lat, lon: coords.lon } : { query },
    });
    if (error || !data?.ok || !data?.groups) return null;

    const groups: Groups = {
      attractions: data.groups.attractions ?? [],
      food: data.groups.food ?? [],
      nature: data.groups.nature ?? [],
      transit: data.groups.transit ?? [],
      airports: data.groups.airports ?? [],
    };
    const total =
      groups.attractions.length + groups.food.length + groups.nature.length +
      groups.transit.length + groups.airports.length;

    const entry: CacheEntry = { groups, center: data.center ?? coords ?? { lat: 0, lon: 0 }, ts: Date.now() };
    // Leere Ergebnisse nicht cachen – sonst bleibt die Umgebung tagelang leer
    if (total > 0) writeCache(query, entry);
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
  }, [query, visible, coords]);

  const allPois = useMemo(
    () =>
      [...groups.attractions, ...groups.food, ...groups.nature, ...groups.transit, ...groups.airports]
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
        .map((p) => ({ name: p.name, kind: p.kind, lat: p.lat as number, lon: p.lon as number })),
    [groups]
  );

  const hasAny =
    groups.attractions.length + groups.food.length + groups.nature.length +
    groups.transit.length + groups.airports.length > 0;

  if (!loading && !hasAny && visible && !center) return <div ref={containerRef} className="hidden" />;

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

  const mapTitle = hotelName || hotelAddress || location || destination;

  return (
    <section
      ref={containerRef}
      id="umgebung"
      className="bg-card border border-border rounded-xl p-6 scroll-mt-36"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-1">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {hotelName ? `Umgebung des Hotels` : "Umgebung"}
          </h2>
          {(hotelName || hotelAddress) && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {[hotelName, hotelAddress].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        {center && (
          <Button variant="outline" size="sm" onClick={() => setMapOpen(true)} className="gap-2">
            <MapIcon className="w-4 h-4" /> Karte anzeigen
          </Button>
        )}
      </div>
      {center && (
        <div className="mt-4 mb-6 rounded-xl overflow-hidden border border-border">
          <MapboxLocationMap
            lat={center.lat}
            lon={center.lon}
            zoom={13}
            label={mapTitle}
            pois={allPois}
            className="w-full h-[280px] md:h-[340px]"
          />
        </div>
      )}

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3">
            <DialogTitle>{mapTitle} – Lage & Umgebung</DialogTitle>
          </DialogHeader>
          {center && mapOpen && (
            <MapboxLocationMap
              lat={center.lat}
              lon={center.lon}
              zoom={14}
              label={mapTitle}
              pois={allPois}
              fitPois
              scrollZoom
              className="w-full h-[70vh]"
            />
          )}
        </DialogContent>
      </Dialog>




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
