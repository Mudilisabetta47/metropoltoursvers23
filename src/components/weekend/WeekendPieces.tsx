import { Bus, MapPin, Clock, BedDouble, User, Check, Hotel, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WeekendStop {
  city: string;
  name: string;
  surcharge: number;
  departure_time?: string | null;
}

export type StayChoice = "none" | "double" | "single";

const euro = (v: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v);

export const formatEuro = euro;

/** Zustiegsorte mit Abfahrtszeit als Timeline */
export function BoardingTimeline({
  departureCity,
  departurePoint,
  departureTime,
  destination,
  stops,
  selectedIndex,
  onSelect,
  returnInfo,
}: {
  departureCity: string;
  departurePoint?: string | null;
  departureTime?: string | null;
  destination: string;
  stops: WeekendStop[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  returnInfo?: string | null;
}) {
  const rows = [
    {
      idx: -1,
      title: departurePoint || departureCity,
      sub: departureCity,
      time: departureTime,
      surcharge: 0,
      isStart: true,
    },
    ...stops.map((s, i) => ({
      idx: i,
      title: s.name || s.city,
      sub: s.city,
      time: s.departure_time,
      surcharge: s.surcharge || 0,
      isStart: false,
    })),
  ];

  return (
    <div className="space-y-3">
      {rows.map((row, i) => {
        const active = selectedIndex === row.idx;
        return (
          <button
            key={`${row.idx}-${row.title}`}
            type="button"
            onClick={() => onSelect(row.idx)}
            className={cn(
              "relative w-full text-left rounded-2xl border p-4 pl-14 transition-all",
              active
                ? "border-primary bg-primary/5 shadow-[0_8px_24px_-16px_hsl(var(--primary))]"
                : "border-border hover:border-primary/40 bg-card",
            )}
          >
            <span
              className={cn(
                "absolute left-6 top-6 h-3 w-3 -translate-x-1/2 rounded-full ring-4",
                active ? "bg-primary ring-primary/20" : "bg-muted-foreground/40 ring-transparent",
              )}
            />
            {i < rows.length - 1 && (
              <span className="absolute left-6 top-9 h-[calc(100%-0.5rem)] w-px -translate-x-1/2 bg-border" />
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">{row.title}</p>
                <p className="text-sm text-muted-foreground">
                  {row.isStart ? "Startpunkt" : row.sub || "Zustieg"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {row.time ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1 text-sm font-semibold text-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    {row.time} Uhr
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Zeit folgt</span>
                )}
                {row.surcharge !== 0 && (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      row.surcharge > 0 ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary",
                    )}
                  >
                    {row.surcharge > 0 ? `+${euro(row.surcharge)}` : euro(row.surcharge)}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}

      <div className="relative rounded-2xl border border-primary/30 bg-primary/10 p-4 pl-14">
        <span className="absolute left-6 top-6 flex h-3 w-3 -translate-x-1/2 items-center justify-center">
          <MapPin className="h-4 w-4 text-primary" />
        </span>
        <p className="font-semibold text-primary">{destination}</p>
        <p className="text-sm text-muted-foreground">Ziel</p>
      </div>

      {returnInfo && (
        <p className="flex items-start gap-2 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
          <Bus className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <strong className="text-foreground">Rückfahrt:</strong> {returnInfo}
          </span>
        </p>
      )}
    </div>
  );
}

/** Nur Fahrt vs. Fahrt + Unterkunft (DZ / EZ) */
export function StayOptions({
  basePrice,
  doubleSurcharge,
  singleSurcharge,
  nights,
  hotelName,
  hotelStars,
  hotelDescription,
  value,
  onChange,
}: {
  basePrice: number;
  doubleSurcharge: number;
  singleSurcharge: number;
  nights?: number | null;
  hotelName?: string | null;
  hotelStars?: number | null;
  hotelDescription?: string | null;
  value: StayChoice;
  onChange: (v: StayChoice) => void;
}) {
  const options: { id: StayChoice; icon: typeof Bus; title: string; desc: string; extra: number }[] = [
    {
      id: "none",
      icon: Bus,
      title: "Nur Fahrt",
      desc: "Hin- und Rückfahrt im Komfortbus – Unterkunft organisieren Sie selbst.",
      extra: 0,
    },
    {
      id: "double",
      icon: BedDouble,
      title: "Fahrt + Hotel (Doppelzimmer)",
      desc: nights ? `${nights} ${nights === 1 ? "Nacht" : "Nächte"} im Doppelzimmer, pro Person` : "Übernachtung im Doppelzimmer, pro Person",
      extra: doubleSurcharge,
    },
    {
      id: "single",
      icon: User,
      title: "Fahrt + Hotel (Einzelzimmer)",
      desc: nights ? `${nights} ${nights === 1 ? "Nacht" : "Nächte"} im Einzelzimmer, alleine` : "Übernachtung im Einzelzimmer",
      extra: singleSurcharge,
    },
  ];

  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all",
              active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <opt.icon className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">{opt.title}</span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{opt.desc}</span>
            </span>
            <span className="text-right">
              <span className="block text-lg font-bold text-foreground">{euro(basePrice + opt.extra)}</span>
              <span className="block text-xs text-muted-foreground">
                {opt.extra > 0 ? `inkl. +${euro(opt.extra)}` : "p. P."}
              </span>
            </span>
          </button>
        );
      })}

      {(hotelName || hotelDescription) && (
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <div className="flex items-center gap-2">
            <Hotel className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">{hotelName || "Unsere Partnerunterkunft"}</span>
            {!!hotelStars && (
              <span className="flex items-center gap-0.5">
                {Array.from({ length: hotelStars }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </span>
            )}
          </div>
          {hotelDescription && <p className="mt-2 text-sm text-muted-foreground">{hotelDescription}</p>}
        </div>
      )}
    </div>
  );
}
