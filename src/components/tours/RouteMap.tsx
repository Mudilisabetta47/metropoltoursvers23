import { useEffect, useState, useRef } from "react";
import Map, { Marker, Source, Layer, NavigationControl } from "react-map-gl/maplibre";
import { supabase } from "@/integrations/supabase/client";
import { TourPickupStop } from "@/hooks/useTourBuilder";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";

interface RouteMapProps {
  stops: TourPickupStop[];
}

// German city coordinates (fallback for geocoding)
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "hamburg": { lat: 53.5511, lng: 9.9937 },
  "bremen": { lat: 53.0793, lng: 8.8017 },
  "hannover": { lat: 52.3759, lng: 9.7320 },
  "berlin": { lat: 52.5200, lng: 13.4050 },
  "münchen": { lat: 48.1351, lng: 11.5820 },
  "köln": { lat: 50.9375, lng: 6.9603 },
  "frankfurt": { lat: 50.1109, lng: 8.6821 },
  "düsseldorf": { lat: 51.2277, lng: 6.7735 },
  "stuttgart": { lat: 48.7758, lng: 9.1829 },
  "dortmund": { lat: 51.5136, lng: 7.4653 },
  "essen": { lat: 51.4556, lng: 7.0116 },
  "leipzig": { lat: 51.3397, lng: 12.3731 },
  "dresden": { lat: 51.0504, lng: 13.7373 },
  "nürnberg": { lat: 49.4521, lng: 11.0767 },
  "osnabrück": { lat: 52.2799, lng: 8.0472 },
  "bielefeld": { lat: 52.0302, lng: 8.5325 },
  "kiel": { lat: 54.3213, lng: 10.1349 },
  "lübeck": { lat: 53.8655, lng: 10.6866 },
  "rostock": { lat: 54.0924, lng: 12.0991 },
  "magdeburg": { lat: 52.1205, lng: 11.6276 },
  "braunschweig": { lat: 52.2689, lng: 10.5268 },
  "wolfsburg": { lat: 52.4227, lng: 10.7865 },
  "salzgitter": { lat: 52.1549, lng: 10.3635 },
  "hildesheim": { lat: 52.1543, lng: 9.9515 },
  "göttingen": { lat: 51.5327, lng: 9.9354 },
  "kassel": { lat: 51.3128, lng: 9.4797 },
  "celle": { lat: 52.6246, lng: 10.0809 },
  "oldenburg": { lat: 53.1435, lng: 8.2146 },
  "wilhelmshaven": { lat: 53.5303, lng: 8.1062 },
  "bremerhaven": { lat: 53.5396, lng: 8.5809 },
  "paderborn": { lat: 51.7189, lng: 8.7544 },
  "münster": { lat: 51.9607, lng: 7.6261 },
  // European destinations
  "kopenhagen": { lat: 55.6761, lng: 12.5683 },
  "amsterdam": { lat: 52.3676, lng: 4.9041 },
  "paris": { lat: 48.8566, lng: 2.3522 },
  "rom": { lat: 41.9028, lng: 12.4964 },
  "prag": { lat: 50.0755, lng: 14.4378 },
  "wien": { lat: 48.2082, lng: 16.3738 },
  "barcelona": { lat: 41.3851, lng: 2.1734 },
  "zagreb": { lat: 45.8150, lng: 15.9819 },
  "split": { lat: 43.5081, lng: 16.4402 },
  "dubrovnik": { lat: 42.6507, lng: 18.0944 },
  "belgrad": { lat: 44.7866, lng: 20.4489 },
  "sarajevo": { lat: 43.8563, lng: 18.4131 },
  "ljubljana": { lat: 46.0569, lng: 14.5058 },
  "podgorica": { lat: 42.4304, lng: 19.2594 },
  "tirana": { lat: 41.3275, lng: 19.8187 },
  "skopje": { lat: 41.9981, lng: 21.4254 },
  "pristina": { lat: 42.6629, lng: 21.1655 },
  "prishtina": { lat: 42.6629, lng: 21.1655 },
  "novi sad": { lat: 45.2671, lng: 19.8335 },
  "kosovo": { lat: 42.6629, lng: 21.1655 },
};

