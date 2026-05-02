import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bus, TrendingUp, Users, AlertTriangle, Activity, Calendar, Euro, Clock } from "lucide-react";

interface KPI {
  todayBookings: number;
  todayRevenue: number;
  activeTrips: number;
  todayPassengers: number;
  openIncidents: number;
  avgOccupancy: number;
}

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const WallboardLive = () => {
  const { token } = useParams<{ token?: string }>();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [kpi, setKpi] = useState<KPI>({
    todayBookings: 0, todayRevenue: 0, activeTrips: 0, todayPassengers: 0, openIncidents: 0, avgOccupancy: 0,
  });
  const [now, setNow] = useState(new Date());
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [activeTours, setActiveTours] = useState<any[]>([]);

  // Auth check (token or staff session)
  useEffect(() => {
    (async () => {
      if (token) {
        const { data, error } = await supabase
          .from("wallboard_tokens" as any)
          .select("id,is_active")
          .eq("token", token)
          .maybeSingle();
        if (error || !data || !(data as any).is_active) {
          setAuthorized(false);
          return;
        }
        // Update last_used (best-effort)
        await supabase.from("wallboard_tokens" as any)
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", (data as any).id);
        setAuthorized(true);
      } else {
        const { data } = await supabase.auth.getUser();
        setAuthorized(!!data.user);
      }
    })();
  }, [token]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Data load (every 30s)
  const loadData = async () => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [bookingsRes, toursRes, tripsRes, incRes] = await Promise.all([
      supabase.from("bookings")
        .select("id,price_paid,passenger_first_name,passenger_last_name,created_at,status,ticket_number")
        .gte("created_at", todayStart.toISOString())
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("tour_dates")
        .select("id,booked_seats,total_seats,departure_date,return_date,tours(title)")
        .gte("departure_date", todayStart.toISOString().slice(0, 10))
        .lte("departure_date", new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10))
        .eq("is_active", true)
        .order("departure_date", { ascending: true })
        .limit(15),
      supabase.from("trips")
        .select("id,departure_date,bus_id")
        .gte("departure_date", todayStart.toISOString())
        .lte("departure_date", todayEnd.toISOString()),
      supabase.from("incidents")
        .select("id")
        .neq("status", "resolved"),
    ]);

    const bookings = bookingsRes.data ?? [];
    const tours = toursRes.data ?? [];
    const todayRev = bookings
      .filter((b: any) => ["confirmed", "paid", "pending"].includes(b.status))
      .reduce((s: number, b: any) => s + Number(b.price_paid || 0), 0);
    const totalSeats = tours.reduce((s: number, t: any) => s + (t.total_seats || 0), 0);
    const bookedSeats = tours.reduce((s: number, t: any) => s + (t.booked_seats || 0), 0);
    const occ = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

    setKpi({
      todayBookings: bookings.length,
      todayRevenue: todayRev,
      activeTrips: (tripsRes.data ?? []).length,
      todayPassengers: bookedSeats,
      openIncidents: (incRes.data ?? []).length,
      avgOccupancy: occ,
    });
    setRecentBookings(bookings.slice(0, 8));
    setActiveTours(tours);
  };

  useEffect(() => {
    if (!authorized) return;
    loadData();
    const t = setInterval(loadData, 30_000);
    return () => clearInterval(t);
  }, [authorized]);

  // Realtime new bookings
  useEffect(() => {
    if (!authorized) return;
    const ch = supabase.channel("wallboard-bookings")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bookings" }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [authorized]);

  if (authorized === null) {
    return <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center text-white/50">Lade…</div>;
  }
  if (authorized === false) {
    return (
      <div className="min-h-screen bg-[#0a0d12] flex flex-col items-center justify-center text-white">
        <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
        <h1 className="text-3xl font-bold">Zugriff verweigert</h1>
        <p className="text-white/60 mt-2">Token ungültig oder deaktiviert.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0d12] via-[#0f1218] to-[#0a0d12] text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Bus className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">MeTours · Live Operations</h1>
            <p className="text-xs text-white/50 uppercase tracking-widest">
              {now.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold font-mono text-emerald-400 tabular-nums">
            {now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <div className="flex items-center gap-2 justify-end mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/50 uppercase tracking-widest">Live</span>
          </div>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-6 gap-4 p-6">
        <KPICard icon={Euro} label="Tagesumsatz" value={fmtEUR(kpi.todayRevenue)} accent="emerald" />
        <KPICard icon={TrendingUp} label="Buchungen heute" value={String(kpi.todayBookings)} accent="blue" />
        <KPICard icon={Users} label="Passagiere (7T)" value={String(kpi.todayPassengers)} accent="violet" />
        <KPICard icon={Activity} label="Auslastung Ø" value={`${kpi.avgOccupancy}%`} accent={kpi.avgOccupancy >= 75 ? "emerald" : kpi.avgOccupancy >= 50 ? "amber" : "rose"} />
        <KPICard icon={Bus} label="Fahrten heute" value={String(kpi.activeTrips)} accent="cyan" />
        <KPICard icon={AlertTriangle} label="Offene Vorfälle" value={String(kpi.openIncidents)} accent={kpi.openIncidents > 0 ? "rose" : "emerald"} />
      </div>

      {/* Two columns: Tours + Live ticker */}
      <div className="grid grid-cols-2 gap-6 px-6 pb-6 h-[calc(100vh-280px)]">
        {/* Active Tours */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-semibold">Touren · nächste 7 Tage</h2>
          </div>
          <div className="space-y-2 overflow-y-auto flex-1">
            {activeTours.length === 0 && <p className="text-white/40 text-sm">Keine bevorstehenden Touren</p>}
            {activeTours.map((t: any) => {
              const occ = t.total_seats > 0 ? Math.round((t.booked_seats / t.total_seats) * 100) : 0;
              const dep = new Date(t.departure_date);
              return (
                <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl bg-black/30 border border-white/5">
                  <div className="text-center min-w-[60px]">
                    <div className="text-2xl font-bold text-emerald-400 tabular-nums">{dep.getDate().toString().padStart(2, "0")}</div>
                    <div className="text-[10px] uppercase text-white/40">{dep.toLocaleDateString("de-DE", { month: "short" })}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{t.tours?.title ?? "—"}</div>
                    <div className="text-xs text-white/50">{t.booked_seats} / {t.total_seats} Plätze</div>
                  </div>
                  <div className="w-32">
                    <div className="text-right text-sm font-mono mb-1">{occ}%</div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full ${occ >= 90 ? "bg-rose-500" : occ >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${occ}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Ticker */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-semibold">Letzte Buchungen</h2>
          </div>
          <div className="space-y-2 overflow-y-auto flex-1">
            {recentBookings.length === 0 && <p className="text-white/40 text-sm">Heute noch keine Buchungen</p>}
            {recentBookings.map((b: any) => {
              const t = new Date(b.created_at);
              return (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/5">
                  <div className="text-xs text-white/40 font-mono tabular-nums w-12">
                    {t.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {b.passenger_first_name} {b.passenger_last_name}
                    </div>
                    <div className="text-xs text-white/50 font-mono">{b.ticket_number}</div>
                  </div>
                  <div className="text-emerald-400 font-bold tabular-nums">{fmtEUR(Number(b.price_paid || 0))}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) => {
  const colors: Record<string, string> = {
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400",
    violet: "from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400",
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400",
    rose: "from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400",
  };
  return (
    <div className={`bg-gradient-to-br rounded-2xl border p-5 ${colors[accent] || colors.emerald}`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-5 h-5 opacity-80" />
        <span className="text-[10px] uppercase tracking-widest opacity-70">{label}</span>
      </div>
      <div className="text-3xl font-bold tabular-nums text-white">{value}</div>
    </div>
  );
};

export default WallboardLive;
