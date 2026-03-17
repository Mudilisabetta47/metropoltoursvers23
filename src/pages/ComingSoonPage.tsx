import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock, Bus, Shield, Wifi, Globe, ChevronRight } from "lucide-react";

const Bus3DScene = lazy(() => import("@/components/three/Bus3DScene"));

// Launch in ~2 months
const LAUNCH_DATE = new Date("2025-09-17T00:00:00+02:00");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const getTimeLeft = (): TimeLeft => {
  const diff = Math.max(0, LAUNCH_DATE.getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

/* ─── Animated digit card ─── */
const CountdownUnit = ({ value, label }: { value: number; label: string }) => {
  const display = String(value).padStart(2, "0");
  const digits = display.split("");

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1.5 sm:gap-2">
        {digits.map((d, i) => (
          <div key={`${label}-${i}`} className="relative">
            {/* Glow behind */}
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-2xl scale-150 opacity-40" />
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-b from-white/[0.07] via-white/[0.03] to-transparent border border-white/[0.08] backdrop-blur-xl w-[38px] h-[54px] sm:w-[52px] sm:h-[72px] md:w-[68px] md:h-[96px] flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
              {/* Top half shine */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.06] to-transparent" />
              {/* Center line */}
              <div className="absolute left-0 right-0 top-1/2 h-px bg-black/30" />
              <div className="absolute left-0 right-0 top-1/2 translate-y-px h-px bg-white/[0.05]" />
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={d}
                  initial={{ y: -30, opacity: 0, filter: "blur(4px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: 30, opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] as const }}
                  className="relative z-10 text-2xl sm:text-4xl md:text-6xl font-black tabular-nums bg-gradient-to-b from-white via-white/95 to-white/50 bg-clip-text text-transparent"
                >
                  {d}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
      <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold uppercase tracking-[0.35em] text-white/30">
        {label}
      </span>
    </div>
  );
};

/* ─── Separator colon ─── */
const Separator = () => (
  <div className="flex flex-col gap-2.5 sm:gap-3 pb-6 sm:pb-7">
    <motion.div
      animate={{ opacity: [0.2, 0.8, 0.2] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary/80"
    />
    <motion.div
      animate={{ opacity: [0.2, 0.8, 0.2] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary/80"
    />
  </div>
);

/* ─── Particle system ─── */
const Particle = ({ index }: { index: number }) => {
  const size = useMemo(() => Math.random() * 3 + 1, []);
  const startX = useMemo(() => Math.random() * 100, []);
  const duration = useMemo(() => Math.random() * 15 + 10, []);
  const delay = useMemo(() => Math.random() * 10, []);

  return (
    <motion.div
      className="absolute rounded-full bg-primary/40"
      style={{ width: size, height: size, left: `${startX}%`, bottom: -10 }}
      animate={{
        y: [0, -window.innerHeight - 20],
        x: [0, (Math.random() - 0.5) * 200],
        opacity: [0, 0.6, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: "linear",
      }}
    />
  );
};

/* ─── Horizontal light beam ─── */
const LightBeam = ({ y, delay }: { y: string; delay: number }) => (
  <motion.div
    className="absolute left-0 h-px w-full"
    style={{ top: y }}
    animate={{ opacity: [0, 0.15, 0], x: ["-100%", "100%"] }}
    transition={{ duration: 8, repeat: Infinity, delay, ease: "linear" }}
  >
    <div className="h-px w-1/3 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
  </motion.div>
);

/* ─── Main page ─── */
const ComingSoonPage = () => {
  const [time, setTime] = useState(getTimeLeft);
  const navigate = useNavigate();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlightX = useTransform(mouseX, (v) => v - 400);
  const spotlightY = useTransform(mouseY, (v) => v - 400);

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  const totalSeconds = time.days * 86400 + time.hours * 3600 + time.minutes * 60 + time.seconds;
  const totalLaunch = Math.floor((LAUNCH_DATE.getTime() - (LAUNCH_DATE.getTime() - 60 * 86400 * 1000)) / 1000);
  const progress = Math.min(1, Math.max(0, 1 - totalSeconds / totalLaunch));

  return (
    <div
      className="fixed inset-0 bg-[#030608] overflow-hidden flex flex-col"
      onMouseMove={handleMouseMove}
    >
      {/* ── Background layers ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }} />

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }} />

        {/* Mouse spotlight */}
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full"
          style={{
            x: spotlightX,
            y: spotlightY,
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
          }}
        />

        {/* Central glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px]">
          <div className="absolute inset-0 bg-primary/[0.04] blur-[180px] rounded-full" />
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-blue-500/[0.03] blur-[120px] rounded-full" />
        </div>

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(3,6,8,0.8)_100%)]" />

        {/* Top & bottom accent lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        {/* Light beams */}
        <LightBeam y="20%" delay={0} />
        <LightBeam y="50%" delay={3} />
        <LightBeam y="80%" delay={6} />

        {/* Particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <Particle key={i} index={i} />
        ))}
      </div>

      {/* ── 3D Bus ── */}
      <Suspense fallback={null}>
        <Bus3DScene />
      </Suspense>


      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:gap-8 md:gap-10 max-w-5xl w-full">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }}
            className="flex items-center gap-3"
          >
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/70 flex items-center justify-center shadow-[0_0_40px_rgba(var(--primary-rgb,59,130,246),0.3)]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/25 to-transparent" />
              <Bus className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground relative z-10" />
            </div>
            <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
              <span className="text-white">METROPOL</span>
              {' '}
              <span className="text-primary">TOURS</span>
            </span>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/[0.06] backdrop-blur-sm">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-primary"
              />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.3em] text-primary/90">
                Launch Countdown
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] as const }}
            className="text-center space-y-4"
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
              Etwas Großes
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                  kommt bald.
                </span>
                {/* Underline glow */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1.2, duration: 1, ease: [0.16, 1, 0.3, 1] as const }}
                  className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary/50 to-transparent origin-left"
                />
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/35 max-w-xl mx-auto leading-relaxed font-light">
              Premium Busreisen durch den Balkan — komfortabel, sicher und unvergesslich.
              <br className="hidden sm:block" />
              Wir starten in Kürze.
            </p>
          </motion.div>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.9, duration: 1, ease: [0.16, 1, 0.3, 1] as const }}
            className="relative"
          >
            {/* Glow behind countdown */}
            <div className="absolute inset-0 -m-8 bg-primary/[0.04] blur-3xl rounded-3xl" />
            <div className="relative flex items-center gap-3 sm:gap-4 md:gap-6">
              <CountdownUnit value={time.days} label="Tage" />
              <Separator />
              <CountdownUnit value={time.hours} label="Stunden" />
              <Separator />
              <CountdownUnit value={time.minutes} label="Minuten" />
              <Separator />
              <CountdownUnit value={time.seconds} label="Sekunden" />
            </div>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "100%" }}
            transition={{ delay: 1.3, duration: 1 }}
            className="max-w-md w-full mx-auto"
          >
            <div className="flex justify-between text-[10px] sm:text-xs text-white/25 mb-2 font-medium">
              <span>Fortschritt</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ delay: 1.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] as const }}
                className="h-full rounded-full bg-gradient-to-r from-primary/60 via-primary to-blue-400/80 relative"
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
              </motion.div>
            </div>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full max-w-2xl"
          >
            {[
              { icon: Bus, label: "Premium Flotte", sub: "Modernste Busse" },
              { icon: Globe, label: "8 Länder", sub: "Balkan & mehr" },
              { icon: Shield, label: "Sicher reisen", sub: "Versichert" },
              { icon: Wifi, label: "Online buchen", sub: "24/7 Service" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
                whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.04)" }}
                className="group flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] transition-colors duration-300 cursor-default"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
                </div>
                <div className="text-center">
                  <div className="text-[11px] sm:text-xs font-semibold text-white/60 group-hover:text-white/80 transition-colors">{item.label}</div>
                  <div className="text-[9px] sm:text-[10px] text-white/25">{item.sub}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Admin access — very subtle ── */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1.5 }}
        onClick={() => navigate("/auth")}
        className="absolute bottom-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/15 hover:text-white/40 hover:bg-white/[0.03] transition-all duration-500 text-[10px] group"
      >
        <Lock className="w-2.5 h-2.5" />
        <span className="font-medium tracking-wider">ADMIN</span>
        <ChevronRight className="w-2.5 h-2.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
      </motion.button>

      {/* Shimmer keyframe injection */}
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
