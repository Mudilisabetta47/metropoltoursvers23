import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Clock, Bus, Users, Phone, ExternalLink, ChevronRight, User, Accessibility, Luggage, Star, Play, Square, Radio, CalendarClock } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { STOP_TYPE_LABELS } from "@/lib/charterTrips";
import { useLiveGpsBroadcast } from "@/hooks/useLiveGpsBroadcast";


interface Trip {
  id: string;
  shift_date: string;
  shift_start: string;
  shift_end: string | null;
  assigned_bus_id: string | null;
  assigned_trip_id: string | null;
  dispatch_location: string | null;
  role: string;
  notes: string | null;
  status: string;
  trip?: any;
  route?: any;
  bus?: any;
  bookings?: any[];
}

const TripsTab = ({ userId }: { userId: string }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Trip | null>(null);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: shifts } = await supabase
        .from("employee_shifts")
        .select("*")
        .eq("user_id", userId)
        .gte("shift_date", today)
        .order("shift_date", { ascending: true })
        .order("shift_start", { ascending: true });

      const enriched: Trip[] = [];
      for (const sh of shifts || []) {
        const item: Trip = { ...sh };
        if (sh.assigned_bus_id) {
          const { data } = await supabase.from("buses").select("*").eq("id", sh.assigned_bus_id).maybeSingle();
          item.bus = data;
        }
        if (sh.assigned_trip_id) {
          const { data } = await supabase.from("trips").select("*, routes(*)").eq("id", sh.assigned_trip_id).maybeSingle();
          item.trip = data;
          item.route = data?.routes;
          const { count } = await supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("trip_id", sh.assigned_trip_id)
            .in("status", ["confirmed", "pending"]);
          item.bookings = new Array(count || 0);
        }
        enriched.push(item);
      }
      setTrips(enriched);
      setLoading(false);
    })();
  }, [userId]);

  const dayLabel = (d: string) => {
    const date = new Date(d);
    if (isToday(date)) return "Heute";
    if (isTomorrow(date)) return "Morgen";
    return format(date, "EEEE, dd. MMM", { locale: de });
  };

  if (loading) {
    return <div className="text-center py-10 text-zinc-500">Lade Aufträge…</div>;
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl bg-[#131720] border border-white/5">
        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
          <MapPin className="w-6 h-6 text-zinc-500" />
        </div>
        <h3 className="text-lg font-semibold text-white">Keine anstehenden Fahrten</h3>
        <p className="text-sm text-zinc-500 mt-1">Sobald die Disposition dich einteilt, erscheint es hier.</p>
      </div>
    );
  }

  const grouped = trips.reduce<Record<string, Trip[]>>((acc, t) => {
    (acc[t.shift_date] ||= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dayTrips]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">{dayLabel(date)}</div>
            <div className="flex-1 h-px bg-white/5" />
            <div className="text-xs text-zinc-500">{dayTrips.length} Auftrag/Aufträge</div>
          </div>
          <div className="space-y-2">
            {dayTrips.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="w-full text-left rounded-xl bg-[#131720] hover:bg-[#171c26] border border-white/5 hover:border-emerald-500/30 p-4 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex flex-col items-center justify-center leading-tight text-emerald-300">
                    <span className="text-[10px] uppercase">Ab</span>
                    <span className="text-sm font-bold">{format(new Date(t.shift_start), "HH:mm")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">
                      {t.route?.name || t.notes || "Fahrt"}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                      {t.bus && <span className="flex items-center gap-1"><Bus className="w-3 h-3" />{t.bus.license_plate}</span>}
                      {t.bookings && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.bookings.length} Pax</span>}
                      <span className="capitalize px-1.5 py-0.5 rounded bg-white/5">{t.role}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-emerald-400 transition" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <TripDetailSheet trip={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

const TripDetailSheet = ({ trip, onClose }: { trip: Trip; onClose: () => void }) => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [tripRow, setTripRow] = useState<any>(trip.trip || null);
  const [shareGps, setShareGps] = useState(false);

  // Echte GPS-Daten des Fahrers an die öffentliche Live-Verfolgung senden
  const gps = useLiveGpsBroadcast({
    tripId: trip.assigned_trip_id,
    active: shareGps,
    status: tripRow?.status === "running" ? "on_route" : "standby",
  });
  const gpsOn = gps.sharing;

  useEffect(() => {
    if (!trip.assigned_trip_id) return;
    supabase
      .from("trip_schedule_stops")
      .select("*")
      .eq("trip_id", trip.assigned_trip_id)
      .order("sort_order")
      .then(({ data }) => setSchedule(data || []));
  }, [trip.assigned_trip_id]);

  // Läuft die Fahrt bereits, wird der Standort automatisch geteilt
  useEffect(() => {
    if (tripRow?.status === "running") setShareGps(true);
  }, [tripRow?.status]);

  useEffect(() => {
    if (gps.error) toast.error(gps.error);
  }, [gps.error]);

  const setStatus = async (status: "running" | "completed") => {
    if (!trip.assigned_trip_id) return;
    const patch: any = { status };
    if (status === "running") patch.started_at = new Date().toISOString();
    if (status === "completed") patch.ended_at = new Date().toISOString();
    const { error } = await (supabase as any).from("trips").update(patch).eq("id", trip.assigned_trip_id);
    if (error) { toast.error(error.message); return; }
    setTripRow((t: any) => ({ ...(t || {}), ...patch }));
    if (status === "running") { setShareGps(true); toast.success("Fahrt gestartet – Standort wird live geteilt"); }
    else { setShareGps(false); toast.success("Fahrt beendet"); }
  };


  const openMaps = () => {
    const q = trip.route?.name || trip.dispatch_location || "";
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`, "_blank");
  };


  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[92vh] bg-[#131720] sm:rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-6">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-emerald-400 uppercase tracking-widest font-semibold mb-1">
                Auftrag {trip.assigned_trip_id?.slice(0, 8) || trip.id.slice(0, 8)}
              </div>
              <h2 className="text-xl font-bold text-white">{trip.route?.name || "Fahrtauftrag"}</h2>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          <Row icon={Clock} label="Abfahrt">
            {format(new Date(trip.shift_start), "HH:mm")} Uhr · {format(new Date(trip.shift_date), "dd. MMM yyyy", { locale: de })}
          </Row>
          <Row icon={Clock} label="Ende">{trip.shift_end ? `${format(new Date(trip.shift_end), "HH:mm")} Uhr` : "—"}</Row>

          {trip.dispatch_location && <Row icon={MapPin} label="Startort">{trip.dispatch_location}</Row>}
          {trip.route?.name && <Row icon={MapPin} label="Route">{trip.route.name}</Row>}
          {trip.bus && (
            <Row icon={Bus} label="Bus">
              {trip.bus.name} · {trip.bus.license_plate} · {trip.bus.total_seats} Sitze
            </Row>
          )}
          {trip.bookings && (
            <Row icon={Users} label="Fahrgäste">{trip.bookings.length} Buchungen</Row>
          )}
          {trip.notes && <Row icon={Star} label="Besonderheiten">{trip.notes}</Row>}

          <div className="grid grid-cols-3 gap-2 pt-2">
            <button className="flex flex-col items-center gap-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300">
              <Accessibility className="w-4 h-4 text-cyan-400" /> Rollstuhl
            </button>
            <button className="flex flex-col items-center gap-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300">
              <Luggage className="w-4 h-4 text-amber-400" /> Gepäck
            </button>
            <button className="flex flex-col items-center gap-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300">
              <Star className="w-4 h-4 text-yellow-400" /> VIP
            </button>
          </div>

          {schedule.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500 mb-2">
                <CalendarClock className="w-3.5 h-3.5 text-emerald-400" /> Fahrplan
              </div>
              <ol className="relative border-l border-white/10 ml-2 space-y-3">
                {schedule.map(s => (
                  <li key={s.id} className="ml-4">
                    <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div className="text-sm text-white">{s.label}</div>
                    <div className="text-xs text-zinc-500">
                      {STOP_TYPE_LABELS[s.stop_type] || s.stop_type}
                      {s.planned_arrival && ` · an ${format(new Date(s.planned_arrival), "dd.MM. HH:mm")}`}
                      {s.planned_departure && ` · ab ${format(new Date(s.planned_departure), "dd.MM. HH:mm")}`}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {trip.assigned_trip_id && (
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Radio className={cn("w-4 h-4", gpsOn ? "text-emerald-400 animate-pulse" : "text-zinc-600")} />
                {gpsOn ? "Standort wird live geteilt" : "Standortfreigabe inaktiv"}
                {gps.coords && (
                  <span className="text-[11px] text-zinc-500">
                    · {Math.round(gps.coords.speedKmh)} km/h
                    {gps.lastSentAt && ` · gesendet ${format(new Date(gps.lastSentAt), "HH:mm:ss")}`}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShareGps((v) => !v)}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold",
                  gpsOn ? "bg-white/10 text-zinc-200 hover:bg-white/15" : "bg-cyan-600 hover:bg-cyan-500 text-white",
                )}
              >
                <Radio className="w-4 h-4" /> {gpsOn ? "Standort nicht mehr teilen" : "Standort teilen"}
              </button>

              {tripRow?.status !== "running" ? (
                <button
                  onClick={() => setStatus("running")}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm"
                >
                  <Play className="w-4 h-4" /> Fahrt starten & GPS aktivieren
                </button>
              ) : (
                <button
                  onClick={() => setStatus("completed")}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm"
                >
                  <Square className="w-4 h-4" /> Fahrt beenden
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 grid grid-cols-2 gap-2 bg-black/20">
          <button
            onClick={openMaps}
            className="flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm"
          >
            <ExternalLink className="w-4 h-4" /> Navigation
          </button>
          <a
            href="tel:+4951180781106"
            className="flex items-center justify-center gap-2 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-semibold text-sm border border-white/10"
          >
            <Phone className="w-4 h-4 text-emerald-400" /> Dispo anrufen
          </a>
        </div>
      </div>
    </div>
  );
};

const Row = ({ icon: Icon, label, children }: any) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-emerald-400" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[11px] text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className="text-sm text-white">{children}</div>
    </div>
  </div>
);

export default TripsTab;
