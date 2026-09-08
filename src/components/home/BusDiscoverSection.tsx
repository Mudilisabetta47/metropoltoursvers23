import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BusShowcase from "@/components/three/BusShowcase";

type Hotspot = {
  id: string;
  label: string;
  text: string;
  /** Position in % der Bühne */
  x: number;
  y: number;
};

const HOTSPOTS: Hotspot[] = [
  { id: "komfort", label: "Sitzkomfort", text: "Verstellbare Reisebus-Sitze mit großzügiger Beinfreiheit – auch auf langen Etappen.", x: 46, y: 44 },
  { id: "wlan", label: "WLAN", text: "Kostenfreies WLAN an Bord, damit Sie unterwegs erreichbar bleiben.", x: 62, y: 33 },
  { id: "klima", label: "Klimaanlage", text: "Dachklimaanlage mit gleichmäßiger Temperaturverteilung im gesamten Innenraum.", x: 55, y: 26 },
  { id: "gepaeck", label: "Gepäckraum", text: "Großer Unterflur-Gepäckraum – auch für Sportgepäck und Gruppenreisen.", x: 34, y: 58 },
  { id: "sicherheit", label: "Sicherheit", text: "Moderne Assistenzsysteme, geprüfte Technik und geschulte Fahrer nach EU-Lenkzeiten.", x: 72, y: 52 },
];

export default function BusDiscoverSection() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = HOTSPOTS.find((h) => h.id === activeId) || null;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => setInView(e[0].isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-white py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-semibold tracking-tight text-[#181818] md:text-5xl">Entdecken Sie Metropol Tours.</h2>
          <p className="mt-4 text-base text-[#555555] md:text-lg">
            Wählen Sie einen Punkt am Fahrzeug – wir zeigen Ihnen, was an Bord auf Sie wartet.
          </p>
        </div>

        <div className="relative mt-10 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white md:aspect-[16/8]">
          <BusShowcase zoom={activeId ? 1 : 0} active={inView} />

          {/* Hotspots */}
          {HOTSPOTS.map((h) => {
            const isActive = h.id === activeId;
            return (
              <button
                key={h.id}
                type="button"
                aria-label={h.label}
                onClick={() => setActiveId(isActive ? null : h.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
              >
                <span className="relative flex h-4 w-4 items-center justify-center">
                  <span
                    className={`absolute h-4 w-4 rounded-full border transition-all duration-300 ${
                      isActive ? "scale-125 border-primary bg-primary/20" : "border-[#181818]/40 bg-white"
                    }`}
                  />
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-primary" : "bg-[#181818]"}`} />
                </span>
              </button>
            );
          })}

          {/* Verbindungslinie + Info */}
          <AnimatePresence>
            {active && (
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute inset-0"
              >
                <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
                  <line
                    x1={`${active.x}%`}
                    y1={`${active.y}%`}
                    x2="8%"
                    y2="86%"
                    stroke="#181818"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                    opacity="0.45"
                  />
                </svg>
                <div className="absolute bottom-6 left-6 max-w-xs border-l-2 border-primary pl-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#555555]">{active.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#181818]">{active.text}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {HOTSPOTS.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setActiveId(activeId === h.id ? null : h.id)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                activeId === h.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-[#e5e5e5] bg-white text-[#181818] hover:border-[#181818]/30"
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
