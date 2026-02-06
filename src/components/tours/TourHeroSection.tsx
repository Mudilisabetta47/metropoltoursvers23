import { MapPin, Share2, Heart, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ExtendedPackageTour } from "@/hooks/useTourBuilder";

interface TourHeroSectionProps {
  tour: ExtendedPackageTour;
  heroImage: string;
}

const TourHeroSection = ({ tour, heroImage }: TourHeroSectionProps) => {
  return (
    <section className="relative">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-primary hover:underline font-medium">
              METROPOL TOURS
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Link to="/" className="text-primary hover:underline">
              {tour.country || 'Europa'}
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{tour.destination}</span>
          </nav>
        </div>
      </div>

      {/* Title Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {tour.destination}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{tour.location}</span>
                </div>
                {tour.category && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                    {tour.category}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Teilen</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Merken</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Image */}
          <div className="lg:col-span-2 relative aspect-[16/10] lg:aspect-[16/9] rounded-xl overflow-hidden shadow-lg">
            <img
              src={heroImage}
              alt={tour.destination}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 right-4">
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white/90 backdrop-blur hover:bg-white shadow-lg"
              >
                <span className="text-xs font-medium">Alle Bilder</span>
              </Button>
            </div>
            {tour.is_featured && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-accent text-accent-foreground shadow-lg">
                  Empfehlung
                </Badge>
              </div>
            )}
          </div>

          {/* Map Placeholder */}
          <div className="hidden lg:flex flex-col gap-4">
            <div className="flex-1 bg-slate-200 rounded-xl overflow-hidden relative min-h-[200px]">
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100">
                <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center mb-3">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Google Maps</span>
                <Button variant="default" size="sm" className="mt-3">
                  Karte aktivieren
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TourHeroSection;
