import { useState, useEffect } from "react";
import { ArrowRight, Clock, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
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
      const {
        data: stops,
        error
      } = await supabase.from('stops').select('*').order('stop_order');
      if (error) throw error;
      if (!stops || stops.length < 2) {
        setRoutes([]);
        return;
      }

      // Generate route combinations
      const routeDisplays: RouteDisplay[] = [];
      for (let i = 0; i < stops.length - 1; i++) {
        for (let j = i + 1; j < stops.length; j++) {
          if (routeDisplays.length < 6) {
            const fromStop = stops[i];
            const toStop = stops[j];
            const price = toStop.price_from_start - fromStop.price_from_start;

            // Estimate duration based on stop order difference (rough estimate)
            const stopsDiff = toStop.stop_order - fromStop.stop_order;
            const hours = Math.max(2, stopsDiff * 3);
            const duration = `${hours}h 00min`;
            routeDisplays.push({
              fromStop,
              toStop,
              price: Math.max(price, 15),
              // Minimum price
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
    return <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </section>;
  }
  if (routes.length === 0) {
    return null;
  }
  return <section className="py-20 lg:py-28">
      
    </section>;
};
export default PopularRoutesSection;