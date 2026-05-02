import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataTable, DataTableColumn, BulkAction } from "@/components/admin/core/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Wallet, FileDown, CheckCircle2, Clock, Euro } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("de-DE") : "—");
const eur = (n: number | null) => `${Number(n || 0).toFixed(2)} €`;

const CATEGORIES = [
  { value: "salary", label: "Grundgehalt" },
  { value: "hours", label: "Arbeitsstunden" },
  { value: "overtime", label: "Überstunden" },
  { value: "per_diem", label: "Spesen / Tagegeld" },
  { value: "bonus", label: "Bonus" },
  { value: "expense", label: "Auslage" },
  { value: "deduction", label: "Abzug" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-400",
  exported: "bg-zinc-700 text-zinc-300",
  rejected: "bg-red-500/15 text-red-400",
};

export default function AdminPayroll() {
  const [rows, setRows] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ category: "hours", entry_date: new Date().toISOString().slice(0, 10), status: "pending" });
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));

  const load = async () => {
    setLoading(true);
    try {
      const [{ data }, { data: roles }] = await Promise.all([
        supabase.from("payroll_entries").select("*").order("entry_date", { ascending: false }).limit(1000),
        supabase.from("user_roles").select("user_id").eq("role", "driver"),
      ]);
      setRows(data || []);
      const driverIds = (roles || []).map((r: any) => r.user_id);
      if (driverIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id, user_id, first_name, last_name, email").in("user_id", driverIds);
        setDrivers(profs || []);
      } else {
        setDrivers([]);
      }
    } catch (e: any) {
      toast.error("Laden fehlgeschlagen: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const driverName = (id: string) => {
    const p = drivers.find(d => d.user_id === id) || drivers.find(d => d.id === id);
    return p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email : id?.slice(0, 8);
  };

  const filtered = useMemo(() => rows.filter(r => r.entry_date?.startsWith(monthFilter)), [rows, monthFilter]);

  const stats = useMemo(() => ({
    total: filtered.reduce((s, r) => s + Number(r.amount || 0), 0),
    hours: filtered.filter(r => r.category === "hours" || r.category === "overtime").reduce((s, r) => s + Number(r.hours || 0), 0),
    pending: filtered.filter(r => r.status === "pending").length,
    approved: filtered.filter(r => r.status === "approved").length,
  }), [filtered]);

  const save = async () => {
    if (!form.driver_id || !form.amount) return toast.error("Fahrer & Betrag erforderlich");
    const { error } = await supabase.from("payroll_entries").insert(form);
    if (error) return toast.error(error.message);
    toast.success("Lohneintrag gespeichert"); setOpen(false); setForm({ category: "hours", entry_date: new Date().toISOString().slice(0, 10), status: "pending" }); load();
  };

  const bulkApprove = async (selected: any[]) => {
    const ids = selected.map(s => s.id);
    const { error } = await supabase.from("payroll_entries").update({ status: "approved", approved_at: new Date().toISOString() }).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} Einträge freigegeben`); load();
  };

  const exportDATEV = (selected: any[]) => {
    const data = selected.length > 0 ? selected : filtered;
    if (!data.length) return toast.error("Keine Einträge");
    const headers = "Buchungsdatum;Konto;Gegenkonto;Betrag;Beleg;Buchungstext";
    const lines = data.map(r => [
      r.entry_date, "1740", "1200", Number(r.amount).toFixed(2).replace(".", ","),
      r.id.slice(0, 8), `${driverName(r.driver_id)} - ${CATEGORIES.find(c => c.value === r.category)?.label}`
    ].join(";"));
    const csv = "\uFEFF" + [headers, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `lohn-export-${monthFilter}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("DATEV-CSV exportiert");
  };

  const bulkActions: BulkAction<any>[] = [
    { label: "Freigeben", icon: CheckCircle2, onClick: async (s) => { await bulkApprove(s); } },
    { label: "DATEV-Export", icon: FileDown, onClick: (s) => { exportDATEV(s); } },
  ];

  const columns: DataTableColumn<any>[] = [
    { key: "date", header: "Datum", accessor: r => fmtDate(r.entry_date), sortValue: r => r.entry_date },
    { key: "driver", header: "Fahrer", accessor: r => <span className="font-medium text-white">{driverName(r.driver_id)}</span>, sortValue: r => driverName(r.driver_id) },
    { key: "cat", header: "Kategorie", accessor: r => CATEGORIES.find(c => c.value === r.category)?.label || r.category, sortValue: r => r.category },
    { key: "desc", header: "Beschreibung", accessor: r => <span className="text-xs text-zinc-400">{r.description || "—"}</span> },
    { key: "hours", header: "Std.", accessor: r => r.hours ? `${Number(r.hours).toFixed(2)} h` : "—", sortValue: r => Number(r.hours || 0) },
    { key: "amount", header: "Betrag", accessor: r => <span className="font-semibold text-emerald-400">{eur(r.amount)}</span>, sortValue: r => Number(r.amount) },
    { key: "status", header: "Status", accessor: r => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] || "bg-zinc-700"}`}>{r.status}</span>
    ), sortValue: r => r.status },
  ];

  return (
    <AdminLayout title="Lohnabrechnung" subtitle="Stunden, Spesen, DATEV-Export"
      actions={<>
        <Input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="bg-white text-black w-40 mr-2 inline-flex" />
        <Button onClick={() => exportDATEV(filtered)} variant="outline" className="mr-2"><FileDown className="w-4 h-4 mr-2" />DATEV</Button>
        <Button onClick={() => setOpen(true)} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black"><Plus className="w-4 h-4 mr-2" />Neuer Eintrag</Button>
      </>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon={Euro} label={`Summe ${monthFilter}`} value={eur(stats.total)} highlight />
        <Stat icon={Clock} label="Stunden gesamt" value={`${stats.hours.toFixed(1)} h`} />
        <Stat icon={Wallet} label="Offen" value={stats.pending} color="text-amber-400" />
        <Stat icon={CheckCircle2} label="Freigegeben" value={stats.approved} color="text-emerald-400" />
      </div>

      <DataTable data={filtered} columns={columns} rowKey={r => r.id} isLoading={loading} exportFilename={`lohn-${monthFilter}`} bulkActions={bulkActions} emptyMessage="Keine Einträge in diesem Monat" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl">
          <DialogHeader><DialogTitle>Lohneintrag erfassen</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Fahrer *</Label>
              <Select value={form.driver_id} onValueChange={v => setForm({ ...form, driver_id: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Fahrer wählen" /></SelectTrigger>
                <SelectContent>{drivers.map(d => <SelectItem key={d.user_id} value={d.user_id}>{d.first_name} {d.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Datum *</Label><Input type="date" className="bg-white text-black" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} /></div>
            <div>
              <Label>Kategorie</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Stunden</Label><Input type="number" step="0.25" className="bg-white text-black" onChange={e => setForm({ ...form, hours: Number(e.target.value) })} /></div>
            <div><Label>Betrag (€) *</Label><Input type="number" step="0.01" className="bg-white text-black" onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></div>
            <div className="col-span-2"><Label>Beschreibung</Label><Textarea className="bg-white text-black" onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button><Button onClick={save} className="bg-[#00CC36] text-black">Speichern</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function Stat({ icon: Icon, label, value, highlight, color }: any) {
  return (
    <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-2"><Icon className={`w-5 h-5 ${color || (highlight ? "text-emerald-400" : "text-zinc-400")}`} /><span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span></div>
      <div className={`text-2xl font-bold ${color || (highlight ? "text-emerald-400" : "text-white")}`}>{value}</div>
    </div>
  );
}
