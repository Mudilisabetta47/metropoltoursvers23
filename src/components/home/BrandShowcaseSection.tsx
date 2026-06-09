import { motion } from "framer-motion";
import { MapPin, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import busCoast from "@/assets/metropol-bus-coast.png.asset.json";
import busRome from "@/assets/metropol-bus-rome.png.asset.json";
import busGroup from "@/assets/metropol-bus-group.png.asset.json";

const cards = [
  {
    img: busCoast.url,
    badge: "Strand & Küste",
    title: "Adria, Mittelmeer & Co.",
    subtitle: "Direkt ans Meer – ohne Stau, ohne Stress.",
    icon: Sparkles,
    to: "/reisen",
  },
  {
    img: busRome.url,
    badge: "Städte Europas",
    title: "Rom, Paris, Prag & Co.",
    subtitle: "Kulturmetropolen bequem im Premium-Reisebus erleben.",
    icon: MapPin,
    to: "/reisen",
  },
  {
    img: busGroup.url,
    badge: "Gruppen & Vereine",
    title: "Gemeinsam reisen",
    subtitle: "Für Familien, Vereine und Firmen – ab 20 Personen.",
    icon: Users,
    to: "/business",
  },
];

const BrandShowcaseSection = () => {
  return (
    <section className="relative py-20 lg:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-5 border border-primary/20">
            <Sparkles className="w-4 h-4" />
            Unsere Flotte unterwegs
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
            Mit METROPOL TOURS{" "}
            <span className="text-primary">durch Europa</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Moderne Reisebusse, erfahrene Fahrer und Erlebnisse, die in Erinnerung bleiben.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <Link
                to={c.to}
                className="group relative block overflow-hidden rounded-3xl shadow-lg shadow-foreground/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 aspect-[4/5]"
              >
                <img
                  src={c.img}
                  alt={c.title}
                  loading="lazy"
                  width={1280}
                  height={720}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute inset-0 p-6 lg:p-7 flex flex-col justify-end text-white">
                  <div className="inline-flex items-center gap-1.5 self-start bg-primary/95 text-primary-foreground rounded-full px-3 py-1 text-xs font-bold mb-3">
                    <c.icon className="w-3.5 h-3.5" />
                    {c.badge}
                  </div>
                  <h3 className="text-2xl font-bold mb-1 leading-tight">{c.title}</h3>
                  <p className="text-white/80 text-sm">{c.subtitle}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandShowcaseSection;
