import { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatWidgetProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  trend?: { value: number; direction: "up" | "down" | "flat"; label?: string };
  accent?: "default" | "success" | "warning" | "danger";
  onClick?: () => void;
}

const accentMap = {
  default: "border-zinc-800",
  success: "border-[#00CC36]/30",
  warning: "border-amber-500/30",
  danger: "border-red-500/30",
};

const accentGlow = {
  default: "",
  success: "shadow-[0_0_30px_-15px_rgba(0,204,54,0.4)]",
  warning: "shadow-[0_0_30px_-15px_rgba(245,158,11,0.4)]",
  danger: "shadow-[0_0_30px_-15px_rgba(239,68,68,0.4)]",
};

export function StatWidget({ label, value, hint, icon, trend, accent = "default", onClick }: StatWidgetProps) {
  const TrendIcon = trend?.direction === "up" ? ArrowUp : trend?.direction === "down" ? ArrowDown : Minus;
  const trendColor =
    trend?.direction === "up" ? "text-[#00CC36]" : trend?.direction === "down" ? "text-red-400" : "text-zinc-500";

  return (
    <div
      onClick={onClick}
      className={cn(
        "cockpit-glass rounded-xl p-4 border transition-all",
        accentMap[accent],
        accentGlow[accent],
        onClick && "cursor-pointer hover:border-zinc-700 hover:bg-white/[0.04]"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</span>
        {icon && <div className="text-zinc-400">{icon}</div>}
      </div>
      <div className="text-2xl font-bold text-white tracking-tight tabular-nums">{value}</div>
      <div className="flex items-center justify-between mt-2 gap-2">
        {hint && <span className="text-[11px] text-zinc-500 truncate">{hint}</span>}
        {trend && (
          <span className={cn("flex items-center gap-1 text-[11px] font-medium ml-auto", trendColor)}>
            <TrendIcon className="w-3 h-3" />
            {trend.value > 0 && trend.direction !== "flat" ? "+" : ""}
            {trend.value}%
            {trend.label && <span className="text-zinc-500 ml-1">{trend.label}</span>}
          </span>
        )}
      </div>
    </div>
  );
}
