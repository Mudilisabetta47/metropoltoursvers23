import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";
import { Wifi, Snowflake, Armchair, Plug, Coffee, Shield } from "lucide-react";
import SearchForm from "@/components/booking/SearchForm";
import heroBus from "@/assets/hero-bus.jpg";
import { supabase } from "@/integrations/supabase/client";

interface Stop {
  id: string;
  name: string;
  city: string;
  stop_order: number;
}

const HeroSection = () => {
  const navigate = useNavigate();
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    loadStops();
  }, []);

  const loadStops = async () => {
    const { data, error } = await supabase
      .from('stops')
      .select('*')
      .order('stop_order');
    
    if (!error && data) {
      setStops(data);
    }
  };

  // Generate popular route combinations from actual stops
  const getPopularRoutes = () => {
    if (stops.length < 2) return [];
    
    const routes: { from: Stop; to: Stop; label: string }[] = [];
    
    // Create combinations: first to last, first to second-to-last, etc.
    for (let i = 0; i < stops.length - 1; i++) {
      for (let j = i + 1; j < stops.length; j++) {
        if (routes.length < 4) {
          routes.push({
            from: stops[i],
            to: stops[j],
            label: `${stops[i].city} → ${stops[j].city}`
          });
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

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBus})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/70 via-secondary/50 to-secondary/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-32 lg:py-40">
        {/* Weekend Discount Banner */}
        <div className="flex justify-center mb-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent/90 text-accent-foreground text-sm font-semibold shadow-lg backdrop-blur-sm animate-pulse">
            <span className="text-lg">🎉</span>
            <span>WOCHENEND-SPARAKTION: Bis zu 25% auf alle Pauschalreisen!</span>
            <span className="text-lg">🎉</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
            Entdecke Europa mit{" "}
            <span className="text-primary">METROPOL TOURS</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-4">
            Traumhafte Pauschalreisen zu den schönsten Zielen am Balkan – 
            Bus, Hotel & Ausflüge inklusive. Entspannt buchen, unvergesslich erleben.
          </p>
          
          {/* Package Deal Highlight */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
              <span className="text-2xl">✈️</span>
              <div className="text-left">
                <div className="text-xs text-primary-foreground/60">All-Inclusive</div>
                <div className="text-sm font-semibold text-primary-foreground">Pauschalreisen</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
              <span className="text-2xl">🏨</span>
              <div className="text-left">
                <div className="text-xs text-primary-foreground/60">Inklusive</div>
                <div className="text-sm font-semibold text-primary-foreground">Hotel & Transfer</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/80 backdrop-blur-sm border border-accent">
              <span className="text-2xl">💰</span>
              <div className="text-left">
                <div className="text-xs text-accent-foreground/80">Wochenende</div>
                <div className="text-sm font-bold text-accent-foreground">Bis -25% Rabatt</div>
              </div>
            </div>
          </div>
        </div>

        {/* Comfort Features Icons */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8 animate-fade-in" style={{ animationDelay: "150ms" }}>
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
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20"
            >
              <feature.icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary-foreground">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Search Form */}
        <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <SearchForm variant="hero" />
        </div>

        {/* Popular Routes */}
        {popularRoutes.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <span className="text-primary-foreground/60 text-sm">Beliebte Routen:</span>
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

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-3 rounded-full bg-primary-foreground/50" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
