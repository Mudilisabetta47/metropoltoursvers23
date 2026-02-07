import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Calendar, Users, ArrowRight, ChevronLeft, ChevronRight, Plus, Minus, ChevronDown, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { usePackageTours } from "@/hooks/useCMS";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import heroBus from "@/assets/hero-bus.jpg";

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
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, destinations.length]);

  const handleSearch = () => {
    if (showContactHint) {
      navigate("/business");
    } else {
      navigate("/service");
    }
  };

  const uniqueDestinations = tours.filter((tour, index, self) => 
    index === self.findIndex(t => t.destination === tour.destination)
  );

  return (
    <section className="relative min-h-[85vh] bg-gradient-to-br from-muted to-muted/80 overflow-hidden">
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
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
          >
            Traumhafte <span className="text-primary">Pauschalreisen</span>
          </motion.h1>

          {/* Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            {/* Search Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Destination Dropdown */}
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Wo soll es hin gehen?
                </label>
                <Popover open={isDestinationOpen} onOpenChange={setIsDestinationOpen}>
                  <PopoverTrigger asChild>
                    <button className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-lg text-left hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span className={selectedDestination ? "text-foreground" : "text-muted-foreground"}>
                          {selectedDestination || "Reiseziel wählen"}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <div className="max-h-[300px] overflow-auto">
                      {uniqueDestinations.map((tour) => (
                        <button
                          key={tour.id}
                          onClick={() => {
                            setSelectedDestination(tour.destination);
                            setIsDestinationOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                        >
                          <img 
                            src={getImageSrc(tour.image_url, tour.destination)} 
                            alt={tour.destination}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium text-foreground">{tour.destination}</p>
                            <p className="text-xs text-muted-foreground">{tour.country} • ab {tour.price_from}€</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date Range Picker */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Wann & wie lange?
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full flex items-center gap-2 px-4 py-3 border border-border rounded-lg text-left hover:border-primary/50 transition-colors">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className={dateRange.from ? "text-foreground text-sm" : "text-muted-foreground"}>
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
                <label className="block text-sm font-medium text-foreground mb-2">
                  Wer reist mit?
                </label>
                <Popover open={isTravelersOpen} onOpenChange={setIsTravelersOpen}>
                  <PopoverTrigger asChild>
                    <button className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-lg text-left hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="text-foreground text-sm">
                          {adults} Erw.{children > 0 ? `, ${children} Kind${children > 1 ? 'er' : ''}` : ''}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-4" align="start">
                    <div className="space-y-4">
                      {/* Adults */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Erwachsene</p>
                          <p className="text-xs text-muted-foreground">Ab 12 Jahren</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                            disabled={adults <= 1}
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center font-semibold">{adults}</span>
                          <button
                            onClick={() => setAdults(Math.min(20, adults + 1))}
                            disabled={adults >= 20}
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Children */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Kinder</p>
                          <p className="text-xs text-muted-foreground">0-11 Jahre</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setChildren(Math.max(0, children - 1))}
                            disabled={children <= 0}
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center font-semibold">{children}</span>
                          <button
                            onClick={() => setChildren(Math.min(10, children + 1))}
                            disabled={children >= 10}
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 20+ Contact Hint */}
                      {showContactHint && (
                        <div className="bg-accent/20 rounded-lg p-3 flex items-start gap-2">
                          <Phone className="w-4 h-4 text-primary mt-0.5" />
                          <div className="text-xs">
                            <p className="font-medium text-foreground">Gruppenreise ab 20 Personen?</p>
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
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-base font-semibold rounded-lg"
                  onClick={handleSearch}
                >
                  {showContactHint ? "Anfrage senden" : "Angebote finden"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Destination Slider - Integrated */}
      {destinations.length > 0 && (
        <div className="relative z-10 bg-white">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Beliebte Reiseziele</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Destinations Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {destinations.map((dest, index) => (
                <motion.div
                  key={dest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/reisen/${dest.slug || dest.id}`)}
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
                    <img
                      src={getImageSrc(dest.image_url, dest.destination)}
                      alt={dest.destination}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white font-semibold text-sm truncate">{dest.destination}</p>
                    </div>
                    {dest.discount_percent > 0 && (
                      <div className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded">
                        -{dest.discount_percent}%
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{dest.duration_days} Tage</span>
                    <span className="font-bold text-primary">ab {dest.price_from}€</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* View All Link */}
            <div className="text-center mt-6">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => navigate("/service")}
              >
                Alle Reiseziele anzeigen
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSlider;
