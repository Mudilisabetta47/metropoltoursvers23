import { MapPin, Calendar, Palmtree, Star, ArrowRight, Hotel, Bus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { usePackageTours, useCMSContent } from "@/hooks/useCMS";
import { format, parseISO } from "date-fns";
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
  const badge = headline?.metadata?.badge as string || "Pauschalreisen 2025 – Jetzt Frühbucher-Rabatt sichern!";

  const getImageSrc = (imageUrl: string | null, destination: string) => {
    if (imageUrl && imageMap[imageUrl]) {
      return imageMap[imageUrl];
    }
    const fallbackKey = `/tour-${destination.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')}.jpg`;
    return imageMap[fallbackKey] || tourCroatia;
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: de });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <section className="py-20 lg:py-28 bg-gradient-to-br from-accent/30 via-background to-primary/5">
        <div className="container mx-auto px-4 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-accent/30 via-background to-primary/5 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Palmtree className="w-4 h-4" />
            <span>{badge}</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
            {headline?.title || "Traumziele in Europa"} –{" "}
            <span className="text-primary">{headline?.subtitle || "Ihr Urlaub wartet"}</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {headline?.content || "Entdecken Sie unsere handverlesenen Reiseziele mit Rundum-Sorglos-Paket: Komfortable Busanreise, ausgewählte Hotels & spannende Ausflüge – alles inklusive."}
          </p>
        </div>

        {/* Tour Cards */}
        {tours.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aktuell sind keine Reisen verfügbar. Bitte schauen Sie später wieder vorbei.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {tours.slice(0, 8).map((tour, index) => (
              <div
                key={tour.id}
                className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={getImageSrc(tour.image_url, tour.destination)}
                    alt={tour.destination}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-xl font-bold text-white">{tour.destination}</h3>
                    <div className="flex items-center gap-1 text-white/90 text-sm">
                      <MapPin className="w-3.5 h-3.5" />
                      {tour.location}, {tour.country}
                    </div>
                  </div>
                  {tour.discount_percent > 0 && (
                    <div className="absolute top-3 left-3 bg-accent text-accent-foreground px-2.5 py-1 rounded-full text-xs font-semibold">
                      -{tour.discount_percent}% Rabatt
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Date & Duration */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(tour.departure_date)}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {tour.duration_days} Tage
                    </Badge>
                  </div>

                  {/* Included Features */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5 text-primary" />
                      <span>Bus</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Hotel className="w-3.5 h-3.5 text-primary" />
                      <span>Hotel</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-1">
                    {tour.highlights?.slice(0, 3).map((highlight) => (
                      <span
                        key={highlight}
                        className="px-2 py-0.5 bg-muted rounded-md text-[10px] text-muted-foreground"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">ab</p>
                      <p className="text-2xl font-bold text-primary">{tour.price_from}€</p>
                    </div>
                    <Button
                      size="sm"
                      className="group-hover:bg-primary group-hover:text-primary-foreground"
                      variant="outline"
                      onClick={() => navigate(`/reisen/${tour.slug || tour.id}`)}
                    >
                      Details
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-6">
            Über 50 weitere Reiseziele verfügbar – von Städtetrips bis Strandurlaub
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/reisen")}
            className="bg-primary hover:bg-primary/90 group"
          >
            Alle Pauschalreisen entdecken
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PackageToursSection;
