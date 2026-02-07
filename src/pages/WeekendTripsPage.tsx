import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  Bus,
  Calendar,
  ArrowRight,
  Wifi,
  Plug,
  Armchair,
  Star,
  TrendingUp,
} from "lucide-react";

interface Route {
  id: string;
  name: string;
  description: string;
  base_price: number;
  is_active: boolean;
}

interface Stop {
  id: string;
  route_id: string;
  name: string;
  city: string;
  stop_order: number;
  price_from_start: number;
}

// Destination metadata for images and info
const DESTINATION_META: Record<
  string,
  { image: string; highlights: string[]; duration: string; distance: string }
> = {
  Kopenhagen: {
    image:
      "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&q=80",
    highlights: ["Nyhavn", "Tivoli", "Meerjungfrau"],
    duration: "7,5 Std.",
    distance: "586 km",
  },
  Amsterdam: {
    image:
      "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80",
    highlights: ["Grachten", "Van Gogh Museum", "Anne Frank Haus"],
    duration: "6,5 Std.",
    distance: "625 km",
  },
  Paris: {
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
    highlights: ["Eiffelturm", "Louvre", "Champs-Élysées"],
    duration: "10 Std.",
    distance: "1.023 km",
  },
  Rom: {
    image:
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
    highlights: ["Kolosseum", "Vatikan", "Trevi-Brunnen"],
    duration: "17 Std.",
    distance: "1.765 km",
  },
  Prag: {
    image:
      "https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&q=80",
    highlights: ["Karlsbrücke", "Prager Burg", "Altstadt"],
    duration: "8 Std.",
    distance: "758 km",
  },
  Wien: {
    image:
      "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&q=80",
    highlights: ["Schönbrunn", "Stephansdom", "Prater"],
    duration: "11 Std.",
    distance: "1.081 km",
  },
  Barcelona: {
    image:
      "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
    highlights: ["Sagrada Familia", "Park Güell", "La Rambla"],
    duration: "17,5 Std.",
    distance: "1.904 km",
  },
};

const WeekendTripsPage = () => {
  const navigate = useNavigate();

  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ["weekend-routes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routes")
        .select("*")
        .eq("is_active", true)
        .ilike("name", "Hamburg -%");
      if (error) throw error;
      return data as Route[];
    },
  });

  const { data: stops } = useQuery({
    queryKey: ["route-stops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stops")
        .select("*")
        .order("stop_order");
      if (error) throw error;
      return data as Stop[];
    },
  });

  const getDestinationCity = (route: Route) => {
    const routeStops = stops?.filter((s) => s.route_id === route.id) || [];
    const lastStop = routeStops.sort((a, b) => b.stop_order - a.stop_order)[0];
    return lastStop?.city || route.name.split(" - ")[1] || "";
  };

  const getRouteStops = (routeId: string) => {
    return (stops?.filter((s) => s.route_id === routeId) || []).sort(
      (a, b) => a.stop_order - b.stop_order
    );
  };

  // Dynamic pricing display (showing potential range)
  const getPriceRange = (basePrice: number) => {
    const maxPrice = Math.round(basePrice * 1.3); // 30% surge at >90% occupancy
    return { min: basePrice, max: maxPrice };
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-0">
              <Calendar className="w-3 h-3 mr-1" />
              Wochenendtrips
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Europa erleben –<br />
              <span className="text-primary">an einem Wochenende</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Entdecken Sie die schönsten Städte Europas mit unseren komfortablen
              Busreisen ab Hamburg. Alle Routen starten vom ZOB Hamburg mit
              Zustiegsmöglichkeiten in Bremen und Hannover.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wifi className="w-4 h-4 text-primary" />
                Kostenloses WLAN
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Plug className="w-4 h-4 text-primary" />
                Steckdosen am Platz
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Armchair className="w-4 h-4 text-primary" />
                Komfort-Sitze
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Pricing Info */}
      <section className="py-6 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 justify-center text-sm">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">Dynamische Preise:</strong> Je
              früher Sie buchen, desto günstiger! Preise steigen mit der
              Auslastung.
            </span>
          </div>
        </div>
      </section>

      {/* Routes Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            Unsere Wochenendtrip-Ziele
          </h2>

          {routesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-80 bg-muted rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routes?.map((route) => {
                const destination = getDestinationCity(route);
                const meta = DESTINATION_META[destination];
                const routeStops = getRouteStops(route.id);
                const priceRange = getPriceRange(route.base_price);

                return (
                  <Card
                    key={route.id}
                    className="group overflow-hidden border-border hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => navigate(`/wochenendtrips/${destination}`)}
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={
                          meta?.image ||
                          "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80"
                        }
                        alt={destination}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white">
                          {destination}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {route.description}
                        </p>
                      </div>
                      <Badge className="absolute top-4 right-4 bg-primary">
                        ab {priceRange.min}€
                      </Badge>
                    </div>

                    <CardContent className="p-4">
                      {/* Route Info */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {meta?.duration || "–"}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {meta?.distance || "–"}
                        </div>
                      </div>

                      {/* Stops */}
                      <div className="flex items-center gap-2 mb-4 text-xs">
                        {routeStops.map((stop, idx) => (
                          <div key={stop.id} className="flex items-center">
                            <span
                              className={
                                idx === routeStops.length - 1
                                  ? "font-semibold text-primary"
                                  : "text-muted-foreground"
                              }
                            >
                              {stop.city}
                            </span>
                            {idx < routeStops.length - 1 && (
                              <ArrowRight className="w-3 h-3 mx-1 text-muted-foreground/50" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Highlights */}
                      {meta?.highlights && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {meta.highlights.map((h) => (
                            <Badge
                              key={h}
                              variant="secondary"
                              className="text-xs"
                            >
                              <Star className="w-3 h-3 mr-1" />
                              {h}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* CTA */}
                      <Button className="w-full" size="sm">
                        <Bus className="w-4 h-4 mr-2" />
                        Jetzt buchen
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              So funktioniert's
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Ziel wählen</h3>
                <p className="text-sm text-muted-foreground">
                  Wählen Sie Ihr Traumziel und den gewünschten Reisetermin
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold mb-2">Platz buchen</h3>
                <p className="text-sm text-muted-foreground">
                  Wählen Sie Ihren Sitzplatz und buchen Sie online
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold mb-2">Losfahren</h3>
                <p className="text-sm text-muted-foreground">
                  Steigen Sie ein und genießen Sie die Reise
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WeekendTripsPage;
