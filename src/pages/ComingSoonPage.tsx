import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock, ChevronRight } from "lucide-react";
import heroAsset from "@/assets/maintenance-bus-hero.png.asset.json";

/* ─── Drifting smoke / fog plumes ─── */
const Smoke = ({ delay = 0, x = "20%", scale = 1, opacity = 0.18 }: { delay?: number; x?: string; scale?: number; opacity?: number }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      left: x,
      top: "35%",
      width: 600 * scale,
      height: 600 * scale,
      background: "radial-gradient(circle, rgba(180,210,230,0.35) 0%, rgba(120,160,200,0.12) 40%, transparent 70%)",
      filter: "blur(40px)",
      mixBlendMode: "screen",
    }}
    initial={{ opacity: 0, x: -80, y: 0, scale: 0.8 }}
    animate={{
      opacity: [0, opacity, opacity * 0.6, 0],
      x: [-80, 60, 180],
      y: [0, -40, -80],
      scale: [0.8, 1.1, 1.4],
    }}
    transition={{ duration: 14, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

/* ─── Light streak (street trail) ─── */
const LightTrail = ({ delay = 0, top = "70%" }: { delay?: number; top?: string }) => (
  <motion.div
    className="absolute h-[2px] pointer-events-none"
    style={{
      top,
      left: "-20%",
      width: "60%",
      background: "linear-gradient(90deg, transparent 0%, rgba(120,200,255,0.9) 40%, rgba(255,255,255,1) 50%, rgba(120,200,255,0.9) 60%, transparent 100%)",
      filter: "blur(1px) drop-shadow(0 0 8px rgba(120,200,255,0.8))",
    }}
    animate={{ x: ["0%", "200%"], opacity: [0, 1, 1, 0] }}
    transition={{ duration: 4, repeat: Infinity, delay, ease: "easeOut" }}
  />
);

const ComingSoonPage = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  /* Parallax on scroll */
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);

  /* Subtle mouse parallax */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(useTransform(mx, [-1, 1], [-20, 20]), { stiffness: 50, damping: 20 });
  const py = useSpring(useTransform(my, [-1, 1], [-12, 12]), { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [mx, my]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-[100dvh] w-full overflow-hidden bg-[#03070d] text-white"
    >
      {/* ── HERO IMAGE LAYER ── */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: heroY, scale: heroScale, x: px }}
      >
        {/* Slow cinematic zoom-in */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1.15 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        >
          <img
            src={heroAsset.url}
            alt="Metropol Tours Bus auf nächtlicher Bergstraße"
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ y: py } as React.CSSProperties}
            loading="eager"
            fetchPriority="high"
          />
        </motion.div>

        {/* Cinematic vignette + bottom gradient for legible text */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_45%,transparent_0%,rgba(3,7,13,0.35)_45%,rgba(3,7,13,0.85)_85%,#03070d_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#03070d] via-[#03070d]/70 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#03070d]/70 to-transparent" />
      </motion.div>

      {/* ── ATMOSPHERIC EFFECTS ── */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {/* Smoke drifting across */}
        <Smoke delay={0} x="10%" scale={1.2} opacity={0.22} />
        <Smoke delay={4} x="40%" scale={1} opacity={0.18} />
        <Smoke delay={8} x="65%" scale={1.4} opacity={0.15} />

        {/* Light trails on the road (lower portion) */}
        <LightTrail delay={0} top="62%" />
        <LightTrail delay={1.5} top="68%" />
        <LightTrail delay={3} top="74%" />

        {/* Brake-light pulse glow — right side where rear of bus sits */}
        <motion.div
          className="absolute"
          style={{
            top: "48%",
            right: "18%",
            width: 220,
            height: 220,
            background: "radial-gradient(circle, rgba(255,40,40,0.45) 0%, rgba(255,60,40,0.15) 35%, transparent 70%)",
            filter: "blur(20px)",
            mixBlendMode: "screen",
          }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Headlight beam glow — under the bus */}
        <motion.div
          className="absolute"
          style={{
            top: "62%",
            right: "8%",
            width: 500,
            height: 280,
            background: "conic-gradient(from 200deg at 50% 0%, transparent 0deg, rgba(180,220,255,0.35) 20deg, rgba(220,240,255,0.5) 35deg, rgba(180,220,255,0.35) 50deg, transparent 80deg)",
            filter: "blur(8px)",
            mixBlendMode: "screen",
          }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Distant moon/streetlamp glow — left */}
        <motion.div
          className="absolute"
          style={{
            top: "28%",
            left: "20%",
            width: 180,
            height: 180,
            background: "radial-gradient(circle, rgba(200,225,255,0.6) 0%, transparent 60%)",
            filter: "blur(10px)",
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Brand-green accent glow (subtle) — top right */}
        <motion.div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0,204,54,0.18) 0%, transparent 60%)",
            filter: "blur(60px)",
          }}
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Film grain */}
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* ── CONTENT ── */}
      <div className="relative z-20 min-h-[100dvh] flex flex-col">
        {/* Top brand bar */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="px-6 sm:px-10 pt-8 sm:pt-10 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <motion.div
              animate={{ boxShadow: ["0 0 0px rgba(0,204,54,0)", "0 0 24px rgba(0,204,54,0.6)", "0 0 0px rgba(0,204,54,0)"] }}
              transition={{ duration: 2.4, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-[#00CC36]"
            />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.35em] text-white/70">
              Metropol Tours
            </span>
          </div>
          <span className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.3em] text-white/35">
            Hannover · Europa
          </span>
        </motion.header>

        {/* Centerpiece headline */}
        <motion.div
          style={{ y: textY }}
          className="flex-1 flex flex-col items-center justify-end pb-16 sm:pb-24 px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md"
          >
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-[#00CC36]"
            />
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
              Wartungsmodus
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.7, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="font-black tracking-tight leading-[0.95] text-white"
            style={{
              fontSize: "clamp(2.5rem, 9vw, 7rem)",
              textShadow: "0 0 60px rgba(0,204,54,0.25), 0 0 30px rgba(0,0,0,0.6)",
            }}
          >
            METROPOL{" "}
            <span className="relative inline-block">
              <span
                className="bg-gradient-to-r from-[#00CC36] via-emerald-300 to-[#00CC36] bg-clip-text text-transparent bg-[length:200%_auto]"
                style={{ animation: "shimmer 4s linear infinite" }}
              >
                TOURS
              </span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 sm:mt-8 font-light tracking-wide text-white/90"
            style={{
              fontSize: "clamp(1.25rem, 3.2vw, 2.25rem)",
              textShadow: "0 2px 30px rgba(0,0,0,0.8)",
            }}
          >
            Das Warten hat bald ein Ende.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1.2 }}
            className="mt-4 text-sm sm:text-base text-white/45 max-w-md mx-auto"
          >
            Unsere neue Website ist bald online.
          </motion.p>

          {/* Animated underline */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 1.8, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 h-px w-40 sm:w-60 origin-center bg-gradient-to-r from-transparent via-[#00CC36]/70 to-transparent"
          />

          {/* Contact micro-row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 1 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] sm:text-xs uppercase tracking-[0.25em] text-white/35"
          >
            <span>info@metours.de</span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/20" />
            <span>app.metours.de</span>
          </motion.div>
        </motion.div>

        {/* Subtle admin access */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 1.5 }}
          onClick={() => navigate("/auth")}
          className="absolute bottom-5 right-5 group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-500 text-[10px]"
        >
          <Lock className="w-2.5 h-2.5" />
          <span className="font-medium tracking-[0.2em]">ADMIN</span>
          <ChevronRight className="w-2.5 h-2.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </motion.button>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
};

export default ComingSoonPage;
