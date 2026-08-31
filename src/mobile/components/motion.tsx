import { ReactNode, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Sanftes Einblenden mit leichtem Versatz. */
export function FadeIn({
  children,
  delay = 0,
  y = 14,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Scroll-Reveal – blendet Inhalte beim Sichtbarwerden ein. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Container für gestaffelte Karten-Animationen. */
export function Stagger({
  children,
  className,
  gap = 0.055,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Druck-Feedback für Karten & Buttons. */
export function Pressable({
  children,
  className,
  onClick,
  disabled,
  as = "button",
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  as?: "button" | "div";
  ariaLabel?: string;
}) {
  const Comp = as === "button" ? motion.button : motion.div;
  return (
    <Comp
      aria-label={ariaLabel}
      // @ts-expect-error – motion.div kennt disabled nicht
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      whileTap={disabled ? undefined : { scale: 0.975 }}
      whileHover={disabled ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className={className}
    >
      {children}
    </Comp>
  );
}

/** Animierter Preis – zählt weich auf den neuen Wert. */
export function AnimatedPrice({
  value,
  className,
  currency = true,
}: {
  value: number;
  className?: string;
  currency?: boolean;
}) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 140, damping: 22, mass: 0.6 });
  const text = useTransform(spring, (v) =>
    new Intl.NumberFormat("de-DE", {
      style: currency ? "currency" : "decimal",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v),
  );
  const [flash, setFlash] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    mv.set(value);
    if (first.current) {
      first.current = false;
      return;
    }
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 450);
    return () => clearTimeout(t);
  }, [value, mv]);

  return (
    <motion.span
      animate={flash ? { scale: [1, 1.07, 1] } : { scale: 1 }}
      transition={{ duration: 0.42, ease: EASE }}
      className={cn("tabular-nums", className)}
    >
      <motion.span>{text}</motion.span>
    </motion.span>
  );
}

/** Shimmer-Platzhalter für Ladezustände. */
export function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-muted/60", className)}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
      />
    </div>
  );
}

/** Weiches Auf-/Zuklappen. */
export function Expand({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.32, ease: EASE }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Bottom-Sheet mit Feder-Animation. */
export function BottomSheet({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-background/70 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-[80] max-h-[92dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-card px-5 pt-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
          >
            <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-muted-foreground/30" />
            {title && <h2 className="mb-4 text-lg font-bold">{title}</h2>}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Animiertes Häkchen für Erfolgszustände. */
export function SuccessCheck({ size = 96 }: { size?: number }) {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="relative mx-auto flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <motion.span
        className="absolute inset-0 rounded-full bg-primary/15"
        animate={{ scale: [1, 1.25, 1], opacity: [0.65, 0, 0.65] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="flex h-full w-full items-center justify-center rounded-full bg-primary/15">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.18, type: "spring", stiffness: 320, damping: 16 }}
          className="flex h-[62%] w-[62%] items-center justify-center rounded-full bg-primary"
        >
          <Check className="h-1/2 w-1/2 text-primary-foreground" strokeWidth={3} />
        </motion.span>
      </span>
    </motion.div>
  );
}

/** Horizontale Schritt-Transition im Checkout. */
export function StepSlide({
  stepKey,
  direction,
  children,
}: {
  stepKey: string;
  direction: 1 | -1;
  children: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={stepKey}
        custom={direction}
        initial={{ opacity: 0, x: direction * 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -40 }}
        transition={{ duration: 0.34, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
