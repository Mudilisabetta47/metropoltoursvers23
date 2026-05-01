import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataTable, DataTableColumn } from "@/components/admin/core/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Compliance = {
  id: string;
  bus_id: string;
  compliance_type: string;
  last_check_date: string | null;
  due_date: string;
  status: string;
  certificate_number: string | null;
  inspector: string | null;
  cost: number | null;
  reminder_days: number;
  notes: string | null;
  bus?: { name: string; license_plate: string } | null;
};

const COMPLIANCE_TYPES = [
  { value: "tuv", label: "TÜV / HU" },
  { value: "uvv", label: "UVV-Prüfung" },
  { value: "tachograph", label: "Tachograph-Prüfung" },
  { value: "safety_check", label: "SP / Sicherheitsprüfung" },
  { value: "emissions", label: "AU / Abgasuntersuchung" },
  { value: "first_aid", label: "Erste-Hilfe-Kasten" },
  { value: "fire_extinguisher", label: "Feuerlöscher" },
];

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("de-DE") : "—");
const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

export default function AdminFleetCompliance() {
  const [rows, setRows] = useState<Compliance[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ compliance_type: "tuv", reminder_days: 30 });

  const load = async () => {
    setLoading(true);
    const [{ data }, { data: b }] = await Promise.all([
      supabase.from("fleet_compliance").select("*, bus:buses(name, license_plate)").order("due_date", { ascending: true }),
      supabase.from("buses").select("id, name, license_plate").eq("is_active", true).order("name"),
    ]);
    setRows((data as any) || []);
    setBuses(b || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.bus_id || !form.due_date) return toast.error("Bus & Fälligkeit erforderlich");
    const { error } = await supabase.from("fleet_compliance").insert(form);
    if (error) return toast.error(error.message);
    toast.success("Eintrag gespeichert");
    setOpen(false); setForm({ compliance_type: "tuv", reminder_days: 30 }); load();
  };

  const stats = {
    total: rows.length,
    expired: rows.filter(r => daysUntil(r.due_date) < 0).length,
    soon: rows.filter(r => { const d = daysUntil(r.due_date); return d >= 0 && d <= 30; }).length,
    valid: rows.filter(r => daysUntil(r.due_date) > 30).length,
  };

  const columns: DataTableColumn<Compliance>[] = [
    { key: "bus", header: "Fahrzeug", accessor: r => (
      <div><div className="font-medium text-white">{r.bus?.name || "—"}</div><div className="text-xs text-zinc-500">{r.bus?.license_plate}</div></div>
    ), sortValue: r => r.bus?.name || "" },
    { key: "type", header: "Prüfung", accessor: r => COMPLIANCE_TYPES.find(t => t.value === r.compliance_type)?.label || r.compliance_type, sortValue: r => r.compliance_type },
    { key: "last", header: "Letzte Prüfung", accessor: r => fmtDate(r.last_check_date), sortValue: r => r.last_check_date || "" },
    { key: "due", header: "Fällig", accessor: r => {
      const d = daysUntil(r.due_date);
      const cls = d < 0 ? "text-red-400" : d <= 30 ? "text-amber-400" : "text-emerald-400";
      return <div><div className={cls}>{fmtDate(r.due_date)}</div><div className="text-xs text-zinc-500">{d < 0 ? `vor ${Math.abs(d)} T.` : `in ${d} T.`}</div></div>;
    }, sortValue: r => r.due_date },
    { key: "cert", header: "Zertifikat", accessor: r => r.certificate_number || "—" },
    { key: "cost", header: "Kosten", accessor: r => r.cost ? `${Number(r.cost).toFixed(2)} €` : "—", sortValue: r => Number(r.cost || 0) },
  ];

  return (
    <AdminLayout title="Flotten-Compliance" subtitle="TÜV, UVV, Tachograph & Prüfberichte"
      actions={<Button onClick={() => setOpen(true)} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black"><Plus className="w-4 h-4 mr-2" />Neue Prüfung</Button>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatBox icon={ShieldCheck} label="Gesamt" value={stats.total} color="text-zinc-300" />
        <StatBox icon={AlertCircle} label="Abgelaufen" value={stats.expired} color="text-red-400" />
        <StatBox icon={AlertTriangle} label="Bald fällig" value={stats.soon} color="text-amber-400" />
        <StatBox icon={CheckCircle2} label="Gültig" value={stats.valid} color="text-emerald-400" />
      </div>

      <DataTable data={rows} columns={columns} rowKey={r => r.id} isLoading={loading} exportFilename="flotten-compliance" emptyMessage="Noch keine Prüfungen erfasst" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl">
          <DialogHeader><DialogTitle>Neue Compliance-Prüfung</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Fahrzeug *</Label>
              <Select value={form.bus_id} onValueChange={v => setForm({ ...form, bus_id: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Fahrzeug wählen" /></SelectTrigger>
                <SelectContent>{buses.map(b => <SelectItem key={b.id} value={b.id}>{b.name} ({b.license_plate})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prüftyp *</Label>
              <Select value={form.compliance_type} onValueChange={v => setForm({ ...form, compliance_type: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue /></SelectTrigger>
                <SelectContent>{COMPLIANCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Erinnerung (Tage)</Label><Input type="number" className="bg-white text-black" value={form.reminder_days} onChange={e => setForm({ ...form, reminder_days: Number(e.target.value) })} /></div>
            <div><Label>Letzte Prüfung</Label><Input type="date" className="bg-white text-black" onChange={e => setForm({ ...form, last_check_date: e.target.value })} /></div>
            <div><Label>Fälligkeit *</Label><Input type="date" className="bg-white text-black" onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            <div><Label>Zertifikat-Nr.</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, certificate_number: e.target.value })} /></div>
            <div><Label>Prüfer</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, inspector: e.target.value })} /></div>
            <div className="col-span-2"><Label>Kosten (€)</Label><Input type="number" step="0.01" className="bg-white text-black" onChange={e => setForm({ ...form, cost: Number(e.target.value) })} /></div>
            <div className="col-span-2"><Label>Notizen</Label><Textarea className="bg-white text-black" onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button><Button onClick={save} className="bg-[#00CC36] text-black">Speichern</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function StatBox({ icon: Icon, label, value, color }: any) {
  return (
    <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-2"><Icon className={`w-5 h-5 ${color}`} /><span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span></div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
