import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Clock, MapPin, SignpostBig } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface BoardingStop {
  id?: string;
  label: string;
  location?: string | null;
  stop_type?: string | null;
  planned_arrival?: string | null;
  planned_departure?: string | null;
  notes?: string | null;
  sort_order?: number | null;
}

/** Steig / Bussteig aus den Notizen oder dem Ort ableiten (z. B. „Steig 5“ am Bremen ZOB). */
export function platformOf(stop: BoardingStop): string | null {
  const source = `${stop.notes ?? ""} ${stop.location ?? ""}`;
  const match = source.match(/(steig|bussteig|gate)\s*([0-9]+[a-z]?)/i);
  return match ? `Steig ${match[2].toUpperCase()}` : null;
}

/** Zustiegsorte = Halte, an denen Fahrgäste einsteigen können (keine Pausen/Endziel). */
export function boardingStops(stops: BoardingStop[]): BoardingStop[] {
  return stops
    .filter((s) => s.stop_type !== "break" && s.stop_type !== "border" && s.stop_type !== "arrival")
    .filter((s) => !!s.planned_departure || s.stop_type === "departure" || s.stop_type === "stop")
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

interface Props {
  stops: BoardingStop[];
  title?: string;
  subtitle?: string;
  /** Aktuelle Verspätung in Minuten – verschiebt die angezeigten Zeiten. */
  delayMinutes?: number;
}

/** Übersicht aller Zustiegsorte mit Abfahrtszeit und Steig. */
export default function BoardingSchedule({
  stops,
  title = "Zustiegsorte & Abfahrtszeiten",
  subtitle = "Bitte seien Sie 15 Minuten vor Abfahrt am Zustiegsort.",
  delayMinutes = 0,
}: Props) {
  const list = boardingStops(stops);
  if (list.length === 0) return null;

  const delay = Number(delayMinutes) || 0;
  const shift = (d: Date) => new Date(d.getTime() + delay * 60000);

  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>
      {delay > 0 && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
          <Clock className="w-3 h-3" /> +{delay} Min. Verspätung – Zeiten neu berechnet
        </p>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {list.map((s, i) => {
          const platform = platformOf(s);
          const depPlanned = s.planned_departure ? new Date(s.planned_departure) : null;
          const arrPlanned = s.planned_arrival ? new Date(s.planned_arrival) : null;
          const dep = depPlanned && delay > 0 ? shift(depPlanned) : depPlanned;
          const arr = arrPlanned && delay > 0 ? shift(arrPlanned) : arrPlanned;

          return (
            <div
              key={s.id ?? `${s.label}-${i}`}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-semibold text-zinc-900">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{s.label}</span>
                  </div>
                  {s.location && s.location !== s.label && (
                    <p className="text-xs text-zinc-500 mt-1 truncate">{s.location}</p>
                  )}
                </div>
                {platform && (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 shrink-0">
                    <SignpostBig className="w-3 h-3 mr-1" />
                    {platform}
                  </Badge>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm">
                <Clock className={`w-4 h-4 ${delay > 0 ? "text-amber-500" : "text-zinc-400"}`} />
                {dep ? (
                  <span className="text-zinc-900">
                    {delay > 0 && depPlanned && (
                      <span className="text-zinc-400 line-through mr-1.5">{format(depPlanned, "HH:mm")}</span>
                    )}
                    <strong className={`text-base ${delay > 0 ? "text-amber-700" : ""}`}>{format(dep, "HH:mm")} Uhr</strong>
                    <span className="text-zinc-500"> · {format(dep, "EEEE, dd.MM.yyyy", { locale: de })}</span>
                  </span>
                ) : arr ? (
                  <span className="text-zinc-600">
                    {delay > 0 && arrPlanned && (
                      <span className="text-zinc-400 line-through mr-1.5">{format(arrPlanned, "HH:mm")}</span>
                    )}
                    an {format(arr, "dd.MM.yyyy HH:mm")} Uhr
                  </span>
                ) : (
                  <span className="text-zinc-500">Abfahrtszeit folgt</span>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
}
