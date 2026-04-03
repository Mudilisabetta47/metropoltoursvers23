import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Star, Shield, Users, Bus, Palmtree, MapPin, UsersRound, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    subtitle: "Kroatien, Montenegro, Albanien & mehr – mit Hotel, Transfer und Rundum-Sorglos-Paket ab Hannover.",
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

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

  const slide = slides[currentSlide];
  const SlideIcon = slide.icon;

  return (
    <section className="relative h-[95vh] min-h-[600px] overflow-hidden">
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
          {/* Cinematic overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mb-6"
                >
                  <div className="inline-flex items-center gap-2 bg-primary/90 backdrop-blur-sm text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg">
                    <SlideIcon className="w-4 h-4" />
                    <span>{slide.badge}</span>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-6 leading-[1.05]"
                >
                  <span className="block">{slide.title}</span>
                  <span className="block text-primary">{slide.highlight}</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-lg md:text-xl text-white/80 mb-10 max-w-xl leading-relaxed"
                >
                  {slide.subtitle}
                </motion.p>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="flex flex-wrap gap-4"
                >
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-bold rounded-2xl shadow-xl shadow-primary/30 gap-3 group"
                    onClick={() => navigate(slide.link)}
                  >
                    {slide.cta}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-6 text-lg rounded-2xl backdrop-blur-sm"
                    onClick={() => navigate("/reisen")}
                  >
                    Alle Reisen
                  </Button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Slider Navigation */}
      <div className="absolute bottom-8 left-0 right-0 z-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Dots + Progress */}
            <div className="flex items-center gap-3">
              {slides.map((s, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className="group relative"
                >
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${
                    index === currentSlide ? "w-12 bg-primary" : "w-6 bg-white/40 hover:bg-white/60"
                  }`} />
                  {/* Tooltip */}
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-white/80 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {s.highlight}
                  </span>
                </button>
              ))}
            </div>

            {/* Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/50 transition-all backdrop-blur-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/50 transition-all backdrop-blur-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Trust bar */}
          <div className="mt-6 flex items-center gap-4 lg:gap-6 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-bold text-white text-sm">4.9/5</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-semibold text-white">50.000+ Kunden</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-semibold text-white">Sichere Zahlung</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <Sparkles className="w-4 h-4 text-accent" />
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
