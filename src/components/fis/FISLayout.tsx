import { ReactNode, useEffect, useState } from "react";
import { LayoutDashboard, MapPin, Bus, MessageSquare, Menu, AlertOctagon, Wifi, WifiOff, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FISTab } from "@/pages/FISPage";
import StatusPill from "./StatusPill";
import EmergencyButton from "./EmergencyButton";

interface Props {
  children: ReactNode;
  tab: FISTab;
  onTabChange: (t: FISTab) => void;
  status: string;
  onStatusChange: (s: string) => void;
  userId: string;
}

const tabs: { id: FISTab; label: string; icon: any }[] = [
  { id: "dashboard", label: "Cockpit", icon: LayoutDashboard },
  { id: "trips", label: "Fahrten", icon: MapPin },
  { id: "scan", label: "Scanner", icon: ScanLine },
  { id: "vehicle", label: "Fahrzeug", icon: Bus },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "more", label: "Mehr", icon: Menu },
];

const FISLayout = ({ children, tab, onTabChange, status, onStatusChange, userId }: Props) => {
  const [time, setTime] = useState(new Date());
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      clearInterval(t);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0d13] text-white flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-gradient-to-b from-[#0f1218] to-[#0f1218]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Bus className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="leading-tight">
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Metropol · FIS</div>
              <div className="text-sm font-semibold">Fahrerkabine</div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-400">
            {online ? (
              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-300">
                <Wifi className="w-3.5 h-3.5" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-300">
                <WifiOff className="w-3.5 h-3.5" /> Offline
              </span>
            )}
          </div>

          <div className="text-right leading-tight">
            <div className="text-lg font-mono font-bold tabular-nums">
              {time.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase">
              {time.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" })}
            </div>
          </div>

          <StatusPill status={status} onChange={onStatusChange} />
          <EmergencyButton userId={userId} />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-4 pb-28 md:pb-8">
        {children}
      </main>

      {/* Bottom Tabs (mobile / tablet) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0f1218]/95 backdrop-blur border-t border-white/5 md:hidden">
        <div className="grid grid-cols-6">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 transition-colors touch-manipulation",
                  active ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]")} />
                <span className="text-[10px] font-medium">{t.label}</span>
                {active && <div className="absolute bottom-0 w-8 h-0.5 bg-emerald-400 rounded-t" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Side Tabs (desktop) */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 lg:w-56 bg-[#0f1218] border-r border-white/5 flex-col py-20 gap-1 px-2 z-30">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                active
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="hidden lg:inline text-sm font-medium">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default FISLayout;
