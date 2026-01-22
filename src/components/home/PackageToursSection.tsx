import { MapPin, Calendar, Palmtree, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import tourCroatia from "@/assets/tour-croatia.jpg";
import tourSlovenia from "@/assets/tour-slovenia.jpg";
import tourBosnia from "@/assets/tour-bosnia.jpg";

const packageTours = [
  {
    destination: "Kroatien",
    location: "Dalmatinische Küste",
    duration: "7 Tage",
    price: "ab 299€",
    image: tourCroatia,
    highlights: ["Strand", "Altstadt", "Meeresfrüchte"],
  },
  {
    destination: "Slowenien",
    location: "Bled & Ljubljana",
    duration: "5 Tage",
    price: "ab 249€",
    image: tourSlovenia,
    highlights: ["Bergsee", "Natur", "Kulinarik"],
  },
  {
    destination: "Bosnien",
    location: "Sarajevo & Mostar",
    duration: "4 Tage",
    price: "ab 199€",
    image: tourBosnia,
    highlights: ["Kultur", "Geschichte", "Gastfreundschaft"],
  },
];

const PackageToursSection = () => {
  const navigate = useNavigate();

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
            <span>Pauschalreisen 2025</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
            Entdecke den Balkan mit{" "}
            <span className="text-primary">METROPOL TOURS</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            All-Inclusive Pauschalreisen zu traumhaften Zielen. Bus, Hotel & Ausflüge – 
            alles aus einer Hand. Entspannt reisen, unvergesslich erleben.
          </p>
        </div>

        {/* Tour Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {packageTours.map((tour, index) => (
            <div
              key={tour.destination}
              className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={tour.image}
                  alt={tour.destination}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white">{tour.destination}</h3>
                  <div className="flex items-center gap-1 text-white/80 text-sm">
                    <MapPin className="w-3 h-3" />
                    {tour.location}
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  {tour.price}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>{tour.duration}</span>
                  <span className="mx-2">•</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {tour.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => navigate(`/pauschalreisen/${tour.destination.toLowerCase()}`)}
                >
                  Mehr erfahren
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-6">
            Über 50 weitere Reiseziele verfügbar – von Städtetrips bis Strandurlaub
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/service")}
            className="bg-primary hover:bg-primary/90"
          >
            Alle Pauschalreisen entdecken
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PackageToursSection;
