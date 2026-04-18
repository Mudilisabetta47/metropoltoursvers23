import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Star, Shield, Users, Bus, Palmtree, MapPin, UsersRound, Landmark, Calendar, ChevronDown, Plus, Minus, Phone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { usePackageTours } from "@/hooks/useCMS";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

import sliderPauschalreisen from "@/assets/slider-pauschalreisen.jpg";
import sliderWochenendtrips from "@/assets/slider-wochenendtrips.jpg";
import sliderGruppenreisen from "@/assets/slider-gruppenreisen.jpg";
import sliderStrandurlaub from "@/assets/slider-strandurlaub.jpg";
import sliderKulturreisen from "@/assets/slider-kulturreisen.jpg";

interface Slide {
  image: string;
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  cta: string;
  link: string;
  icon: React.ElementType;
}

const slides: Slide[] = [
  {
    image: sliderPauschalreisen,
    badge: "All-Inclusive Reisen",
    title: "Traumhafte",
    highlight: "Pauschalreisen",
    subtitle: "Kroatien, Frankreich, Italien & Spanien – mit Hotel, Transfer und Rundum-Sorglos-Paket ab Hannover.",
    cta: "Pauschalreisen entdecken",
    link: "/reisen",
    icon: Bus,
  },
  {
    image: sliderStrandurlaub,
    badge: "Sonne & Meer",
    title: "Unvergesslicher",
    highlight: "Strandurlaub",
    subtitle: "Die schönsten Strände der Adria und des Mittelmeers – kristallklares Wasser und purer Genuss.",
    cta: "Strandreisen ansehen",
    link: "/reisen",
    icon: Palmtree,
  },
  {
    image: sliderWochenendtrips,
    badge: "Kurzurlaub",
    title: "Spannende",
    highlight: "Wochenendtrips",
    subtitle: "Europas charmanteste Städte an einem Wochenende erleben – spontan und unkompliziert.",
    cta: "Wochenendtrips buchen",
    link: "/wochenendtrips",
    icon: MapPin,
  },
  {
    image: sliderGruppenreisen,
    badge: "Gemeinsam reisen",
    title: "Individuelle",
    highlight: "Gruppenreisen",
    subtitle: "Vereine, Firmen, Schulen – maßgeschneiderte Busreisen für jede Gruppengröße ab 20 Personen.",
    cta: "Gruppenanfrage starten",
    link: "/business",
    icon: UsersRound,
  },
  {
    image: sliderKulturreisen,
    badge: "Kultur & Geschichte",
    title: "Faszinierende",
    highlight: "Kulturreisen",
    subtitle: "Antike Stätten, historische Altstädte und kulinarische Entdeckungen auf dem Balkan.",
    cta: "Kulturreisen entdecken",
    link: "/reisen",
    icon: Landmark,
  },
];

