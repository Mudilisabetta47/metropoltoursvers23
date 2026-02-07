import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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

// Destination metadata for images and info
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
    duration: "7,5 Std.",
    distance: "586 km",
    fullDescription: "Entdecken Sie die charmante dänische Hauptstadt mit ihren bunten Giebelhäusern am Nyhavn, dem weltberühmten Vergnügungspark Tivoli und der ikonischen kleinen Meerjungfrau. Kopenhagen verbindet skandinavisches Design, kulinarische Exzellenz und maritime Geschichte zu einem unvergesslichen Wochenenderlebnis.",
    inclusions: ["Hin- und Rückfahrt im Komfortbus", "Kostenloses WLAN an Bord", "Steckdosen am Sitzplatz", "Erfahrener Busfahrer", "Stadtplan & Infomaterial"],
    notIncluded: ["Übernachtung", "Verpflegung", "Eintritte & Führungen"],
  },
  Amsterdam: {
    image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=80",
    highlights: ["Grachten", "Van Gogh Museum", "Anne Frank Haus", "Jordaan"],
    duration: "6,5 Std.",
    distance: "625 km",
    fullDescription: "Amsterdam verzaubert mit seinen malerischen Grachten, weltberühmten Museen und liberaler Atmosphäre. Schlendern Sie durch das charmante Jordaan-Viertel, besuchen Sie das Van Gogh Museum oder erleben Sie die bewegende Geschichte im Anne Frank Haus.",
    inclusions: ["Hin- und Rückfahrt im Komfortbus", "Kostenloses WLAN an Bord", "Steckdosen am Sitzplatz", "Erfahrener Busfahrer", "Stadtplan & Infomaterial"],
    notIncluded: ["Übernachtung", "Verpflegung", "Eintritte & Führungen"],
  },
  Paris: {
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
    highlights: ["Eiffelturm", "Louvre", "Champs-Élysées", "Montmartre"],
    duration: "10 Std.",
    distance: "1.023 km",
    fullDescription: "Die Stadt der Liebe erwartet Sie! Paris bietet weltberühmte Sehenswürdigkeiten wie den Eiffelturm, den Louvre und Notre-Dame. Flanieren Sie über die Champs-Élysées, entdecken Sie das Künstlerviertel Montmartre und genießen Sie französische Lebensart.",
    inclusions: ["Hin- und Rückfahrt im Komfortbus", "Kostenloses WLAN an Bord", "Steckdosen am Sitzplatz", "Erfahrener Busfahrer", "Stadtplan & Infomaterial"],
    notIncluded: ["Übernachtung", "Verpflegung", "Eintritte & Führungen"],
  },
  Rom: {
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80",
    highlights: ["Kolosseum", "Vatikan", "Trevi-Brunnen", "Forum Romanum"],
    duration: "17 Std.",
    distance: "1.765 km",
    fullDescription: "Die ewige Stadt Rom ist ein lebendiges Freilichtmuseum. Erleben Sie antike Geschichte am Kolosseum und Forum Romanum, werfen Sie eine Münze in den Trevi-Brunnen und bestaunen Sie die Kunstschätze des Vatikans mit der Sixtinischen Kapelle.",
    inclusions: ["Hin- und Rückfahrt im Komfortbus", "Kostenloses WLAN an Bord", "Steckdosen am Sitzplatz", "Erfahrener Busfahrer", "Nachtfahrt mit Schlafmöglichkeit", "Stadtplan & Infomaterial"],
    notIncluded: ["Übernachtung", "Verpflegung", "Eintritte & Führungen"],
  },
  Prag: {
    image: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=1200&q=80",
    highlights: ["Karlsbrücke", "Prager Burg", "Altstadt", "Hradschin"],
    duration: "8 Std.",
    distance: "758 km",
    fullDescription: "Die goldene Stadt Prag bezaubert mit ihrer mittelalterlichen Altstadt, der majestätischen Prager Burg und der berühmten Karlsbrücke. Genießen Sie böhmische Küche, erkunden Sie verwinkelte Gassen und erleben Sie das pulsierende Nachtleben.",
    inclusions: ["Hin- und Rückfahrt im Komfortbus", "Kostenloses WLAN an Bord", "Steckdosen am Sitzplatz", "Erfahrener Busfahrer", "Stadtplan & Infomaterial"],
    notIncluded: ["Übernachtung", "Verpflegung", "Eintritte & Führungen"],
  },
  Wien: {
    image: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200&q=80",
    highlights: ["Schönbrunn", "Stephansdom", "Prater", "Hofburg"],
    duration: "11 Std.",
    distance: "1.081 km",
    fullDescription: "Wien vereint kaiserliche Pracht mit modernem Lebensgefühl. Besichtigen Sie das Schloss Schönbrunn, den imposanten Stephansdom und die Hofburg. Genießen Sie Wiener Kaffeehauskultur, Sachertorte und vielleicht einen Abend in der Staatsoper.",
    inclusions: ["Hin- und Rückfahrt im Komfortbus", "Kostenloses WLAN an Bord", "Steckdosen am Sitzplatz", "Erfahrener Busfahrer", "Stadtplan & Infomaterial"],
    notIncluded: ["Übernachtung", "Verpflegung", "Eintritte & Führungen"],
  },
  Barcelona: {
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=80",
    highlights: ["Sagrada Familia", "Park Güell", "La Rambla", "Strand"],
    duration: "17,5 Std.",
    distance: "1.904 km",
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

  // Fetch route by destination
  const { data: route, isLoading: routeLoading } = useQuery({
    queryKey: ["weekend-route", destination],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routes")
        .select("*")
        .ilike("name", `Hamburg - ${destination}`)
        .single();
      if (error) throw error;
      return data as Route;
    },
    enabled: !!destination,
  });

  // Fetch stops for route
  const { data: stops } = useQuery({
    queryKey: ["route-stops", route?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stops")
        .select("*")
        .eq("route_id", route!.id)
        .order("stop_order");
      if (error) throw error;
      return data as Stop[];
    },
    enabled: !!route?.id,
  });

  useEffect(() => {
    if (stops && stops.length > 0 && !selectedStop) {
      setSelectedStop(stops[0]); // Default to Hamburg
    }
  }, [stops, selectedStop]);

  const meta = destination ? DESTINATION_META[destination] : null;

  // Dynamic pricing calculation
  const getPrice = () => {
    if (!route) return 0;
    const basePrice = route.base_price;
    const stopSurcharge = selectedStop?.price_from_start || 0;
    // Simulated occupancy factor (would be real-time in production)
    const occupancyFactor = 1.15; // 15% surge
    return Math.round((basePrice - stopSurcharge) * occupancyFactor);
  };

  const pricePerPerson = getPrice();
  const totalPrice = pricePerPerson * participants;

  const tabs = [
    { id: 'leistungen', label: 'Leistungen' },
    { id: 'route', label: 'Route & Zustiege' },
    { id: 'infos', label: 'Wichtige Infos' },
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      {/* pt-16 lg:pt-20 accounts for fixed header height */}
      <main className="flex-1 pt-16 lg:pt-20">
        {/* Hero Section - Full width like TourDetailPage */}
        <section className="relative">
          <div className="relative h-[50vh] lg:h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden">
            <img
              src={meta.image}
              alt={destination}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
            
            {/* Breadcrumb - Top */}
            <div className="absolute top-0 left-0 right-0 pt-4">
              <div className="container mx-auto px-4">
                <nav className="flex items-center gap-2 text-sm text-white/80">
                  <Link to="/" className="hover:text-white transition-colors font-medium">
                    METROPOL TOURS
                  </Link>
                  <ChevronRight className="w-4 h-4" />
                  <Link to="/wochenendtrips" className="hover:text-white transition-colors">
                    Wochenendtrips
                  </Link>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-white">{destination}</span>
                </nav>
              </div>
            </div>

            {/* Hero Content - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 pb-8">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className="bg-accent text-accent-foreground shadow-lg">
                      <Calendar className="w-3 h-3 mr-1" />
                      Wochenendtrip
                    </Badge>
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                    {destination}
                  </h1>
                  
                  {/* Subtitle */}
                  <div className="flex flex-wrap items-center gap-4 text-white/90 mb-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{meta.distance}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>Fahrzeit: {meta.duration}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="ml-1 text-sm">(4.7)</span>
                    </div>
                  </div>

                  {/* Quick Info Pills */}
                  <div className="flex flex-wrap gap-3 mb-5">
                    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                      <Bus className="w-4 h-4" />
                      <span>Komfortbus inkl.</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                      <Wifi className="w-4 h-4" />
                      <span>WLAN an Bord</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                      <Plug className="w-4 h-4" />
                      <span>Steckdosen</span>
                    </div>
                  </div>

                  {/* Price Teaser */}
                  <div className="inline-flex items-end gap-2 bg-white/95 backdrop-blur rounded-xl px-5 py-3 shadow-xl">
                    <span className="text-muted-foreground text-sm">ab</span>
                    <span className="text-3xl font-bold text-primary">{route.base_price}€</span>
                    <span className="text-muted-foreground text-sm pb-1">pro Person</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Top Right */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur hover:bg-white shadow-lg gap-2">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Teilen</span>
              </Button>
              <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur hover:bg-white shadow-lg gap-2">
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Merken</span>
              </Button>
            </div>
          </div>

          {/* Short Description Bar */}
          <div className="bg-muted/50 border-b">
            <div className="container mx-auto px-4 py-4">
              <p className="text-muted-foreground max-w-3xl">
                {meta.fullDescription}
              </p>
            </div>
          </div>
        </section>

        <nav className="sticky top-16 lg:top-20 z-40 bg-white border-b shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 overflow-x-auto py-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                      activeTab === tab.id
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="hidden md:flex items-center gap-3 pl-4 border-l">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <span className="text-muted-foreground">Dynamische Preise</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Content - 2/3 */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {meta.fullDescription}
                  </p>
                </CardContent>
              </Card>

              {/* Tab Content: Leistungen */}
              {activeTab === "leistungen" && (
                <div className="space-y-6">
                  {/* Inclusions */}
                  <Card>
                    <CardHeader className="pb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-500" />
                        Inklusive Leistungen
                      </h3>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {meta.inclusions.map((item) => (
                          <div key={item} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                              <Check className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Not Included */}
                  <Card>
                    <CardHeader className="pb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <X className="w-5 h-5 text-muted-foreground" />
                        Nicht enthalten
                      </h3>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {meta.notIncluded.map((item) => (
                          <div key={item} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                              <X className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="text-sm text-muted-foreground">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bus Comfort */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-6">
                      <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Bus className="w-5 h-5 text-primary" />
                        Reisekomfort
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <Wifi className="w-5 h-5 text-primary" />
                          <span className="text-sm">WLAN</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Plug className="w-5 h-5 text-primary" />
                          <span className="text-sm">Steckdosen</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Armchair className="w-5 h-5 text-primary" />
                          <span className="text-sm">Komfortsitze</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-primary" />
                          <span className="text-sm">45 Plätze</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tab Content: Route */}
              {activeTab === "route" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-4">
                      <h3 className="text-lg font-bold">Route & Zustiege</h3>
                      <p className="text-sm text-muted-foreground">
                        Wählen Sie Ihren Zustiegsort. Je später der Einstieg, desto günstiger!
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {stops?.map((stop, idx) => {
                          const isLast = idx === (stops?.length || 1) - 1;
                          const discount = stop.price_from_start;
                          
                          return (
                            <div 
                              key={stop.id}
                              onClick={() => !isLast && setSelectedStop(stop)}
                              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                                isLast 
                                  ? 'bg-primary/10 border-primary/30 cursor-default' 
                                  : selectedStop?.id === stop.id
                                    ? 'border-primary bg-primary/5 cursor-pointer'
                                    : 'border-border hover:border-primary/50 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  selectedStop?.id === stop.id ? 'border-primary' : 'border-muted-foreground/50'
                                }`}>
                                  {selectedStop?.id === stop.id && (
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                  )}
                                </div>
                                <div>
                                  <p className={`font-medium ${isLast ? 'text-primary' : ''}`}>
                                    {stop.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{stop.city}</p>
                                </div>
                              </div>
                              {!isLast && discount > 0 && (
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                  -{discount}€ Rabatt
                                </Badge>
                              )}
                              {isLast && (
                                <Badge className="bg-primary">Ziel</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Visual Route */}
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="font-semibold mb-4">Streckenverlauf</h4>
                      <div className="flex items-center justify-between">
                        {stops?.map((stop, idx) => (
                          <div key={stop.id} className="flex items-center">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                idx === 0 ? 'bg-emerald-500 text-white' :
                                idx === (stops?.length || 1) - 1 ? 'bg-primary text-white' :
                                'bg-slate-200'
                              }`}>
                                {idx === 0 ? <Bus className="w-4 h-4" /> :
                                 idx === (stops?.length || 1) - 1 ? <MapPin className="w-4 h-4" /> :
                                 <div className="w-2 h-2 rounded-full bg-slate-400" />}
                              </div>
                              <span className="text-xs mt-2 text-center font-medium">{stop.city}</span>
                            </div>
                            {idx < (stops?.length || 1) - 1 && (
                              <ArrowRight className="w-6 h-6 mx-2 text-slate-300" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tab Content: Infos */}
              {activeTab === "infos" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-bold">Wichtige Informationen</h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Reisedokumente</h4>
                        <p className="text-sm text-muted-foreground">
                          Für diese Reise benötigen Sie einen gültigen Personalausweis oder Reisepass.
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Stornierung</h4>
                        <p className="text-sm text-muted-foreground">
                          Kostenlose Stornierung bis 7 Tage vor Abfahrt. Danach fallen Stornogebühren an.
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Gepäck</h4>
                        <p className="text-sm text-muted-foreground">
                          1 Handgepäckstück (max. 8kg) ist inklusive. Zusätzliches Gepäck kann gegen Aufpreis mitgenommen werden.
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Dynamische Preisgestaltung</h4>
                        <p className="text-sm text-muted-foreground">
                          Unsere Preise passen sich der Nachfrage an. Je früher Sie buchen und je höher Ihr Einstiegsort, 
                          desto günstiger wird Ihre Fahrt. Der angezeigte Preis ist der aktuelle Echtzeitpreis.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Right Sidebar - 1/3 with proper header offset */}
            <div className="lg:col-span-1">
              <div className="sticky top-[calc(theme(spacing.20)+theme(spacing.16))] lg:top-[calc(theme(spacing.20)+theme(spacing.20))]">
                <Card className="border-2 border-primary/20 shadow-xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10 border-b pb-4">
                    <h3 className="text-lg font-bold text-foreground">Dein Angebot:</h3>
                  </CardHeader>
                  
                  <CardContent className="p-5 space-y-4">
                    {/* Destination */}
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground">{destination}</p>
                        <p className="text-sm text-muted-foreground">Wochenendtrip ab Hamburg</p>
                      </div>
                    </div>

                    {/* Selected Stop */}
                    <div className="flex items-start gap-3">
                      <Bus className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground">
                          Zustieg: {selectedStop?.city || 'Hamburg'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedStop?.name || 'ZOB Hamburg'}
                        </p>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <p className="text-sm text-foreground">Fahrzeit: {meta.duration}</p>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{participants} Personen</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setParticipants(Math.max(1, participants - 1))}
                          disabled={participants <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{participants}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setParticipants(Math.min(10, participants + 1))}
                          disabled={participants >= 10}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Price */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-end justify-between mb-1">
                        <span className="text-sm text-muted-foreground">pro Person</span>
                        <span className="text-3xl font-bold text-primary">{pricePerPerson} €</span>
                      </div>
                      {participants > 1 && (
                        <div className="flex items-end justify-between">
                          <span className="text-sm text-muted-foreground">Gesamtpreis ({participants} Pers.)</span>
                          <span className="text-lg font-semibold text-foreground">{totalPrice} €</span>
                        </div>
                      )}
                      {selectedStop && selectedStop.price_from_start > 0 && (
                        <div className="mt-2 text-xs text-emerald-600">
                          ✓ {selectedStop.price_from_start}€ Rabatt durch Zustieg in {selectedStop.city}
                        </div>
                      )}
                    </div>

                    {/* Dynamic Price Hint */}
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                      <TrendingUp className="w-4 h-4" />
                      <span>Preis kann sich je nach Auslastung ändern</span>
                    </div>

                    {/* CTA Button */}
                    <Button 
                      size="lg" 
                      className="w-full text-lg font-semibold py-6 shadow-lg"
                      onClick={() => {
                        // Navigate to checkout with route info - will find matching trip
                        const params = new URLSearchParams({
                          routeId: route.id,
                          from: selectedStop?.city || 'Hamburg',
                          to: destination || '',
                          passengers: participants.toString(),
                        });
                        navigate(`/checkout?${params.toString()}`);
                      }}
                    >
                      Jetzt buchen
                    </Button>

                    {/* Trust Signals */}
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
