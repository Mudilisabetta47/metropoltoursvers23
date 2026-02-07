import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Calendar, Users, ArrowRight, Star, Clock, Euro } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePackageTours } from "@/hooks/useCMS";

// Import tour images
import tourCroatia from "@/assets/tour-croatia.jpg";
import tourSlovenia from "@/assets/tour-slovenia.jpg";
import tourBosnia from "@/assets/tour-bosnia.jpg";
import tourMontenegro from "@/assets/tour-montenegro.jpg";
import tourSerbien from "@/assets/tour-serbien.jpg";
import tourNordmazedonien from "@/assets/tour-nordmazedonien.jpg";
import tourAlbanien from "@/assets/tour-albanien.jpg";
import tourKosovo from "@/assets/tour-kosovo.jpg";
import heroBeach from "@/assets/hero-beach-swimming.jpg";

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

const ReisenPage = () => {
  const navigate = useNavigate();
  const { tours, isLoading } = usePackageTours();

  const getImageSrc = (imageUrl: string | null, destination: string) => {
    if (imageUrl && imageMap[imageUrl]) {
      return imageMap[imageUrl];
    }
    const fallbackKey = `/tour-${destination.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')}.jpg`;
    return imageMap[fallbackKey] || tourCroatia;
  };

  // Group tours by country for better organization
  const toursByCountry = tours.reduce((acc, tour) => {
    const country = tour.country || 'Europa';
    if (!acc[country]) acc[country] = [];
    acc[country].push(tour);
    return acc;
  }, {} as Record<string, typeof tours>);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="relative min-h-[50vh] lg:min-h-[60vh] flex items-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={heroBeach}
              alt="Traumhafter Strandurlaub"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
          </div>
          
          <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
                Entdecken Sie unsere Pauschalreisen
              </h1>
              <p className="text-lg lg:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
                Von traumhaften Stränden bis zu historischen Städten – finden Sie Ihre perfekte Reise 
                mit Komfort, Service und unvergesslichen Erlebnissen.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  <span>Inkl. Übernachtung & Frühstück</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>Erfahrene Reiseleitung</span>
                </div>
                <div className="flex items-center gap-2">
                  <Euro className="w-5 h-5" />
                  <span>Transparente Preise</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Tours Grid */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-muted" />
                    <div className="p-6 space-y-3">
                      <div className="h-6 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-10 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tours.length === 0 ? (
              <div className="text-center py-16">
                <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Keine Reisen verfügbar</h2>
                <p className="text-muted-foreground mb-6">
                  Aktuell sind keine Pauschalreisen verfügbar. Schauen Sie bald wieder vorbei!
                </p>
                <Button onClick={() => navigate("/")} variant="outline">
                  Zurück zur Startseite
                </Button>
              </div>
            ) : (
              <div className="space-y-16">
                {Object.entries(toursByCountry).map(([country, countryTours]) => (
                  <div key={country}>
                    <div className="flex items-center gap-4 mb-8">
                      <h2 className="text-2xl lg:text-3xl font-bold text-foreground">{country}</h2>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-muted-foreground">{countryTours.length} Reisen</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {countryTours.map((tour, index) => (
                        <motion.div
                          key={tour.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer"
                          onClick={() => navigate(`/reisen/${tour.slug || tour.id}`)}
                        >
                          {/* Image */}
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <img
                              src={getImageSrc(tour.image_url, tour.destination)}
                              alt={tour.destination}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            
                            {/* Badges */}
                            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                              {tour.is_featured && (
                                <Badge className="bg-accent text-accent-foreground">
                                  <Star className="w-3 h-3 mr-1" />
                                  Beliebt
                                </Badge>
                              )}
                              {tour.discount_percent > 0 && (
                                <Badge variant="destructive">
                                  -{tour.discount_percent}%
                                </Badge>
                              )}
                            </div>
                            
                            {/* Destination Name */}
                            <div className="absolute bottom-4 left-4 right-4">
                              <h3 className="text-xl font-bold text-white mb-1">
                                {tour.destination}
                              </h3>
                              <div className="flex items-center gap-2 text-white/80 text-sm">
                                <MapPin className="w-4 h-4" />
                                <span>{tour.location}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="p-5">
                            <div className="flex items-center justify-between gap-4 mb-4">
                              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Clock className="w-4 h-4" />
                                <span>{tour.duration_days} Tage</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(tour.departure_date).toLocaleDateString('de-DE', { 
                                    day: '2-digit', 
                                    month: 'short' 
                                  })}
                                </span>
                              </div>
                            </div>
                            
                            {tour.short_description && (
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {tour.short_description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs text-muted-foreground">ab</span>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-bold text-primary">
                                    {tour.price_from}€
                                  </span>
                                  <span className="text-sm text-muted-foreground">/Person</span>
                                </div>
                              </div>
                              <Button size="sm" className="gap-1">
                                Details
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
              Sie planen eine Gruppenreise?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Ab 20 Personen bieten wir individuelle Angebote mit exklusiven Konditionen. 
              Kontaktieren Sie uns für ein unverbindliches Angebot!
            </p>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/business")}
              className="gap-2"
            >
              Gruppenanfrage stellen
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ReisenPage;
