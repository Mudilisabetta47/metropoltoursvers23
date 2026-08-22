import { useEffect, useMemo, useState } from "react";
import { Loader2, FerrisWheel, Utensils, Mountain, TrainFront, Plane, ExternalLink } from "lucide-react";

interface Poi {
  name: string;
  kind: string;
  distanceKm: number;
}

interface Groups {
  attractions: Poi[];
  food: Poi[];
  nature: Poi[];
  transit: Poi[];
  airports: Poi[];
}

const EMPTY: Groups = { attractions: [], food: [], nature: [], transit: [], airports: [] };

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
}

const TourSurroundingsSection = ({ destination, location, country }: Props) => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Groups>(EMPTY);
  const [center, setCenter] = useState<{ lat: number; lon: number } | null>(null);

  const query = useMemo(
    () => [location, destination, country].filter(Boolean).join(", "),
    [location, destination, country]
  );

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    setLoading(true);
    setGroups(EMPTY);

    (async () => {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
          { headers: { Accept: "application/json" } }
        );
        const geo = await geoRes.json();
        if (!Array.isArray(geo) || geo.length === 0) throw new Error("no geocode");
        const lat = parseFloat(geo[0].lat);
        const lon = parseFloat(geo[0].lon);
        if (cancelled) return;
        setCenter({ lat, lon });

        const overpass = `
[out:json][timeout:25];
(
  node(around:6000,${lat},${lon})["tourism"~"attraction|museum|viewpoint|theme_park|zoo"]["name"];
  node(around:6000,${lat},${lon})["historic"~"castle|monument|memorial|ruins"]["name"];
  node(around:1500,${lat},${lon})["amenity"~"restaurant|cafe"]["name"];
  node(around:15000,${lat},${lon})["natural"~"beach|peak|wood"]["name"];
  node(around:8000,${lat},${lon})["railway"="station"]["name"];
  node(around:4000,${lat},${lon})["highway"="bus_stop"]["name"];
  node(around:60000,${lat},${lon})["aeroway"="aerodrome"]["name"];
  way(around:60000,${lat},${lon})["aeroway"="aerodrome"]["name"];
);
out center 120;`;

        const opRes = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: overpass,
        });
        const op = await opRes.json();
        if (cancelled) return;

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

          if (t.aeroway === "aerodrome") {
            next.airports.push({ name, kind: "Flughafen", distanceKm });
          } else if (t.railway === "station") {
            next.transit.push({ name, kind: "Bahnhof", distanceKm });
          } else if (t.highway === "bus_stop") {
            next.transit.push({ name, kind: "Bus", distanceKm });
          } else if (t.amenity === "restaurant" || t.amenity === "cafe") {
            next.food.push({ name, kind: t.amenity === "cafe" ? "Café" : "Restaurant", distanceKm });
          } else if (t.natural) {
            const kind = t.natural === "beach" ? "Strand" : t.natural === "peak" ? "Gipfel" : "Wald";
            next.nature.push({ name, kind, distanceKm });
          } else {
            const kind =
              t.tourism === "museum"
                ? "Museum"
                : t.tourism === "viewpoint"
                ? "Aussichtspunkt"
                : t.historic
                ? "Sehenswürdigkeit"
                : "Attraktion";
            next.attractions.push({ name, kind, distanceKm });
          }
        }

        const sortTrim = (arr: Poi[], n: number) =>
          arr.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, n);

        setGroups({
          attractions: sortTrim(next.attractions, 10),
          food: sortTrim(next.food, 6),
          nature: sortTrim(next.nature, 5),
          transit: sortTrim(next.transit, 6),
          airports: sortTrim(next.airports, 3),
        });
      } catch {
        if (!cancelled) setGroups(EMPTY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const hasAny =
    groups.attractions.length + groups.food.length + groups.nature.length +
    groups.transit.length + groups.airports.length > 0;

  if (!loading && !hasAny) return null;

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
    <section className="bg-card border border-border rounded-xl p-6 scroll-mt-36">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h2 className="text-2xl font-bold text-foreground">Umgebung</h2>
      </div>
      {center && (
        <a
          href={`https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lon}#map=14/${center.lat}/${center.lon}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-6"
        >
          Karte anzeigen <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Umgebung wird geladen…
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
