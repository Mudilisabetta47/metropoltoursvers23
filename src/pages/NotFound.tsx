import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type LightState = "red" | "yellow" | "green";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [light, setLight] = useState<LightState>("red");
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Auto cycle: red → yellow → red
  useEffect(() => {
    if (navigating) return;
    const interval = setInterval(() => {
      setLight((prev) => (prev === "red" ? "yellow" : "red"));
    }, 2000);
    return () => clearInterval(interval);
  }, [navigating]);

  const handleGoHome = useCallback(() => {
    setLight("green");
    setNavigating(true);
    setTimeout(() => navigate("/"), 800);
  }, [navigate]);

  const messages: Record<LightState, { title: string; sub: string }> = {
    red: {
      title: "Stop! Diese Seite existiert nicht.",
      sub: "Hier geht es leider nicht weiter.",
    },
    yellow: {
      title: "Moment…",
      sub: "Wir suchen die richtige Richtung.",
    },
    green: {
      title: "Freie Fahrt!",
      sub: "Du wirst zur Startseite weitergeleitet.",
    },
  };

  const glowColors: Record<LightState, string> = {
    red: "rgba(239, 68, 68, 0.6)",
    yellow: "rgba(250, 204, 21, 0.6)",
    green: "rgba(34, 197, 94, 0.6)",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Subtle street atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-foreground/5 to-transparent" />
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-1 h-32 bg-foreground/10 rounded-full" />
      </div>

      {/* Ambient glow */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-30 pointer-events-none"
        animate={{ backgroundColor: glowColors[light] }}
        transition={{ duration: 0.6 }}
      />

      {/* Traffic light */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Pole top cap */}
        <div className="w-20 h-3 bg-foreground/20 rounded-t-lg" />

        {/* Ampel body */}
        <div className="relative bg-foreground/90 dark:bg-foreground/80 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl border border-foreground/10">
          {/* Housing brim top */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[calc(100%+8px)] h-2 bg-foreground/70 rounded-t-xl" />

          {(["red", "yellow", "green"] as LightState[]).map((color) => {
            const isActive = light === color;
            const bgMap = {
              red: "bg-red-500",
              yellow: "bg-yellow-400",
              green: "bg-green-500",
            };
            const glowMap = {
              red: "0 0 30px 8px rgba(239,68,68,0.5), 0 0 60px 20px rgba(239,68,68,0.2)",
              yellow: "0 0 30px 8px rgba(250,204,21,0.5), 0 0 60px 20px rgba(250,204,21,0.2)",
              green: "0 0 30px 8px rgba(34,197,94,0.5), 0 0 60px 20px rgba(34,197,94,0.2)",
            };

            return (
              <div key={color} className="relative flex items-center justify-center">
                {/* Visor/hood */}
                <div className="absolute -top-1 w-16 h-4 bg-foreground/80 rounded-t-full" style={{ clipPath: "polygon(10% 100%, 90% 100%, 100% 0%, 0% 0%)" }} />
                <motion.div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-background/10 ${isActive ? bgMap[color] : "bg-foreground/40"}`}
                  animate={{
                    boxShadow: isActive ? glowMap[color] : "none",
                    scale: isActive ? 1.05 : 0.95,
                    opacity: isActive ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              </div>
            );
          })}
        </div>

        {/* Pole */}
        <div className="w-3 h-20 bg-foreground/20 rounded-b" />
      </div>

      {/* Text content */}
      <div className="relative z-10 mt-8 text-center max-w-md">
        <motion.p
          className="text-6xl sm:text-7xl font-bold text-foreground/10 select-none"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          404
        </motion.p>

        <AnimatePresence mode="wait">
          <motion.div
            key={light}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mt-2"
          >
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {messages[light].title}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {messages[light].sub}
            </p>
          </motion.div>
        </AnimatePresence>

        <motion.p
          className="text-muted-foreground/60 text-xs mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Diese Seite hat gerade Rot. Aber wir bringen dich zurück auf Grün.
        </motion.p>

        <motion.div
          className="mt-6 flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button onClick={handleGoHome} size="lg" className="gap-2" disabled={navigating}>
            <Home className="w-4 h-4" />
            Zur Startseite
          </Button>
          <Button variant="outline" size="lg" className="gap-2" onClick={() => navigate(-1)} disabled={navigating}>
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
