import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Map, Ticket, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/app", label: "Entdecken", icon: Compass, end: true },
  { to: "/app/reisen", label: "Reisen", icon: Map },
  { to: "/app/meine-reisen", label: "Meine Reisen", icon: Ticket },
  { to: "/app/profil", label: "Profil", icon: User },
];

export function MobileAppShell({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <nav
        aria-label="App-Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/85 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 py-1.5">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "relative flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="tab-pill"
                        className="absolute inset-0 rounded-2xl bg-primary/10"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <Icon className={cn("relative h-5 w-5", isActive && "scale-110 transition-transform")} />
                    <span className="relative">{label}</span>
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
      className="sticky top-0 z-40 border-b border-border/50 bg-background/85 px-5 pb-3 backdrop-blur-xl"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.9rem)" }}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

export default MobileAppShell;
