import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bus, User, Clock, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fmtTime = (d: string | null) => d ? new Date(d).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "—";

type Shift = { id: string; user_id: string; shift_date: string; shift_start: string; shift_end: string | null; assigned_bus_id: string | null; assigned_trip_id: string | null; role: string; status: string };
type Trip = { id: string; departure_date: string; departure_time: string; arrival_time: string; route_id: string; bus_id: string | null };
type Bus = { id: string; name: string; license_plate: string };
type Driver = { id: string; first_name: string | null; last_name: string | null; email: string };

export default function AdminDispoBoard() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragData, setDragData] = useState<{ type: "driver" | "bus"; id: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const [s, t, b, r, dr] = await Promise.all([
      supabase.from("employee_shifts").select("*").eq("shift_date", date),
      supabase.from("trips").select("*").eq("departure_date", date).order("departure_time"),
      supabase.from("buses").select("id, name, license_plate").eq("is_active", true).order("name"),
      supabase.from("routes").select("id, name, origin_city, destination_city"),
      supabase.from("user_roles").select("user_id").eq("role", "driver"),
    ]);
    setShifts((s.data as any) || []); setTrips((t.data as any) || []); setBuses(b.data || []); setRoutes(r.data || []);
    const driverIds = (dr.data || []).map((x: any) => x.user_id);
    if (driverIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, first_name, last_name, email").in("id", driverIds);
      setDrivers(profs || []);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [date]);

  const driverName = (id: string) => {
    const d = drivers.find(x => x.id === id);
    return d ? `${d.first_name || ""} ${d.last_name || ""}`.trim() || d.email : "—";
  };
  const busName = (id: string | null) => buses.find(b => b.id === id);
  const routeName = (id: string) => {
    const r = routes.find(x => x.id === id);
    return r ? `${r.origin_city} → ${r.destination_city}` : id?.slice(0, 8);
  };

  // Find conflicts: same driver/bus assigned to overlapping trips
  const conflicts = useMemo(() => {
    const c = new Set<string>();
    const byTrip: Record<string, Shift[]> = {};
    shifts.forEach(s => {
      if (s.assigned_trip_id) {
        byTrip[s.assigned_trip_id] = byTrip[s.assigned_trip_id] || [];
        byTrip[s.assigned_trip_id].push(s);
      }
    });
    // Driver assigned to 2 different trips at same time
    const byDriver: Record<string, Shift[]> = {};
    shifts.forEach(s => { byDriver[s.user_id] = byDriver[s.user_id] || []; byDriver[s.user_id].push(s); });
    Object.values(byDriver).forEach(arr => {
      if (arr.length > 1) arr.forEach(s => c.add(s.id));
    });
    return c;
  }, [shifts]);

  const onDropOnTrip = async (tripId: string) => {
    if (!dragData) return;
    if (dragData.type === "driver") {
      // Find or create shift for this driver on this date
      let shift = shifts.find(s => s.user_id === dragData.id);
      if (shift) {
        const { error } = await supabase.from("employee_shifts").update({ assigned_trip_id: tripId }).eq("id", shift.id);
        if (error) return toast.error(error.message);
      } else {
        const trip = trips.find(t => t.id === tripId);
        if (!trip) return;
        const startISO = `${trip.departure_date}T${trip.departure_time}`;
        const { error } = await supabase.from("employee_shifts").insert({
          user_id: dragData.id, shift_date: date, shift_start: startISO,
          assigned_trip_id: tripId, role: "driver", status: "scheduled",
        });
        if (error) return toast.error(error.message);
      }
      toast.success("Fahrer zugewiesen");
    } else {
      // Bus → trip
      const { error } = await supabase.from("trips").update({ bus_id: dragData.id }).eq("id", tripId);
      if (error) return toast.error(error.message);
      toast.success("Bus zugewiesen");
    }
    setDragData(null); load();
  };

  const removeAssignment = async (shiftId: string) => {
    const { error } = await supabase.from("employee_shifts").update({ assigned_trip_id: null }).eq("id", shiftId);
    if (error) return toast.error(error.message);
    load();
  };

  const removeBus = async (tripId: string) => {
    const { error } = await supabase.from("trips").update({ bus_id: null }).eq("id", tripId);
    if (error) return toast.error(error.message);
    load();
  };

  // Pool of unassigned drivers/buses
  const assignedDriverIds = new Set(shifts.filter(s => s.assigned_trip_id).map(s => s.user_id));
  const unassignedDrivers = drivers.filter(d => !assignedDriverIds.has(d.id));
  const assignedBusIds = new Set(trips.filter(t => t.bus_id).map(t => t.bus_id));
  const unassignedBuses = buses.filter(b => !assignedBusIds.has(b.id));

  return (
    <AdminLayout title="Dispo-Board" subtitle="Drag & Drop: Fahrer und Busse auf Fahrten zuweisen"
      actions={<div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-zinc-400" />
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white text-black w-44" />
      </div>}>
      {loading ? <div className="text-zinc-400 text-sm">Lädt...</div> : (
        <div className="grid grid-cols-12 gap-4">
          {/* Pools left */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <Pool title="Verfügbare Fahrer" icon={User} count={unassignedDrivers.length}>
              {unassignedDrivers.map(d => (
                <div key={d.id} draggable onDragStart={() => setDragData({ type: "driver", id: d.id })}
                  className="cursor-move rounded-lg bg-zinc-800 hover:bg-zinc-700 p-3 border border-zinc-700 hover:border-emerald-500 transition">
                  <div className="text-sm font-medium text-white">{d.first_name} {d.last_name}</div>
                  <div className="text-xs text-zinc-500">{d.email}</div>
                </div>
              ))}
              {unassignedDrivers.length === 0 && <div className="text-xs text-zinc-500 text-center py-4">Alle Fahrer zugewiesen</div>}
            </Pool>
            <Pool title="Verfügbare Busse" icon={Bus} count={unassignedBuses.length}>
              {unassignedBuses.map(b => (
                <div key={b.id} draggable onDragStart={() => setDragData({ type: "bus", id: b.id })}
                  className="cursor-move rounded-lg bg-zinc-800 hover:bg-zinc-700 p-3 border border-zinc-700 hover:border-emerald-500 transition">
                  <div className="text-sm font-medium text-white">{b.name}</div>
                  <div className="text-xs text-zinc-500 font-mono">{b.license_plate}</div>
                </div>
              ))}
              {unassignedBuses.length === 0 && <div className="text-xs text-zinc-500 text-center py-4">Alle Busse zugewiesen</div>}
            </Pool>
          </div>

          {/* Trips column */}
          <div className="col-span-12 lg:col-span-9">
            <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-4">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Fahrten am {new Date(date).toLocaleDateString("de-DE")} ({trips.length})
              </h3>
              {trips.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-sm">Keine Fahrten an diesem Tag</div>
              ) : (
                <div className="space-y-3">
                  {trips.map(t => {
                    const tripShifts = shifts.filter(s => s.assigned_trip_id === t.id);
                    const hasConflict = tripShifts.some(s => conflicts.has(s.id));
                    return (
                      <div key={t.id} onDragOver={e => e.preventDefault()} onDrop={() => onDropOnTrip(t.id)}
                        className={`rounded-lg border-2 border-dashed p-4 transition ${dragData ? "border-emerald-500 bg-emerald-500/5" : hasConflict ? "border-red-500/50 bg-red-500/5" : "border-zinc-800 bg-zinc-900"}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium text-white">{routeName(t.route_id)}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">{t.departure_time?.slice(0, 5)} → {t.arrival_time?.slice(0, 5)}</div>
                          </div>
                          {hasConflict && <span className="flex items-center gap-1 text-xs text-red-400"><AlertTriangle className="w-3 h-3" />Konflikt</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Fahrer</div>
                            {tripShifts.length > 0 ? tripShifts.map(s => (
                              <div key={s.id} className="flex items-center justify-between bg-zinc-800 rounded px-2 py-1.5 text-sm">
                                <span className="text-white">{driverName(s.user_id)}</span>
                                <button onClick={() => removeAssignment(s.id)} className="text-zinc-500 hover:text-red-400 text-xs">×</button>
                              </div>
                            )) : <div className="text-xs text-zinc-600 italic">Hier ablegen</div>}
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Bus</div>
                            {t.bus_id ? (
                              <div className="flex items-center justify-between bg-zinc-800 rounded px-2 py-1.5 text-sm">
                                <span className="text-white">{busName(t.bus_id)?.name}</span>
                                <button onClick={() => removeBus(t.id)} className="text-zinc-500 hover:text-red-400 text-xs">×</button>
                              </div>
                            ) : <div className="text-xs text-zinc-600 italic">Hier ablegen</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function Pool({ title, icon: Icon, count, children }: any) {
  return (
    <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><Icon className="w-4 h-4" />{title}</h4>
        <span className="text-xs text-zinc-500">{count}</span>
      </div>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">{children}</div>
    </div>
  );
}
