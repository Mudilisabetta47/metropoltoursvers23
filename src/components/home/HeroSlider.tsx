import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Calendar, Users, ArrowRight, ChevronLeft, ChevronRight, Plus, Minus, ChevronDown, Phone, Sparkles, Clock, Percent, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { usePackageTours } from "@/hooks/useCMS";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import heroBus from "@/assets/hero-premium-bus.jpg";

// Import tour images
import tourCroatia from "@/assets/tour-croatia.jpg";
import tourSlovenia from "@/assets/tour-slovenia.jpg";
import tourBosnia from "@/assets/tour-bosnia.jpg";
import tourMontenegro from "@/assets/tour-montenegro.jpg";
import tourSerbien from "@/assets/tour-serbien.jpg";
import tourNordmazedonien from "@/assets/tour-nordmazedonien.jpg";
import tourAlbanien from "@/assets/tour-albanien.jpg";
import tourKosovo from "@/assets/tour-kosovo.jpg";

const imageMap: Record<string, string> = {
  '/tour-croatia.jpg': tourCroatia,
  '/tour-slovenia.jpg': tourSlovenia,
  '/tour-bosnia.jpg': tourBosnia,
  '/tour-montenegro.jpg': tourMontenegro,
  '/tour-serbien.jpg': tourSerbien,
  '/tour-nordmazedonien.jpg': tourNordmazedonien,
  '/tour-albanien.jpg': tourAlbanien,
  '/tour-kosovo.jpg': tourKosovo,
};