const HeroSlider = () => {
  const navigate = useNavigate();
  const { tours } = usePackageTours();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [_direction, setDirection] = useState(1);

  // Search state
  const [selectedDestination, setSelectedDestination] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [isTravelersOpen, setIsTravelersOpen] = useState(false);

  const totalTravelers = adults + children;
  const showContactHint = totalTravelers > 20;

  const uniqueDestinations = tours.filter((tour, index, self) =>
    index === self.findIndex(t => t.destination === tour.destination)
  );

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  useEffect(() => {
    const interval = setInterval(nextSlide, 7000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const handleSearch = () => {
    if (showContactHint) {
      navigate("/business");
    } else {
      navigate("/reisen");
    }
  };

  const slide = slides[currentSlide];
  const SlideIcon = slide.icon;

  return (
    <section className="relative h-auto min-h-screen lg:h-[95vh] lg:min-h-[700px] overflow-hidden">
      {/* Background Images */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          <img
            src={slide.image}
            alt={slide.highlight}
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center pt-20 pb-32 lg:pt-0 lg:pb-0">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">
            {/* Left: Slide Text */}
            <div className="max-w-2xl flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-5"
                  >
                    <div className="inline-flex items-center gap-2 bg-primary/90 backdrop-blur-sm text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg">
                      <SlideIcon className="w-4 h-4" />
                      <span>{slide.badge}</span>
                    </div>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-3 lg:mb-5 leading-[1.05]"
                  >
                    <span className="block">{slide.title}</span>
                    <span className="block text-primary">{slide.highlight}</span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="text-base md:text-xl text-white/80 mb-5 lg:mb-8 max-w-xl leading-relaxed"
                  >
                    {slide.subtitle}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="flex flex-wrap gap-4"
                  >
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-4 lg:px-8 lg:py-6 text-base lg:text-lg font-bold rounded-2xl shadow-xl shadow-primary/30 gap-3 group"
                      onClick={() => navigate(slide.link)}
                    >
                      {slide.cta}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right: Search Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-6 lg:mt-0 w-full lg:w-[420px] shrink-0"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/20 shadow-2xl">
                <h3 className="text-white font-bold text-base lg:text-lg mb-3 lg:mb-5 flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Reise finden
                </h3>

                <div className="space-y-3 lg:space-y-4">
                  {/* Destination */}
                  <div>
                    <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">Reiseziel</label>
                    <Popover open={isDestinationOpen} onOpenChange={setIsDestinationOpen}>
                      <PopoverTrigger asChild>
                        <button className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/10 border border-white/15 text-left hover:bg-white/15 transition-all group">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-primary" />
                            <span className={cn("text-sm font-medium", selectedDestination ? "text-white" : "text-white/50")}>
                              {selectedDestination || "Wohin soll es gehen?"}
                            </span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-white/40" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[min(380px,calc(100vw-2rem))] p-0 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden" align="start">
                        <div className="max-h-[300px] overflow-auto">
                          {uniqueDestinations.map((tour) => (
                            <button
                              key={tour.id}
                              onClick={() => { setSelectedDestination(tour.destination); setIsDestinationOpen(false); }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-all text-left border-b border-border/30 last:border-0"
                            >
                              <MapPin className="w-4 h-4 text-primary shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground text-sm">{tour.destination}</p>
                                <p className="text-xs text-muted-foreground">{tour.country} • ab {tour.price_from}€</p>
                              </div>
                              {tour.discount_percent > 0 && (
                                <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-bold">-{tour.discount_percent}%</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">Reisezeitraum</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/10 border border-white/15 text-left hover:bg-white/15 transition-all">
                          <Calendar className="w-5 h-5 text-primary" />
                          <span className={cn("text-sm font-medium", dateRange.from ? "text-white" : "text-white/50")}>
                            {dateRange.from
                              ? dateRange.to
                                ? `${format(dateRange.from, "dd.MM", { locale: de })} – ${format(dateRange.to, "dd.MM.yy", { locale: de })}`
                                : format(dateRange.from, "dd.MM.yyyy", { locale: de })
                              : "Datum wählen"}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card border shadow-xl rounded-2xl" align="start">
                         <CalendarComponent
                          mode="range"
                          selected={dateRange}
                          onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                          numberOfMonths={1}
                          disabled={(date) => date < new Date()}
                          className="p-3 pointer-events-auto"
                          locale={de}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Travelers */}
                  <div>
                    <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">Reisende</label>
                    <Popover open={isTravelersOpen} onOpenChange={setIsTravelersOpen}>
                      <PopoverTrigger asChild>
                        <button className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/10 border border-white/15 text-left hover:bg-white/15 transition-all">
                          <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium text-white">
                              {adults} Erw.{children > 0 ? `, ${children} Kind${children > 1 ? 'er' : ''}` : ''}
                            </span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-white/40" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-5 bg-card border shadow-xl rounded-2xl" align="start">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-foreground text-sm">Erwachsene</p>
                              <p className="text-xs text-muted-foreground">Ab 12 Jahren</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setAdults(Math.max(1, adults - 1))} disabled={adults <= 1} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground disabled:opacity-40 transition-all">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center font-bold text-foreground">{adults}</span>
                              <button onClick={() => setAdults(Math.min(20, adults + 1))} disabled={adults >= 20} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground disabled:opacity-40 transition-all">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-foreground text-sm">Kinder</p>
                              <p className="text-xs text-muted-foreground">0–11 Jahre</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setChildren(Math.max(0, children - 1))} disabled={children <= 0} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground disabled:opacity-40 transition-all">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center font-bold text-foreground">{children}</span>
                              <button onClick={() => setChildren(Math.min(10, children + 1))} disabled={children >= 10} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground disabled:opacity-40 transition-all">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {showContactHint && (
                            <div className="bg-accent/10 rounded-xl p-3 flex items-start gap-2 border border-accent/20">
                              <Phone className="w-4 h-4 text-accent mt-0.5" />
                              <p className="text-xs text-muted-foreground">Ab 20 Personen: Gruppenanfrage!</p>
                            </div>
                          )}
                          <Button className="w-full rounded-xl" size="sm" onClick={() => setIsTravelersOpen(false)}>Übernehmen</Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Search Button */}
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-5 text-base font-bold rounded-xl shadow-lg shadow-primary/25 gap-2 group"
                    onClick={handleSearch}
                  >
                    {showContactHint ? "Gruppenanfrage senden" : "Reise finden"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Slider Navigation */}
      <div className="absolute bottom-4 lg:bottom-6 left-0 right-0 z-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {slides.map((s, index) => (
                <button key={index} onClick={() => goToSlide(index)} className="group relative">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${index === currentSlide ? "w-12 bg-primary" : "w-6 bg-white/40 hover:bg-white/60"}`} />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-white/80 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{s.highlight}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevSlide} className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/50 transition-all backdrop-blur-sm">
                <ChevronLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </button>
              <button onClick={nextSlide} className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/50 transition-all backdrop-blur-sm">
                <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </button>
            </div>
          </div>

          {/* Trust bar */}
          <div className="mt-3 lg:mt-4 flex items-center gap-2 lg:gap-5 flex-wrap hidden sm:flex">
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-bold text-white text-xs">4.9/5</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-white">50.000+ Kunden</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-white">Sichere Zahlung</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="font-semibold text-white">Bis -25% Frühbucher</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide counter */}
      <div className="absolute top-28 right-8 z-20 hidden lg:block">
        <div className="text-white/40 text-sm font-mono">
          <span className="text-white font-bold text-2xl">{String(currentSlide + 1).padStart(2, "0")}</span>
          <span className="mx-1">/</span>
          <span>{String(slides.length).padStart(2, "0")}</span>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
