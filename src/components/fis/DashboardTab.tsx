import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Clock, Gauge, TrendingUp, Cloud, MapPin, Bus, Users, AlertTriangle,
  ChevronRight, Timer, Sun
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { statusMeta } from "./StatusPill";
import LocationShareButton from "@/components/driver/LocationShareButton";
import ChecklistDialog from "./ChecklistDialog";

interface Props {
  userId: string;
  status: string;
  onStatusChange: (s: string) => void;
}

const DashboardTab = ({ userId, status, onStatusChange }: Props) => {
  const [shift, setShift] = useState<any>(null);
  const [nextTrip, setNextTrip] = useState<any>(null);
  const [bus, setBus] = useState<any>(null);
  const [duty, setDuty] = useState<any>(null);
  const [delay, setDelay] = useState<number>(0);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklistDone, setChecklistDone] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const loadAll = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data: shiftData } = await supabase
      .from("employee_shifts")
      .select("*")
      .eq("user_id", userId)
      .gte("shift_date", today)
      .order("shift_date", { ascending: true })
      .order("shift_start", { ascending: true })
      .limit(1)
      .maybeSingle();
    setShift(shiftData);

    if (shiftData?.assigned_bus_id) {
      const { data: busData } = await supabase
        .from("buses")
        .select("*")
        .eq("id", shiftData.assigned_bus_id)
        .maybeSingle();
      setBus(busData);
    }

    if (shiftData?.assigned_trip_id) {
      const { data: tripData } = await supabase
        .from("trips")
        .select("*, routes(name)")
        .eq("id", shiftData.assigned_trip_id)
        .maybeSingle();
      setNextTrip(tripData);

      const { data: reg } = await (supabase as any)
        .from("trip_registry")
        .select("current_delay_min, delay_reason")
        .eq("source_type", "trip")
        .eq("source_id", shiftData.assigned_trip_id)
        .maybeSingle();
      if (reg) setDelay(reg.current_delay_min || 0);
    }

    const { data: dutyData } = await (supabase as any)
      .from("driver_duty_log")
      .select("*")
      .eq("driver_user_id", userId)
      .eq("log_date", today)
      .maybeSingle();
    setDuty(dutyData);

    const { data: checkData } = await (supabase as any)
      .from("driver_checklists")
      .select("all_ok")
      .eq("driver_user_id", userId)
      .eq("shift_date", today)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setChecklistDone(!!checkData?.all_ok);
  };

  useEffect(() => {
    loadAll();
    const channel = supabase
      .channel("fis-dashboard-" + userId)
      .on("postgres_changes", { event: "*", schema: "public", table: "employee_shifts", filter: `user_id=eq.${userId}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_registry" }, loadAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const drivingH = Math.floor((duty?.driving_seconds || 0) / 3600);
  const drivingM = Math.floor(((duty?.driving_seconds || 0) % 3600) / 60);
  const remainingH = Math.max(0, 9 - drivingH - drivingM / 60);
  const kmToday = duty?.km_end && duty?.km_start ? duty.km_end - duty.km_start : 0;

  const departureIn = nextTrip?.departure_date && nextTrip?.departure_time
    ? differenceInMinutes(
        new Date(`${nextTrip.departure_date}T${nextTrip.departure_time}`),
        now
      )
    : null;

  const s = statusMeta[status] || statusMeta.off_duty;

  return (
    <div className="space-y-4">
      {/* Hero – heutige Schicht */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 via-[#131720] to-[#131720] border border-emerald-500/20 p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs text-emerald-300 uppercase tracking-widest font-semibold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Heutige Schicht
            </div>
            <div className={cn("px-2 py-1 rounded-md text-xs font-semibold border", s.color)}>
              {s.label}
            </div>
          </div>

          {shift ? (
            <>
              <div className="text-3xl font-bold text-white mb-1">
                {shift.shift_start} – {shift.shift_end || "—"}
              </div>
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {shift.dispatch_location || "Kein Startort"}
                <span className="mx-2">·</span>
                Rolle: {shift.role}
              </div>
            </>
          ) : (
            <div className="py-4">
              <div className="text-2xl font-bold text-white">Heute keine Schicht</div>
              <div className="text-sm text-zinc-400">Genieße den freien Tag ☕</div>
            </div>
          )}
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={Timer} label="Lenkzeit heute" value={`${drivingH}h ${drivingM}m`} tint="cyan" />
        <KPI icon={Gauge} label="Rest­lenkzeit" value={`${remainingH.toFixed(1)}h`} tint="emerald" />
        <KPI icon={TrendingUp} label="Kilometer heute" value={kmToday.toLocaleString("de-DE")} tint="violet" />
        <KPI icon={AlertTriangle} label="Verspätung" value={delay > 0 ? `+${delay} min` : "0 min"} tint={delay > 10 ? "red" : "zinc"} />
      </section>

      {/* Next departure */}
      {nextTrip && (
        <section className="rounded-2xl bg-[#131720] border border-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Nächste Abfahrt</h3>
            {departureIn !== null && (
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-bold",
                departureIn < 0 ? "bg-red-500/20 text-red-300" :
                departureIn < 30 ? "bg-amber-500/20 text-amber-300" :
                "bg-emerald-500/20 text-emerald-300"
              )}>
                {departureIn < 0 ? `${Math.abs(departureIn)}m verspätet` : `in ${departureIn}m`}
              </div>
            )}
          </div>
          <div className="text-2xl font-bold text-white mb-1">{nextTrip.routes?.name || "Route"}</div>
          <div className="flex items-center gap-4 text-sm text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              {nextTrip.departure_time?.slice(0, 5)} · {format(new Date(nextTrip.departure_date), "dd. MMM", { locale: de })}
            </span>
            {bus && (
              <span className="flex items-center gap-1.5">
                <Bus className="w-4 h-4 text-cyan-400" />
                {bus.license_plate}
              </span>
            )}
          </div>
        </section>
      )}

      {/* Wetter Widget */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <WeatherCard destination={nextTrip?.routes?.name} />
        <div className="rounded-2xl bg-[#131720] border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Schnellaktionen</h3>
          <div className="space-y-2">
            <button
              onClick={() => setChecklistOpen(true)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border transition",
                checklistDone
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse"
              )}
            >
              <span className="flex items-center gap-2 font-semibold text-sm">
                {checklistDone ? "✓ Check heute erledigt" : "Pre-Trip Check jetzt durchführen"}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-full">
              <LocationShareButton userId={userId} />
            </div>
          </div>
        </div>
      </section>

      <ChecklistDialog
        open={checklistOpen}
        onClose={() => { setChecklistOpen(false); loadAll(); }}
        userId={userId}
        busId={shift?.assigned_bus_id || null}
      />
    </div>
  );
};

const KPI = ({ icon: Icon, label, value, tint }: { icon: any; label: string; value: string; tint: string }) => {
  const tints: Record<string, string> = {
    emerald: "text-emerald-300 bg-emerald-500/10",
    cyan: "text-cyan-300 bg-cyan-500/10",
    violet: "text-violet-300 bg-violet-500/10",
    red: "text-red-300 bg-red-500/10",
    zinc: "text-zinc-300 bg-zinc-700/30",
  };
  return (
    <div className="rounded-xl bg-[#131720] border border-white/5 p-4">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", tints[tint])}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
    </div>
  );
};

const WeatherCard = ({ destination }: { destination?: string | null }) => {
  // Placeholder for weather. Integrating a live source can happen in Phase 2.
  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-[#131720] border border-white/5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Wetter am Zielort</h3>
          <div className="text-2xl font-bold text-white">{destination || "Kein Ziel"}</div>
          <div className="text-xs text-zinc-500 mt-1">Live-Wetter wird geladen…</div>
        </div>
        <Sun className="w-16 h-16 text-amber-300 opacity-70" />
      </div>
    </div>
  );
};

export default DashboardTab;
