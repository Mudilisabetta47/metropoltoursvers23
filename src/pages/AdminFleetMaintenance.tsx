import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Wrench, Plus, AlertTriangle, CheckCircle2, Clock, Euro, Edit } from "lucide-react";
import { toast } from "sonner";

interface Bus { id: string; name: string; license_plate: string; }
interface Maintenance {
  id: string; bus_id: string; current_km: number;
  tuev_date: string | null; uvv_date: string | null;
  next_inspection_date: string | null; next_inspection_km: number | null;
  oil_change_date: string | null; oil_change_km: number | null;
  tachograph_date: string | null; notes: string | null;
}
interface Inspection {
  id: string; bus_id: string; inspection_type: string;
  performed_at: string; km_at_service: number | null;
  workshop: string | null; cost_eur: number; description: string | null;
}

const fmtEUR = (n: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("de-DE") : "—";

const daysUntil = (dateStr: string | null): number | null => {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
};

const statusFor = (days: number | null): { label: string; color: string; icon: any } => {
  if (days === null) return { label: "Nicht gesetzt", color: "bg-white/10 text-white/60 border-white/20", icon: Clock };
  if (days < 0) return { label: `Überfällig (${Math.abs(days)}T)`, color: "bg-rose-500/20 text-rose-400 border-rose-500/40", icon: AlertTriangle };
  if (days <= 14) return { label: `In ${days} Tagen`, color: "bg-rose-500/20 text-rose-400 border-rose-500/40", icon: AlertTriangle };
  if (days <= 30) return { label: `In ${days} Tagen`, color: "bg-amber-500/20 text-amber-400 border-amber-500/40", icon: Clock };
  return { label: `In ${days} Tagen`, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", icon: CheckCircle2 };
};

const AdminFleetMaintenance = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editBus, setEditBus] = useState<Bus | null>(null);
  const [historyBus, setHistoryBus] = useState<Bus | null>(null);
  const [newInspBus, setNewInspBus] = useState<Bus | null>(null);

  // Edit form state
  const [form, setForm] = useState<Partial<Maintenance>>({});
  const [inspForm, setInspForm] = useState({
    inspection_type: "Inspektion",
    performed_at: new Date().toISOString().slice(0, 10),
    km_at_service: 0,
    workshop: "",
    cost_eur: 0,
    description: "",
  });

  const load = async () => {
    setLoading(true);
    const [busesRes, mRes, iRes] = await Promise.all([
      supabase.from("buses").select("id,name,license_plate").eq("is_active", true).order("name"),
      supabase.from("fleet_maintenance" as any).select("*"),
      supabase.from("fleet_inspections" as any).select("*").order("performed_at", { ascending: false }),
    ]);
    setBuses(busesRes.data ?? []);
    setMaintenance((mRes.data as any) ?? []);
    setInspections((iRes.data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getMaint = (busId: string) => maintenance.find((m) => m.bus_id === busId);
  const getInspections = (busId: string) => inspections.filter((i) => i.bus_id === busId);
  const totalCost = (busId: string) => getInspections(busId).reduce((s, i) => s + Number(i.cost_eur || 0), 0);

  const openEdit = (bus: Bus) => {
    const existing = getMaint(bus.id);
    setForm(existing ?? { bus_id: bus.id, current_km: 0 });
    setEditBus(bus);
  };

  const saveMaint = async () => {
    if (!editBus) return;
    const payload = { ...form, bus_id: editBus.id };
    delete (payload as any).id;
    delete (payload as any).created_at;
    delete (payload as any).updated_at;

    const existing = getMaint(editBus.id);
    const { error } = existing
      ? await supabase.from("fleet_maintenance" as any).update(payload).eq("id", existing.id)
      : await supabase.from("fleet_maintenance" as any).insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Wartungsdaten gespeichert");
    setEditBus(null);
    load();
  };

  const addInspection = async () => {
    if (!newInspBus) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("fleet_inspections" as any).insert({
      ...inspForm, bus_id: newInspBus.id, created_by: u.user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Werkstatt-Eintrag gespeichert");
    setNewInspBus(null);
    setInspForm({ inspection_type: "Inspektion", performed_at: new Date().toISOString().slice(0, 10), km_at_service: 0, workshop: "", cost_eur: 0, description: "" });
    load();
  };

  // KPIs
  const totalBuses = buses.length;
  const overdueCount = buses.filter((b) => {
    const m = getMaint(b.id);
    if (!m) return false;
    return [m.tuev_date, m.uvv_date, m.next_inspection_date].some((d) => {
      const days = daysUntil(d);
      return days !== null && days < 0;
    });
  }).length;
  const dueSoonCount = buses.filter((b) => {
    const m = getMaint(b.id);
    if (!m) return false;
    return [m.tuev_date, m.uvv_date, m.next_inspection_date].some((d) => {
      const days = daysUntil(d);
      return days !== null && days >= 0 && days <= 30;
    });
  }).length;
  const fleetCost = inspections.reduce((s, i) => s + Number(i.cost_eur || 0), 0);

  return (
    <AdminLayout title="Wartungs-Manager Flotte" subtitle="TÜV · UVV · Inspektion · Werkstatt-Historie">
      {/* KPI Row */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-white tabular-nums">{totalBuses}</div>
              <div className="text-xs text-white/60 uppercase tracking-widest">Aktive Busse</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-500/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
            <div>
              <div className="text-2xl font-bold text-white tabular-nums">{overdueCount}</div>
              <div className="text-xs text-white/60 uppercase tracking-widest">Überfällig</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-400" />
            <div>
              <div className="text-2xl font-bold text-white tabular-nums">{dueSoonCount}</div>
              <div className="text-xs text-white/60 uppercase tracking-widest">Fällig in 30T</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <div className="flex items-center gap-3">
            <Euro className="w-8 h-8 text-emerald-400" />
            <div>
              <div className="text-2xl font-bold text-white tabular-nums">{fmtEUR(fleetCost)}</div>
              <div className="text-xs text-white/60 uppercase tracking-widest">Gesamtkosten</div>
            </div>
          </div>
        </Card>
      </div>

      {loading ? (
        <p className="text-white/50">Lade…</p>
      ) : (
        <div className="space-y-3">
          {buses.map((bus) => {
            const m = getMaint(bus.id);
            const tuev = statusFor(daysUntil(m?.tuev_date ?? null));
            const uvv = statusFor(daysUntil(m?.uvv_date ?? null));
            const insp = statusFor(daysUntil(m?.next_inspection_date ?? null));
            const cost = totalCost(bus.id);

            return (
              <Card key={bus.id} className="p-5 bg-[#0f1218] border-white/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-lg font-bold text-white">{bus.name}</div>
                        <div className="text-xs text-white/50 font-mono">{bus.license_plate} · {m?.current_km?.toLocaleString("de-DE") ?? 0} km</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setHistoryBus(bus)} className="border-white/10 text-white/80">
                          <Wrench className="w-4 h-4 mr-1" />Historie ({getInspections(bus.id).length})
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setNewInspBus(bus)} className="border-white/10 text-white/80">
                          <Plus className="w-4 h-4 mr-1" />Werkstatt
                        </Button>
                        <Button size="sm" onClick={() => openEdit(bus)} className="bg-emerald-600 hover:bg-emerald-500">
                          <Edit className="w-4 h-4 mr-1" />Wartungsdaten
                        </Button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-3">
                      <StatusTile label="TÜV/HU" date={m?.tuev_date} status={tuev} />
                      <StatusTile label="UVV" date={m?.uvv_date} status={uvv} />
                      <StatusTile label="Inspektion" date={m?.next_inspection_date} status={insp} />
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-[10px] uppercase tracking-widest text-white/50">Kosten gesamt</div>
                        <div className="text-lg font-bold text-emerald-400 tabular-nums">{fmtEUR(cost)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit maintenance dialog */}
      <Dialog open={!!editBus} onOpenChange={(o) => !o && setEditBus(null)}>
        <DialogContent className="bg-[#0f1218] border-white/10 text-white max-w-2xl">
          <DialogHeader><DialogTitle>Wartungsdaten · {editBus?.name}</DialogTitle></DialogHeader>
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Aktueller km-Stand</Label><Input type="number" value={form.current_km ?? 0} onChange={(e) => setForm({ ...form, current_km: parseInt(e.target.value) || 0 })} className="bg-white text-black" /></div>
            <div><Label>TÜV/HU bis</Label><Input type="date" value={form.tuev_date ?? ""} onChange={(e) => setForm({ ...form, tuev_date: e.target.value })} className="bg-white text-black" /></div>
            <div><Label>UVV bis</Label><Input type="date" value={form.uvv_date ?? ""} onChange={(e) => setForm({ ...form, uvv_date: e.target.value })} className="bg-white text-black" /></div>
            <div><Label>Tachograph bis</Label><Input type="date" value={form.tachograph_date ?? ""} onChange={(e) => setForm({ ...form, tachograph_date: e.target.value })} className="bg-white text-black" /></div>
            <div><Label>Nächste Inspektion (Datum)</Label><Input type="date" value={form.next_inspection_date ?? ""} onChange={(e) => setForm({ ...form, next_inspection_date: e.target.value })} className="bg-white text-black" /></div>
            <div><Label>Nächste Inspektion (km)</Label><Input type="number" value={form.next_inspection_km ?? 0} onChange={(e) => setForm({ ...form, next_inspection_km: parseInt(e.target.value) || 0 })} className="bg-white text-black" /></div>
            <div><Label>Letzter Ölwechsel</Label><Input type="date" value={form.oil_change_date ?? ""} onChange={(e) => setForm({ ...form, oil_change_date: e.target.value })} className="bg-white text-black" /></div>
            <div><Label>Ölwechsel bei (km)</Label><Input type="number" value={form.oil_change_km ?? 0} onChange={(e) => setForm({ ...form, oil_change_km: parseInt(e.target.value) || 0 })} className="bg-white text-black" /></div>
            <div className="md:col-span-2"><Label>Notizen</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-white text-black" rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBus(null)}>Abbrechen</Button>
            <Button onClick={saveMaint} className="bg-emerald-600 hover:bg-emerald-500">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New inspection dialog */}
      <Dialog open={!!newInspBus} onOpenChange={(o) => !o && setNewInspBus(null)}>
        <DialogContent className="bg-[#0f1218] border-white/10 text-white max-w-xl">
          <DialogHeader><DialogTitle>Werkstatt-Eintrag · {newInspBus?.name}</DialogTitle></DialogHeader>
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Typ</Label>
              <select value={inspForm.inspection_type} onChange={(e) => setInspForm({ ...inspForm, inspection_type: e.target.value })} className="w-full h-10 rounded-md bg-white text-black px-3">
                <option>Inspektion</option><option>TÜV/HU</option><option>UVV</option><option>Reparatur</option><option>Ölwechsel</option><option>Reifen</option><option>Sonstiges</option>
              </select>
            </div>
            <div><Label>Datum</Label><Input type="date" value={inspForm.performed_at} onChange={(e) => setInspForm({ ...inspForm, performed_at: e.target.value })} className="bg-white text-black" /></div>
            <div><Label>km-Stand</Label><Input type="number" value={inspForm.km_at_service} onChange={(e) => setInspForm({ ...inspForm, km_at_service: parseInt(e.target.value) || 0 })} className="bg-white text-black" /></div>
            <div><Label>Kosten (€)</Label><Input type="number" step="0.01" value={inspForm.cost_eur} onChange={(e) => setInspForm({ ...inspForm, cost_eur: parseFloat(e.target.value) || 0 })} className="bg-white text-black" /></div>
            <div className="md:col-span-2"><Label>Werkstatt</Label><Input value={inspForm.workshop} onChange={(e) => setInspForm({ ...inspForm, workshop: e.target.value })} className="bg-white text-black" /></div>
            <div className="md:col-span-2"><Label>Beschreibung</Label><Textarea value={inspForm.description} onChange={(e) => setInspForm({ ...inspForm, description: e.target.value })} className="bg-white text-black" rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewInspBus(null)}>Abbrechen</Button>
            <Button onClick={addInspection} className="bg-emerald-600 hover:bg-emerald-500">Eintrag speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={!!historyBus} onOpenChange={(o) => !o && setHistoryBus(null)}>
        <DialogContent className="bg-[#0f1218] border-white/10 text-white max-w-3xl">
          <DialogHeader><DialogTitle>Werkstatt-Historie · {historyBus?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {historyBus && getInspections(historyBus.id).length === 0 && <p className="text-white/40 text-sm">Keine Einträge.</p>}
            {historyBus && getInspections(historyBus.id).map((i) => (
              <div key={i.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <Badge>{i.inspection_type}</Badge>
                  <span className="text-emerald-400 font-bold tabular-nums">{fmtEUR(Number(i.cost_eur || 0))}</span>
                </div>
                <div className="text-sm text-white/80 mt-2">{i.description}</div>
                <div className="text-xs text-white/50 mt-1">
                  {fmtDate(i.performed_at)} · {i.km_at_service?.toLocaleString("de-DE") ?? "—"} km · {i.workshop ?? "—"}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

const StatusTile = ({ label, date, status }: { label: string; date: string | null | undefined; status: ReturnType<typeof statusFor> }) => {
  const Icon = status.icon;
  return (
    <div className={`p-3 rounded-lg border ${status.color}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-widest opacity-80">{label}</span>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-sm font-bold">{fmtDate(date ?? null)}</div>
      <div className="text-[11px] opacity-90">{status.label}</div>
    </div>
  );
};

export default AdminFleetMaintenance;
