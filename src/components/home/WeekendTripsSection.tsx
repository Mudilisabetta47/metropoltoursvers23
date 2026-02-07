import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MapPin, Calendar, Bus } from "lucide-react";

interface Route {
  id: string;
  name: string;
  description: string;
  base_price: number;
}

const DESTINATION_IMAGES: Record<string, string> = {
  Kopenhagen:
    "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=400&q=80",
  Amsterdam:
    "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&q=80",
  Paris:
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80",
  Rom: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80",
  Prag: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=400&q=80",
  Wien: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=400&q=80",
  Barcelona:
    "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80",
};

const WeekendTripsSection = () => {
  const navigate = useNavigate();

  const { data: routes, isLoading } = useQuery({
    queryKey: ["weekend-routes-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routes")
        .select("*")
        .eq("is_active", true)
        .ilike("name", "Hamburg -%")
        .limit(4);
      if (error) throw error;
      return data as Route[];
    },
  });

  const getDestination = (routeName: string) => {
    return routeName.split(" - ")[1] || routeName;
  };

  if (isLoading || !routes || routes.length === 0) {
    return null;
  }

  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <Badge className="mb-4 bg-primary/10 text-primary border-0">
              <Calendar className="w-3 h-3 mr-1" />
              Wochenendtrips
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Europa an einem Wochenende
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Entdecken Sie die schönsten Städte Europas – bequem ab Hamburg mit
              Zustieg in Bremen und Hannover.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/wochenendtrips")}
            className="shrink-0"
          >
            Alle Ziele entdecken
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Routes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {routes.map((route) => {
            const destination = getDestination(route.name);
            const image = DESTINATION_IMAGES[destination];

            return (
              <div
                key={route.id}
                className="group relative rounded-2xl overflow-hidden cursor-pointer"
                onClick={() => navigate(`/wochenendtrips/${destination}`)}
              >
                {/* Image */}
                <div className="aspect-[4/5] relative">
                  <img
                    src={
                      image ||
                      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80"
                    }
                    alt={destination}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-2 text-white/70 text-xs mb-2">
                    <MapPin className="w-3 h-3" />
                    Ab Hamburg
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {destination}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">
                      ab{" "}
                      <span className="text-white font-bold text-lg">
                        {route.base_price}€
                      </span>
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-primary transition-colors">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Badge */}
                <Badge className="absolute top-4 right-4 bg-primary border-0">
                  <Bus className="w-3 h-3 mr-1" />
                  Wochenendtrip
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WeekendTripsSection;
