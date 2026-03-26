import { MapPin, Calendar, Palmtree, Star, ArrowRight, Hotel, Bus, Flame, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { usePackageTours, useCMSContent } from "@/hooks/useCMS";
import { format, parseISO, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";

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

  const getImageSrc = (tour: { image_url: string | null; hero_image_url?: string | null }, destination: string) => {
    const url = tour.hero_image_url || tour.image_url;
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) return url;
    if (url && imageMap[url]) return imageMap[url];
    const fallbackKey = `/tour-${destination.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')}.jpg`;
    return imageMap[fallbackKey] || tourCroatia;
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd. MMM yyyy', { locale: de });
    } catch {
      return dateStr;
    }
  };

  const getUrgencyInfo = (tour: { max_participants: number | null; current_participants: number | null; departure_date: string }) => {
    const remaining = (tour.max_participants || 50) - (tour.current_participants || 0);
    const daysUntil = differenceInDays(parseISO(tour.departure_date), new Date());
    
    if (remaining <= 5 && remaining > 0) {
      return { text: `Nur noch ${remaining} Plätze!`, type: "critical" as const };
    }
    if (remaining <= 10 && remaining > 0) {
      return { text: `Noch ${remaining} Plätze frei`, type: "warning" as const };
    }
    if (daysUntil <= 14 && daysUntil > 0) {
      return { text: `In ${daysUntil} Tagen`, type: "soon" as const };
    }
    return null;
  };

  if (isLoading) {
    return (
      <section className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Skeleton className="h-8 w-64 mx-auto mb-6" />
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-5 w-80 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <Skeleton className="h-56 w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Split tours: first one as featured, rest as grid
  const featuredTour = tours[0];
  const gridTours = tours.slice(1, 7);

  return (
    <section className="py-24 lg:py-32 bg-background relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6 border border-accent/20">
            <Palmtree className="w-4 h-4" />
            <span>{badge}</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
            {headline?.title || "Traumziele in Europa"} –{" "}
            <span className="text-primary">{headline?.subtitle || "Ihr Urlaub wartet"}</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {headline?.content || "Entdecken Sie unsere handverlesenen Reiseziele mit Rundum-Sorglos-Paket: Komfortable Busanreise, ausgewählte Hotels & spannende Ausflüge – alles inklusive."}
          </p>
        </motion.div>

        {/* Tour Cards */}
        {tours.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aktuell sind keine Reisen verfügbar. Bitte schauen Sie später wieder vorbei.</p>
          </div>
        ) : (
          <div className="space-y-8 mb-14">
            {/* Featured Tour - Large Hero Card */}
            {featuredTour && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="group cursor-pointer"
                onClick={() => navigate(`/reisen/${featuredTour.id}`)}
              >
                <div className="relative rounded-3xl overflow-hidden bg-card border border-border/30 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/[0.06] transition-all duration-500">
                  <div className="grid lg:grid-cols-2">
                    {/* Image */}
                    <div className="relative h-64 lg:h-[420px] overflow-hidden">
                      <img
                        src={getImageSrc(featuredTour, featuredTour.destination)}
                        alt={`Reise nach ${featuredTour.destination}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card/80 hidden lg:block" />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent lg:hidden" />
                      
                      {featuredTour.discount_percent > 0 && (
                        <div className="absolute top-4 left-4 bg-accent text-accent-foreground px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
                          -{featuredTour.discount_percent}% Rabatt
                        </div>
                      )}
                      
                      {(() => {
                        const urgency = getUrgencyInfo(featuredTour);
                        return urgency ? (
                          <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg ${
                            urgency.type === "critical" 
                              ? "bg-destructive text-destructive-foreground animate-pulse" 
                              : "bg-card/95 text-foreground"
                          }`}>
                            {urgency.type === "critical" && <Flame className="w-3.5 h-3.5" />}
                            {urgency.text}
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* Content */}
                    <div className="p-8 lg:p-10 flex flex-col justify-center">
                      <Badge className="w-fit mb-4 bg-primary/10 text-primary border-0">
                        <Star className="w-3 h-3 mr-1 fill-primary" /> Top-Reiseziel
                      </Badge>
                      <h3 className="text-3xl lg:text-4xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {featuredTour.destination}
                      </h3>
                      <div className="flex items-center gap-2 text-muted-foreground mb-4">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{featuredTour.location}, {featuredTour.country}</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                        {featuredTour.short_description || featuredTour.description?.substring(0, 200) || "Entdecken Sie dieses traumhafte Reiseziel mit unserem Rundum-Sorglos-Paket."}
                      </p>

                      <div className="flex items-center gap-5 mb-6 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>{formatDate(featuredTour.departure_date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{featuredTour.duration_days} Tage</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-8">
                        {featuredTour.highlights?.slice(0, 4).map((h) => (
                          <span key={h} className="px-3 py-1 bg-muted rounded-lg text-xs text-muted-foreground font-medium">
                            {h}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">ab</p>
                          <p className="text-4xl font-bold text-primary">{featuredTour.price_from}€</p>
                          <p className="text-xs text-muted-foreground">pro Person</p>
                        </div>
                        <Button size="lg" className="gap-2 rounded-xl group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow">
                          Jetzt entdecken
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Grid Tours */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridTours.map((tour, index) => {
                const urgency = getUrgencyInfo(tour);
                return (
                  <motion.div
                    key={tour.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08, duration: 0.5 }}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/reisen/${tour.id}`)}
                  >
                    <div className="bg-card rounded-2xl overflow-hidden border border-border/30 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/[0.05] transition-all duration-500 hover:-translate-y-1 h-full flex flex-col">
                      {/* Image */}
                      <div className="relative h-52 overflow-hidden">
                        <img
                          src={getImageSrc(tour, tour.destination)}
                          alt={`Reise nach ${tour.destination}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-xl font-bold text-white mb-0.5">{tour.destination}</h3>
                          <div className="flex items-center gap-1 text-white/80 text-sm">
                            <MapPin className="w-3.5 h-3.5" />
                            {tour.location}, {tour.country}
                          </div>
                        </div>
                        {tour.discount_percent > 0 && (
                          <div className="absolute top-3 left-3 bg-accent text-accent-foreground px-3 py-1 rounded-lg text-xs font-bold shadow-lg">
                            -{tour.discount_percent}%
                          </div>
                        )}
                        {urgency && (
                          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                            urgency.type === "critical" 
                              ? "bg-destructive text-destructive-foreground animate-pulse" 
                              : urgency.type === "warning"
                              ? "bg-accent/90 text-accent-foreground"
                              : "bg-card/90 text-foreground"
                          }`}>
                            {urgency.type === "critical" && <Flame className="w-3 h-3" />}
                            {urgency.text}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center justify-between text-sm mb-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>{formatDate(tour.departure_date)}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs font-semibold">
                            {tour.duration_days} Tage
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
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

                        <div className="flex flex-wrap gap-1 mb-4">
                          {tour.highlights?.slice(0, 3).map((highlight) => (
                            <span key={highlight} className="px-2 py-0.5 bg-muted rounded-md text-[10px] text-muted-foreground font-medium">
                              {highlight}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
                          <div>
                            <p className="text-xs text-muted-foreground">ab</p>
                            <p className="text-2xl font-bold text-primary">{tour.price_from}€</p>
                          </div>
                          <Button
                            size="sm"
                            className="gap-1.5 rounded-xl"
                            variant="outline"
                          >
                            Details
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-6">
            Über 50 weitere Reiseziele verfügbar – von Städtetrips bis Strandurlaub
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/reisen")}
            className="bg-primary hover:bg-primary/90 group gap-2 rounded-full px-8"
          >
            Alle Pauschalreisen entdecken
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default PackageToursSection;