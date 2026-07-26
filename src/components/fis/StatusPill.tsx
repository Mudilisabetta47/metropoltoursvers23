import { useState } from "react";
import { Check, ChevronDown, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES: Record<string, { label: string; color: string; dot: string }> = {
  ready: { label: "Bereit", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  on_route: { label: "Unterwegs", color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30", dot: "bg-cyan-400" },
  at_destination: { label: "Am Ziel", color: "bg-blue-500/15 text-blue-300 border-blue-500/30", dot: "bg-blue-400" },
  break: { label: "Pause", color: "bg-amber-500/15 text-amber-300 border-amber-500/30", dot: "bg-amber-400" },
  breakdown: { label: "Störung", color: "bg-red-500/15 text-red-300 border-red-500/30", dot: "bg-red-400" },
  accident: { label: "Unfall", color: "bg-red-600/20 text-red-200 border-red-500/40", dot: "bg-red-500" },
  off_duty: { label: "Feierabend", color: "bg-zinc-700/40 text-zinc-300 border-zinc-600", dot: "bg-zinc-500" },
};

interface Props {
  status: string;
  onChange: (s: string) => void;
}

const StatusPill = ({ status, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const s = STATUSES[status] || STATUSES.off_duty;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition",
          s.color
        )}
      >
        <span className={cn("w-2 h-2 rounded-full animate-pulse", s.dot)} />
        <span className="hidden sm:inline">{s.label}</span>
        <ChevronDown className="w-4 h-4 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-[#131720] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-500 border-b border-white/5">
              Status ändern
            </div>
            {Object.entries(STATUSES).map(([key, v]) => (
              <button
                key={key}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-left transition"
              >
                <span className={cn("w-2.5 h-2.5 rounded-full", v.dot)} />
                <span className="flex-1 text-sm text-white">{v.label}</span>
                {status === key && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const statusMeta = STATUSES;
export default StatusPill;
