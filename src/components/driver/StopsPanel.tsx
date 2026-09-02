import { useState } from "react";
import {
  CheckCircle2, Circle, MapPin, LogIn, LogOut, Navigation, Plus, Trash2, Loader2, Crosshair,
} from "lucide-react";
import { OrderStop, STOP_TYPE_LABEL } from "@/hooks/useOrderStops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  stops: OrderStop[];
  delayMinutes: number;
  onArrive: (stopId: string) => void;
  onDepart: (stopId: string) => void;
  onNavigate: (stop: OrderStop) => void;
  onAddUnscheduled?: (input: { name: string; notes: string; useGps: boolean }) => Promise<void> | void;
  onRemoveUnscheduled?: (stopId: string) => Promise<void> | void;
  canEdit?: boolean;
  hasGps?: boolean;
  busy?: boolean;
}

const time = (value: string | Date | null) =>
  value ? new Date(value).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "–";

const QUICK_REASONS = ["Zusätzlicher Zustieg", "WC-Halt", "Tankhalt", "Pausenhalt", "Umleitung", "Technischer Halt"];

const StopsPanel = ({
  stops, delayMinutes, onArrive, onDepart, onNavigate,
  onAddUnscheduled, onRemoveUnscheduled, canEdit, hasGps, busy,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [useGps, setUseGps] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !onAddUnscheduled) return;
    setSaving(true);
    try {
      await onAddUnscheduled({ name: name.trim(), notes: notes.trim(), useGps });
      setName("");
      setNotes("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {canEdit && (
        <div className="rounded-xl border border-emerald-700/60 bg-emerald-500/5 p-3">
          {!open ? (
            <Button
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setOpen(true)}
              disabled={busy}
            >
              <Plus className="w-5 h-5 mr-1" /> Außerplanmäßigen Halt anlegen
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400">
                Der Halt wird sofort in der Zentrale und im Live-Tracking angezeigt.
              </p>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bezeichnung, z. B. Raststätte Allertal"
                className="h-12 bg-white text-black"
              />
              <div className="flex flex-wrap gap-2">
                {QUICK_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setName(r)}
                    className="px-3 py-1.5 rounded-full text-[11px] bg-zinc-800 text-zinc-200 border border-zinc-700"
                  >
                    {r}
                  </button>
                ))}
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Grund / Hinweis für die Zentrale (optional)"
                className="bg-white text-black min-h-[72px]"
              />
              <button
                type="button"
                onClick={() => setUseGps((v) => !v)}
                disabled={!hasGps}
                className={cn(
                  "w-full h-11 rounded-lg border text-xs flex items-center justify-center gap-2",
                  useGps && hasGps
                    ? "border-emerald-600 bg-emerald-500/10 text-emerald-300"
                    : "border-zinc-700 text-zinc-400",
                )}
              >
                <Crosshair className="w-4 h-4" />
                {hasGps
                  ? useGps ? "Aktuelle GPS-Position übernehmen" : "Ohne Position speichern"
                  : "Keine GPS-Position verfügbar"}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-12" onClick={() => setOpen(false)} disabled={saving}>
                  Abbrechen
                </Button>
                <Button
                  className="h-12 bg-emerald-600 hover:bg-emerald-700"
                  onClick={submit}
                  disabled={saving || !name.trim()}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                  Halt melden
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {stops.length === 0 && (
        <p className="text-sm text-zinc-500 py-6 text-center">
          Für diesen Auftrag sind keine Zwischenhalte hinterlegt.
        </p>
      )}

      {stops.map((stop, idx) => {
        const done = !!stop.actual_departure;
        const arrived = !!stop.actual_arrival && !done;
        const unscheduled = stop.stop_type === "unscheduled";
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
                  : unscheduled
                    ? "border-amber-600 bg-amber-500/10"
                    : "border-zinc-800 bg-zinc-900",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="pt-0.5">
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className={cn("w-5 h-5", unscheduled ? "text-amber-400" : "text-zinc-500")} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold">
                    {idx + 1}. {stop.name}
                  </span>
                  <Badge
                    className={cn(
                      "text-[10px]",
                      unscheduled ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-300",
                    )}
                  >
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
              {unscheduled && !done && onRemoveUnscheduled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-zinc-400"
                  disabled={busy}
                  onClick={() => onRemoveUnscheduled(stop.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
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
