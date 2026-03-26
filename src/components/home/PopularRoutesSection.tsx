import { useState, useEffect } from "react";
import { ArrowRight, Clock, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface Stop {
  id: string;
  name: string;
  city: string;
  stop_order: number;
  price_from_start: number;
}

interface RouteDisplay {
  fromStop: Stop;
  toStop: Stop;
  price: number;
  duration: string;
}

const PopularRoutesSection = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setIsLoading(true);
    try {
      const { data: stops, error } = await supabase.from('stops').select('*').order('stop_order');
      if (error) throw error;
      if (!stops || stops.length < 2) {
        setRoutes([]);
        return;
      }

      const routeDisplays: RouteDisplay[] = [];
      for (let i = 0; i < stops.length - 1; i++) {
        for (let j = i + 1; j < stops.length; j++) {
          if (routeDisplays.length < 6) {
            const fromStop = stops[i];
            const toStop = stops[j];
            const price = toStop.price_from_start - fromStop.price_from_start;
            const stopsDiff = toStop.stop_order - fromStop.stop_order;
            const hours = Math.max(2, stopsDiff * 3);
            const duration = `${hours}h 00min`;
            routeDisplays.push({
              fromStop,
              toStop,
              price: Math.max(price, 15),
              duration
            });
          }
        }
      }
      setRoutes(routeDisplays);
    } catch (error) {
      console.error('Error loading routes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookRoute = (fromStop: Stop, toStop: Stop) => {
    const tomorrow = addDays(new Date(), 1);
    const searchParams = new URLSearchParams({
      fromStopId: fromStop.id,
      toStopId: toStop.id,
      from: fromStop.name,
      to: toStop.name,
      date: format(tomorrow, "yyyy-MM-dd"),
      passengers: "1"
    });
    navigate(`/search?${searchParams.toString()}`);
  };

  if (isLoading) {
    return (
      <section className="py-24 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-72 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (routes.length === 0) return null;

  return (
    <section className="py-24 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
            <Bus className="w-4 h-4" />
            Linienverkehr
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Beliebte <span className="text-primary">Strecken</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Günstige Busverbindungen zu den beliebtesten Zielen – täglich ab Hamburg, Bremen & Hannover.
          </p>
        </motion.div>

        {/* Routes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {routes.map((route, index) => (
            <motion.div
              key={`${route.fromStop.id}-${route.toStop.id}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.4 }}
            >
              <button
                onClick={() => handleBookRoute(route.fromStop, route.toStop)}
                className="w-full text-left bg-card rounded-2xl border border-border/30 p-5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.05] hover:-translate-y-0.5 transition-all duration-400 group"
              >
                <div className="flex items-center gap-4">
                  {/* Route Line */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="w-3 h-3 rounded-full border-2 border-primary bg-primary/20" />
                    <div className="w-0.5 h-8 bg-gradient-to-b from-primary/40 to-accent/40 rounded-full" />
                    <div className="w-3 h-3 rounded-full border-2 border-accent bg-accent/20" />
                  </div>

                  {/* Cities */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-base truncate">{route.fromStop.city}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground my-1">
                      <Clock className="w-3 h-3" />
                      <span>{route.duration}</span>
                    </div>
                    <p className="font-bold text-foreground text-base truncate">{route.toStop.city}</p>
                  </div>

                  {/* Price & Arrow */}
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">ab</p>
                    <p className="text-2xl font-bold text-primary">{route.price}€</p>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1 group-hover:bg-primary group-hover:shadow-md transition-all">
                      <ArrowRight className="w-4 h-4 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button
            variant="outline"
            size="lg"
            className="gap-2 rounded-full border-2 hover:border-primary hover:bg-primary/5 px-8 group"
            onClick={() => navigate("/search")}
          >
            Alle Verbindungen anzeigen
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default PopularRoutesSection;