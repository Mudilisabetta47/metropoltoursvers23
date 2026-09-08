import { useMemo, useState } from "react";
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
  MapPin, Clock, Bus, ArrowRight, Wifi, Plug, Armchair,
  BedDouble, Sparkles, Ruler, Search,
} from "lucide-react";
import weekendHero from "@/assets/weekend-hero.jpg";
import SEO from "@/components/seo/SEO";
import { breadcrumbJsonLd } from "@/lib/seo";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatEuro, WeekendStop } from "@/components/weekend/WeekendPieces";

interface WeekendTrip {
  id: string;
  destination: string;
  slug: string;
  country: string;
  image_url: string | null;
  hero_image_url: string | null;
  short_description: string | null;
  highlights: string[] | null;
  duration: string | null;
  distance: string | null;
  base_price: number;
  departure_city: string;
  departure_point: string | null;
  departure_time: string | null;
  via_stops: WeekendStop[] | null;
  accommodation_available: boolean;
  price_double_room: number;
  is_featured: boolean;
  is_active: boolean;
  layout_variant: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const WeekendTripsPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [onlyStay, setOnlyStay] = useState(false);

  const { data: trips, isLoading } = useQuery({
    queryKey: ["weekend-trips-page-v3"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("weekend_trips")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("sort_order");
      if (error) throw error;
      return (data || []) as WeekendTrip[];
    },
  });

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (trips || []).filter((t) => {
      const matches =
        !term ||
        [t.destination, t.country, t.departure_city, t.short_description]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term));
      return matches && (!onlyStay || t.accommodation_available);
    });
  }, [trips, query, onlyStay]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Wochenendtrips ab Hamburg, Bremen & Hannover"
        description="Kurztrips nach Europa im Komfortbus – nur Fahrt oder mit optionaler Unterkunft. Alle Zustiegsorte mit Abfahrtszeiten auf einen Blick."
        path="/wochenendtrips"
        image={weekendHero}
        jsonLd={[breadcrumbJsonLd([{ name: "Start", path: "/" }, { name: "Wochenendtrips", path: "/wochenendtrips" }])]}
      />
      <Header />

      <main>
        {/* HERO */}
        <section className="relative min-h-[560px] py-16 md:h-[62vh] md:min-h-[480px] md:py-0">
          <img src={weekendHero} alt="Wochenendtrips durch Europa im Reisebus" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-black/60" />
          <div className="absolute inset-0 bg-black/15" />
          <div className="container relative mx-auto flex h-full flex-col justify-end px-4 pb-8 pt-6 md:pb-12">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
              <Badge className="mb-4 border-0 bg-primary text-primary-foreground">
                <Bus className="mr-1 h-3 w-3" /> Kurzurlaub mit Zeitgefühl
              </Badge>
              <h1 className="text-[2rem] font-bold leading-[1.1] text-white sm:text-4xl md:text-6xl">
                Wochenendtrips durch Europa
              </h1>
              <p className="mt-3 text-base leading-relaxed text-white/85 md:mt-4 md:text-lg">
                Freitagabend einsteigen, Sonntag zurück. Sie buchen nur die Fahrt – die Unterkunft
                nehmen Sie optional dazu.
              </p>

              <div className="mt-6 flex flex-col gap-2.5 rounded-2xl border border-white/15 bg-black/45 p-2.5 shadow-2xl backdrop-blur-xl sm:flex-row md:mt-7">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ziel oder Zustiegsort suchen"
                    className="h-12 rounded-xl border-0 bg-background pl-10 text-base text-foreground shadow-sm placeholder:text-muted-foreground"
                  />
                </div>
                <Button
                  variant={onlyStay ? "default" : "secondary"}
                  className={cn(
                    "h-12 w-full rounded-xl text-base font-semibold sm:w-auto",
                    !onlyStay && "bg-background text-foreground hover:bg-background/90",
                  )}
                  onClick={() => setOnlyStay((v) => !v)}
                >
                  <BedDouble className="mr-2 h-4 w-4" />
                  Mit Unterkunft
                </Button>
              </div>
            </motion.div>

          </div>
        </section>

        {/* LISTE */}
        <section className="container mx-auto px-4 py-14">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[420px] rounded-3xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">Keine Wochenendtrips gefunden.</p>
          ) : (
            <>
              {featured && <FeaturedCard trip={featured} onClick={() => navigate(`/wochenendtrips/${featured.slug}`)} />}

              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((trip, i) => (
                  <motion.article
                    key={trip.id}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    variants={fadeUp}
                    onClick={() => navigate(`/wochenendtrips/${trip.slug}`)}
                    className="group cursor-pointer overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={trip.image_url || trip.hero_image_url || weekendHero}
                        alt={`Wochenendtrip nach ${trip.destination}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        <Badge className="border-0 bg-white/90 text-foreground">{trip.country}</Badge>
                        {trip.accommodation_available && (
                          <Badge className="border-0 bg-primary text-primary-foreground">
                            <BedDouble className="mr-1 h-3 w-3" /> Unterkunft optional
                          </Badge>
                        )}
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                        <h2 className="text-2xl font-bold text-white">{trip.destination}</h2>
                        <div className="rounded-xl bg-white/95 px-3 py-1.5 text-right">
                          <span className="block text-[10px] uppercase text-muted-foreground">ab</span>
                          <span className="text-lg font-bold text-primary">{formatEuro(Number(trip.base_price))}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-5">
                      {trip.short_description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{trip.short_description}</p>
                      )}
                      <StopStrip trip={trip} />
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {trip.duration && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary" />{trip.duration}</span>}
                        {trip.distance && <span className="inline-flex items-center gap-1"><Ruler className="h-3.5 w-3.5 text-primary" />{trip.distance}</span>}
                      </div>
                      <Button className="w-full" variant="outline">
                        Details & Abfahrtszeiten
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </motion.article>
                ))}
              </div>
            </>
          )}

          {/* Komfort */}
          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Wifi, title: "Kostenloses WLAN", text: "Die ganze Fahrt online bleiben" },
              { icon: Plug, title: "Steckdose am Sitz", text: "Handy und Laptop laden" },
              { icon: Armchair, title: "Komfortsitze", text: "Viel Beinfreiheit, verstellbar" },
            ].map((f) => (
              <div key={f.title} className="rounded-3xl border border-border bg-card p-6">
                <f.icon className="mb-3 h-6 w-6 text-primary" />
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const StopStrip = ({ trip, light = false }: { trip: WeekendTrip; light?: boolean }) => {
  const stops = [
    { name: trip.departure_point || trip.departure_city, time: trip.departure_time },
    ...(trip.via_stops || []).map((s) => ({ name: s.name || s.city, time: s.departure_time })),
  ].filter((s) => s.name);

  if (stops.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {stops.slice(0, 4).map((s, i) => (
        <span
          key={`${s.name}-${i}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            light ? "bg-white/15 text-white" : "bg-muted text-muted-foreground",
          )}
        >
          <MapPin className={cn("h-3 w-3", light ? "text-white" : "text-primary")} />
          {s.name}
          {s.time && <span className={cn("font-semibold", light ? "text-white" : "text-foreground")}>{s.time}</span>}
        </span>
      ))}
    </div>
  );
};

