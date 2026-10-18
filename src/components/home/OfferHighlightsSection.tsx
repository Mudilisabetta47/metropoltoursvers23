import { motion } from "framer-motion";
import { ArrowRight, Bus, CalendarDays, MapPin, ShieldCheck, Wifi, Armchair } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import sliderBusreise from "@/assets/slider-pauschalreisen.jpg";
import sliderWochenendtrip from "@/assets/slider-wochenendtrips.jpg";

const offers = [
  {
    image: sliderBusreise,
    alt: "Grüner Reisebus von METROPOL TOURS auf einer Küstenstraße am Mittelmeer",
    badge: "Pauschal- & Gruppenreisen",
    title: "Busreisen durch Europa",
    description:
      "Komplette Reisepakete mit Fahrt im modernen Komfort-Bus, sorgfältig ausgewählten Hotels und erlebnisreichem Programm – ab Hannover, Bremen und Hamburg.",
    bullets: ["Fahrt im modernen Reisebus", "Hotels & Programm inklusive", "Persönliche Reiseleitung"],
    cta: "Alle Busreisen ansehen",
    link: "/reisen",
  },
  {
    image: sliderWochenendtrip,
    alt: "Beleuchteter europäischer Altstadtplatz am Abend",
    badge: "Kurztrips ab 99 €",
    title: "Wochenendtrips",
    description:
      "Kurz weg, viel erleben: 2–3 Tage in Europas schönsten Städten – spontan buchbar, unkompliziert und jedes Wochenende mit neuen Zielen.",
    bullets: ["2–3 Tage inkl. Fahrt & Hotel", "Freitags los, sonntags zurück", "Top-Städte wie Paris & Prag"],
    cta: "Wochenendtrips entdecken",
    link: "/wochenendtrips",
  },
];

const OfferHighlightsSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20 mb-5">
            <Bus className="w-4 h-4" />
            Unser Angebot
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Reisen, die <span className="text-primary">ankommen</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Ob ausgiebige Busreise oder spontaner Wochenendtrip – bei uns reisen Sie komfortabel, sicher und ohne Stress.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {offers.map((offer, index) => (
            <motion.div
              key={offer.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.12, duration: 0.6 }}
              className="group relative rounded-3xl overflow-hidden border border-border/40 bg-card shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500"
            >
              <div className="relative h-64 md:h-72 overflow-hidden">
                <img
                  src={offer.image}
                  alt={offer.alt}
                  loading="lazy"
                  width={1920}
                  height={1088}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  {offer.badge}
                </span>
                <h3 className="absolute bottom-4 left-5 right-5 text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                  {offer.title}
                </h3>
              </div>

              <div className="p-6 md:p-8">
                <p className="text-muted-foreground leading-relaxed mb-5">{offer.description}</p>
                <ul className="space-y-2.5 mb-6">
                  {offer.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2.5 text-sm text-foreground">
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link to={offer.link}>
                  <Button className="w-full sm:w-auto rounded-xl gap-2 group/btn font-semibold">
                    {offer.cta}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
        >
          {[
            { icon: Wifi, label: "WLAN & Steckdosen an Bord" },
            { icon: Armchair, label: "Komfort-Sitze mit Beinfreiheit" },
            { icon: CalendarDays, label: "Wöchentliche Abfahrten ab 2027" },
            { icon: MapPin, label: "Zustiege in Norddeutschland" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <f.icon className="w-4 h-4 text-primary" />
              <span className="font-medium">{f.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default OfferHighlightsSection;
