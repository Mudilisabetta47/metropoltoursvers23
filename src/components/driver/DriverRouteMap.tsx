import { useRef } from "react";
import Map, { Marker, Source, Layer, NavigationControl } from "@vis.gl/react-mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

// German city coordinates for geocoding
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "hamburg": { lat: 53.5511, lng: 9.9937 },
  "bremen": { lat: 53.0793, lng: 8.8017 },
  "hannover": { lat: 52.3759, lng: 9.732 },
  "berlin": { lat: 52.52, lng: 13.405 },
  "münchen": { lat: 48.1351, lng: 11.582 },
  "köln": { lat: 50.9375, lng: 6.9603 },
  "frankfurt": { lat: 50.1109, lng: 8.6821 },
  "düsseldorf": { lat: 51.2277, lng: 6.7735 },
  "stuttgart": { lat: 48.7758, lng: 9.1829 },
  "dortmund": { lat: 51.5136, lng: 7.4653 },
  "osnabrück": { lat: 52.2799, lng: 8.0472 },
  "bielefeld": { lat: 52.0302, lng: 8.5325 },
  "kiel": { lat: 54.3213, lng: 10.1349 },
  "lübeck": { lat: 53.8655, lng: 10.6866 },
  "oldenburg": { lat: 53.1435, lng: 8.2146 },
  "münster": { lat: 51.9607, lng: 7.6261 },
  "kopenhagen": { lat: 55.6761, lng: 12.5683 },
  "amsterdam": { lat: 52.3676, lng: 4.9041 },
  "prag": { lat: 50.0755, lng: 14.4378 },
  "wien": { lat: 48.2082, lng: 16.3738 },
  "zagreb": { lat: 45.815, lng: 15.9819 },
  "split": { lat: 43.5081, lng: 16.4402 },
  "dubrovnik": { lat: 42.6507, lng: 18.0944 },
  "belgrad": { lat: 44.7866, lng: 20.4489 },
  "sarajevo": { lat: 43.8563, lng: 18.4131 },
  "pristina": { lat: 42.6629, lng: 21.1655 },
  "prishtina": { lat: 42.6629, lng: 21.1655 },
  "skopje": { lat: 41.9981, lng: 21.4254 },
  "tirana": { lat: 41.3275, lng: 19.8187 },
  "podgorica": { lat: 42.4304, lng: 19.2594 },
  "ljubljana": { lat: 46.0569, lng: 14.5058 },
  "novi sad": { lat: 45.2671, lng: 19.8335 },
};

interface Stop {
  id: string;
  name: string;
  city: string;
  stop_order: number;
}

interface DriverRouteMapProps {
  stops: Stop[];
  mapboxToken: string;
}

const getCityCoords = (city: string) => {
  const normalized = city.toLowerCase().trim();
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) return coords;
  }
  return null;
};

const DriverRouteMap = ({ stops, mapboxToken }: DriverRouteMapProps) => {
  const mapRef = useRef<any>(null);

  const markers = stops
    .map((stop) => {
      const coords = getCityCoords(stop.city);
      if (!coords) return null;
      return { ...stop, lat: coords.lat, lng: coords.lng };
    })
    .filter(Boolean) as (Stop & { lat: number; lng: number })[];

  if (markers.length === 0) return null;

  const lats = markers.map(m => m.lat);
  const lngs = markers.map(m => m.lng);
  const center = {
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  };

  const routeLine = markers.length > 1 ? {
    type: "Feature" as const,
    geometry: {
      type: "LineString" as const,
      coordinates: markers.sort((a, b) => a.stop_order - b.stop_order).map(m => [m.lng, m.lat]),
    },
    properties: {},
  } : null;

  return (
    <div className="h-64 rounded-xl overflow-hidden border border-zinc-800">
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={{ ...center, zoom: markers.length === 1 ? 10 : 5 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {routeLine && (
          <Source id="route" type="geojson" data={routeLine}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "#10b981",
                "line-width": 3,
                "line-dasharray": [2, 2],
              }}
            />
          </Source>
        )}

        {markers.map((marker, idx) => (
          <Marker key={marker.id} latitude={marker.lat} longitude={marker.lng} anchor="bottom">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-lg border-2 border-zinc-900">
              {idx + 1}
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
};

export default DriverRouteMap;
