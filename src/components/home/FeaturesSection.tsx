import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { 
  MapPin, Bus, Ticket, Users,
  School, Trophy, Plane, PartyPopper, ArrowRight, Loader2, Shield, Zap, Sparkles
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
    accentColor: "from-emerald-400 to-teal-500",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    icon: Bus,
    title: "Unterwegs mit Komfort",
    description: "Genieße kostenloses WLAN, Steckdosen und extra viel Beinfreiheit.",
    accentColor: "from-primary to-primary-light",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: Ticket,
    title: "Auswählen, buchen, reisen",
    description: "Blitzschnell vom Bildschirm zu Deinem Sitzplatz: einfach und unkompliziert.",
    accentColor: "from-amber-400 to-orange-500",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    icon: Users,
    title: "Gemeinsam unterwegs",
    description: "Warum mehr Autos, wenn wir gemeinsam reisen können?",
    accentColor: "from-blue-400 to-indigo-500",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
];

// 3D Tilt Card component
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });

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

  const bgY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const servicesHeadline = getContent('services_headline');

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-36 overflow-hidden bg-gradient-to-b from-muted/40 via-background to-muted/20">
      {/* Subtle animated background */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-32 -left-20 w-72 h-72 bg-primary/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-32 -right-20 w-64 h-64 bg-accent/[0.04] rounded-full blur-3xl" />
      </motion.div>

      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "32px 32px"
      }} />

      <div className="container mx-auto px-4 relative z-10">
        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-24"
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
              <div className="bg-card border border-border/40 rounded-2xl p-6 text-center hover:border-primary/20 transition-all duration-500 hover:shadow-lg hover:shadow-primary/[0.06] hover:-translate-y-1">
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
                  <AnimatedNumber value={stat.value} />
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Cards - Light & Clean */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-28"
          style={{ perspective: "1200px" }}
        >
          {flixFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <TiltCard className="h-full cursor-default">
                <div className="relative h-full bg-card rounded-2xl p-7 border border-border/40 overflow-hidden group hover:border-primary/20 hover:shadow-xl hover:shadow-primary/[0.06] transition-all duration-500">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl ${feature.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-500`}>
                    <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                  </div>
                  
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Bottom accent */}
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${feature.accentColor} w-0 group-hover:w-full transition-all duration-700`} />
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Travel Types Section - LIGHT & BRIGHT */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-14"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20"
            >
              <Sparkles className="w-4 h-4" />
              Unsere Reisearten
            </motion.div>

            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-5 leading-tight">
              {servicesHeadline?.title?.split(' ').slice(0, -1).join(' ') || "Unsere"}{" "}
              <span className="text-primary">{servicesHeadline?.title?.split(' ').slice(-1)[0] || "Reisearten"}</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {servicesHeadline?.content || "Maßgeschneiderte Transportlösungen für Unternehmen, Vereine, Schulen und private Veranstaltungen."}
            </p>
          </motion.div>

          {/* Services Grid - BRIGHT LIGHT CARDS */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Keine Services verfügbar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12" style={{ perspective: "1200px" }}>
              {services.map((service, index) => {
                const IconComponent = iconMap[service.icon] || Users;
                const cardColors = [
                  { bg: "bg-emerald-50/80", border: "hover:border-emerald-200", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", hoverText: "group-hover:text-emerald-700" },
                  { bg: "bg-blue-50/80", border: "hover:border-blue-200", iconBg: "bg-blue-100", iconColor: "text-blue-600", hoverText: "group-hover:text-blue-700" },
                  { bg: "bg-amber-50/80", border: "hover:border-amber-200", iconBg: "bg-amber-100", iconColor: "text-amber-600", hoverText: "group-hover:text-amber-700" },
                  { bg: "bg-violet-50/80", border: "hover:border-violet-200", iconBg: "bg-violet-100", iconColor: "text-violet-600", hoverText: "group-hover:text-violet-700" },
                  { bg: "bg-rose-50/80", border: "hover:border-rose-200", iconBg: "bg-rose-100", iconColor: "text-rose-600", hoverText: "group-hover:text-rose-700" },
                  { bg: "bg-cyan-50/80", border: "hover:border-cyan-200", iconBg: "bg-cyan-100", iconColor: "text-cyan-600", hoverText: "group-hover:text-cyan-700" },
                ];
                const colors = cardColors[index % cardColors.length];
                
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ delay: index * 0.08, duration: 0.5 }}
                  >
                    <TiltCard className="h-full">
                      <Link
                        to="/business"
                        className={`group relative block h-full ${colors.bg} bg-card rounded-2xl overflow-hidden border border-border/30 ${colors.border} transition-all duration-500 hover:shadow-xl hover:shadow-foreground/[0.04] hover:-translate-y-1`}
                      >
                        <div className="p-7">
                          {/* Icon */}
                          <div className="relative mb-5">
                            <div className={`w-14 h-14 rounded-xl ${colors.iconBg} flex items-center justify-center group-hover:scale-110 transition-all duration-500`}>
                              <IconComponent className={`w-7 h-7 ${colors.iconColor}`} />
                            </div>
                          </div>
                          
                          <h3 className={`text-lg font-bold text-foreground mb-2.5 ${colors.hoverText} transition-colors duration-300`}>
                            {service.name}
                          </h3>
                          
                          <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                            {service.description}
                          </p>
                          
                          <div className={`flex items-center gap-2 ${colors.iconColor} text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-400 translate-y-2 group-hover:translate-y-0`}>
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