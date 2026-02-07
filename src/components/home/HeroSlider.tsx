import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Calendar, Users, ArrowRight, ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePackageTours } from "@/hooks/useCMS";
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
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('roundtrip');
  const [_currentSlide, setCurrentSlide] = useState(0);

  const destinations = tours.slice(0, 6);

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

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-muted to-muted/80 overflow-hidden">
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
      <div className="relative z-10 container mx-auto px-4 pt-32 lg:pt-40 pb-12">
        <div className="max-w-2xl">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
          >
            Günstige <span className="text-primary">Busreisen</span>
          </motion.h1>

          {/* FlixBus-Style Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6 lg:p-8"
          >
            {/* Trip Type Toggle */}
            <div className="flex items-center gap-6 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tripType"
                  checked={tripType === 'oneway'}
                  onChange={() => setTripType('oneway')}
                  className="w-5 h-5 text-primary border-2 border-muted-foreground focus:ring-primary"
                />
                <span className="text-foreground font-medium">Einfache Fahrt</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tripType"
                  checked={tripType === 'roundtrip'}
                  onChange={() => setTripType('roundtrip')}
                  className="w-5 h-5 text-primary border-2 border-muted-foreground focus:ring-primary accent-primary"
                />
                <span className="text-foreground font-medium">Hin- und Rückfahrt</span>
              </label>
            </div>

            {/* Search Fields */}
            <div className="space-y-4">
              {/* From / To Row */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-muted-foreground mb-1">Von</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <input
                      type="text"
                      placeholder="Hamburg"
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                </div>
                
                {/* Swap Button */}
                <div className="flex items-end justify-center md:pb-1">
                  <button className="p-2 rounded-full hover:bg-muted transition-colors">
                    <ArrowLeftRight className="w-5 h-5 text-primary" />
                  </button>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm text-muted-foreground mb-1">Nach</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <input
                      type="text"
                      placeholder="Kroatien"
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Date / Passengers Row */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-muted-foreground mb-1">Hin</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <input
                      type="text"
                      placeholder="Datum wählen"
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                </div>
                
                {tripType === 'roundtrip' && (
                  <div className="flex-1">
                    <label className="block text-sm text-muted-foreground mb-1">Zurück</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                      <input
                        type="text"
                        placeholder="Datum wählen"
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex-1">
                  <label className="block text-sm text-muted-foreground mb-1">Fahrgäste</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <select className="w-full pl-10 pr-4 py-3 border border-border rounded-lg text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none">
                      <option>1 Erwachsener</option>
                      <option>2 Erwachsene</option>
                      <option>3 Erwachsene</option>
                      <option>4 Erwachsene</option>
                    </select>
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex items-end">
                  <Button 
                    size="lg" 
                    className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-semibold rounded-lg"
                    onClick={() => navigate("/search")}
                  >
                    Suchen
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Destination Slider - Bottom */}
      {destinations.length > 0 && (
        <div className="relative z-10 bg-white border-t border-border">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Beliebte Reiseziele</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
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
                  transition={{ delay: index * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/reisen/${dest.slug || dest.id}`)}
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
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
                      <div className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded">
                        -{dest.discount_percent}%
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{dest.duration_days} Tage</span>
                    <span className="text-sm font-bold text-primary">ab {dest.price_from}€</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* View All Link */}
            <div className="text-center mt-8">
              <Button
                variant="outline"
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
