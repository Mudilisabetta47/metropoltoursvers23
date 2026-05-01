import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataTable, DataTableColumn } from "@/components/admin/core/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, IdCard, GraduationCap, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("de-DE") : "—");
const daysUntil = (d: string | null) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;

const LICENSE_CLASSES = ["B", "C", "C1", "CE", "D", "D1", "DE"];
const TRAINING_TYPES = [
  { value: "module_95", label: "Modul 95 (BKrFQG)" },
  { value: "first_aid", label: "Erste Hilfe" },
  { value: "adr", label: "ADR Gefahrgut" },
  { value: "defensive_driving", label: "Defensives Fahren" },
  { value: "eco_driving", label: "Eco-Driving" },
  { value: "customer_service", label: "Kundenservice" },
];

export default function AdminDriverCompliance() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"license" | "training">("license");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    setLoading(true);
    const [l, t, d] = await Promise.all([
      supabase.from("driver_licenses").select("*").order("expires_at", { ascending: true }),
      supabase.from("driver_trainings").select("*").order("expires_at", { ascending: true, nullsFirst: false }),
      supabase.rpc("get_staff_list" as any).then((r: any) => r.data ? { data: r.data } : supabase.from("user_roles").select("user_id").eq("role", "driver")),
    ]);
    setLicenses(l.data || []); setTrainings(t.data || []);
    // Resolve driver names via profiles
    const driverIds = [...new Set([...(l.data || []), ...(t.data || [])].map((x: any) => x.driver_id))].filter(Boolean);
    if (driverIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, first_name, last_name, email").in("id", driverIds);
      setDrivers(profs || []);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const driverName = (id: string) => {
    const p = drivers.find(d => d.id === id);
    return p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email : id?.slice(0, 8);
  };

  const save = async () => {
    const table = tab === "license" ? "driver_licenses" : "driver_trainings";
    if (!form.driver_id) return toast.error("Fahrer erforderlich");
    if (tab === "license" && (!form.license_class || !form.license_number || !form.expires_at)) return toast.error("Klasse, Nr. & Ablauf erforderlich");
    if (tab === "training" && (!form.training_type || !form.title)) return toast.error("Typ & Titel erforderlich");
    const { error } = await supabase.from(table).insert(form);
    if (error) return toast.error(error.message);
    toast.success("Gespeichert");
    setOpen(false); setForm({}); load();
  };

  const licStats = {
    expired: licenses.filter(l => (daysUntil(l.expires_at) ?? 0) < 0).length,
    soon: licenses.filter(l => { const d = daysUntil(l.expires_at) ?? 999; return d >= 0 && d <= 60; }).length,
    valid: licenses.filter(l => (daysUntil(l.expires_at) ?? 0) > 60).length,
    mod95Soon: licenses.filter(l => { const d = daysUntil(l.module_95_expires) ?? 999; return d >= 0 && d <= 90; }).length,
  };

  const licCols: DataTableColumn<any>[] = [
    { key: "driver", header: "Fahrer", accessor: r => <span className="font-medium text-white">{driverName(r.driver_id)}</span>, sortValue: r => driverName(r.driver_id) },
    { key: "class", header: "Klasse", accessor: r => <span className="px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 text-xs font-mono">{r.license_class}</span>, sortValue: r => r.license_class },
    { key: "num", header: "Führerschein-Nr.", accessor: r => <span className="font-mono text-xs">{r.license_number}</span> },
    { key: "expires", header: "Gültig bis", accessor: r => {
      const d = daysUntil(r.expires_at) ?? 0;
      const cls = d < 0 ? "text-red-400" : d <= 60 ? "text-amber-400" : "text-emerald-400";
      return <div><div className={cls}>{fmtDate(r.expires_at)}</div><div className="text-xs text-zinc-500">{d < 0 ? `vor ${Math.abs(d)} T.` : `in ${d} T.`}</div></div>;
    }, sortValue: r => r.expires_at || "" },
    { key: "mod95", header: "Modul 95", accessor: r => {
      if (!r.module_95_expires) return <span className="text-zinc-500">—</span>;
      const d = daysUntil(r.module_95_expires) ?? 0;
      const cls = d < 0 ? "text-red-400" : d <= 90 ? "text-amber-400" : "text-emerald-400";
      return <span className={cls}>{fmtDate(r.module_95_expires)}</span>;
    } },
    { key: "adr", header: "ADR", accessor: r => r.adr_certificate ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span className="text-zinc-600">—</span> },
  ];

  const trainCols: DataTableColumn<any>[] = [
    { key: "driver", header: "Fahrer", accessor: r => <span className="font-medium text-white">{driverName(r.driver_id)}</span>, sortValue: r => driverName(r.driver_id) },
    { key: "type", header: "Typ", accessor: r => TRAINING_TYPES.find(t => t.value === r.training_type)?.label || r.training_type },
    { key: "title", header: "Titel", accessor: r => r.title },
    { key: "provider", header: "Anbieter", accessor: r => r.provider || "—" },
    { key: "completed", header: "Absolviert", accessor: r => fmtDate(r.completed_at), sortValue: r => r.completed_at || "" },
    { key: "expires", header: "Gültig bis", accessor: r => {
      if (!r.expires_at) return <span className="text-zinc-500">—</span>;
      const d = daysUntil(r.expires_at) ?? 0;
      const cls = d < 0 ? "text-red-400" : d <= 90 ? "text-amber-400" : "text-emerald-400";
      return <span className={cls}>{fmtDate(r.expires_at)}</span>;
    }, sortValue: r => r.expires_at || "" },
    { key: "hours", header: "Stunden", accessor: r => r.hours ? `${r.hours} h` : "—" },
    { key: "passed", header: "Bestanden", accessor: r => r.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" /> },
  ];

  return (
    <AdminLayout title="Fahrer-Compliance" subtitle="Führerscheine, Modul 95, Schulungen"
      actions={<Button onClick={() => { setForm({}); setOpen(true); }} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black"><Plus className="w-4 h-4 mr-2" />Neuer Eintrag</Button>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Box icon={AlertCircle} label="Führerscheine abgelaufen" value={licStats.expired} color="text-red-400" />
        <Box icon={AlertTriangle} label="Bald ablaufend (60T)" value={licStats.soon} color="text-amber-400" />
        <Box icon={CheckCircle2} label="Gültig" value={licStats.valid} color="text-emerald-400" />
        <Box icon={GraduationCap} label="Modul 95 in 90T" value={licStats.mod95Soon} color="text-amber-400" />
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as any)}>
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="license" className="data-[state=active]:bg-zinc-800"><IdCard className="w-4 h-4 mr-2" />Führerscheine</TabsTrigger>
          <TabsTrigger value="training" className="data-[state=active]:bg-zinc-800"><GraduationCap className="w-4 h-4 mr-2" />Schulungen</TabsTrigger>
        </TabsList>
        <TabsContent value="license" className="mt-4">
          <DataTable data={licenses} columns={licCols} rowKey={r => r.id} isLoading={loading} exportFilename="fuehrerscheine" emptyMessage="Keine Führerscheine erfasst" />
        </TabsContent>
        <TabsContent value="training" className="mt-4">
          <DataTable data={trainings} columns={trainCols} rowKey={r => r.id} isLoading={loading} exportFilename="schulungen" emptyMessage="Keine Schulungen erfasst" />
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl">
          <DialogHeader><DialogTitle>{tab === "license" ? "Führerschein" : "Schulung"} erfassen</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Fahrer *</Label>
              <Select value={form.driver_id} onValueChange={v => setForm({ ...form, driver_id: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Fahrer wählen" /></SelectTrigger>
                <SelectContent>{drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.first_name} {d.last_name} ({d.email})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {tab === "license" ? (
              <>
                <div>
                  <Label>Klasse *</Label>
                  <Select value={form.license_class} onValueChange={v => setForm({ ...form, license_class: v })}>
                    <SelectTrigger className="bg-white text-black"><SelectValue /></SelectTrigger>
                    <SelectContent>{LICENSE_CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>FS-Nummer *</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, license_number: e.target.value })} /></div>
                <div><Label>Ausgestellt am</Label><Input type="date" className="bg-white text-black" onChange={e => setForm({ ...form, issued_date: e.target.value })} /></div>
                <div><Label>Ausstellende Behörde</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, issued_by: e.target.value })} /></div>
                <div><Label>Gültig bis *</Label><Input type="date" className="bg-white text-black" onChange={e => setForm({ ...form, expires_at: e.target.value })} /></div>
                <div><Label>Modul 95 Nr.</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, module_95_number: e.target.value })} /></div>
                <div><Label>Modul 95 läuft ab</Label><Input type="date" className="bg-white text-black" onChange={e => setForm({ ...form, module_95_expires: e.target.value })} /></div>
                <div className="flex items-end"><label className="flex items-center gap-2 text-sm"><input type="checkbox" onChange={e => setForm({ ...form, adr_certificate: e.target.checked })} />ADR-Schein</label></div>
              </>
            ) : (
              <>
                <div>
                  <Label>Schulungstyp *</Label>
                  <Select value={form.training_type} onValueChange={v => setForm({ ...form, training_type: v })}>
                    <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Wählen" /></SelectTrigger>
                    <SelectContent>{TRAINING_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Titel *</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Anbieter</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, provider: e.target.value })} /></div>
                <div><Label>Stunden</Label><Input type="number" step="0.5" className="bg-white text-black" onChange={e => setForm({ ...form, hours: Number(e.target.value) })} /></div>
                <div><Label>Absolviert am</Label><Input type="date" className="bg-white text-black" onChange={e => setForm({ ...form, completed_at: e.target.value })} /></div>
                <div><Label>Gültig bis</Label><Input type="date" className="bg-white text-black" onChange={e => setForm({ ...form, expires_at: e.target.value })} /></div>
                <div><Label>Kosten (€)</Label><Input type="number" step="0.01" className="bg-white text-black" onChange={e => setForm({ ...form, cost: Number(e.target.value) })} /></div>
                <div className="flex items-end"><label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked onChange={e => setForm({ ...form, passed: e.target.checked })} />Bestanden</label></div>
              </>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button><Button onClick={save} className="bg-[#00CC36] text-black">Speichern</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function Box({ icon: Icon, label, value, color }: any) {
  return (
    <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-2"><Icon className={`w-5 h-5 ${color}`} /><span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span></div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
