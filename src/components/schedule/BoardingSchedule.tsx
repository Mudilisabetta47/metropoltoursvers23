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
}

/** Übersicht aller Zustiegsorte mit Abfahrtszeit und Steig. */
export default function BoardingSchedule({
  stops,
  title = "Zustiegsorte & Abfahrtszeiten",
  subtitle = "Bitte seien Sie 15 Minuten vor Abfahrt am Zustiegsort.",
}: Props) {
  const list = boardingStops(stops);
  if (list.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {list.map((s, i) => {
          const platform = platformOf(s);
          const dep = s.planned_departure ? new Date(s.planned_departure) : null;
          const arr = s.planned_arrival ? new Date(s.planned_arrival) : null;
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
                <Clock className="w-4 h-4 text-zinc-400" />
                {dep ? (
                  <span className="text-zinc-900">
                    <strong className="text-base">{format(dep, "HH:mm")} Uhr</strong>
                    <span className="text-zinc-500"> · {format(dep, "EEEE, dd.MM.yyyy", { locale: de })}</span>
                  </span>
                ) : arr ? (
                  <span className="text-zinc-600">
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
