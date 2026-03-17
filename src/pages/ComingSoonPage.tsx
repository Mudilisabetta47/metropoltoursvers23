import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock, Bus, MapPin, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

// Launch date — adjust as needed
const LAUNCH_DATE = new Date("2025-08-01T00:00:00+02:00");

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

const FlipDigit = ({ value, label }: { value: number; label: string }) => {
  const display = String(value).padStart(2, "0");
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={display}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
            className="relative"
          >
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl px-4 py-3 sm:px-6 sm:py-5 md:px-8 md:py-6 min-w-[70px] sm:min-w-[90px] md:min-w-[120px] shadow-2xl shadow-primary/10">
              <span className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-b from-white via-white/90 to-white/60 bg-clip-text text-transparent tabular-nums">
                {display}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
        {/* Reflection */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-primary/20 blur-xl rounded-full" />
      </div>
      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-white/40">
        {label}
      </span>
    </div>
  );
};

const FloatingOrb = ({ delay, size, x, y }: { delay: number; size: number; x: string; y: string }) => (
  <motion.div
    className="absolute rounded-full bg-gradient-to-br from-primary/30 to-primary/5 blur-3xl"
    style={{ width: size, height: size, left: x, top: y }}
    animate={{
      y: [0, -30, 0],
      x: [0, 15, 0],
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.6, 0.3],
    }}
    transition={{
      duration: 6 + delay,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  />
);

const ComingSoonPage = () => {
  const [time, setTime] = useState(getTimeLeft);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#05080f] overflow-hidden flex flex-col items-center justify-center">
      {/* Animated background */}
      <div className="absolute inset-0">
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.07] rounded-full blur-[150px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        {/* Floating orbs */}
        <FloatingOrb delay={0} size={200} x="10%" y="20%" />
        <FloatingOrb delay={2} size={150} x="80%" y="60%" />
        <FloatingOrb delay={4} size={100} x="60%" y="15%" />
        <FloatingOrb delay={1} size={180} x="25%" y="70%" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 md:gap-12 px-4 max-w-4xl">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <Logo size="lg" />
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-2 text-primary/80">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-[0.4em]">Bald verfügbar</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white leading-tight">
            Dein nächstes Abenteuer
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              wartet auf dich.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-white/40 max-w-lg mx-auto leading-relaxed">
            Wir arbeiten an etwas Großem. Komfortable Busreisen durch den Balkan — 
            bequem buchen, sicher reisen, unvergesslich erleben.
          </p>
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="flex items-center gap-2 sm:gap-4 md:gap-6"
        >
          <FlipDigit value={time.days} label="Tage" />
          <span className="text-2xl sm:text-4xl md:text-6xl font-thin text-white/20 self-start mt-3 sm:mt-5 md:mt-6">:</span>
          <FlipDigit value={time.hours} label="Stunden" />
          <span className="text-2xl sm:text-4xl md:text-6xl font-thin text-white/20 self-start mt-3 sm:mt-5 md:mt-6">:</span>
          <FlipDigit value={time.minutes} label="Minuten" />
          <span className="text-2xl sm:text-4xl md:text-6xl font-thin text-white/20 self-start mt-3 sm:mt-5 md:mt-6">:</span>
          <FlipDigit value={time.seconds} label="Sekunden" />
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9, ease: [0.16, 1, 0.3, 1] as const }}
          className="flex flex-wrap justify-center gap-3"
        >
          {[
            { icon: Bus, label: "Premium Busse" },
            { icon: MapPin, label: "8 Länder" },
            { icon: Sparkles, label: "All-Inclusive" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm"
            >
              <item.icon className="w-3.5 h-3.5 text-primary/70" />
              <span className="text-xs font-medium text-white/50">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Admin access button — subtle bottom-right */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        onClick={() => navigate("/auth")}
        className="absolute bottom-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all duration-300 text-xs"
      >
        <Lock className="w-3 h-3" />
        <span>Admin</span>
      </motion.button>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
};

export default ComingSoonPage;
