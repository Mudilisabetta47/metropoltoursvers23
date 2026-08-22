import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { Loader2 } from "lucide-react";

export interface MapPoi {
  name: string;
  lat: number;
  lon: number;
  kind?: string;
}

interface MapboxLocationMapProps {
  /** Freitext-Suche (z. B. "Novalja, Kroatien") – wird per Mapbox Geocoding aufgelöst */
  query?: string;
  /** Bekannte Koordinaten – haben Vorrang vor query */
  lat?: number;
  lon?: number;
  zoom?: number;
  className?: string;
  label?: string;
  /** Umgebungs-Punkte, die zusätzlich als Marker gezeigt werden */
  pois?: MapPoi[];
  /** Kartenausschnitt automatisch auf alle POIs anpassen */
  fitPois?: boolean;
  /** Scroll-Zoom aktivieren (für Vollbild/Dialog sinnvoll) */
  scrollZoom?: boolean;
}

const MapboxLocationMap = ({
  query,
  lat,
  lon,
  zoom = 11,
  className = "w-full h-[70vh]",
  label,
  pois,
  fitPois = false,
  scrollZoom = false,
}: MapboxLocationMapProps) => {
  const { token, isLoading } = useMapboxToken();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [center, setCenter] = useState<{ lat: number; lon: number } | null>(
    Number.isFinite(lat) && Number.isFinite(lon) ? { lat: lat as number, lon: lon as number } : null,
  );
  const [error, setError] = useState<string | null>(null);

  // Geocoding via Mapbox
  useEffect(() => {
    if (center || !token || !query) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?limit=1&language=de&access_token=${token}`,
        );
        const data = await res.json();
        const feature = data?.features?.[0];
        if (!cancelled && feature?.center) {
          setCenter({ lon: feature.center[0], lat: feature.center[1] });
        } else if (!cancelled) {
          setError("Standort konnte nicht ermittelt werden.");
        }
      } catch {
        if (!cancelled) setError("Karte konnte nicht geladen werden.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, query, center]);

  useEffect(() => {
    if (!token || !center || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [center.lon, center.lat],
      zoom,
      attributionControl: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new mapboxgl.FullscreenControl(), "top-right");
    if (scrollZoom) map.scrollZoom.enable();
    else map.scrollZoom.disable();

    const el = document.createElement("div");
    el.className = "metours-marker";
    el.style.cssText =
      "width:22px;height:22px;border-radius:9999px;background:#00CC36;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)";
    const marker = new mapboxgl.Marker(el).setLngLat([center.lon, center.lat]);
    if (label) marker.setPopup(new mapboxgl.Popup({ offset: 18 }).setText(label));
    marker.addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [token, center, zoom, label, scrollZoom]);

  // Umgebungs-Marker (POIs)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center || !pois?.length) return;
    const markers = pois
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
      .map((p) => {
        const dot = document.createElement("div");
        dot.style.cssText =
          "width:12px;height:12px;border-radius:9999px;background:#0f1218;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);cursor:pointer";
        return new mapboxgl.Marker(dot)
          .setLngLat([p.lon, p.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 12 }).setText(p.kind ? `${p.kind} · ${p.name}` : p.name),
          )
          .addTo(map);
      });

    if (fitPois && markers.length) {
      const bounds = new mapboxgl.LngLatBounds([center.lon, center.lat], [center.lon, center.lat]);
      pois.forEach((p) => bounds.extend([p.lon, p.lat]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 0 });
    }

    return () => markers.forEach((m) => m.remove());
  }, [center, pois, fitPois]);

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="absolute inset-0" />
      {(isLoading || (!center && !error)) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/60 backdrop-blur-sm">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Karte wird geladen …
          </span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/70">
          <span className="text-xs text-muted-foreground">{error}</span>
        </div>
      )}
    </div>
  );
};

export default MapboxLocationMap;
