import { MapPin, Users, CheckCircle2, Phone, Armchair, Ticket, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ManifestStop, ManifestTrip } from "@/hooks/useTripManifest";

interface Props {
  trip: ManifestTrip | null;
  stops: ManifestStop[];
  totalPassengers: number;
  totalBoarded: number;
  isLoading: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Ausstehend",
  confirmed: "Bestätigt",
  completed: "Abgeschlossen",
};

/** Zustiegsliste pro Halt für den Fahrer – synchronisiert sich live mit dem Admin. */
const ManifestPanel = ({ trip, stops, totalPassengers, totalBoarded, isLoading }: Props) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!trip) {
    return (
      <p className="text-sm text-zinc-500 py-6 text-center">
        Für dieses Datum ist dir keine Fahrt zugewiesen.
      </p>
    );
  }

  if (stops.length === 0) {
    return (
      <div className="py-6 text-center space-y-1">
        <p className="text-sm text-zinc-400">
          {trip.title || "Fahrt"} · {new Date(trip.departure_date).toLocaleDateString("de-DE")}
        </p>
        <p className="text-sm text-zinc-500">Noch keine Buchungen für diese Fahrt.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Kopf: Fahrt + Gesamtzähler */}
      <div className="rounded-xl border border-emerald-600/30 bg-emerald-500/10 p-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{trip.title || "Fahrt"}</p>
          <p className="text-xs text-zinc-400">
            {new Date(trip.departure_date).toLocaleDateString("de-DE")}
            {trip.departure_time ? ` · Abfahrt ${trip.departure_time.slice(0, 5)} Uhr` : ""}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-white tabular-nums">
            {totalBoarded}
            <span className="text-zinc-500 text-sm font-normal"> / {totalPassengers}</span>
          </p>
          <p className="text-[10px] text-zinc-400">an Bord / gebucht</p>
        </div>
      </div>

      {stops.map((stop) => {
        const allIn = stop.boardedCount === stop.passengers.length && stop.passengers.length > 0;
        return (
          <div
            key={stop.stop_id}
            className={cn(
              "rounded-xl border overflow-hidden",
              allIn ? "border-emerald-600/40 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900",
            )}
          >
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-zinc-800/60">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm font-semibold text-white truncate">{stop.stop_name}</span>
              </div>
              <Badge
                className={cn(
                  "shrink-0 text-[10px]",
                  allIn ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300",
                )}
              >
                <Users className="w-3 h-3 mr-1" />
                {stop.boardedCount}/{stop.passengers.length} an Bord
              </Badge>
            </div>

            <ul className="divide-y divide-zinc-800/60">
              {stop.passengers.map((p) => (
                <li key={p.booking_id} className="px-3 py-2.5 flex items-center gap-3">
                  <div className="pt-0.5 shrink-0">
                    {p.boarded ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <span className="block w-5 h-5 rounded-full border-2 border-zinc-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-medium", p.boarded ? "text-zinc-400" : "text-white")}>
                      {p.passenger_last_name}, {p.passenger_first_name}
                    </p>
                    <p className="text-[11px] text-zinc-500 flex flex-wrap items-center gap-x-3">
                      <span className="inline-flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        {p.ticket_number || p.booking_number}
                      </span>
                      {p.seat_number && (
                        <span className="inline-flex items-center gap-1">
                          <Armchair className="w-3 h-3" />
                          Platz {p.seat_number}
                        </span>
                      )}
                      {p.passenger_phone && (
                        <a
                          href={`tel:${p.passenger_phone}`}
                          className="inline-flex items-center gap-1 text-emerald-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-3 h-3" />
                          {p.passenger_phone}
                        </a>
                      )}
                    </p>
                  </div>
                  {p.booking_status !== "confirmed" && (
                    <Badge className="bg-amber-500/20 text-amber-300 text-[10px] shrink-0">
                      {STATUS_LABEL[p.booking_status] ?? p.booking_status}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default ManifestPanel;
