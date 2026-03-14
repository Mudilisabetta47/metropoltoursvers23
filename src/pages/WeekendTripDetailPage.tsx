import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Loader2, ChevronLeft, ChevronRight, MapPin, Share2, Heart,
  Calendar, Clock, Users, Bus, ArrowRight, Star, Wifi, Plug,
  Armchair, Check, X, TrendingUp, Minus, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";

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

const DESTINATION_META: Record<string, {
  image: string;
  highlights: string[];
  duration: string;
  distance: string;
  fullDescription: string;
  inclusions: string[];
  notIncluded: string[];
}> = {
  Kopenhagen: {
    image: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=1200&q=80",
    highlights: ["Nyhavn", "Tivoli", "Meerjungfrau", "Christiania"],
    duration: "7,5 Std.", distance: "586 km",
    fullDescription: "Entdecken Sie die charmante dänische Hauptstadt mit ihren bunten Giebelhäusern am Nyhavn, dem weltberühmten Vergnügungspark Tivoli und der ikonischen kleinen Meerjungfrau. Kopenhagen verbindet skandinavisches Design, kulinarische Exzellenz und maritime Geschichte zu einem unvergesslichen Wochenenderlebnis.",
    inclusions: ["Hin- und Rückfahrt im Komfortbus", "Kostenloses WLAN an Bord", "Steckdosen am Sitzplatz", "Erfahrener Busfahrer", "Stadtplan & Infomaterial"],
    notIncluded: ["Übernachtung", "Verpflegung", "Eintritte & Führungen"],
  },
  Amsterdam: {
    image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=80",
    highlights: ["Grachten", "Van Gogh Museum", "Anne Frank Haus", "Jordaan"],
    duration: "6,5 Std.", distance: "625 km",
    fullDescription: "Amsterdam verzaubert mit seinen malerischen Grachten, weltberühmten Museen und liberaler Atmosphäre. Schlendern Sie durch das charmante Jordaan-Viertel, besuchen Sie das Van Gogh Museum oder erleben Sie die bewegende Geschichte im Anne Frank Haus.",
    inclusions: ["Hin- und Rückfahrt im Komfortbus", "Kostenloses WLAN an Bord", "Steckdosen am Sitzplatz", "Erfahrener Busfahrer", "Stadtplan & Infomaterial"],
    notIncluded: ["Übernachtung", "Verpflegung", "Eintritte & Führungen"],
  },
  Paris: {
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
    highlights: ["Eiffelturm", "Louvre", "Champs-Élysées", "Montmartre"],
    duration: "10 Std.", distance: "1.023 km",
    fullDescription: "Die Stadt der Liebe erwartet Sie! Paris bietet weltberühmte Sehenswürdigkeiten wie den Eiffelturm, den Louvre und Notre-Dame. Flanieren Sie über die Champs-Élysées, entdecken Sie das Künstlerviertel Montmartre und genießen Sie französische Lebensart.",
    inclusions: ["Hin- und Rückfahrt im Komfortbus", "Kostenloses WLAN an Bord", "Steckdosen am Sitzplatz", "Erfahrener Busfahrer", "Stadtplan & Infomaterial"],
    notIncluded: ["Übernachtung", "Verpflegung", "Eintritte & Führungen"],
  },
  Rom: {
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80",
    highlights: ["Kolosseum", "Vatikan", "Trevi-Brunnen", "Forum Romanum"],
    duration: "17 Std.", distance: "1.765 km",
    fullDescription: "Die ewige Stadt Rom ist ein lebendiges Freilichtmuseum. Erleben Sie antike Geschichte am Kolosseum und Forum Romanum, werfen Sie eine Münze in den Trevi-Brunnen und bestaunen Sie die Kunstschätze des Vatikans mit der Sixtinischen Kapelle.",
    inclusions: ["Hin- und Rückfahrt im Komfortbus", "Kostenloses WLAN an Bord", "Steckdosen am Sitzplatz", "Erfahrener Busfahrer", "Nachtfahrt mit Schlafmöglichkeit", "Stadtplan & Infomaterial"],
    notIncluded: ["Übernachtung", "Verpflegung", "Eintritte & Führungen"],
  },
  Prag: {
    image: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=1200&q=80",
    highlights: ["Karlsbrücke", "Prager Burg", "Altstadt", "Hradschin"],
    duration: "8 Std.", distance: "758 km",
    fullDescription: "Die goldene Stadt Prag bezaubert mit ihrer mittelalterlichen Altstadt, der majestätischen Prager Burg und der berühmten Karlsbrücke. Genießen Sie böhmische Küche, erkunden Sie verwinkelte Gassen und erleben Sie das pulsierende Nachtleben.",
    inclusions: ["Hin- und Rückfahrt im Komfortbus", "Kostenloses WLAN an Bord", "Steckdosen am Sitzplatz", "Erfahrener Busfahrer", "Stadtplan & Infomaterial"],
    notIncluded: ["Übernachtung", "Verpflegung", "Eintritte & Führungen"],
  },
  Wien: {
    image: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200&q=80",
    highlights: ["Schönbrunn", "Stephansdom", "Prater", "Hofburg"],
    duration: "11 Std.", distance: "1.081 km",
    fullDescription: "Wien vereint kaiserliche Pracht mit modernem Lebensgefühl. Besichtigen Sie das Schloss Schönbrunn, den imposanten Stephansdom und die Hofburg. Genießen Sie Wiener Kaffeehauskultur, Sachertorte und vielleicht einen Abend in der Staatsoper.",
    inclusions: ["Hin- und Rückfahrt im Komfortbus", "Kostenloses WLAN an Bord", "Steckdosen am Sitzplatz", "Erfahrener Busfahrer", "Stadtplan & Infomaterial"],
    notIncluded: ["Übernachtung", "Verpflegung", "Eintritte & Führungen"],
  },
  Barcelona: {
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=80",
    highlights: ["Sagrada Familia", "Park Güell", "La Rambla", "Strand"],
    duration: "17,5 Std.", distance: "1.904 km",
    fullDescription: "Barcelona begeistert mit Gaudís fantastischer Architektur, mediterranem Flair und lebhafter Kultur. Bestaunen Sie die Sagrada Familia, schlendern Sie über La Rambla und entspannen Sie an den Stränden der Barceloneta.",
    inclusions: ["Hin- und Rückfahrt im Komfortbus", "Kostenloses WLAN an Bord", "Steckdosen am Sitzplatz", "Erfahrener Busfahrer", "Nachtfahrt mit Schlafmöglichkeit", "Stadtplan & Infomaterial"],
    notIncluded: ["Übernachtung", "Verpflegung", "Eintritte & Führungen"],
  },
};

