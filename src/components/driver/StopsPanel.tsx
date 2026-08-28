import { CheckCircle2, Circle, MapPin, LogIn, LogOut, Navigation } from "lucide-react";
import { OrderStop, STOP_TYPE_LABEL } from "@/hooks/useOrderStops";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  stops: OrderStop[];
  delayMinutes: number;
  onArrive: (stopId: string) => void;
  onDepart: (stopId: string) => void;
  onNavigate: (stop: OrderStop) => void;
  busy?: boolean;
}

const time = (value: string | Date | null) =>
  value ? new Date(value).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "–";

const StopsPanel = ({ stops, delayMinutes, onArrive, onDepart, onNavigate, busy }: Props) => {
  if (stops.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-6 text-center">
        Für diesen Auftrag sind keine Zwischenhalte hinterlegt.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {stops.map((stop, idx) => {
        const done = !!stop.actual_departure;
        const arrived = !!stop.actual_arrival && !done;
        const expected = stop.planned_arrival
          ? new Date(new Date(stop.planned_arrival).getTime() + delayMinutes * 60000)
          : null;
        return (
          <div
            key={stop.id}
            className={cn(
              "rounded-xl border p-3",
              done
                ? "border-zinc-800 bg-zinc-900/50 opacity-70"
                : arrived
                  ? "border-emerald-600 bg-emerald-500/10"
                  : "border-zinc-800 bg-zinc-900",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="pt-0.5">
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-zinc-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold">
                    {idx + 1}. {stop.name}
                  </span>
                  <Badge className="bg-zinc-800 text-zinc-300 text-[10px]">
                    {STOP_TYPE_LABEL[stop.stop_type] ?? stop.stop_type}
                  </Badge>
                </div>
                {stop.address && (
                  <p className="text-xs text-zinc-400 truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" /> {stop.address}
                  </p>
                )}
                <div className="flex gap-4 mt-1 text-xs">
                  <span className="text-zinc-400">Plan: {time(stop.planned_arrival)}</span>
                  <span className={cn(delayMinutes > 0 ? "text-amber-300" : "text-emerald-300")}>
                    Erwartet: {time(stop.actual_arrival ?? expected)}
                    {delayMinutes > 0 && !stop.actual_arrival ? ` (+${delayMinutes} min)` : ""}
                  </span>
                </div>
                {stop.notes && <p className="text-xs text-zinc-400 mt-1">{stop.notes}</p>}
              </div>
            </div>

            {!done && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                <Button
                  variant="outline"
                  className="h-12 text-xs"
                  disabled={busy || !stop.lat}
                  onClick={() => onNavigate(stop)}
                >
                  <Navigation className="w-4 h-4 mr-1" /> Ziel
                </Button>
                <Button
                  variant="outline"
                  className="h-12 text-xs"
                  disabled={busy || arrived}
                  onClick={() => onArrive(stop.id)}
                >
                  <LogIn className="w-4 h-4 mr-1" /> Ankunft
                </Button>
                <Button
                  className="h-12 text-xs bg-emerald-600 hover:bg-emerald-700"
                  disabled={busy}
                  onClick={() => onDepart(stop.id)}
                >
                  <LogOut className="w-4 h-4 mr-1" /> Abfahrt
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StopsPanel;
