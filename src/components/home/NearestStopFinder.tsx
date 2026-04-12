import { useState } from "react";
import { MapPin, Navigation, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface NearbyStop {
  id: string;
  name: string;
  city: string;
  distance_km: number;
}

const haversineDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Known city coordinates for distance calculation
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  hamburg: { lat: 53.5511, lng: 9.9937 },
  bremen: { lat: 53.0793, lng: 8.8017 },
  hannover: { lat: 52.3759, lng: 9.732 },
  berlin: { lat: 52.52, lng: 13.405 },
  münchen: { lat: 48.1351, lng: 11.582 },
  köln: { lat: 50.9375, lng: 6.9603 },
  frankfurt: { lat: 50.1109, lng: 8.6821 },
  düsseldorf: { lat: 51.2277, lng: 6.7735 },
  stuttgart: { lat: 48.7758, lng: 9.1829 },
  dortmund: { lat: 51.5136, lng: 7.4653 },
  essen: { lat: 51.4556, lng: 7.0116 },
  leipzig: { lat: 51.3397, lng: 12.3731 },
  dresden: { lat: 51.0504, lng: 13.7373 },
  nürnberg: { lat: 49.4521, lng: 11.0767 },
  osnabrück: { lat: 52.2799, lng: 8.0472 },
  bielefeld: { lat: 52.0302, lng: 8.5325 },
  kiel: { lat: 54.3213, lng: 10.1349 },
  lübeck: { lat: 53.8655, lng: 10.6866 },
  rostock: { lat: 54.0924, lng: 12.0991 },
  magdeburg: { lat: 52.1205, lng: 11.6276 },
  braunschweig: { lat: 52.2689, lng: 10.5268 },
  wolfsburg: { lat: 52.4227, lng: 10.7865 },
  hildesheim: { lat: 52.1543, lng: 9.9515 },
  göttingen: { lat: 51.5327, lng: 9.9354 },
  kassel: { lat: 51.3128, lng: 9.4797 },
  celle: { lat: 52.6246, lng: 10.0809 },
  oldenburg: { lat: 53.1435, lng: 8.2146 },
  bremerhaven: { lat: 53.5396, lng: 8.5809 },
  paderborn: { lat: 51.7189, lng: 8.7544 },
  münster: { lat: 51.9607, lng: 7.6261 },
};

const NearestStopFinder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyStops, setNearbyStops] = useState<NearbyStop[]>([]);
  const [showResults, setShowResults] = useState(false);

  const findNearestStops = async () => {
    setLoading(true);
    setError(null);
    setNearbyStops([]);
    setShowResults(true);

    if (!("geolocation" in navigator)) {
      setError("Ihr Browser unterstützt keine Standortbestimmung.");
      setLoading(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      );

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      // Fetch all stops
      const { data: stops, error: dbError } = await supabase
        .from("stops")
        .select("id, name, city")
        .order("city");

      if (dbError) throw dbError;

      // Calculate distances using city coordinates
      const withDistance: NearbyStop[] = (stops || [])
        .map((stop) => {
          const cityKey = stop.city.toLowerCase().trim();
          const coords = CITY_COORDS[cityKey];
          if (!coords) return null;
          const dist = haversineDistance(userLat, userLng, coords.lat, coords.lng);
          return {
            id: stop.id,
            name: stop.name,
            city: stop.city,
            distance_km: Math.round(dist * 10) / 10,
          };
        })
        .filter(Boolean) as NearbyStop[];

      // Deduplicate by city (keep closest per city)
      const cityMap = new Map<string, NearbyStop>();
      withDistance.forEach((s) => {
        const existing = cityMap.get(s.city);
        if (!existing || s.distance_km < existing.distance_km) {
          cityMap.set(s.city, s);
        }
      });

      const sorted = Array.from(cityMap.values())
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, 5);

      setNearbyStops(sorted);
    } catch (err: any) {
      if (err?.code === 1) {
        setError("Standortzugriff wurde verweigert. Bitte erlauben Sie den Zugriff in Ihren Browsereinstellungen.");
      } else if (err?.code === 2) {
        setError("Standort konnte nicht ermittelt werden. Bitte versuchen Sie es erneut.");
      } else {
        setError("Fehler bei der Standortbestimmung. Bitte versuchen Sie es erneut.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Nächste Haltestelle finden</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Ermitteln Sie Ihren Standort, um die nächstgelegenen MeTours-Haltestellen zu finden.
          </p>

          <Button
            onClick={findNearestStops}
            disabled={loading}
            size="lg"
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5" />
            )}
            {loading ? "Standort wird ermittelt..." : "Meinen Standort verwenden"}
          </Button>

          {showResults && (
            <div className="mt-6 space-y-3">
              {error && (
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
                </Card>
              )}

              {nearbyStops.length > 0 && (
                <div className="space-y-2">
                  {nearbyStops.map((stop, i) => (
                    <Card
                      key={stop.id}
                      className={cn(
                        "transition-all",
                        i === 0 && "border-primary/50 bg-primary/5 shadow-md"
                      )}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                              i === 0
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {i + 1}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-foreground">{stop.city}</p>
                            <p className="text-sm text-muted-foreground">{stop.name}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-primary">
                          {stop.distance_km} km
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!loading && !error && nearbyStops.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Keine Haltestellen in der Nähe gefunden.
                </p>
              )}

              {showResults && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowResults(false); setNearbyStops([]); setError(null); }}
                  className="mt-2"
                >
                  <X className="w-4 h-4 mr-1" /> Schließen
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NearestStopFinder;
