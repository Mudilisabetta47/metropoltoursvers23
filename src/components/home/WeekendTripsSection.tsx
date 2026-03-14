import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Calendar, Bus, ChevronLeft, ChevronRight } from "lucide-react";

interface Route {
  id: string;
  name: string;
  description: string;
  base_price: number;
}

const DESTINATION_IMAGES: Record<string, string> = {
  Kopenhagen: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=400&q=80",
  Amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&q=80",
  Paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80",
  Rom: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80",
  Prag: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=400&q=80",
  Wien: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=400&q=80",
  Barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80",
};

const WeekendTripsSection = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: routes, isLoading } = useQuery({
    queryKey: ["weekend-routes-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routes")
        .select("*")
        .eq("is_active", true)
        .ilike("name", "Hamburg -%");
      if (error) throw error;
      return data as Route[];
    },
  });

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("div")?.offsetWidth || 300;
    el.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  const getDestination = (routeName: string) => routeName.split(" - ")[1] || routeName;

  if (isLoading || !routes || routes.length === 0) return null;

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
          <div className="flex items-center gap-2 shrink-0">
            {/* Scroll Arrows */}
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-full bg-card shadow-sm border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Zurück"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-full bg-card shadow-sm border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Weiter"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
            <Button
              variant="outline"
              onClick={() => navigate("/wochenendtrips")}
              className="ml-2 hidden md:inline-flex"
            >
              Alle Ziele
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Scrollable Cards */}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {routes.map((route) => {
            const destination = getDestination(route.name);
            const image = DESTINATION_IMAGES[destination];

            return (
              <div
                key={route.id}
                className="group relative rounded-2xl overflow-hidden cursor-pointer flex-shrink-0 snap-start w-[280px] sm:w-[300px] lg:w-[calc(25%-18px)]"
                onClick={() => navigate(`/wochenendtrips/${destination}`)}
              >
                {/* Image */}
                <div className="aspect-[4/5] relative">
                  <img
                    src={image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80"}
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
                  <h3 className="text-xl font-bold text-white mb-1">{destination}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">
                      ab <span className="text-white font-bold text-lg">{route.base_price}€</span>
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

        {/* Mobile CTA */}
        <div className="mt-6 md:hidden text-center">
          <Button variant="outline" onClick={() => navigate("/wochenendtrips")}>
            Alle Ziele entdecken
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default WeekendTripsSection;
