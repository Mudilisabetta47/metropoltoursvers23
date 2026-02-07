import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Calendar, Users, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePackageTours } from "@/hooks/useCMS";

// Import local images
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
  const { tours, isLoading } = usePackageTours();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slideTours = tours.slice(0, 6);

  const getImageSrc = (imageUrl: string | null, destination: string) => {
    if (imageUrl && imageMap[imageUrl]) {
      return imageMap[imageUrl];
    }
    const fallbackKey = `/tour-${destination.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')}.jpg`;
    return imageMap[fallbackKey] || tourCroatia;
  };

  const nextSlide = useCallback(() => {
    if (slideTours.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % slideTours.length);
  }, [slideTours.length]);

  const prevSlide = useCallback(() => {
    if (slideTours.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + slideTours.length) % slideTours.length);
  }, [slideTours.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  useEffect(() => {
    if (!isAutoPlaying || slideTours.length === 0) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, slideTours.length]);

  if (isLoading || slideTours.length === 0) {
    return (
      <section className="relative h-screen bg-secondary flex items-center justify-center">
        <div className="animate-pulse text-primary-foreground">Lädt Reiseziele...</div>
      </section>
    );
  }

  const currentTour = slideTours[currentIndex];

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background Images with Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={getImageSrc(currentTour.image_url, currentTour.destination)}
            alt={currentTour.destination}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Large Typography Overlay */}
      <div className="absolute inset-0 flex flex-col justify-center">
        <div className="container mx-auto px-4 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-5xl"
            >
              {/* Destination Label */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex items-center gap-3 mb-4"
              >
                <div className="w-12 h-[2px] bg-primary" />
                <span className="text-primary font-medium tracking-wider uppercase text-sm">
                  Pauschalreise {String(currentIndex + 1).padStart(2, '0')}
                </span>
              </motion.div>

              {/* Large Destination Name - Split Typography */}
              <div className="relative mb-6">
                <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black leading-[0.85] tracking-tight">
                  <span className="text-white/90 block">{currentTour.destination.split(' ')[0]}</span>
                  <span className="text-primary block mt-2">
                    {currentTour.destination.split(' ').slice(1).join(' ') || currentTour.country}
                  </span>
                </h1>
              </div>

              {/* Location & Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-wrap items-center gap-6 mb-8"
              >
                <div className="flex items-center gap-2 text-white/80">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="text-lg">{currentTour.location}, {currentTour.country}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-lg">{currentTour.duration_days} Tage</span>
                </div>
                <div className="flex items-center gap-2 bg-accent/90 backdrop-blur px-4 py-2 rounded-full">
                  <span className="text-accent-foreground font-bold text-lg">ab {currentTour.price_from}€</span>
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="flex flex-wrap gap-4"
              >
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold gap-2 group"
                  onClick={() => navigate(`/reisen/${currentTour.slug || currentTour.id}`)}
                >
                  Jetzt entdecken
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 px-8 py-6 text-lg"
                  onClick={() => navigate("/service")}
                >
                  Alle Reisen
                </Button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* TUI-Style Search Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-white/95 backdrop-blur-lg border-t-4 border-primary">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row items-stretch gap-4">
              {/* Destination Input */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wide mb-2">
                  Wo soll es hin gehen?
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <input
                    type="text"
                    placeholder="z.B. Kroatien, Montenegro..."
                    className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Date Input */}
              <div className="flex-1 lg:max-w-xs">
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wide mb-2">
                  Wann & wie lange?
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <input
                    type="text"
                    placeholder="Reisezeitraum wählen"
                    className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Travelers Input */}
              <div className="flex-1 lg:max-w-xs">
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wide mb-2">
                  Wer reist mit?
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <input
                    type="text"
                    placeholder="2 Erwachsene"
                    className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <Button 
                  size="lg" 
                  className="w-full lg:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-7 text-lg font-semibold gap-2 rounded-xl"
                  onClick={() => navigate("/service")}
                >
                  <Search className="w-5 h-5" />
                  Angebote finden
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all flex items-center justify-center group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all flex items-center justify-center group"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute left-8 bottom-36 lg:bottom-32 z-20 flex flex-col gap-3">
        {slideTours.map((tour, index) => (
          <button
            key={tour.id}
            onClick={() => goToSlide(index)}
            className={`group flex items-center gap-3 transition-all duration-300 ${
              index === currentIndex ? 'opacity-100' : 'opacity-50 hover:opacity-80'
            }`}
            aria-label={`Go to ${tour.destination}`}
          >
            <div className={`h-[3px] transition-all duration-500 ${
              index === currentIndex ? 'w-8 bg-primary' : 'w-4 bg-white/50'
            }`} />
            <span className={`text-sm font-medium transition-all duration-300 ${
              index === currentIndex ? 'text-white translate-x-0 opacity-100' : 'text-white/0 -translate-x-2 opacity-0'
            }`}>
              {tour.destination}
            </span>
          </button>
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute right-8 bottom-36 lg:bottom-32 z-20 text-white/70 font-mono text-sm">
        <span className="text-white font-bold text-2xl">{String(currentIndex + 1).padStart(2, '0')}</span>
        <span className="mx-2">/</span>
        <span>{String(slideTours.length).padStart(2, '0')}</span>
      </div>
    </section>
  );
};

export default HeroSlider;
