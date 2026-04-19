import { motion } from "framer-motion";
import busPhoto from "@/assets/metropol-bus-real.jpg";

/* ─── Real Metropol Tours bus showcase ─── */
export default function Bus3DScene() {
  return (
    <div className="absolute inset-x-0 bottom-0 top-1/3 pointer-events-none overflow-hidden">
      {/* Soft floor reflection / horizon */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/[0.08] via-primary/[0.02] to-transparent" />

      {/* Glow under the bus */}
      <div className="absolute left-1/2 bottom-[12%] -translate-x-1/2 w-[80%] h-32 bg-primary/30 blur-[100px] rounded-full" />

      {/* Bus image with cinematic float */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-x-0 bottom-0 flex items-end justify-center"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-full max-w-[1400px] mx-auto"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%), linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%), linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        >
          <img
            src={busPhoto}
            alt="Metropol Tours Reisebus"
            className="w-full h-auto object-contain opacity-90 drop-shadow-[0_30px_60px_rgba(16,185,129,0.25)]"
            loading="eager"
          />
          {/* Color grade overlay – cool teal/green tint to match brand */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030608]/70 via-transparent to-[#030608]/30 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.08] via-transparent to-primary/[0.08] pointer-events-none mix-blend-overlay" />
        </motion.div>
      </motion.div>
    </div>
  );
}