const WeekendTripDetailPage = () => {
  const { destination } = useParams<{ destination: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("leistungen");
  const [participants, setParticipants] = useState(2);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);

  const { data: route, isLoading: routeLoading } = useQuery({
    queryKey: ["weekend-route", destination],
    queryFn: async () => {
      const { data, error } = await supabase.from("routes").select("*").ilike("name", `Hamburg - ${destination}`).single();
      if (error) throw error;
      return data as Route;
    },
    enabled: !!destination,
  });

  const { data: stops } = useQuery({
    queryKey: ["route-stops", route?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("stops").select("*").eq("route_id", route!.id).order("stop_order");
      if (error) throw error;
      return data as Stop[];
    },
    enabled: !!route?.id,
  });

  useEffect(() => {
    if (stops && stops.length > 0 && !selectedStop) setSelectedStop(stops[0]);
  }, [stops, selectedStop]);

  const meta = destination ? DESTINATION_META[destination] : null;

  const getPrice = () => {
    if (!route) return 0;
    const stopSurcharge = selectedStop?.price_from_start || 0;
    const occupancyFactor = 1.15;
    return Math.round((route.base_price - stopSurcharge) * occupancyFactor);
  };

  const pricePerPerson = getPrice();
  const totalPrice = pricePerPerson * participants;

  const tabs = [
    { id: "leistungen", label: "Leistungen" },
    { id: "route", label: "Route & Zustiege" },
    { id: "infos", label: "Wichtige Infos" },
  ];

  if (routeLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!route || !meta) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-2xl font-bold mb-4">Ziel nicht gefunden</h1>
            <p className="text-muted-foreground mb-6">Dieses Wochenendtrip-Ziel ist leider nicht verfügbar.</p>
            <Button onClick={() => navigate("/wochenendtrips")} variant="outline">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Zurück zur Übersicht
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-16 lg:pt-20">
        {/* Hero */}
        <section className="relative">
          <div className="relative h-[50vh] lg:h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden">
            <img src={meta.image} alt={destination} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

            {/* Breadcrumb */}
            <div className="absolute top-0 left-0 right-0 pt-4">
              <div className="container mx-auto px-4">
                <nav className="flex items-center gap-2 text-sm text-white/80">
                  <Link to="/" className="hover:text-white transition-colors font-medium">METROPOL TOURS</Link>
                  <ChevronRight className="w-4 h-4" />
                  <Link to="/wochenendtrips" className="hover:text-white transition-colors">Wochenendtrips</Link>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-white">{destination}</span>
                </nav>
              </div>
            </div>

            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute bottom-0 left-0 right-0 pb-8"
            >
              <div className="container mx-auto px-4">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className="bg-accent text-accent-foreground shadow-lg">
                      <Calendar className="w-3 h-3 mr-1" />
                      Wochenendtrip
                    </Badge>
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                    {destination}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-white/90 mb-4">
                    <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /><span>{meta.distance}</span></div>
                    <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /><span>Fahrzeit: {meta.duration}</span></div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                      <span className="ml-1 text-sm">(4.7)</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mb-5">
                    {[
                      { icon: Bus, label: "Komfortbus inkl." },
                      { icon: Wifi, label: "WLAN an Bord" },
                      { icon: Plug, label: "Steckdosen" },
                    ].map((p) => (
                      <div key={p.label} className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                        <p.icon className="w-4 h-4" /><span>{p.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="inline-flex items-end gap-2 bg-card/95 backdrop-blur rounded-xl px-5 py-3 shadow-xl">
                    <span className="text-muted-foreground text-sm">ab</span>
                    <span className="text-3xl font-bold text-primary">{route.base_price}€</span>
                    <span className="text-muted-foreground text-sm pb-1">pro Person</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Button variant="secondary" size="sm" className="bg-card/90 backdrop-blur hover:bg-card shadow-lg gap-2">
                <Share2 className="w-4 h-4" /><span className="hidden sm:inline">Teilen</span>
              </Button>
              <Button variant="secondary" size="sm" className="bg-card/90 backdrop-blur hover:bg-card shadow-lg gap-2">
                <Heart className="w-4 h-4" /><span className="hidden sm:inline">Merken</span>
              </Button>
            </div>
          </div>

          {/* Description Bar */}
          <div className="bg-muted/50 border-b border-border">
            <div className="container mx-auto px-4 py-4">
              <p className="text-muted-foreground max-w-3xl">{meta.fullDescription}</p>
            </div>
          </div>
        </section>

        {/* Tab Nav */}
        <nav className="sticky top-16 lg:top-20 z-40 bg-card border-b border-border" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 overflow-x-auto py-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                      activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                  </button>
                ))}
              </div>
              <div className="hidden md:flex items-center gap-3 pl-4 border-l border-border">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-muted-foreground">Dynamische Preise</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Card className="border border-border rounded-2xl">
                  <CardContent className="p-6">
                    <p className="text-muted-foreground leading-relaxed">{meta.fullDescription}</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Tab: Leistungen */}
              {activeTab === "leistungen" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <Card className="border border-border rounded-2xl">
                    <CardHeader className="pb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                        Inklusive Leistungen
                      </h3>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {meta.inclusions.map((item) => (
                          <div key={item} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5">
                            <Check className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-border rounded-2xl">
                    <CardHeader className="pb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <X className="w-4 h-4 text-muted-foreground" />
                        </div>
                        Nicht enthalten
                      </h3>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {meta.notIncluded.map((item) => (
                          <div key={item} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                            <X className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-sm text-muted-foreground">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-primary/20 rounded-2xl bg-primary/5">
                    <CardContent className="p-6">
                      <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Bus className="w-5 h-5 text-primary" />
                        Reisekomfort
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { icon: Wifi, label: "WLAN" },
                          { icon: Plug, label: "Steckdosen" },
                          { icon: Armchair, label: "Komfortsitze" },
                          { icon: Users, label: "45 Plätze" },
                        ].map((c) => (
                          <div key={c.label} className="flex items-center gap-2">
                            <c.icon className="w-5 h-5 text-primary" />
                            <span className="text-sm">{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Tab: Route */}
              {activeTab === "route" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <Card className="border border-border rounded-2xl">
                    <CardHeader className="pb-4">
                      <h3 className="text-lg font-bold">Route & Zustiege</h3>
                      <p className="text-sm text-muted-foreground">Wählen Sie Ihren Zustiegsort. Je später der Einstieg, desto günstiger!</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {stops?.map((stop, idx) => {
                          const isLast = idx === (stops?.length || 1) - 1;
                          return (
                            <div
                              key={stop.id}
                              onClick={() => !isLast && setSelectedStop(stop)}
                              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                                isLast ? "bg-primary/10 border-primary/30 cursor-default"
                                : selectedStop?.id === stop.id ? "border-primary bg-primary/5 cursor-pointer"
                                : "border-border hover:border-primary/50 cursor-pointer"
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  selectedStop?.id === stop.id ? "border-primary" : "border-muted-foreground/50"
                                }`}>
                                  {selectedStop?.id === stop.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                                <div>
                                  <p className={`font-medium ${isLast ? "text-primary" : ""}`}>{stop.name}</p>
                                  <p className="text-sm text-muted-foreground">{stop.city}</p>
                                </div>
                              </div>
                              {!isLast && stop.price_from_start > 0 && (
                                <Badge variant="secondary" className="bg-primary/10 text-primary">-{stop.price_from_start}€ Rabatt</Badge>
                              )}
                              {isLast && <Badge className="bg-primary border-0">Ziel</Badge>}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-border rounded-2xl">
                    <CardContent className="p-6">
                      <h4 className="font-bold mb-4">Streckenverlauf</h4>
                      <div className="flex items-center justify-between">
                        {stops?.map((stop, idx) => (
                          <div key={stop.id} className="flex items-center">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                idx === 0 ? "bg-primary text-primary-foreground"
                                : idx === (stops?.length || 1) - 1 ? "bg-accent text-accent-foreground"
                                : "bg-muted"
                              }`}>
                                {idx === 0 ? <Bus className="w-4 h-4" /> :
                                 idx === (stops?.length || 1) - 1 ? <MapPin className="w-4 h-4" /> :
                                 <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
                              </div>
                              <span className="text-xs mt-2 text-center font-medium">{stop.city}</span>
                            </div>
                            {idx < (stops?.length || 1) - 1 && <ArrowRight className="w-6 h-6 mx-2 text-muted-foreground/30" />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Tab: Infos */}
              {activeTab === "infos" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="border border-border rounded-2xl">
                    <CardHeader>
                      <h3 className="text-lg font-bold">Wichtige Informationen</h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { title: "Reisedokumente", text: "Für diese Reise benötigen Sie einen gültigen Personalausweis oder Reisepass." },
                        { title: "Stornierung", text: "Kostenlose Stornierung bis 7 Tage vor Abfahrt. Danach fallen Stornogebühren an." },
                        { title: "Gepäck", text: "1 Handgepäckstück (max. 8kg) ist inklusive. Zusätzliches Gepäck kann gegen Aufpreis mitgenommen werden." },
                        { title: "Dynamische Preisgestaltung", text: "Unsere Preise passen sich der Nachfrage an. Je früher Sie buchen und je höher Ihr Einstiegsort, desto günstiger wird Ihre Fahrt." },
                      ].map((info, i) => (
                        <div key={info.title}>
                          {i > 0 && <Separator className="mb-4" />}
                          <h4 className="font-bold mb-2">{info.title}</h4>
                          <p className="text-sm text-muted-foreground">{info.text}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-[calc(theme(spacing.20)+theme(spacing.16))] lg:top-[calc(theme(spacing.20)+theme(spacing.20))]">
                <Card className="border-2 border-primary/20 rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-elevated)" }}>
                  <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10 border-b border-border pb-4">
                    <h3 className="text-lg font-bold text-foreground">Dein Angebot:</h3>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-bold text-foreground">{destination}</p>
                        <p className="text-sm text-muted-foreground">Wochenendtrip ab Hamburg</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Bus className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-bold text-foreground">Zustieg: {selectedStop?.city || "Hamburg"}</p>
                        <p className="text-sm text-muted-foreground">{selectedStop?.name || "ZOB Hamburg"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <p className="text-sm text-foreground">Fahrzeit: {meta.duration}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{participants} Personen</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setParticipants(Math.max(1, participants - 1))} disabled={participants <= 1}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-bold">{participants}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setParticipants(Math.min(10, participants + 1))} disabled={participants >= 10}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="bg-muted/50 rounded-xl p-4">
                      <div className="flex items-end justify-between mb-1">
                        <span className="text-sm text-muted-foreground">pro Person</span>
                        <span className="text-3xl font-bold text-primary">{pricePerPerson} €</span>
                      </div>
                      {participants > 1 && (
                        <div className="flex items-end justify-between">
                          <span className="text-sm text-muted-foreground">Gesamtpreis ({participants} Pers.)</span>
                          <span className="text-lg font-bold text-foreground">{totalPrice} €</span>
                        </div>
                      )}
                      {selectedStop && selectedStop.price_from_start > 0 && (
                        <div className="mt-2 text-xs text-primary font-medium">
                          ✓ {selectedStop.price_from_start}€ Rabatt durch Zustieg in {selectedStop.city}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-accent bg-accent/10 p-3 rounded-xl">
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      <span>Preis kann sich je nach Auslastung ändern</span>
                    </div>

                    <Button
                      size="lg"
                      className="w-full text-lg font-bold py-6 shadow-lg"
                      onClick={() => {
                        const params = new URLSearchParams({
                          routeId: route.id,
                          from: selectedStop?.city || "Hamburg",
                          to: destination || "",
                          passengers: participants.toString(),
                        });
                        navigate(`/checkout?${params.toString()}`);
                      }}
                    >
                      Jetzt buchen
                    </Button>

                    <div className="text-center text-xs text-muted-foreground">
                      <p>✓ Sichere Zahlung • ✓ Kostenlose Stornierung</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WeekendTripDetailPage;
