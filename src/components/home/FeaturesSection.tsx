import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MapPin, Bus, Ticket, Users,
  School, Trophy, Plane, PartyPopper, ArrowRight, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServiceTypes, useCMSContent } from "@/hooks/useCMS";

const iconMap: Record<string, React.ElementType> = {
  School,
  Users,
  MapPin,
  Trophy,
  Plane,
  PartyPopper,
};

// FlixBus-style feature highlights
const flixFeatures = [
  {
    icon: MapPin,
    title: "Die Welt wartet auf Dich",
    description: "Unendliche Möglichkeiten: Entdecke traumhafte Reiseziele in ganz Europa.",
    color: "text-primary",
  },
  {
    icon: Bus,
    title: "Unterwegs mit Komfort",
    description: "Genieße kostenloses WLAN, Steckdosen und extra viel Beinfreiheit.",
    color: "text-primary",
  },
  {
    icon: Ticket,
    title: "Auswählen, buchen, reisen",
    description: "Blitzschnell vom Bildschirm zu Deinem Sitzplatz: einfach und unkompliziert.",
    color: "text-primary",
  },
  {
    icon: Users,
    title: "Gemeinsam unterwegs",
    description: "Warum mehr Autos, wenn wir gemeinsam reisen können?",
    color: "text-primary",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

const FeaturesSection = () => {
  const { services, isLoading } = useServiceTypes();
  const { getContent } = useCMSContent();

  const servicesHeadline = getContent('services_headline');

  return (
    <section className="py-16 lg:py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        {/* FlixBus-Style Features - Clean horizontal layout */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-20 border-b border-border pb-16"
        >
          {flixFeatures.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-5 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                <feature.icon className={`w-8 h-8 ${feature.color} transition-transform duration-300 group-hover:scale-110`} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Travel Types Section */}
        <div className="relative">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {servicesHeadline?.title?.split(' ').slice(0, -1).join(' ') || "Unsere"}{" "}
              <span className="text-primary">{servicesHeadline?.title?.split(' ').slice(-1)[0] || "Reisearten"}</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              {servicesHeadline?.content || "Maßgeschneiderte Transportlösungen für Unternehmen, Vereine, Schulen und private Veranstaltungen."}
            </p>
          </div>

          {/* Services Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Keine Services verfügbar.</p>
            </div>
          ) : (
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={containerVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            >
              {services.map((service) => {
                const IconComponent = iconMap[service.icon] || Users;
                
                return (
                  <motion.div key={service.id} variants={itemVariants}>
                    <Link
                      to="/business"
                      className="group relative bg-white rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/30 block hover:-translate-y-1"
                    >
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-all duration-300 group-hover:scale-105">
                        <IconComponent className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                      </div>
                      
                      <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {service.name}
                      </h3>
                      
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                        {service.description}
                      </p>
                      
                      <div className="flex items-center gap-1 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                        Mehr erfahren
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* CTA */}
          <div className="text-center">
            <Link to="/business">
              <Button size="lg" variant="outline" className="gap-2">
                Alle Reisearten entdecken
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
