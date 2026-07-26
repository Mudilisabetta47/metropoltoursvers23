import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bus, Fuel, Droplets, Gauge, Wrench, AlertTriangle, Plus, Camera } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import DamageReportDialog from "./DamageReportDialog";

const VehicleTab = ({ userId }: { userId: string }) => {
  const [bus, setBus] = useState<any>(null);
  const [damages, setDamages] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any>(null);
  const [fuel, setFuel] = useState<any>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const load = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data: shift } = await supabase
      .from("employee_shifts")
      .select("assigned_bus_id")
      .eq("user_id", userId)
      .gte("shift_date", today)
      .order("shift_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!shift?.assigned_bus_id) return;

    const [{ data: busData }, { data: dmg }, { data: maint }, { data: fuelData }] = await Promise.all([
      supabase.from("buses").select("*").eq("id", shift.assigned_bus_id).maybeSingle(),
      supabase.from("vehicle_damages").select("*").eq("bus_id", shift.assigned_bus_id).order("damage_date", { ascending: false }).limit(5),
      supabase.from("bus_maintenance" as any).select("*").eq("bus_id", shift.assigned_bus_id).order("scheduled_date", { ascending: true }).limit(1).maybeSingle(),
      supabase.from("fuel_log").select("*").eq("bus_id", shift.assigned_bus_id).order("fuel_date", { ascending: false }).limit(1).maybeSingle(),
    ]);

    setBus(busData);
    setDamages(dmg || []);
    setMaintenance(maint);
    setFuel(fuelData);
  };

  useEffect(() => { load(); }, [userId]);

  if (!bus) {
    return (
      <div className="text-center py-16 rounded-2xl bg-[#131720] border border-white/5">
        <Bus className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
        <div className="text-white font-semibold">Kein Bus zugewiesen</div>
        <div className="text-sm text-zinc-500 mt-1">Bitte warte auf die Zuweisung der Disposition.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bus Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-cyan-500/15 via-[#131720] to-[#131720] border border-cyan-500/20 p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Bus className="w-7 h-7 text-cyan-300" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-white">{bus.license_plate}</div>
            <div className="text-sm text-zinc-400">{bus.name} · {bus.total_seats} Sitze</div>
          </div>
        </div>
      </section>

      {/* Sensor Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Sensor icon={Fuel} label="Tankstand" value={fuel ? `${fuel.liters ?? "—"} L` : "—"} tint="amber" />
        <Sensor icon={Droplets} label="AdBlue" value="—" tint="blue" />
        <Sensor icon={Gauge} label="Kilometerstand" value={fuel?.odometer_km ? `${fuel.odometer_km.toLocaleString("de-DE")} km` : "—"} tint="emerald" />
        <Sensor
          icon={Wrench}
          label="Nächster Service"
          value={maintenance?.scheduled_date ? format(new Date(maintenance.scheduled_date), "dd.MM.yy", { locale: de }) : "—"}
          tint="violet"
        />
      </section>

      {/* Mängel */}
      <section className="rounded-2xl bg-[#131720] border border-white/5 overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Mängel / Schäden ({damages.length})
          </h3>
          <button
            onClick={() => setReportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Neu
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {damages.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500">Keine offenen Mängel – top!</div>
          ) : (
            damages.map((d) => (
              <div key={d.id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-white text-sm">{d.damage_type}</div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    d.severity === "critical" ? "bg-red-500/20 text-red-300" :
                    d.severity === "high" ? "bg-amber-500/20 text-amber-300" :
                    "bg-zinc-700/40 text-zinc-300"
                  }`}>{d.severity}</span>
                </div>
                <div className="text-xs text-zinc-400 line-clamp-2">{d.description}</div>
                <div className="text-[10px] text-zinc-600 mt-1">{format(new Date(d.damage_date), "dd.MM.yyyy", { locale: de })}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <DamageReportDialog
        open={reportOpen}
        onClose={() => { setReportOpen(false); load(); }}
        busId={bus.id}
        userId={userId}
      />
    </div>
  );
};

const Sensor = ({ icon: Icon, label, value, tint }: any) => {
  const tints: Record<string, string> = {
    emerald: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    blue: "text-blue-300 bg-blue-500/10 border-blue-500/20",
    violet: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  };
  return (
    <div className={`rounded-xl border p-4 ${tints[tint]}`}>
      <Icon className="w-5 h-5 mb-2 opacity-80" />
      <div className="text-lg font-bold text-white tabular-nums">{value}</div>
      <div className="text-xs opacity-70 mt-0.5">{label}</div>
    </div>
  );
};

export default VehicleTab;
