import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Map, Ticket, User, Luggage } from "lucide-react";
import { cn } from "@/lib/utils";
import { nativeHaptic } from "@/mobile/lib/native";
import { NativePullToRefresh } from "@/mobile/components/NativePullToRefresh";

const TABS = [
  { to: "/app", label: "Entdecken", icon: Compass, end: true },
  { to: "/app/reisen", label: "Reisen", icon: Map },
  { to: "/app/tickets", label: "Tickets", icon: Ticket },
  { to: "/app/meine-reisen", label: "Buchungen", icon: Luggage },
  { to: "/app/profil", label: "Profil", icon: User },
];

export function MobileAppShell({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-[100dvh] max-w-full overflow-x-hidden bg-background text-foreground">
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.995 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0 pb-[calc(6.5rem+env(safe-area-inset-bottom))]"
        >
          <NativePullToRefresh>{children}</NativePullToRefresh>
        </motion.main>
      </AnimatePresence>

      <nav
        aria-label="App-Navigation"
        className="fixed inset-x-0 bottom-0 z-50"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.6rem)" }}
      >
        {/* weicher Verlauf, damit Inhalt sauber unter der Bar ausläuft */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/85 to-transparent" />
        <ul className="relative mx-auto flex max-w-md items-stretch justify-between gap-1 rounded-[26px] border border-border/60 bg-card/90 px-2 py-2 shadow-[0_18px_44px_-22px_hsl(150_20%_8%_/_0.45)] backdrop-blur-2xl [margin-inline:1rem]">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                onClick={() => void nativeHaptic()}
                className={({ isActive }) =>
                  cn(
                    "relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors duration-200",
                    isActive ? "text-primary" : "text-muted-foreground/70",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="tab-pill"
                        className="absolute inset-0 rounded-[18px] bg-primary/10 ring-1 ring-inset ring-primary/20"
                        transition={{ type: "spring", stiffness: 460, damping: 38 }}
                      />
                    )}
                    <motion.span
                      className="relative"
                      animate={isActive ? { y: -1, scale: 1.08 } : { y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 480, damping: 26 }}
                    >
                      <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 1.9} />
                    </motion.span>
                    <span className="relative text-[9px]">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function MobileHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header
      className="sticky top-0 z-40 border-b border-border/40 bg-background/80 px-5 pb-4 backdrop-blur-2xl"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
    >
      <div className="flex items-end justify-between gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-[28px] font-extrabold leading-none tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">{subtitle}</p>
          )}
        </motion.div>
        {right}
      </div>
    </header>
  );
}

export default MobileAppShell;
