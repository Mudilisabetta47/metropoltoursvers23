import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Calendar, Users, ArrowRight, ChevronLeft, ChevronRight, Plus, Minus, ChevronDown, Phone, Sparkles, Clock, Percent, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { usePackageTours } from "@/hooks/useCMS";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import heroBus from "@/assets/hero-premium-bus.jpg";

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

// Floating particles for hero background
const FloatingParticle = ({ delay, size, x, y, duration }: { delay: number; size: number; x: string; y: string; duration: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/10"
    style={{ width: size, height: size, left: x, top: y }}
    animate={{
      y: [0, -30, 0],
      opacity: [0.3, 0.6, 0.3],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

const HeroSlider = () => {
  const navigate = useNavigate();
  const { tours } = usePackageTours();
  const [_currentSlide, setCurrentSlide] = useState(0);
  
  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [isTravelersOpen, setIsTravelersOpen] = useState(false);

  const destinations = tours.slice(0, 6);
  const totalTravelers = adults + children;
  const showContactHint = totalTravelers > 20;

  const getImageSrc = (imageUrl: string | null, destination: string, heroUrl?: string | null) => {
    const url = heroUrl || imageUrl;
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) return url;
    if (url && imageMap[url]) return imageMap[url];
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
    <section className="relative min-h-[92vh] overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute right-0 top-0 w-full lg:w-[70%] h-full">
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
            src={heroBus}
            alt="Metropol Tours Bus"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10 lg:from-background lg:via-background/50 lg:to-transparent" />
        </div>
        
        {/* Floating particles */}
        <FloatingParticle delay={0} size={8} x="10%" y="20%" duration={4} />
        <FloatingParticle delay={1} size={6} x="25%" y="60%" duration={5} />
        <FloatingParticle delay={0.5} size={10} x="40%" y="30%" duration={3.5} />
        <FloatingParticle delay={2} size={5} x="15%" y="80%" duration={4.5} />
        <FloatingParticle delay={1.5} size={7} x="35%" y="50%" duration={6} />
      </div>

      {/* Gradient mesh overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/40 pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 pt-28 lg:pt-36 pb-8">
        <div className="max-w-2xl">
          {/* Urgency Badge */}
          <motion.div
            initial={{ opacity: 0, x: -30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-lg shadow-accent/25 animate-pulse-soft">
              <Sparkles className="w-4 h-4" />
              <span>Jetzt sparen – bis zu 25% Frühbucher-Rabatt!</span>
              <Percent className="w-4 h-4" />
            </div>
          </motion.div>

          {/* Headline with stagger */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-5 leading-[1.1]"
            >
              <motion.span
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="block"
              >
                Traumhafte
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="block text-primary relative"
              >
                Pauschalreisen
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
                  className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-primary-light to-primary/0 rounded-full origin-left"
                />
              </motion.span>
            </motion.h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg lg:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed"
          >
            Entdecken Sie die schönsten Reiseziele Europas – mit Komfort, erstklassigem Service und unvergesslichen Erlebnissen.
          </motion.p>

          {/* Premium Search Card - Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-foreground/5 p-8 border border-border/50 max-w-4xl"
          >
            {/* Limited Time Banner */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-2 text-sm text-accent font-semibold mb-6 pb-5 border-b border-border/50"
            >
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <Clock className="w-4 h-4" />
              <span>Nur für kurze Zeit: Kostenlose Stornierung bis 14 Tage vor Abreise!</span>
            </motion.div>

            {/* Search Fields */}
            <div className="space-y-6">
              {/* Destination Field */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                  Wohin soll die Reise gehen?
                </label>
                <Popover open={isDestinationOpen} onOpenChange={setIsDestinationOpen}>
                  <PopoverTrigger asChild>
                    <button className="w-full flex items-center justify-between px-6 py-5 border-2 border-border/50 rounded-2xl text-left hover:border-primary/50 transition-all duration-300 bg-muted/20 hover:bg-muted/40 hover:shadow-md group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-300">
                          <MapPin className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                        </div>
                        <div>
                          <span className={cn(
                            "block text-lg font-semibold",
                            selectedDestination ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {selectedDestination || "Reiseziel auswählen"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {uniqueDestinations.length} Traumziele verfügbar
                          </span>
                        </div>
                      </div>
                      <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:rotate-180" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 bg-card border border-border/50 shadow-2xl rounded-2xl overflow-hidden" align="start">
                    <div className="max-h-[350px] overflow-auto">
                      {uniqueDestinations.map((tour) => (
                        <button
                          key={tour.id}
                          onClick={() => {
                            setSelectedDestination(tour.destination);
                            setIsDestinationOpen(false);
                          }}
                          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-primary/5 transition-all duration-200 text-left group border-b border-border/30 last:border-0"
                        >
                          <img 
                            src={getImageSrc(tour.image_url, tour.destination, tour.hero_image_url)} 
                            alt={tour.destination}
                            className="w-16 h-16 rounded-xl object-cover group-hover:scale-105 transition-transform shadow-sm"
                          />
                          <div className="flex-1">
                            <p className="font-bold text-foreground text-lg">{tour.destination}</p>
                            <p className="text-sm text-muted-foreground">{tour.country} • ab {tour.price_from}€</p>
                          </div>
                          {tour.discount_percent > 0 && (
                            <span className="text-sm bg-accent text-accent-foreground px-3 py-1 rounded-full font-bold">
                              -{tour.discount_percent}%
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date & Travelers Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Range Picker */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    Reisezeitraum
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full flex items-center gap-4 px-5 py-4 border-2 border-border/50 rounded-2xl text-left hover:border-primary/50 transition-all duration-300 bg-muted/20 hover:bg-muted/40 hover:shadow-md group">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <span className={dateRange.from ? "text-foreground font-medium" : "text-muted-foreground"}>
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
                    <PopoverContent className="w-auto p-0 bg-card border shadow-xl rounded-2xl" align="start">
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
                  <label className="block text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    Reisende
                  </label>
                  <Popover open={isTravelersOpen} onOpenChange={setIsTravelersOpen}>
                    <PopoverTrigger asChild>
                      <button className="w-full flex items-center justify-between px-5 py-4 border-2 border-border/50 rounded-2xl text-left hover:border-primary/50 transition-all duration-300 bg-muted/20 hover:bg-muted/40 hover:shadow-md group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <span className="text-foreground font-medium">
                            {adults} Erw.{children > 0 ? `, ${children} Kind${children > 1 ? 'er' : ''}` : ''}
                          </span>
                        </div>
                        <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-5 bg-card border shadow-xl rounded-2xl" align="start">
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-foreground">Erwachsene</p>
                            <p className="text-xs text-muted-foreground">Ab 12 Jahren</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setAdults(Math.max(1, adults - 1))}
                              disabled={adults <= 1}
                              className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-bold text-xl">{adults}</span>
                            <button
                              onClick={() => setAdults(Math.min(20, adults + 1))}
                              disabled={adults >= 20}
                              className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-foreground">Kinder</p>
                            <p className="text-xs text-muted-foreground">0-11 Jahre</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setChildren(Math.max(0, children - 1))}
                              disabled={children <= 0}
                              className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-bold text-xl">{children}</span>
                            <button
                              onClick={() => setChildren(Math.min(10, children + 1))}
                              disabled={children >= 10}
                              className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {showContactHint && (
                          <div className="bg-accent/10 rounded-xl p-4 flex items-start gap-3 border border-accent/20">
                            <Phone className="w-5 h-5 text-accent mt-0.5" />
                            <div className="text-sm">
                              <p className="font-bold text-foreground">Gruppenreise ab 20 Personen?</p>
                              <p className="text-muted-foreground">Kontaktieren Sie uns für ein individuelles Angebot!</p>
                            </div>
                          </div>
                        )}

                        <Button 
                          className="w-full rounded-xl" 
                          onClick={() => setIsTravelersOpen(false)}
                        >
                          Übernehmen
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* CTA Button */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button 
                  size="xl" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-7 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 gap-3 group"
                  onClick={handleSearch}
                >
                  {showContactHint ? "Gruppenanfrage senden" : "Angebote finden"}
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Trust Elements */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mt-10 flex items-center gap-6 lg:gap-8 flex-nowrap overflow-x-auto pb-2"
          >
            <div className="flex items-center gap-1.5 shrink-0 bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full border border-border/30">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-bold text-foreground text-sm">4.9/5</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-sm shrink-0 bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full border border-border/30">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">50.000+ Kunden</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-sm shrink-0 bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full border border-border/30">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">Sichere Zahlung</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Destination Slider */}
      {destinations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="relative z-10 bg-card/95 backdrop-blur-xl border-t border-border/50"
        >
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
                  transition={{ delay: 1.1 + index * 0.06 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/reisen/${dest.slug || dest.id}`)}
                  whileHover={{ y: -4 }}
                >
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3 shadow-md group-hover:shadow-xl transition-shadow duration-300">
                    <img
                      src={getImageSrc(dest.image_url, dest.destination, dest.hero_image_url)}
                      alt={dest.destination}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
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

            <div className="text-center mt-8">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-2 rounded-full hover:border-primary hover:bg-primary/5 transition-all duration-300 px-8"
                onClick={() => navigate("/reisen")}
              >
                Alle Reiseziele anzeigen
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
};

export default HeroSlider;
