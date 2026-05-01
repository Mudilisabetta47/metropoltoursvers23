import { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataTable, DataTableColumn } from "@/components/admin/core/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Fuel, Gauge, Euro, Droplet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("de-DE") : "—");
const eur = (n: number | null) => (n != null ? `${Number(n).toFixed(2)} €` : "—");

export default function AdminFuelLog() {
  const [rows, setRows] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ fuel_type: "diesel", country: "DE", refuel_date: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    setLoading(true);
    const [{ data }, { data: b }] = await Promise.all([
      supabase.from("fuel_log").select("*, bus:buses(name, license_plate)").order("refuel_date", { ascending: false }).limit(500),
      supabase.from("buses").select("id, name, license_plate").eq("is_active", true).order("name"),
    ]);
    setRows(data || []); setBuses(b || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const last30 = rows.filter(r => Date.now() - new Date(r.refuel_date).getTime() < 30 * 86400000);
    const liters = last30.reduce((s, r) => s + Number(r.liters || 0), 0);
    const cost = last30.reduce((s, r) => s + Number(r.total_cost || 0), 0);
    const avgPrice = liters > 0 ? cost / liters : 0;
    return { count: last30.length, liters, cost, avgPrice };
  }, [rows]);

  const save = async () => {
    if (!form.bus_id || !form.liters || !form.price_per_liter) return toast.error("Bus, Liter & Preis erforderlich");
    const total = Number(form.liters) * Number(form.price_per_liter);
    const { error } = await supabase.from("fuel_log").insert({ ...form, total_cost: total });
    if (error) return toast.error(error.message);
    toast.success("Tankung gespeichert");
    setOpen(false); setForm({ fuel_type: "diesel", country: "DE", refuel_date: new Date().toISOString().slice(0, 10) }); load();
  };

  const columns: DataTableColumn<any>[] = [
    { key: "date", header: "Datum", accessor: r => fmtDate(r.refuel_date), sortValue: r => r.refuel_date },
    { key: "bus", header: "Fahrzeug", accessor: r => r.bus ? <div><div className="font-medium text-white">{r.bus.name}</div><div className="text-xs text-zinc-500">{r.bus.license_plate}</div></div> : "—" },
    { key: "station", header: "Tankstelle", accessor: r => <div><div className="text-white">{r.station_name || "—"}</div><div className="text-xs text-zinc-500">{r.country}</div></div> },
    { key: "liters", header: "Liter", accessor: r => `${Number(r.liters).toFixed(2)} L`, sortValue: r => Number(r.liters) },
    { key: "ppl", header: "€/L", accessor: r => eur(r.price_per_liter), sortValue: r => Number(r.price_per_liter) },
    { key: "total", header: "Gesamt", accessor: r => <span className="font-semibold text-emerald-400">{eur(r.total_cost)}</span>, sortValue: r => Number(r.total_cost) },
    { key: "odo", header: "KM-Stand", accessor: r => r.odometer_km ? `${r.odometer_km.toLocaleString("de-DE")} km` : "—", sortValue: r => Number(r.odometer_km || 0) },
    { key: "card", header: "Karte", accessor: r => r.fuel_card || "—" },
  ];

  return (
    <AdminLayout title="Tankungen" subtitle="Kraftstoff-Log mit Verbrauchsanalyse"
      actions={<Button onClick={() => setOpen(true)} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black"><Plus className="w-4 h-4 mr-2" />Tankung erfassen</Button>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon={Fuel} label="Tankungen (30d)" value={stats.count} />
        <Stat icon={Droplet} label="Liter (30d)" value={`${stats.liters.toFixed(0)} L`} />
        <Stat icon={Euro} label="Kosten (30d)" value={`${stats.cost.toFixed(2)} €`} highlight />
        <Stat icon={Gauge} label="Ø €/L" value={`${stats.avgPrice.toFixed(3)} €`} />
      </div>

      <DataTable data={rows} columns={columns} rowKey={r => r.id} isLoading={loading} exportFilename="tankungen" emptyMessage="Noch keine Tankungen erfasst" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl">
          <DialogHeader><DialogTitle>Tankung erfassen</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Fahrzeug *</Label>
              <Select value={form.bus_id} onValueChange={v => setForm({ ...form, bus_id: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Fahrzeug wählen" /></SelectTrigger>
                <SelectContent>{buses.map(b => <SelectItem key={b.id} value={b.id}>{b.name} ({b.license_plate})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Datum *</Label><Input type="date" className="bg-white text-black" value={form.refuel_date} onChange={e => setForm({ ...form, refuel_date: e.target.value })} /></div>
            <div>
              <Label>Kraftstoff</Label>
              <Select value={form.fuel_type} onValueChange={v => setForm({ ...form, fuel_type: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="diesel">Diesel</SelectItem><SelectItem value="adblue">AdBlue</SelectItem><SelectItem value="petrol">Benzin</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Liter *</Label><Input type="number" step="0.01" className="bg-white text-black" onChange={e => setForm({ ...form, liters: Number(e.target.value) })} /></div>
            <div><Label>Preis pro Liter *</Label><Input type="number" step="0.001" className="bg-white text-black" onChange={e => setForm({ ...form, price_per_liter: Number(e.target.value) })} /></div>
            <div><Label>KM-Stand</Label><Input type="number" className="bg-white text-black" onChange={e => setForm({ ...form, odometer_km: Number(e.target.value) })} /></div>
            <div><Label>Tankkarte</Label><Input className="bg-white text-black" placeholder="DKV, UTA..." onChange={e => setForm({ ...form, fuel_card: e.target.value })} /></div>
            <div><Label>Tankstelle</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, station_name: e.target.value })} /></div>
            <div><Label>Land</Label><Input className="bg-white text-black" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></div>
          </div>
          {form.liters && form.price_per_liter ? (
            <div className="text-right text-emerald-400 font-semibold">Gesamt: {(Number(form.liters) * Number(form.price_per_liter)).toFixed(2)} €</div>
          ) : null}
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button><Button onClick={save} className="bg-[#00CC36] text-black">Speichern</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function Stat({ icon: Icon, label, value, highlight }: any) {
  return (
    <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-2"><Icon className={`w-5 h-5 ${highlight ? "text-emerald-400" : "text-zinc-400"}`} /><span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span></div>
      <div className={`text-2xl font-bold ${highlight ? "text-emerald-400" : "text-white"}`}>{value}</div>
    </div>
  );
}
