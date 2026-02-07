import { 
  MapPin, 
  ArrowRight, 
  Loader2,
  Hotel,
  Bus,
  Clock,
  Users,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { usePackageTours, useCMSContent } from "@/hooks/useCMS";
import { format, parseISO, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";

// Import local images as fallbacks
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

const PackageToursSection = () => {
  const navigate = useNavigate();
  const { tours, isLoading } = usePackageTours();
  const { getContent } = useCMSContent();

  const headline = getContent('package_tours_headline');
  const badge = headline?.metadata?.badge as string || "Pauschalreisen 2025";

  const getImageSrc = (imageUrl: string | null, destination: string) => {
    if (imageUrl && imageMap[imageUrl]) {
      return imageMap[imageUrl];
    }
    const fallbackKey = `/tour-${destination.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')}.jpg`;
    return imageMap[fallbackKey] || tourCroatia;
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEE, dd. MMM yyyy', { locale: de });
    } catch {
      return dateStr;
    }
  };

  const getNights = (departure: string, returnDate: string) => {
    try {
      return differenceInDays(parseISO(returnDate), parseISO(departure));
    } catch {
      return 0;
    }
  };

  if (isLoading) {
    return (
      <section className="py-20 lg:py-28 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-background to-muted/30 relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-0">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {badge}
          </Badge>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
            {headline?.title || "Busreisen mit Komfort"}
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {headline?.content || "Entspannt reisen: Busfahrt, Hotel und Frühstück – alles in einem Paket. Einfach einsteigen und ankommen."}
          </p>
        </div>

        {/* Tour Cards - Professional DB Style */}
        {tours.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aktuell sind keine Reisen verfügbar. Schauen Sie später wieder vorbei.</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-5xl mx-auto mb-12">
            {tours.slice(0, 6).map((tour) => {
              const nights = getNights(tour.departure_date, tour.return_date);
              
              return (
                <div
                  key={tour.id}
                  onClick={() => navigate(`/reisen/${tour.slug || tour.id}`)}
                  className="group bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Image */}
                    <div className="relative w-full lg:w-64 h-48 lg:h-auto shrink-0 overflow-hidden">
                      <img
                        src={getImageSrc(tour.image_url, tour.destination)}
                        alt={tour.destination}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/10" />
                      
                      {/* Mobile Title Overlay */}
                      <div className="absolute bottom-3 left-3 lg:hidden">
                        <h3 className="text-xl font-bold text-white">{tour.destination}</h3>
                        <div className="flex items-center gap-1.5 text-white/90 text-sm">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{tour.country}</span>
                        </div>
                      </div>
                      
                      {/* Discount Badge */}
                      {tour.discount_percent > 0 && (
                        <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground shadow-lg">
                          -{tour.discount_percent}% Frühbucher
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 lg:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-8">
                        {/* Main Info */}
                        <div className="flex-1 space-y-3">
                          {/* Title - Desktop */}
                          <div className="hidden lg:block">
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                              {tour.destination}
                            </h3>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-0.5">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{tour.location}, {tour.country}</span>
                            </div>
                          </div>

                          {/* Travel Dates - DB Style */}
                          <div className="bg-muted/50 rounded-lg p-3 lg:p-4">
                            <div className="flex items-center gap-4 lg:gap-6">
                              {/* Departure */}
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Hinfahrt</p>
                                <p className="font-semibold text-foreground">{formatDate(tour.departure_date)}</p>
                              </div>
                              
                              <div className="flex flex-col items-center px-2">
                                <div className="w-8 h-px bg-primary/40" />
                                <div className="flex items-center gap-1 my-1">
                                  <Bus className="w-4 h-4 text-primary" />
                                </div>
                                <div className="w-8 h-px bg-primary/40" />
                              </div>
                              
                              {/* Return */}
                              <div className="flex-1 text-right lg:text-left">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Rückfahrt</p>
                                <p className="font-semibold text-foreground">{formatDate(tour.return_date)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Features */}
                          <div className="flex flex-wrap gap-2 lg:gap-3">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4 text-primary/70" />
                              <span>{tour.duration_days} Tage</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Hotel className="w-4 h-4 text-primary/70" />
                              <span>{nights} Übernachtungen</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Users className="w-4 h-4 text-primary/70" />
                              <span>Max. {tour.max_participants || 50} Pers.</span>
                            </div>
                          </div>

                          {/* Highlights */}
                          {tour.highlights && tour.highlights.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {tour.highlights.slice(0, 4).map((highlight) => (
                                <Badge 
                                  key={highlight} 
                                  variant="outline" 
                                  className="text-xs font-normal bg-background"
                                >
                                  {highlight}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Price & CTA */}
                        <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border lg:pl-6 lg:min-w-[140px]">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-0.5">pro Person ab</p>
                            <p className="text-3xl font-bold text-primary">
                              {tour.price_from.toFixed(0)}
                              <span className="text-lg font-semibold ml-0.5">€</span>
                            </p>
                            <p className="text-xs text-muted-foreground">inkl. Bus & Hotel</p>
                          </div>
                          
                          <Button 
                            className="shrink-0 gap-1 group-hover:bg-primary group-hover:text-primary-foreground"
                            variant="outline"
                          >
                            Auswählen
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Included Info Bar */}
        <div className="max-w-4xl mx-auto mb-10">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 lg:p-6">
            <p className="text-sm font-semibold text-emerald-800 mb-3 text-center">Bei allen Pauschalreisen inklusive:</p>
            <div className="flex flex-wrap justify-center gap-4 lg:gap-8 text-sm text-emerald-700">
              <div className="flex items-center gap-2">
                <Bus className="w-5 h-5" />
                <span>Bushin- & Rückfahrt</span>
              </div>
              <div className="flex items-center gap-2">
                <Hotel className="w-5 h-5" />
                <span>Übernachtung im Hotel</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Frühstück täglich</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => navigate("/service")}
            className="bg-primary hover:bg-primary/90 shadow-lg"
          >
            Alle Reiseziele entdecken
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PackageToursSection;
