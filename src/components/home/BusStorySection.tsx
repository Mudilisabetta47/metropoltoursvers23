import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import BusScene, { type ScrollRef } from "@/components/three/BusScene";

const STEPS = [
  { title: "Ihr Reisebus.", sub: "Bis ins Detail für lange Strecken gebaut." },
  { title: "Ankommen statt fahren.", sub: "Ruhiger Innenraum, moderne Technik, geschulte Fahrer." },
  { title: "Jedes Detail zählt.", sub: "Klimatisierung, WLAN, Beinfreiheit, großer Gepäckraum." },
  { title: "Europa im Blick.", sub: "Abfahrten ab Bremen, Hamburg, Hannover und Berlin." },
];

export default function BusStorySection() {
  const wrap = useRef<HTMLDivElement>(null);
  const scroll = useRef<ScrollRef>({ progress: 0 });
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(false);
  const [mobile, setMobile] = useState(false);
  const reduced = !!useReducedMotion();

  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    scroll.current.progress = v;
    const i = Math.min(STEPS.length - 1, Math.floor(v * STEPS.length));
    setStep((prev) => (prev === i ? prev : i));
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onMq = () => setMobile(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    const el = wrap.current;
    const io = el
      ? new IntersectionObserver((e) => setActive(e[0].isIntersecting), { rootMargin: "120px" })
      : null;
    if (el && io) io.observe(el);
    return () => {
      mq.removeEventListener("change", onMq);
      io?.disconnect();
    };
  }, []);

  return (
    <section ref={wrap} className="relative bg-[#f7f7f7]" style={{ height: mobile ? "260vh" : "400vh" }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0">
          <BusScene scroll={scroll} reduced={reduced || mobile} active={active && !reduced} />
        </div>

        {/* Textebene */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-6 py-16 md:px-16 md:py-20">
          <div className="max-w-2xl">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={false}
                animate={{ opacity: step === i ? 1 : 0, y: step === i ? 0 : 14 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={step === i ? "" : "pointer-events-none absolute"}
              >
                {step === i && (
                  <>
                    <h2 className="text-4xl font-semibold tracking-tight text-[#181818] md:text-6xl">{s.title}</h2>
                    <p className="mt-4 text-base text-[#555555] md:text-xl">{s.sub}</p>
                  </>
                )}
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <span
                key={s.title}
                className={`h-[3px] w-10 rounded-full transition-colors duration-500 ${
                  step >= i ? "bg-[#181818]" : "bg-[#e5e5e5]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