const getCityCoords = (city: string): { lat: number; lng: number } | null => {
  const normalized = city.toLowerCase().trim();
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }
  return null;
};

const RouteMap = ({ stops }: RouteMapProps) => {
  const { hasAnalyticsConsent, isLoading: consentLoading } = useCookieConsent();
  const [isReady, setIsReady] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!consentLoading) {
      setIsReady(true);
    }
  }, [consentLoading]);

  // Parse coordinates from stops using city lookup
  const markers = stops
    .filter(stop => stop.city)
    .map((stop) => {
      const cityCoords = getCityCoords(stop.city);
      
      if (!cityCoords) return null;

      return {
        id: stop.id,
        city: stop.city,
        location: stop.location_name,
        time: stop.departure_time,
        surcharge: stop.surcharge,
        lat: cityCoords.lat,
        lng: cityCoords.lng,
        order: stop.sort_order,
      };
    })
    .filter(Boolean) as Array<{
      id: string;
      city: string;
      location: string;
      time: string;
      surcharge: number;
      lat: number;
      lng: number;
      order: number;
    }>;

  // Calculate bounds
  const getBounds = () => {
    if (markers.length === 0) return null;
    
    const lats = markers.map(m => m.lat);
    const lngs = markers.map(m => m.lng);
    
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  };

  const bounds = getBounds();
  const center = bounds ? {
    latitude: (bounds.minLat + bounds.maxLat) / 2,
    longitude: (bounds.minLng + bounds.maxLng) / 2,
  } : { latitude: 52.5, longitude: 10.0 };

  // Create line for route
  const routeLine = markers.length > 1 ? {
    type: "Feature" as const,
    geometry: {
      type: "LineString" as const,
      coordinates: markers
        .sort((a, b) => a.order - b.order)
        .map(m => [m.lng, m.lat]),
    },
    properties: {},
  } : null;

  // Loading state
  if (!isReady || consentLoading) {
    return (
      <div className="h-64 bg-muted rounded-xl flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Karte wird geladen...</div>
      </div>
    );
  }

  // No consent - show consent prompt
  if (!hasAnalyticsConsent) {
    return (
      <div className="h-64 bg-muted rounded-xl flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Cookie className="w-6 h-6 text-primary" />
        </div>
        <h4 className="font-semibold text-foreground mb-2">Karte deaktiviert</h4>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          Um die interaktive Karte zu nutzen, akzeptieren Sie bitte die Analyse-Cookies in den Cookie-Einstellungen.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            localStorage.removeItem('metropol_cookie_consent');
            window.location.reload();
          }}
        >
          Cookie-Einstellungen öffnen
        </Button>
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div className="h-64 bg-muted rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Keine Koordinaten für Haltestellen verfügbar</p>
      </div>
    );
  }

  return (
    <div className="h-72 rounded-xl overflow-hidden border shadow-sm">
      <Map
        ref={mapRef}
        initialViewState={{
          ...center,
          zoom: markers.length === 1 ? 10 : 5,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />
        
        {/* Route Line */}
        {routeLine && (
          <Source id="route" type="geojson" data={routeLine}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "hsl(221, 83%, 53%)",
                "line-width": 3,
                "line-dasharray": [2, 2],
              }}
            />
          </Source>
        )}

        {/* Markers */}
        {markers.map((marker, index) => (
          <Marker
            key={marker.id}
            latitude={marker.lat}
            longitude={marker.lng}
            anchor="bottom"
          >
            <div className="relative group cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg border-2 border-background">
                {index + 1}
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-background rounded-lg shadow-lg p-3 whitespace-nowrap border">
                  <p className="font-semibold text-sm text-foreground">{marker.city}</p>
                  <p className="text-xs text-muted-foreground">{marker.location}</p>
                  <p className="text-xs text-primary font-medium">{marker.time} Uhr</p>
                </div>
              </div>
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
};

export default RouteMap;