const HeroSlider = () => {
  const navigate = useNavigate();
  const { tours } = usePackageTours();
  const [_currentSlide, setCurrentSlide] = useState(0);
  
  // Search form state
  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [isTravelersOpen, setIsTravelersOpen] = useState(false);

  const destinations = tours.slice(0, 6);
  const totalTravelers = adults + children;
  const showContactHint = totalTravelers > 20;

  const getImageSrc = (imageUrl: string | null, destination: string) => {
    if (imageUrl && imageMap[imageUrl]) {
      return imageMap[imageUrl];
    }
    const fallbackKey = `/tour-${destination.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')}.jpg`;
    return imageMap[fallbackKey] || tourCroatia;
  };

  const nextSlide = useCallback(() => {
    if (destinations.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % destinations.length);
  }, [destinations.length]);

  const prevSlide = useCallback(() => {
    if (destinations.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + destinations.length) % destinations.length);
  }, [destinations.length]);

  useEffect(() => {
    if (destinations.length === 0) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide, destinations.length]);

  const handleSearch = () => {
    if (showContactHint) {
      navigate("/business");
    } else {
      navigate("/reisen");
    }
  };

  const uniqueDestinations = tours.filter((tour, index, self) => 
    index === self.findIndex(t => t.destination === tour.destination)
  );

  return (
    <section className="relative min-h-[90vh] bg-gradient-to-br from-muted to-muted/80 overflow-hidden">
      {/* Background Image - Right Side */}
      <div className="absolute inset-0">
        <div className="absolute right-0 top-0 w-full lg:w-3/5 h-full">
          <img
            src={heroBus}
            alt="Metropol Tours Bus"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/80 to-transparent lg:from-muted lg:via-transparent lg:to-transparent" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 pt-28 lg:pt-36 pb-8">
        <div className="max-w-2xl">
          {/* Urgency Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            <span>Jetzt sparen – bis zu 25% Frühbucher-Rabatt!</span>
            <Percent className="w-4 h-4" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight"
          >
            Traumhafte{" "}
            <span className="text-primary relative">
              Pauschalreisen
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" viewBox="0 0 200 12" preserveAspectRatio="none">
                <path d="M0,8 Q50,0 100,8 T200,8" stroke="currentColor" strokeWidth="4" fill="none" />
              </svg>
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-muted-foreground mb-8 max-w-xl"
          >
            Entdecken Sie die schönsten Reiseziele Europas – mit Komfort, erstklassigem Service und unvergesslichen Erlebnissen.
          </motion.p>

          {/* Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl p-6 border border-border/50"
          >
            {/* Limited Time Banner */}
            <div className="flex items-center gap-2 text-sm text-accent font-medium mb-4 pb-4 border-b border-border">
              <Clock className="w-4 h-4" />
              <span>Nur für kurze Zeit: Kostenlose Stornierung bis 14 Tage vor Abreise!</span>
            </div>

            {/* Search Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Destination Dropdown */}
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Wo soll es hin gehen?
                </label>
                <Popover open={isDestinationOpen} onOpenChange={setIsDestinationOpen}>
                  <PopoverTrigger asChild>
                    <button className="w-full flex items-center justify-between px-4 py-3.5 border-2 border-border rounded-xl text-left hover:border-primary/50 transition-all duration-200 bg-muted/30 hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span className={selectedDestination ? "text-foreground font-medium" : "text-muted-foreground"}>
                          {selectedDestination || "Reiseziel wählen"}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <div className="max-h-[300px] overflow-auto">
                      {uniqueDestinations.map((tour) => (
                        <button
                          key={tour.id}
                          onClick={() => {
                            setSelectedDestination(tour.destination);
                            setIsDestinationOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left group"
                        >
                          <img 
                            src={getImageSrc(tour.image_url, tour.destination)} 
                            alt={tour.destination}
                            className="w-12 h-12 rounded-lg object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{tour.destination}</p>
                            <p className="text-xs text-muted-foreground">{tour.country} • ab {tour.price_from}€</p>
                          </div>
                          {tour.discount_percent > 0 && (
                            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded font-medium">
                              -{tour.discount_percent}%
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date Range Picker */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Wann & wie lange?
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full flex items-center gap-2 px-4 py-3.5 border-2 border-border rounded-xl text-left hover:border-primary/50 transition-all duration-200 bg-muted/30 hover:bg-muted/50">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className={dateRange.from ? "text-foreground font-medium text-sm" : "text-muted-foreground"}>
                        {dateRange.from ? (
                          dateRange.to ? (
                            `${format(dateRange.from, "dd.MM", { locale: de })} - ${format(dateRange.to, "dd.MM.yy", { locale: de })}`
                          ) : (
                            format(dateRange.from, "dd.MM.yyyy", { locale: de })
                          )
                        ) : (
                          "Datum wählen"
                        )}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                      numberOfMonths={2}
                      disabled={(date) => date < new Date()}
                      className={cn("p-3 pointer-events-auto")}
                      locale={de}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Travelers Selector */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Wer reist mit?
                </label>
                <Popover open={isTravelersOpen} onOpenChange={setIsTravelersOpen}>
                  <PopoverTrigger asChild>
                    <button className="w-full flex items-center justify-between px-4 py-3.5 border-2 border-border rounded-xl text-left hover:border-primary/50 transition-all duration-200 bg-muted/30 hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="text-foreground font-medium text-sm">
                          {adults} Erw.{children > 0 ? `, ${children} Kind${children > 1 ? 'er' : ''}` : ''}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-4" align="start">
                    <div className="space-y-4">
                      {/* Adults */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">Erwachsene</p>
                          <p className="text-xs text-muted-foreground">Ab 12 Jahren</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                            disabled={adults <= 1}
                            className="w-9 h-9 rounded-full border-2 border-border flex items-center justify-center hover:bg-muted hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center font-bold text-lg">{adults}</span>
                          <button
                            onClick={() => setAdults(Math.min(20, adults + 1))}
                            disabled={adults >= 20}
                            className="w-9 h-9 rounded-full border-2 border-border flex items-center justify-center hover:bg-muted hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Children */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">Kinder</p>
                          <p className="text-xs text-muted-foreground">0-11 Jahre</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setChildren(Math.max(0, children - 1))}
                            disabled={children <= 0}
                            className="w-9 h-9 rounded-full border-2 border-border flex items-center justify-center hover:bg-muted hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center font-bold text-lg">{children}</span>
                          <button
                            onClick={() => setChildren(Math.min(10, children + 1))}
                            disabled={children >= 10}
                            className="w-9 h-9 rounded-full border-2 border-border flex items-center justify-center hover:bg-muted hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 20+ Contact Hint */}
                      {showContactHint && (
                        <div className="bg-accent/10 rounded-xl p-3 flex items-start gap-2 border border-accent/20">
                          <Phone className="w-4 h-4 text-accent mt-0.5" />
                          <div className="text-xs">
                            <p className="font-semibold text-foreground">Gruppenreise ab 20 Personen?</p>
                            <p className="text-muted-foreground">Kontaktieren Sie uns für ein individuelles Angebot!</p>
                          </div>
                        </div>
                      )}

                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => setIsTravelersOpen(false)}
                      >
                        Übernehmen
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <Button 
                  size="lg" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 gap-2"
                  onClick={handleSearch}
                >
                  {showContactHint ? "Anfrage senden" : "Angebote finden"}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-4 mt-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span>4.9/5 Kundenbewertung</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <span>Über 50.000 zufriedene Kunden</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <span>Kostenlose Stornierung</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Destination Slider - Integrated */}
      {destinations.length > 0 && (
        <div className="relative z-10 bg-white border-t border-border">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Beliebte Reiseziele</h2>
                <p className="text-sm text-muted-foreground">Entdecken Sie unsere Top-Destinationen</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  className="p-2.5 rounded-full border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2.5 rounded-full border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Destinations Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {destinations.map((dest, index) => (
                <motion.div
                  key={dest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/reisen/${dest.slug || dest.id}`)}
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 shadow-md group-hover:shadow-xl transition-all duration-300">
                    <img
                      src={getImageSrc(dest.image_url, dest.destination)}
                      alt={dest.destination}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white font-bold text-base truncate">{dest.destination}</p>
                      <p className="text-white/80 text-xs">{dest.country}</p>
                    </div>
                    {dest.discount_percent > 0 && (
                      <div className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg">
                        -{dest.discount_percent}%
                      </div>
                    )}
                    {dest.is_featured && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Top
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">{dest.duration_days} Tage</span>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">ab</span>
                      <span className="font-bold text-primary ml-1">{dest.price_from}€</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* View All Link */}
            <div className="text-center mt-8">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300"
                onClick={() => navigate("/reisen")}
              >
                Alle Reiseziele anzeigen
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSlider;
