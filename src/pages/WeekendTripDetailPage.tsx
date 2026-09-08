import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Loader2, MapPin, Calendar, Clock, Bus, ArrowRight, Check, X,
  Wifi, Plug, Armchair, Minus, Plus, Ruler, Sparkles, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/seo/SEO";
import { breadcrumbJsonLd, weekendTripJsonLd } from "@/lib/seo";
import ShareButton from "@/components/common/ShareButton";
import { cn } from "@/lib/utils";
import { BoardingTimeline, StayOptions, WeekendStop, StayChoice, formatEuro } from "@/components/weekend/WeekendPieces";
import TourSurroundingsSection from "@/components/tours/TourSurroundingsSection";

interface BookableDeparture {
  id: string;
  departure_date: string;
  departure_time: string;
  originStopId: string;
  destinationStopId: string;
}

interface WeekendTrip {
  id: string;
  destination: string;
  slug: string;
  country: string;
  image_url: string | null;
  hero_image_url: string | null;
  gallery_images: string[];
  short_description: string | null;
  full_description: string | null;
  highlights: string[];
  inclusions: string[];
  not_included: string[];
  duration: string | null;
  distance: string | null;
  base_price: number;
  route_id: string | null;
  departure_city: string;
  departure_point: string | null;
  departure_time: string | null;
  return_info: string | null;
  via_stops: WeekendStop[];
  accommodation_available: boolean;
  accommodation_nights: number | null;
  hotel_name: string | null;
  hotel_stars: number | null;
  hotel_description: string | null;
  price_double_room: number;
  price_single_room: number;
  layout_variant: "classic" | "editorial" | "bold" | string;
  is_active: boolean;
}