const FeaturedCard = ({ trip, onClick }: { trip: WeekendTrip; onClick: () => void }) => (
  <motion.article
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className="group grid cursor-pointer overflow-hidden rounded-[2rem] border border-border bg-card shadow-lg transition-shadow hover:shadow-2xl lg:grid-cols-2"
  >
    <div className="relative min-h-[300px]">
      <img
        src={trip.hero_image_url || trip.image_url || weekendHero}
        alt={`Wochenendtrip nach ${trip.destination}`}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent lg:bg-gradient-to-r" />
      <div className="absolute bottom-5 left-5">
        <Badge className="border-0 bg-primary text-primary-foreground">
          <Sparkles className="mr-1 h-3 w-3" /> Unser Tipp
        </Badge>
      </div>
    </div>
    <div className="space-y-5 p-7 lg:p-10">
      <div>
        <p className="text-sm font-medium text-primary">{trip.country}</p>
        <h2 className="text-3xl font-bold text-foreground lg:text-4xl">{trip.destination}</h2>
      </div>
      {trip.short_description && <p className="text-muted-foreground">{trip.short_description}</p>}
      <StopStrip trip={trip} />
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {trip.duration && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" />{trip.duration}</span>}
        <span className="inline-flex items-center gap-1.5"><Bus className="h-4 w-4 text-primary" />ab {trip.departure_city}</span>
        {trip.accommodation_available && (
          <span className="inline-flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-primary" />Unterkunft optional</span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        <div>
          <span className="block text-xs uppercase text-muted-foreground">Nur Fahrt ab</span>
          <span className="text-3xl font-bold text-primary">{formatEuro(Number(trip.base_price))}</span>
          {trip.accommodation_available && Number(trip.price_double_room) > 0 && (
            <span className="block text-xs text-muted-foreground">
              mit Übernachtung ab {formatEuro(Number(trip.base_price) + Number(trip.price_double_room))}
            </span>
          )}
        </div>
        <Button size="lg">
          Wochenende ansehen
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  </motion.article>
);

export default WeekendTripsPage;
