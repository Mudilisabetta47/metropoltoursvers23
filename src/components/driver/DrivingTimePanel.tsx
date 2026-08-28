import { Clock, Coffee, AlertTriangle, ShieldCheck, Users } from "lucide-react";
import { ComplianceResult, formatHm } from "@/lib/driving/euDrivingRules";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  compliance: ComplianceResult;
  multiDriver: boolean;
  onToggleMultiDriver: (value: boolean) => void;
  onStartBreak: () => void;
  onEndBreak: () => void;
}

const barColor = (level: string) =>
  level === "critical" ? "bg-red-500" : level === "warn" ? "bg-amber-400" : "bg-emerald-500";

const DrivingTimePanel = ({
  compliance,
  multiDriver,
  onToggleMultiDriver,
  onStartBreak,
  onEndBreak,
}: Props) => (
  <div className="space-y-4">
    <div
      className={cn(
        "rounded-xl p-4 flex items-center gap-3",
        compliance.level === "critical"
          ? "bg-red-500/15 text-red-200"
          : compliance.level === "warn"
            ? "bg-amber-500/15 text-amber-200"
            : "bg-emerald-500/10 text-emerald-200",
      )}
    >
      {compliance.level === "ok" ? (
        <ShieldCheck className="w-8 h-8 shrink-0" />
      ) : (
        <AlertTriangle className="w-8 h-8 shrink-0" />
      )}
      <div>
        <p className="text-sm opacity-80">
          {compliance.state === "driving"
            ? "Lenkzeit läuft"
            : compliance.state === "break"
              ? "Pause läuft"
              : "Keine Lenkzeit aktiv"}
        </p>
        <p className="text-xl font-bold">
          {compliance.state === "break"
            ? `Pause ${formatHm(compliance.currentBreakSeconds)}`
            : `Noch ${formatHm(compliance.secondsToBreak)} bis zur Pause`}
        </p>
      </div>
    </div>

    <div className="space-y-3">
      {compliance.items.map((item) => (
        <div key={item.key}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-zinc-300">{item.label}</span>
            <span className="text-zinc-400">
              {formatHm(item.usedSeconds)} / {formatHm(item.limitSeconds)}
            </span>
          </div>
          <Progress
            value={Math.min(100, (item.usedSeconds / item.limitSeconds) * 100)}
            className="h-2 bg-zinc-800"
            indicatorClassName={barColor(item.level)}
          />
          {item.hint && <p className="text-xs text-amber-300 mt-1">{item.hint}</p>}
        </div>
      ))}
    </div>

    <div className="grid grid-cols-2 gap-2">
      {compliance.state === "break" ? (
        <Button className="h-14 bg-emerald-600 hover:bg-emerald-700" onClick={onEndBreak}>
          <Clock className="w-5 h-5 mr-2" /> Pause beenden
        </Button>
      ) : (
        <Button className="h-14 bg-amber-500 hover:bg-amber-600 text-black" onClick={onStartBreak}>
          <Coffee className="w-5 h-5 mr-2" /> Pause starten
        </Button>
      )}
      <Button
        variant="outline"
        className={cn("h-14", multiDriver && "border-emerald-500 text-emerald-300")}
        onClick={() => onToggleMultiDriver(!multiDriver)}
      >
        <Users className="w-5 h-5 mr-2" /> {multiDriver ? "Doppelbesatzung an" : "Doppelbesatzung"}
      </Button>
    </div>

    <p className="text-[11px] leading-relaxed text-zinc-500">
      Richtwerte nach VO (EG) 561/2006. Diese Anzeige ist ein Hilfsmittel und ersetzt nicht den
      digitalen Tachographen – rechtlich verbindlich sind allein dessen Aufzeichnungen.
    </p>
  </div>
);

export default DrivingTimePanel;
