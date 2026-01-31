import { Link } from "react-router-dom";
import { 
  Wifi, Snowflake, Armchair, Plug, Coffee, Shield,
  Train, School, Users, MapPin, Trophy, Plane, PartyPopper, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const comfortFeatures = [
  {
    icon: Wifi,
    title: "Kostenloses WLAN",
    description: "Surfen, streamen und arbeiten Sie während der gesamten Fahrt.",
  },
  {
    icon: Snowflake,
    title: "Klimaanlage",
    description: "Angenehme Temperatur bei jeder Witterung, das ganze Jahr über.",
  },
  {
    icon: Armchair,
    title: "Bequeme Sitze",
    description: "Großzügiger Sitzabstand und ergonomische Polsterung für Ihren Komfort.",
  },
  {
    icon: Plug,
    title: "Steckdosen",
    description: "Halten Sie Ihre Geräte während der Fahrt aufgeladen.",
  },
  {
    icon: Coffee,
    title: "Bordservice",
    description: "Snacks und Getränke für Ihre Erfrischung während der Reise.",
  },
  {
    icon: Shield,
    title: "Sichere Reise",
    description: "Erfahrene Fahrer und modernste Sicherheitstechnik an Bord.",
  },
];

const businessServices = [
  {
    icon: Train,
    title: "Schienenersatzverkehr",
    description: "Zuverlässiger SEV-Partner der Deutschen Bahn bei Bauarbeiten und Störungen.",
    highlight: "24/7 Bereitschaft",
  },
  {
    icon: School,
    title: "Schulfahrten",
    description: "Sichere Klassenfahrten und Schullandheimtransporte mit erfahrenen Fahrern.",
    highlight: "Kinderfreundlich",
  },
  {
    icon: Users,
    title: "Privatfahrten",
    description: "Individuelle Reisen für Familien, Feiern und besondere Anlässe.",
    highlight: "Flexibel planbar",
  },
  {
    icon: MapPin,
    title: "Shuttle-Service",
    description: "Regelmäßiger Mitarbeitertransfer und Werksverkehr für Unternehmen.",
    highlight: "GPS-Tracking",
  },
  {
    icon: Trophy,
    title: "Vereinsfahrten",
    description: "Transport für Sportvereine, Musikgruppen und Verbände mit Spezialrabatten.",
    highlight: "Vereinskonditionen",
  },
  {
    icon: Plane,
    title: "Flughafentransfer",
    description: "Pünktlicher Gruppentransfer zu allen deutschen Flughäfen.",
    highlight: "Flugtracking",
  },
  {
    icon: PartyPopper,
    title: "Eventfahrten",
    description: "Konzerte, Messen und Großveranstaltungen – professionelle Logistik.",
    highlight: "VIP-Busse verfügbar",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Comfort Features */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Reisen mit <span className="text-primary">Komfort</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Unsere modernen Busse bieten alles, was Sie für eine entspannte Reise brauchen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-24">
          {comfortFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className="card-elevated p-6 lg:p-8 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Business Services */}
        <div className="relative">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-3xl -m-4 lg:-m-8" />
          
          <div className="relative">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 text-primary text-sm font-medium mb-4">
                <Train className="w-4 h-4" />
                Für Geschäftskunden & Gruppen
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Professionelle <span className="text-primary">Services</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Maßgeschneiderte Transportlösungen für Unternehmen, Vereine, Schulen und private Veranstaltungen.
              </p>
            </div>

            {/* Services Grid - Modern Card Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-10">
              {businessServices.map((service, index) => (
                <Link
                  to="/business"
                  key={service.title}
                  className="group relative bg-card rounded-2xl p-5 lg:p-6 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-primary/30 overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Highlight badge */}
                  <div className="absolute top-3 right-3 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {service.highlight}
                  </div>
                  
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">
                    <service.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                  
                  {/* Hover indicator */}
                  <div className="flex items-center gap-1 text-primary text-sm font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    Mehr erfahren
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <Link to="/business">
                <Button size="lg" className="group">
                  Alle Services entdecken
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-4">
                Über 20 Jahre Erfahrung • 50+ moderne Busse • 24/7 Erreichbarkeit
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
