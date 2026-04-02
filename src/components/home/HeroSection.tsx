import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wifi, Snowflake, Armchair, Plug, Coffee, Shield,
  ChevronLeft, ChevronRight, Palmtree, Bus, Users, Calendar,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchForm from "@/components/booking/SearchForm";
import { supabase } from "@/integrations/supabase/client";

import sliderPauschalreisen from "@/assets/slider-pauschalreisen.jpg";
import sliderLinienfahrten from "@/assets/slider-linienfahrten.jpg";
import sliderGruppenreisen from "@/assets/slider-gruppenreisen.jpg";
import sliderWochenendtrips from "@/assets/slider-wochenendtrips.jpg";

interface Stop {
  id: string;
  name: string;
  city: string;
  stop_order: number;
}

const slides = [
  {
    image: sliderPauschalreisen,
    badge: "All-Inclusive Urlaub",
    badgeIcon: Palmtree,
    title: "Traumhafte",
    titleHighlight: "Pauschalreisen",
    subtitle: "Rundum-Sorglos-Pakete mit Bus, Hotel & Ausflügen – entspannt buchen, unvergesslich erleben.",
    cta: "Pauschalreisen entdecken",
    ctaLink: "/reisen",
  },
  {
    image: sliderLinienfahrten,
    badge: "Regelmäßige Verbindungen",
    badgeIcon: Bus,
    title: "Komfortable",
    titleHighlight: "Linienfahrten",
    subtitle: "Regelmäßige Busverbindungen zu den beliebtesten Zielen in Europa – günstig, pünktlich und bequem.",
    cta: "Verbindung suchen",
    ctaLink: "/search",
  },
  {
    image: sliderGruppenreisen,
    badge: "Ab 10 Personen",
    badgeIcon: Users,
    title: "Unvergessliche",
    titleHighlight: "Gruppenreisen",
    subtitle: "Ob Schulfahrt, Vereinsausflug oder Firmenreise – wir organisieren Ihre maßgeschneiderte Gruppenreise.",
    cta: "Gruppenanfrage stellen",
    ctaLink: "/business",
  },
  {
    image: sliderWochenendtrips,
    badge: "Kurzurlaub",
    badgeIcon: Calendar,
    title: "Spannende",
    titleHighlight: "Wochenendtrips",
    subtitle: "Die schönsten Städte Europas an einem Wochenende entdecken – ab Hannover mit Zustieg in Bremen und Hamburg.",
    cta: "Wochenendtrips ansehen",
    ctaLink: "/wochenendtrips",
  },
];

const SLIDE_DURATION = 7000;

const HeroSection = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [stops, setStops] = useState<Stop[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const loadStops = async () => {
      const { data, error } = await supabase
        .from('stops')
        .select('*')
        .order('stop_order');
      if (!error && data) setStops(data);
    };
    loadStops();
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, SLIDE_DURATION);
    return () => clearInterval(interval);
  }, [nextSlide, isPaused]);

  const getPopularRoutes = () => {
    if (stops.length < 2) return [];
    const routes: { from: Stop; to: Stop; label: string }[] = [];
    for (let i = 0; i < stops.length - 1; i++) {
      for (let j = i + 1; j < stops.length; j++) {
        if (routes.length < 4) {
          routes.push({ from: stops[i], to: stops[j], label: `${stops[i].city} → ${stops[j].city}` });
        }
      }
    }
    return routes.slice(0, 4);
  };

  const handleQuickRoute = (fromStop: Stop, toStop: Stop) => {
    const tomorrow = addDays(new Date(), 1);
    const searchParams = new URLSearchParams({
      fromStopId: fromStop.id,
      toStopId: toStop.id,
      from: fromStop.name,
      to: toStop.name,
      date: format(tomorrow, "yyyy-MM-dd"),
      passengers: "1",
    });
    navigate(`/search?${searchParams.toString()}`);
  };

  const popularRoutes = getPopularRoutes();
  const slide = slides[currentSlide];

  return (
    <section
      className="relative min-h-[92vh] flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Slides */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          <img
            src={slide.image}
            alt={slide.titleHighlight}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/75 via-secondary/50 to-secondary/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/60 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-1.5 px-4 pt-[72px] lg:pt-[80px]">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className="flex-1 h-1 rounded-full overflow-hidden bg-primary-foreground/20 cursor-pointer"
          >
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{
                width: idx === currentSlide ? "100%" : idx < currentSlide ? "100%" : "0%",
              }}
              transition={{
                duration: idx === currentSlide ? SLIDE_DURATION / 1000 : 0.3,
                ease: "linear",
              }}
            />
          </button>
        ))}
      </div>

      {/* Nav Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20 transition-all hidden lg:flex"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20 transition-all hidden lg:flex"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-32 lg:py-40">
        {/* Slide Badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`badge-${currentSlide}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/90 text-primary-foreground text-sm font-semibold shadow-lg backdrop-blur-sm">
              <slide.badgeIcon className="w-4 h-4" />
              <span>{slide.badge}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Title */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`title-${currentSlide}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-4xl mx-auto text-center mb-6"
          >
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground mb-4 leading-tight">
              {slide.title}{" "}
              <span className="text-primary">{slide.titleHighlight}</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              {slide.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Slide CTA */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`cta-${currentSlide}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex justify-center mb-8"
          >
            <Button
              size="lg"
              onClick={() => navigate(slide.ctaLink)}
              className="gap-2 rounded-full px-8 text-base shadow-lg shadow-primary/30 group"
            >
              {slide.cta}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </AnimatePresence>

        {/* Comfort Features */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-5 mb-8">
          {[
            { icon: Wifi, label: "Gratis WLAN" },
            { icon: Snowflake, label: "Klimaanlage" },
            { icon: Armchair, label: "Komfortsitze" },
            { icon: Plug, label: "Steckdosen" },
            { icon: Coffee, label: "Bordservice" },
            { icon: Shield, label: "Sicherheit" },
          ].map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/15"
            >
              <feature.icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary-foreground">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Search Form */}
        <div>
          <SearchForm variant="hero" />
        </div>

        {/* Quick Route Suggestions */}
        {popularRoutes.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="text-primary-foreground/60 text-sm">Schnellauswahl:</span>
            {popularRoutes.map((route) => (
              <button
                key={`${route.from.id}-${route.to.id}`}
                onClick={() => handleQuickRoute(route.from, route.to)}
                className="text-sm px-3 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
              >
                {route.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Slide Indicators (Mobile) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 lg:hidden">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              idx === currentSlide ? "bg-primary w-8" : "bg-primary-foreground/30 w-2.5"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
