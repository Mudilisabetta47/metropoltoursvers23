import { MapPin, Share2, Heart, ChevronRight, Clock, Star, Bus, Hotel, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ExtendedPackageTour } from "@/hooks/useTourBuilder";

interface TourHeroSectionProps {
  tour: ExtendedPackageTour;
  heroImage: string;
  lowestPrice?: number;
}

const TourHeroSection = ({ tour, heroImage, lowestPrice }: TourHeroSectionProps) => {

  return (
    <section className="relative">
      {/* Full-width Hero Image */}
      <div className="relative h-[50vh] lg:h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden">
        <img
          src={heroImage}
          alt={tour.destination}
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        
        {/* Breadcrumb - Top */}
        <div className="absolute top-0 left-0 right-0 pt-4">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-2 text-sm text-white/80">
              <Link to="/" className="hover:text-white transition-colors font-medium">
                METROPOL TOURS
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link to="/" className="hover:text-white transition-colors">
                Pauschalreisen
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">{tour.destination}</span>
            </nav>
          </div>
        </div>

        {/* Hero Content - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 pb-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {tour.is_featured && (
                  <Badge className="bg-accent text-accent-foreground shadow-lg">
                    ★ Top-Empfehlung
                  </Badge>
                )}
                {tour.discount_percent && tour.discount_percent > 0 && (
                  <Badge className="bg-red-500 text-white shadow-lg">
                    -{tour.discount_percent}% Frühbucher-Rabatt
                  </Badge>
                )}
                {tour.category && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                    {tour.category}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                {tour.destination}
              </h1>
              
              {/* Subtitle */}
              <div className="flex flex-wrap items-center gap-4 text-white/90 mb-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{tour.location}, {tour.country}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{tour.duration_days} Tage / {(tour.duration_days || 1) - 1} Nächte</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 text-sm">(4.8)</span>
                </div>
              </div>

              {/* Quick Info Pills */}
              <div className="flex flex-wrap gap-3 mb-5">
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                  <Bus className="w-4 h-4" />
                  <span>Komfortbus inkl.</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                  <Hotel className="w-4 h-4" />
                  <span>Übernachtung inkl.</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                  <Coffee className="w-4 h-4" />
                  <span>Frühstück inkl.</span>
                </div>
              </div>

              {/* Price Teaser */}
              {lowestPrice && (
                <div className="inline-flex items-end gap-2 bg-white/95 backdrop-blur rounded-xl px-5 py-3 shadow-xl">
                  <span className="text-muted-foreground text-sm">ab</span>
                  <span className="text-3xl font-bold text-primary">{lowestPrice.toFixed(0)}€</span>
                  <span className="text-muted-foreground text-sm pb-1">pro Person</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - Top Right */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur hover:bg-white shadow-lg gap-2">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Teilen</span>
          </Button>
          <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur hover:bg-white shadow-lg gap-2">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Merken</span>
          </Button>
        </div>
      </div>

      {/* Short Description Bar */}
      {tour.short_description && (
        <div className="bg-muted/50 border-b">
          <div className="container mx-auto px-4 py-4">
            <p className="text-muted-foreground max-w-3xl">
              {tour.short_description}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default TourHeroSection;
