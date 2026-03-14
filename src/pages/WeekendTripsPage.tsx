import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, Clock, Bus, Calendar, ArrowRight, Wifi, Plug,
  Armchair, Star, TrendingUp, Sparkles,
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

const DESTINATION_META: Record<string, { image: string; highlights: string[]; duration: string; distance: string }> = {
  Kopenhagen: { image: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&q=80", highlights: ["Nyhavn", "Tivoli", "Meerjungfrau"], duration: "7,5 Std.", distance: "586 km" },
  Amsterdam: { image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80", highlights: ["Grachten", "Van Gogh Museum", "Anne Frank Haus"], duration: "6,5 Std.", distance: "625 km" },
  Paris: { image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80", highlights: ["Eiffelturm", "Louvre", "Champs-Élysées"], duration: "10 Std.", distance: "1.023 km" },
  Rom: { image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80", highlights: ["Kolosseum", "Vatikan", "Trevi-Brunnen"], duration: "17 Std.", distance: "1.765 km" },
  Prag: { image: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&q=80", highlights: ["Karlsbrücke", "Prager Burg", "Altstadt"], duration: "8 Std.", distance: "758 km" },
  Wien: { image: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&q=80", highlights: ["Schönbrunn", "Stephansdom", "Prater"], duration: "11 Std.", distance: "1.081 km" },
  Barcelona: { image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80", highlights: ["Sagrada Familia", "Park Güell", "La Rambla"], duration: "17,5 Std.", distance: "1.904 km" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const WeekendTripsPage = () => {
  const navigate = useNavigate();

  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ["weekend-routes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("routes").select("*").eq("is_active", true).ilike("name", "Hamburg -%");
      if (error) throw error;
      return data as Route[];
    },
  });

  const { data: stops } = useQuery({
    queryKey: ["route-stops"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stops").select("*").order("stop_order");
      if (error) throw error;
      return data as Stop[];
    },
  });

  const getDestinationCity = (route: Route) => {
    const routeStops = stops?.filter((s) => s.route_id === route.id) || [];
    const lastStop = routeStops.sort((a, b) => b.stop_order - a.stop_order)[0];
    return lastStop?.city || route.name.split(" - ")[1] || "";
  };

  const getRouteStops = (routeId: string) =>
    (stops?.filter((s) => s.route_id === routeId) || []).sort((a, b) => a.stop_order - b.stop_order);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-16 lg:pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 lg:py-28 bg-secondary">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_70%)]" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
              <Badge className="mb-5 bg-primary/20 text-primary border-0 text-sm px-4 py-1.5">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                Wochenendtrips
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-secondary-foreground mb-5">
                Europa erleben –<br />
                <span className="gradient-text">an einem Wochenende</span>
              </h1>
              <p className="text-lg text-secondary-foreground/70 mb-8 max-w-2xl">
                Entdecken Sie die schönsten Städte Europas mit unseren komfortablen
                Busreisen ab Hamburg. Alle Routen starten vom ZOB Hamburg mit
                Zustiegsmöglichkeiten in Bremen und Hannover.
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: Wifi, label: "Kostenloses WLAN" },
                  { icon: Plug, label: "Steckdosen am Platz" },
                  { icon: Armchair, label: "Komfort-Sitze" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2 text-sm text-secondary-foreground/60 bg-secondary-foreground/5 rounded-full px-4 py-2">
                    <f.icon className="w-4 h-4 text-primary" />
                    {f.label}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Dynamic Pricing Info */}
        <section className="py-4 bg-accent/5 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 justify-center text-sm">
              <TrendingUp className="w-5 h-5 text-accent" />
              <span className="text-muted-foreground">
                <strong className="text-foreground">Dynamische Preise:</strong> Je
                früher Sie buchen, desto günstiger!
              </span>
            </div>
          </div>
        </section>

        {/* Routes Grid */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-0">
                <MapPin className="w-3 h-3 mr-1" />
                Reiseziele
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Unsere Wochenendtrip-Ziele
              </h2>
            </motion.div>

            {routesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-2xl overflow-hidden">
                    <Skeleton className="h-52" />
                    <div className="p-5 space-y-3">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {routes?.map((route, i) => {
                  const destination = getDestinationCity(route);
                  const meta = DESTINATION_META[destination];
                  const routeStops = getRouteStops(route.id);

                  return (
                    <motion.div
                      key={route.id}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      className="group card-elevated overflow-hidden cursor-pointer border border-transparent hover:border-primary/30 transition-all"
                      onClick={() => navigate(`/wochenendtrips/${destination}`)}
                    >
                      {/* Image */}
                      <div className="relative h-52 overflow-hidden">
                        <img
                          src={meta?.image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80"}
                          alt={`Wochenendtrip nach ${destination}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-2xl font-bold text-white">{destination}</h3>
                          <p className="text-white/80 text-sm mt-1">{route.description}</p>
                        </div>
                        <Badge className="absolute top-4 right-4 bg-primary border-0 shadow-lg text-sm">
                          ab {route.base_price}€
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-primary" />
                            {meta?.duration || "–"}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-primary" />
                            {meta?.distance || "–"}
                          </div>
                        </div>

                        {/* Stops */}
                        <div className="flex items-center gap-1.5 mb-4 text-xs flex-wrap">
                          {routeStops.map((stop, idx) => (
                            <div key={stop.id} className="flex items-center">
                              <span className={idx === routeStops.length - 1 ? "font-bold text-primary" : "text-muted-foreground"}>
                                {stop.city}
                              </span>
                              {idx < routeStops.length - 1 && <ArrowRight className="w-3 h-3 mx-1 text-muted-foreground/40" />}
                            </div>
                          ))}
                        </div>

                        {/* Highlights */}
                        {meta?.highlights && (
                          <div className="flex flex-wrap gap-1.5 mb-5">
                            {meta.highlights.map((h) => (
                              <Badge key={h} variant="secondary" className="text-xs rounded-full">
                                <Star className="w-3 h-3 mr-1" />{h}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Button className="w-full gap-2">
                          <Bus className="w-4 h-4" />
                          Jetzt buchen
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 lg:py-28 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                So einfach geht's
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                So funktioniert's
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Ziel wählen", desc: "Wählen Sie Ihr Traumziel und den gewünschten Reisetermin" },
                { step: "2", title: "Platz buchen", desc: "Wählen Sie Ihren Sitzplatz und buchen Sie online" },
                { step: "3", title: "Losfahren", desc: "Steigen Sie ein und genießen Sie die Reise" },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <span className="text-2xl font-bold text-primary">{item.step}</span>
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default WeekendTripsPage;
