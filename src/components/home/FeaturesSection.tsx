import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { 
  MapPin, Bus, Ticket, Users,
  School, Trophy, Plane, PartyPopper, ArrowRight, Loader2, Shield, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServiceTypes, useCMSContent } from "@/hooks/useCMS";

const iconMap: Record<string, React.ElementType> = {
  School, Users, MapPin, Trophy, Plane, PartyPopper,
};

const flixFeatures = [
  {
    icon: MapPin,
    title: "Die Welt wartet auf Dich",
    description: "Unendliche Möglichkeiten: Entdecke traumhafte Reiseziele in ganz Europa.",
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/25",
  },
  {
    icon: Bus,
    title: "Unterwegs mit Komfort",
    description: "Genieße kostenloses WLAN, Steckdosen und extra viel Beinfreiheit.",
    gradient: "from-primary to-primary-dark",
    glow: "shadow-primary/25",
  },
  {
    icon: Ticket,
    title: "Auswählen, buchen, reisen",
    description: "Blitzschnell vom Bildschirm zu Deinem Sitzplatz: einfach und unkompliziert.",
    gradient: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/25",
  },
  {
    icon: Users,
    title: "Gemeinsam unterwegs",
    description: "Warum mehr Autos, wenn wir gemeinsam reisen können?",
    gradient: "from-blue-500 to-indigo-600",
    glow: "shadow-blue-500/25",
  },
];

// 3D Tilt Card component
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated counter
function AnimatedNumber({ value, suffix = "" }: { value: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="inline-block"
    >
      {value}{suffix}
    </motion.span>
  );
}

const FeaturesSection = () => {
  const { services, isLoading } = useServiceTypes();
  const { getContent } = useCMSContent();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  const servicesHeadline = getContent('services_headline');

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-32 overflow-hidden bg-background">
      {/* Animated background orbs */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 -right-32 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20"
        >
          {[
            { value: "50.000+", label: "Zufriedene Kunden", icon: Users },
            { value: "200+", label: "Reiseziele", icon: MapPin },
            { value: "99%", label: "Pünktlichkeit", icon: Zap },
            { value: "24/7", label: "Support", icon: Shield },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="relative group"
            >
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 text-center hover:border-primary/30 transition-all duration-500 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
                  <AnimatedNumber value={stat.value} />
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 3D Feature Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24"
          style={{ perspective: "1200px" }}
        >
          {flixFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40, rotateX: 15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <TiltCard className="h-full cursor-default">
                <div className="relative h-full bg-card rounded-3xl p-8 border border-border/50 overflow-hidden group hover:border-primary/20 transition-all duration-500">
                  {/* Glow effect */}
                  <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700`} />
                  
                  {/* Icon */}
                  <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg ${feature.glow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                    style={{ transform: "translateZ(30px)" }}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300"
                    style={{ transform: "translateZ(20px)" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed"
                    style={{ transform: "translateZ(10px)" }}
                  >
                    {feature.description}
                  </p>

                  {/* Bottom accent line */}
                  <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.gradient} w-0 group-hover:w-full transition-all duration-700`} />
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Divider with animation */}
        <div className="relative mb-20">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          />
        </div>

        {/* Travel Types Section */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20"
            >
              <Bus className="w-4 h-4" />
              Unsere Reisearten
            </motion.div>

            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-5 leading-tight">
              {servicesHeadline?.title?.split(' ').slice(0, -1).join(' ') || "Unsere"}{" "}
              <span className="relative">
                <span className="text-primary">{servicesHeadline?.title?.split(' ').slice(-1)[0] || "Reisearten"}</span>
                <motion.svg
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                  className="absolute -bottom-3 left-0 w-full h-4 text-primary/30"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                >
                  <motion.path
                    d="M0,8 Q50,0 100,8 T200,8"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                  />
                </motion.svg>
              </span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {servicesHeadline?.content || "Maßgeschneiderte Transportlösungen für Unternehmen, Vereine, Schulen und private Veranstaltungen."}
            </p>
          </motion.div>

          {/* Services Grid - 3D Cards */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Keine Services verfügbar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12" style={{ perspective: "1200px" }}>
              {services.map((service, index) => {
                const IconComponent = iconMap[service.icon] || Users;
                
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 50, rotateY: -10 }}
                    whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ delay: index * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <TiltCard className="h-full">
                      <Link
                        to="/business"
                        className="group relative block h-full bg-card rounded-3xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5"
                      >
                        {/* Top gradient bar */}
                        <div className="h-1.5 bg-gradient-to-r from-primary via-primary-light to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="p-8">
                          {/* Icon with 3D depth */}
                          <div className="relative mb-6" style={{ transform: "translateZ(25px)" }}>
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3">
                              <IconComponent className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                            </div>
                            {/* Floating dot accent */}
                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-100 scale-0" />
                          </div>
                          
                          <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300"
                            style={{ transform: "translateZ(15px)" }}
                          >
                            {service.name}
                          </h3>
                          
                          <p className="text-muted-foreground text-sm leading-relaxed mb-6"
                            style={{ transform: "translateZ(10px)" }}
                          >
                            {service.description}
                          </p>
                          
                          <div className="flex items-center gap-2 text-primary text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0"
                            style={{ transform: "translateZ(20px)" }}
                          >
                            Mehr erfahren
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                          </div>
                        </div>
                      </Link>
                    </TiltCard>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Link to="/business">
              <Button size="lg" variant="outline" className="gap-2 rounded-full border-2 hover:border-primary hover:bg-primary/5 px-8 group transition-all duration-300">
                Alle Reisearten entdecken
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