const WeekendTripDetailPage = () => {
  const { destination } = useParams<{ destination: string }>();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState(2);
  const [selectedStopIndex, setSelectedStopIndex] = useState(-1);
  const [stay, setStay] = useState<StayChoice>("none");

  const { data: trip, isLoading } = useQuery({
    queryKey: ["weekend-trip-detail", destination],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("weekend_trips")
        .select("*")
        .ilike("slug", destination)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data as WeekendTrip;
    },
    enabled: !!destination,
  });

  const { data: bookableDeparture, isLoading: isLoadingDeparture } = useQuery({
    queryKey: ["weekend-trip-departure", trip?.route_id, selectedStopIndex],
    queryFn: async () => {
      if (!trip?.route_id) return null;
      const today = new Date().toISOString().slice(0, 10);
      const [{ data: departures, error: departureError }, { data: stops, error: stopsError }] = await Promise.all([
        supabase.from("trips").select("id, departure_date, departure_time")
          .eq("route_id", trip.route_id).eq("is_active", true)
          .gte("departure_date", today).order("departure_date").order("departure_time").limit(1),
        supabase.from("stops").select("id, city, stop_order").eq("route_id", trip.route_id).order("stop_order"),
      ]);
      if (departureError) throw departureError;
      if (stopsError) throw stopsError;
      if (!departures?.[0] || !stops || stops.length < 2) return null;

      const selectedCity = selectedStopIndex >= 0 ? trip.via_stops?.[selectedStopIndex]?.city : trip.departure_city;
      const origin = stops.find((s) => s.city.toLocaleLowerCase("de") === selectedCity?.toLocaleLowerCase("de")) || stops[0];
      const destinationStop = stops[stops.length - 1];
      if (!origin || !destinationStop || origin.stop_order >= destinationStop.stop_order) return null;
      return { ...departures[0], originStopId: origin.id, destinationStopId: destinationStop.id } as BookableDeparture;
    },
    enabled: Boolean(trip?.route_id),
  });

  const viaStops: WeekendStop[] = trip?.via_stops || [];
  const heroImage = trip?.hero_image_url || trip?.image_url || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80";
  const variant = trip?.layout_variant || "classic";

  const stopSurcharge = selectedStopIndex >= 0 ? Number(viaStops[selectedStopIndex]?.surcharge || 0) : 0;
  const stayExtra = stay === "double" ? Number(trip?.price_double_room || 0) : stay === "single" ? Number(trip?.price_single_room || 0) : 0;
  const pricePerPerson = Number(trip?.base_price || 0) + stopSurcharge + stayExtra;
  const totalPrice = pricePerPerson * participants;

  const selectedBoarding = useMemo(() => {
    if (!trip) return null;
    if (selectedStopIndex >= 0) return viaStops[selectedStopIndex] || null;
    return {
      city: trip.departure_city,
      name: trip.departure_point || trip.departure_city,
      surcharge: 0,
      departure_time: trip.departure_time,
    } as WeekendStop;
  }, [trip, selectedStopIndex, viaStops]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-2xl font-bold mb-4">Wochenendtrip nicht gefunden</h1>
          <Button onClick={() => navigate("/wochenendtrips")} variant="outline">Zurück zur Übersicht</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const heroTone =
    variant === "bold"
      ? "from-black via-black/60 to-transparent"
      : variant === "editorial"
        ? "from-background via-background/40 to-transparent"
        : "from-black/85 via-black/35 to-transparent";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`Wochenendtrip ${trip.destination} ab ${trip.departure_city} | Metropol Tours`}
        description={trip.short_description || `Wochenendtrip nach ${trip.destination} ab ${trip.base_price} € – Busfahrt, optional mit Unterkunft.`}
        path={`/wochenendtrips/${trip.slug}`}
        image={heroImage}
        jsonLd={[
          weekendTripJsonLd({
            destination: trip.destination,
            country: trip.country,
            departureCity: trip.departure_city,
            slug: trip.slug,
            description: trip.short_description || `Wochenendtrip nach ${trip.destination}`,
            image: heroImage,
            price: Number(trip.base_price || 0),
            isBookable: true,
          }),
          breadcrumbJsonLd([
            { name: "Start", path: "/" },
            { name: "Wochenendtrips", path: "/wochenendtrips" },
            { name: trip.destination, path: `/wochenendtrips/${trip.slug}` },
          ]),
        ]}
      />
      <Header />

      <main>
        {/* HERO */}
        <section className={cn("relative", variant === "editorial" ? "h-[62vh] min-h-[440px]" : "h-[78vh] min-h-[520px]")}>
          <img src={heroImage} alt={`Wochenendtrip nach ${trip.destination}`} className="absolute inset-0 h-full w-full object-cover" />
          <div className={cn("absolute inset-0 bg-gradient-to-t", heroTone)} />
          <div className="container relative mx-auto flex h-full flex-col justify-end px-4 pb-12">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
              <nav className="mb-4 flex items-center gap-2 text-sm text-white/70">
                <Link to="/" className="hover:text-white">Start</Link>
                <ChevronRight className="h-3 w-3" />
                <Link to="/wochenendtrips" className="hover:text-white">Wochenendtrips</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-white">{trip.destination}</span>
              </nav>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-primary text-primary-foreground">
                  <Bus className="mr-1 h-3 w-3" /> Wochenendtrip
                </Badge>
                {trip.accommodation_available && (
                  <Badge variant="secondary" className="border-0 bg-white/15 text-white backdrop-blur">
                    <Sparkles className="mr-1 h-3 w-3" /> Optional mit Unterkunft
                  </Badge>
                )}
                <Badge variant="secondary" className="border-0 bg-white/15 text-white backdrop-blur">
                  <MapPin className="mr-1 h-3 w-3" /> {trip.country}
                </Badge>
              </div>

              <h1
                className={cn(
                  "text-white",
                  variant === "editorial"
                    ? "text-5xl font-light tracking-tight md:text-7xl"
                    : variant === "bold"
                      ? "text-5xl font-black uppercase tracking-tighter md:text-8xl"
                      : "text-4xl font-bold md:text-6xl",
                )}
              >
                {trip.destination}
              </h1>
              {trip.short_description && (
                <p className="mt-4 max-w-2xl text-lg text-white/85">{trip.short_description}</p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-4 text-white/85">
                {trip.duration && <span className="inline-flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-primary" />{trip.duration} Fahrt</span>}
                {trip.distance && <span className="inline-flex items-center gap-2 text-sm"><Ruler className="h-4 w-4 text-primary" />{trip.distance}</span>}
                <span className="inline-flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-primary" />ab {trip.departure_city}</span>
                <ShareButton title={`Wochenendtrip ${trip.destination}`} />
              </div>
            </motion.div>
          </div>
        </section>

        {/* CONTENT */}
        <section className="container mx-auto px-4 py-12 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
            <div className="space-y-12">
              {/* Auf einen Blick */}
              <div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">Auf einen Blick</h2>
                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    { icon: MapPin, label: "Ziel", value: `${trip.destination}${trip.country ? `, ${trip.country}` : ""}` },
                    { icon: Bus, label: "Abfahrt ab", value: trip.departure_point || trip.departure_city },
                    { icon: Clock, label: "Abfahrtszeit", value: trip.departure_time ? `${trip.departure_time} Uhr` : "wird bekannt gegeben" },
                    { icon: Ruler, label: "Fahrtzeit", value: trip.duration || trip.distance || "ca. 1 Nacht" },
                    { icon: Calendar, label: "Übernachtungen", value: trip.accommodation_available ? `${trip.accommodation_nights || 1} optional` : "Nur Fahrt" },
                    { icon: Sparkles, label: "Unterkunft", value: trip.accommodation_available ? (trip.hotel_name || "Hotel optional buchbar") : "nicht enthalten" },
                    { icon: Check, label: "Zustiege", value: `${viaStops.length + 1} Orte` },
                    { icon: ArrowRight, label: "Rückfahrt", value: trip.return_info || "siehe Fahrplan" },
                  ].map((f) => (
                    <div key={f.label} className="rounded-2xl border border-border bg-card p-4">
                      <f.icon className="mb-2 h-4 w-4 text-primary" />
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{f.label}</p>
                      <p className="mt-1 text-sm font-semibold text-foreground line-clamp-2">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Beschreibung */}
              {(trip.full_description || trip.short_description || trip.highlights?.length > 0) && (
                <div className={cn(variant === "editorial" && "border-l-2 border-primary/40 pl-6")}>
                  <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                    {variant === "bold" ? "Darum lohnt sich das Wochenende" : `Ihr Wochenende in ${trip.destination}`}
                  </h2>
                  {(trip.full_description || trip.short_description) && (
                    <p className="mt-4 whitespace-pre-line text-muted-foreground leading-relaxed">
                      {trip.full_description || trip.short_description}
                    </p>
                  )}
                  {trip.highlights?.length > 0 ? (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {trip.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {i + 1}
                          </span>
                          <span className="text-sm text-foreground">{h}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {[
                        { icon: Bus, title: "Direkt ab " + trip.departure_city, text: trip.departure_point ? `Zustieg: ${trip.departure_point}` : "Bequemer Zustieg im Komfortbus" },
                        { icon: Clock, title: "Fahrtzeit", text: trip.duration ? `${trip.duration} Fahrt` : "Nachtfahrt – Sie kommen ausgeruht an" },
                        { icon: MapPin, title: `Ziel: ${trip.destination}`, text: trip.country || "Städtetrip in Europa" },
                        { icon: Sparkles, title: trip.accommodation_available ? "Unterkunft optional" : "Nur Fahrt buchbar", text: trip.accommodation_available ? "Hotel bequem dazubuchen" : "Unterkunft wählen Sie selbst" },
                      ].map((f) => (
                        <div key={f.title} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <f.icon className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-foreground">{f.title}</span>
                            <span className="block text-sm text-muted-foreground">{f.text}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}



              {/* Zustieg & Abfahrtszeiten */}
              <div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">Zustieg & Abfahrtszeiten</h2>
                <p className="mt-2 text-muted-foreground">
                  Wählen Sie Ihren Zustiegsort – der Preis passt sich automatisch an.
                </p>
                <div className="mt-6">
                  <BoardingTimeline
                    departureCity={trip.departure_city}
                    departurePoint={trip.departure_point}
                    departureTime={trip.departure_time}
                    destination={trip.destination}
                    stops={viaStops}
                    selectedIndex={selectedStopIndex}
                    onSelect={setSelectedStopIndex}
                    returnInfo={trip.return_info}
                  />
                </div>
              </div>

              {/* Reiseart */}
              {trip.accommodation_available && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground md:text-3xl">Nur Fahrt oder mit Unterkunft?</h2>
                  <p className="mt-2 text-muted-foreground">
                    Die Busfahrt ist der Basispreis. Eine Übernachtung buchen Sie optional dazu.
                  </p>
                  <div className="mt-6">
                    <StayOptions
                      basePrice={Number(trip.base_price) + stopSurcharge}
                      doubleSurcharge={Number(trip.price_double_room || 0)}
                      singleSurcharge={Number(trip.price_single_room || 0)}
                      nights={trip.accommodation_nights}
                      hotelName={trip.hotel_name}
                      hotelStars={trip.hotel_stars}
                      hotelDescription={trip.hotel_description}
                      value={stay}
                      onChange={setStay}
                    />
                  </div>
                </div>
              )}

              {/* Leistungen */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-border bg-card p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
                    <Check className="h-4 w-4 text-primary" /> Inklusive
                  </h3>
                  <ul className="space-y-2.5">
                    {(trip.inclusions || []).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-border bg-muted/40 p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
                    <X className="h-4 w-4 text-muted-foreground" /> Nicht inklusive
                  </h3>
                  <ul className="space-y-2.5">
                    {(trip.not_included || []).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Komfort */}
              <div className="grid grid-cols-3 gap-4">
                {[{ icon: Wifi, label: "Kostenloses WLAN" }, { icon: Plug, label: "Steckdose am Platz" }, { icon: Armchair, label: "Komfortsitze" }].map((f) => (
                  <div key={f.label} className="rounded-2xl border border-border bg-card p-4 text-center">
                    <f.icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
                  </div>
                ))}
              </div>

              {/* Galerie */}
              {trip.gallery_images?.length > 0 && (
                <div className={cn("grid gap-4", variant === "editorial" ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
                  {trip.gallery_images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`${trip.destination} Impression ${i + 1}`}
                      loading="lazy"
                      className={cn("w-full rounded-2xl object-cover", variant === "editorial" && i === 0 ? "sm:col-span-2 aspect-[16/10]" : "aspect-[4/3]")}
                    />
                  ))}
                </div>
              )}

              {/* Was ist in der Nähe */}
              <TourSurroundingsSection
                destination={trip.destination}
                location={trip.destination}
                country={trip.country}
                hotelName={trip.hotel_name}
              />

            </div>

            {/* BUCHUNGS-SIDEBAR */}
            <div>
              <Card className="sticky top-24 overflow-hidden rounded-3xl border-border shadow-xl">
                <div className="bg-primary/10 px-6 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Ihr Preis</p>
                  <div className="mt-1 flex items-end gap-2">
                    <span className="text-4xl font-bold text-foreground">{formatEuro(pricePerPerson)}</span>
                    <span className="pb-1 text-sm text-muted-foreground">pro Person</span>
                  </div>
                </div>
                <CardContent className="space-y-5 p-6">
                  <div className="space-y-2 text-sm">
                    <Row label="Zustieg" value={selectedBoarding?.name || trip.departure_city} />
                    {selectedBoarding?.departure_time && <Row label="Abfahrt" value={`${selectedBoarding.departure_time} Uhr`} />}
                    <Row
                      label="Reiseart"
                      value={stay === "none" ? "Nur Busfahrt" : stay === "double" ? "Fahrt + Doppelzimmer" : "Fahrt + Einzelzimmer"}
                    />
                    {bookableDeparture && (
                      <Row
                        label="Nächster Termin"
                        value={new Date(bookableDeparture.departure_date).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
                      />
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Personen</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setParticipants(Math.max(1, participants - 1))} disabled={participants <= 1}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-bold">{participants}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setParticipants(Math.min(10, participants + 1))} disabled={participants >= 10}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-muted/60 p-4">
                    <div className="flex items-end justify-between">
                      <span className="text-sm text-muted-foreground">Gesamt ({participants} Pers.)</span>
                      <span className="text-2xl font-bold text-primary">{formatEuro(totalPrice)}</span>
                    </div>
                    {stopSurcharge !== 0 && (
                      <p className="mt-2 text-xs font-medium text-primary">
                        {stopSurcharge < 0 ? `${formatEuro(Math.abs(stopSurcharge))} Rabatt durch Zustieg` : `+ ${formatEuro(stopSurcharge)} Zustieg`}
                      </p>
                    )}
                    {stayExtra > 0 && <p className="mt-1 text-xs text-muted-foreground">inkl. Unterkunft + {formatEuro(stayExtra)} p. P.</p>}
                  </div>

                  <Button
                    size="lg"
                    className="w-full py-6 text-lg font-bold shadow-lg"
                    disabled={isLoadingDeparture || !bookableDeparture}
                    onClick={() => {
                      if (!bookableDeparture) return;
                      const params = new URLSearchParams({
                        tripId: bookableDeparture.id,
                        fromStopId: bookableDeparture.originStopId,
                        toStopId: bookableDeparture.destinationStopId,
                        passengers: participants.toString(),
                        unterkunft: stay,
                      });
                      navigate(`/checkout?${params.toString()}`);
                    }}
                  >
                    {isLoadingDeparture ? "Termin wird geprüft…" : bookableDeparture ? "Jetzt buchen" : "Derzeit kein Termin buchbar"}
                    {bookableDeparture && !isLoadingDeparture && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>

                  {stay !== "none" && (
                    <p className="text-center text-xs text-muted-foreground">
                      Die Unterkunft wird nach der Buchung von uns bestätigt.
                    </p>
                  )}
                  <p className="text-center text-xs text-muted-foreground">Sichere Zahlung · Sitzplatzgarantie</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium text-foreground">{value}</span>
  </div>
);

export default WeekendTripDetailPage;
