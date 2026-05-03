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

interface TourTariffMini {
  id: string;
  name: string;
  price_modifier: number | null;
  is_recommended: boolean | null;
  is_active: boolean | null;
}

interface TourDateMini {
  id: string;
  departure_date: string;
  return_date: string | null;
  price_basic: number | null;
  total_seats: number | null;
  booked_seats: number | null;
  status: string | null;
  is_active: boolean | null;
}

interface WeekendTrip {
  id: string;
  destination: string;
  slug: string;
  country: string;
  image_url: string | null;
  short_description: string | null;
  highlights: string[];
  duration_days: number | null;
  price_from: number;
  location: string;
  is_active: boolean;
  is_featured: boolean;
  tour_dates: TourDateMini[];
  tour_tariffs: TourTariffMini[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const formatDateShort = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
};

const WeekendTripsPage = () => {
  const navigate = useNavigate();

  const { data: trips, isLoading } = useQuery({
    queryKey: ["weekend-trips-page-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("package_tours")
        .select(`
          id, destination, slug, country, image_url, short_description, highlights,
          duration_days, price_from, location, is_active, is_featured,
          tour_dates(id, departure_date, return_date, price_basic, total_seats, booked_seats, status, is_active),
          tour_tariffs(id, name, price_modifier, is_recommended, is_active)
        `)
        .eq("is_active", true)
        .eq("category", "weekend")
        .order("is_featured", { ascending: false })
        .order("destination");
      if (error) throw error;
      return (data || []) as unknown as WeekendTrip[];
    },
  });

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

            {isLoading ? (
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
                {trips?.map((trip, i) => {
                  const upcomingDates = (trip.tour_dates || [])
                    .filter(d => d.is_active && d.departure_date && new Date(d.departure_date) >= new Date(new Date().toDateString()))
                    .sort((a, b) => a.departure_date.localeCompare(b.departure_date));
                  const nextDate = upcomingDates[0];
                  const remainingSeats = nextDate
                    ? Math.max(0, (nextDate.total_seats || 0) - (nextDate.booked_seats || 0))
                    : null;
                  const minDatePrice = upcomingDates.length
                    ? Math.min(...upcomingDates.map(d => d.price_basic ?? trip.price_from))
                    : trip.price_from;
                  const activeTariffs = (trip.tour_tariffs || []).filter(t => t.is_active);
                  const isBookable = !!nextDate && (nextDate.status === 'available' || nextDate.status === 'limited');

                  return (
                    <motion.div
                      key={trip.id}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      className="group card-elevated overflow-hidden cursor-pointer border border-transparent hover:border-primary/30 transition-all flex flex-col"
                      onClick={() => navigate(`/wochenendtrips/${trip.slug}`)}
                    >
                      {/* Image */}
                      <div className="relative h-52 overflow-hidden">
                        <img
                          src={trip.image_url || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80"}
                          alt={`Wochenendtrip nach ${trip.destination}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-2xl font-bold text-white">{trip.destination}</h3>
                          <p className="text-white/80 text-sm mt-1 line-clamp-1">{trip.short_description}</p>
                        </div>
                        <Badge className="absolute top-4 right-4 bg-primary border-0 shadow-lg text-sm">
                          ab {minDatePrice}€
                        </Badge>
                        {remainingSeats !== null && remainingSeats > 0 && remainingSeats <= 8 && (
                          <Badge className="absolute top-4 left-4 bg-amber-500 text-white border-0 shadow-lg text-xs">
                            Nur noch {remainingSeats} Plätze
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-primary" />
                            {trip.duration_days ? `${trip.duration_days} Tage` : "–"}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-primary" />
                            {trip.country}
                          </div>
                        </div>

                        {/* Departure */}
                        <div className="flex items-center gap-1.5 mb-3 text-xs flex-wrap">
                          <span className="text-muted-foreground">{trip.location}</span>
                          <ArrowRight className="w-3 h-3 mx-1 text-muted-foreground/40" />
                          <span className="font-bold text-primary">{trip.destination}</span>
                        </div>

                        {/* Next date */}
                        <div className="flex items-center gap-2 mb-3 text-sm">
                          <Calendar className="w-4 h-4 text-primary" />
                          {nextDate ? (
                            <span className="text-foreground font-medium">
                              Nächster Termin: {formatDateShort(nextDate.departure_date)}
                              {upcomingDates.length > 1 && (
                                <span className="text-muted-foreground font-normal"> · +{upcomingDates.length - 1} weitere</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Termine auf Anfrage</span>
                          )}
                        </div>

                        {/* Tariffs */}
                        {activeTariffs.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {activeTariffs.slice(0, 3).map((t) => (
                              <Badge
                                key={t.id}
                                variant={t.is_recommended ? "default" : "secondary"}
                                className="text-xs rounded-full"
                              >
                                {t.is_recommended && <Star className="w-3 h-3 mr-1" />}
                                {t.name}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Highlights */}
                        {trip.highlights?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-5">
                            {trip.highlights.slice(0, 2).map((h) => (
                              <Badge key={h} variant="outline" className="text-xs rounded-full">
                                {h}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="mt-auto">
                          <Button className="w-full gap-2" disabled={!isBookable && !!nextDate}>
                            <Bus className="w-4 h-4" />
                            {isBookable ? "Jetzt buchen" : nextDate ? "Auf Anfrage" : "Details ansehen"}
                          </Button>
                        </div>
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
