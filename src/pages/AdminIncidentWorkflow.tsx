import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataTable, DataTableColumn } from "@/components/admin/core/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, AlertTriangle, FileCheck2, Workflow, ArrowUp, CheckCircle2, ListChecks, Paperclip, Upload, Trash2, Download, FileText, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fmtDateTime = (d: string | null) => d ? new Date(d).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

const SEVERITY_COLORS: Record<string, string> = {
  info: "bg-blue-500/15 text-blue-400",
  warning: "bg-amber-500/15 text-amber-400",
  high: "bg-orange-500/15 text-orange-400",
  critical: "bg-red-500/15 text-red-400",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-400",
  in_progress: "bg-blue-500/15 text-blue-400",
  escalated: "bg-red-500/15 text-red-400",
  resolved: "bg-emerald-500/15 text-emerald-400",
};

const INCIDENT_TYPES = [
  { value: "breakdown", label: "Bus-Panne" },
  { value: "delay", label: "Verspätung" },
  { value: "accident", label: "Unfall" },
  { value: "complaint", label: "Beschwerde" },
  { value: "medical", label: "Medizinischer Notfall" },
  { value: "security", label: "Sicherheitsvorfall" },
  { value: "other", label: "Sonstiges" },
];

export default function AdminIncidentWorkflow() {
  const [tab, setTab] = useState<"incidents" | "sops">("incidents");
  const [incidents, setIncidents] = useState<any[]>([]);
  const [sops, setSops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [sopOpen, setSopOpen] = useState(false);
  const [form, setForm] = useState<any>({ severity: "warning", status: "open", type: "delay" });
  const [sopForm, setSopForm] = useState<any>({ incident_type: "delay", severity: "normal", steps: [], is_active: true, auto_escalate_minutes: 30 });
  const [detail, setDetail] = useState<any | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [docCategory, setDocCategory] = useState<string>("photo");

  const load = async () => {
    setLoading(true);
    const [i, s] = await Promise.all([
      supabase.from("incidents").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("sop_templates").select("*").order("incident_type"),
    ]);
    setIncidents(i.data || []); setSops(s.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Load documents whenever a detail is opened
  useEffect(() => {
    if (!detail?.id) { setDocs([]); return; }
    (async () => {
      const { data } = await supabase
        .from("incident_documents")
        .select("*")
        .eq("incident_id", detail.id)
        .order("created_at", { ascending: false });
      setDocs(data || []);
    })();
  }, [detail?.id]);

  const stats = useMemo(() => ({
    open: incidents.filter(i => i.status !== "resolved").length,
    overdue: incidents.filter(i => i.status !== "resolved" && i.sla_due_at && new Date(i.sla_due_at) < new Date()).length,
    critical: incidents.filter(i => i.severity === "critical" && i.status !== "resolved").length,
    sops: sops.filter(s => s.is_active).length,
  }), [incidents, sops]);

  const create = async () => {
    if (!form.title || !form.type) return toast.error("Titel & Typ erforderlich");
    // Auto-attach matching SOP
    const sop = sops.find(s => s.incident_type === form.type && s.is_active);
    const insert: any = { ...form };
    if (sop) {
      insert.sop_template_id = sop.id;
      insert.sop_progress = (sop.steps || []).map((step: any) => ({ ...step, completed: false }));
      if (sop.auto_escalate_minutes) {
        insert.sla_due_at = new Date(Date.now() + sop.auto_escalate_minutes * 60000).toISOString();
      }
    }
    const { error } = await supabase.from("incidents").insert(insert);
    if (error) return toast.error(error.message);
    toast.success(sop ? `Vorfall mit SOP "${sop.name}" angelegt` : "Vorfall angelegt");
    setOpen(false); setForm({ severity: "warning", status: "open", type: "delay" }); load();
  };

  const toggleStep = async (idx: number) => {
    if (!detail) return;
    const newProgress = [...(detail.sop_progress || [])];
    const wasDone = !!(newProgress[idx].done ?? newProgress[idx].completed);
    newProgress[idx] = {
      ...newProgress[idx],
      done: !wasDone,
      completed: !wasDone, // legacy compat
      completed_at: !wasDone ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from("incidents").update({ sop_progress: newProgress }).eq("id", detail.id);
    if (error) return toast.error(error.message);
    // Trigger may auto-resolve → reload
    const { data: refreshed } = await supabase.from("incidents").select("*").eq("id", detail.id).maybeSingle();
    if (refreshed) setDetail(refreshed);
    if (refreshed?.status === "resolved") toast.success("Alle SOP-Schritte erledigt – Vorfall automatisch gelöst");
    load();
  };

  const changeStatus = async (newStatus: string) => {
    if (!detail) return;
    const { error } = await supabase.rpc("transition_incident_status", {
      p_incident_id: detail.id,
      p_new_status: newStatus,
      p_note: null,
    });
    if (error) return toast.error(error.message);
    const { data: refreshed } = await supabase.from("incidents").select("*").eq("id", detail.id).maybeSingle();
    if (refreshed) setDetail(refreshed);
    load();
    toast.success(`Status: ${newStatus}`);
  };

  const uploadDoc = async (file: File) => {
    if (!detail || !file) return;
    if (file.size > 20 * 1024 * 1024) return toast.error("Maximal 20 MB pro Datei");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${detail.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await supabase.storage.from("incident-documents").upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("incident_documents").insert({
        incident_id: detail.id,
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        category: docCategory,
        uploaded_by: user?.id ?? null,
      });
      if (error) throw error;
      const { data } = await supabase.from("incident_documents").select("*").eq("incident_id", detail.id).order("created_at", { ascending: false });
      setDocs(data || []);
      toast.success("Anhang hochgeladen");
    } catch (e: any) {
      toast.error(e.message || "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const downloadDoc = async (doc: any) => {
    const { data, error } = await supabase.storage.from("incident-documents").createSignedUrl(doc.file_path, 300);
    if (error || !data?.signedUrl) return toast.error("Download nicht möglich");
    window.open(data.signedUrl, "_blank");
  };

  const deleteDoc = async (doc: any) => {
    if (!confirm(`Anhang "${doc.file_name}" wirklich löschen?`)) return;
    await supabase.storage.from("incident-documents").remove([doc.file_path]);
    const { error } = await supabase.from("incident_documents").delete().eq("id", doc.id);
    if (error) return toast.error(error.message);
    setDocs(docs.filter(d => d.id !== doc.id));
    toast.success("Anhang gelöscht");
  };

  const saveSop = async () => {
    if (!sopForm.name || !sopForm.incident_type) return toast.error("Name & Typ erforderlich");
    const stepsArray = (sopForm.stepsText || "").split("\n").filter((l: string) => l.trim()).map((text: string, i: number) => ({ order: i + 1, text: text.trim() }));
    const insert = { ...sopForm, steps: stepsArray };
    delete insert.stepsText;
    const { error } = await supabase.from("sop_templates").insert(insert);
    if (error) return toast.error(error.message);
    toast.success("SOP angelegt"); setSopOpen(false); setSopForm({ incident_type: "delay", severity: "normal", steps: [], is_active: true, auto_escalate_minutes: 30 }); load();
  };

  const incCols: DataTableColumn<any>[] = [
    { key: "title", header: "Vorfall", accessor: r => (
      <div><div className="font-medium text-white">{r.title}</div><div className="text-xs text-zinc-500">{INCIDENT_TYPES.find(t => t.value === r.type)?.label || r.type}</div></div>
    ), sortValue: r => r.title },
    { key: "sev", header: "Schwere", accessor: r => <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_COLORS[r.severity]}`}>{r.severity}</span>, sortValue: r => r.severity },
    { key: "status", header: "Status", accessor: r => <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>{r.status}</span>, sortValue: r => r.status },
    { key: "sop", header: "SOP-Fortschritt", accessor: r => {
      const steps = r.sop_progress || [];
      if (!steps.length) return <span className="text-xs text-zinc-600">—</span>;
      const done = steps.filter((s: any) => s.completed).length;
      return <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${(done / steps.length) * 100}%` }} /></div>
        <span className="text-xs text-zinc-400">{done}/{steps.length}</span>
      </div>;
    } },
    { key: "sla", header: "SLA", accessor: r => {
      if (!r.sla_due_at || r.status === "resolved") return <span className="text-xs text-zinc-600">—</span>;
      const min = Math.ceil((new Date(r.sla_due_at).getTime() - Date.now()) / 60000);
      return <span className={min < 0 ? "text-red-400 font-semibold" : min < 30 ? "text-amber-400" : "text-zinc-400"}>{min < 0 ? `${Math.abs(min)}m überfällig` : `${min}m`}</span>;
    }, sortValue: r => r.sla_due_at || "" },
    { key: "created", header: "Erstellt", accessor: r => fmtDateTime(r.created_at), sortValue: r => r.created_at },
  ];

  const sopCols: DataTableColumn<any>[] = [
    { key: "name", header: "Name", accessor: r => <span className="font-medium text-white">{r.name}</span>, sortValue: r => r.name },
    { key: "type", header: "Vorfall-Typ", accessor: r => INCIDENT_TYPES.find(t => t.value === r.incident_type)?.label || r.incident_type },
    { key: "steps", header: "Schritte", accessor: r => `${(r.steps || []).length} Steps` },
    { key: "esc", header: "Auto-Eskalation", accessor: r => r.auto_escalate_minutes ? `${r.auto_escalate_minutes} Min → ${r.escalate_to_role}` : "—" },
    { key: "active", header: "Aktiv", accessor: r => r.is_active ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span className="text-zinc-600">—</span> },
  ];

  return (
    <AdminLayout title="Incident-Workflow" subtitle="Vorfälle mit SOP-Checklisten und Auto-Eskalation"
      actions={tab === "incidents"
        ? <Button onClick={() => setOpen(true)} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black"><Plus className="w-4 h-4 mr-2" />Neuer Vorfall</Button>
        : <Button onClick={() => setSopOpen(true)} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black"><Plus className="w-4 h-4 mr-2" />Neue SOP</Button>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card icon={AlertTriangle} label="Offen" value={stats.open} color="text-amber-400" />
        <Card icon={ArrowUp} label="SLA überfällig" value={stats.overdue} color="text-red-400" />
        <Card icon={AlertTriangle} label="Kritisch" value={stats.critical} color="text-red-400" />
        <Card icon={FileCheck2} label="Aktive SOPs" value={stats.sops} color="text-emerald-400" />
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as any)}>
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="incidents" className="data-[state=active]:bg-zinc-800"><Workflow className="w-4 h-4 mr-2" />Vorfälle ({incidents.length})</TabsTrigger>
          <TabsTrigger value="sops" className="data-[state=active]:bg-zinc-800"><FileCheck2 className="w-4 h-4 mr-2" />SOP-Vorlagen ({sops.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="incidents" className="mt-4">
          <DataTable data={incidents} columns={incCols} rowKey={r => r.id} isLoading={loading} onRowClick={setDetail} exportFilename="vorfaelle" emptyMessage="Keine Vorfälle" />
        </TabsContent>
        <TabsContent value="sops" className="mt-4">
          <DataTable data={sops} columns={sopCols} rowKey={r => r.id} isLoading={loading} exportFilename="sops" emptyMessage="Noch keine SOPs" />
        </TabsContent>
      </Tabs>

      {/* New Incident */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl">
          <DialogHeader><DialogTitle>Vorfall melden</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Titel *</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label>Typ *</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue /></SelectTrigger>
                <SelectContent>{INCIDENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Schwere *</Label>
              <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="info">Info</SelectItem><SelectItem value="warning">Warnung</SelectItem><SelectItem value="high">Hoch</SelectItem><SelectItem value="critical">Kritisch</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Beschreibung</Label><Textarea className="bg-white text-black" onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <div className="text-xs text-zinc-500">Passende SOP wird automatisch zugewiesen, wenn vorhanden.</div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button><Button onClick={create} className="bg-[#00CC36] text-black">Vorfall anlegen</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New SOP */}
      <Dialog open={sopOpen} onOpenChange={setSopOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader><DialogTitle>SOP-Vorlage erstellen</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Name *</Label><Input className="bg-white text-black" onChange={e => setSopForm({ ...sopForm, name: e.target.value })} /></div>
            <div>
              <Label>Vorfall-Typ *</Label>
              <Select value={sopForm.incident_type} onValueChange={v => setSopForm({ ...sopForm, incident_type: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue /></SelectTrigger>
                <SelectContent>{INCIDENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Auto-Eskalation (Min)</Label><Input type="number" className="bg-white text-black" value={sopForm.auto_escalate_minutes} onChange={e => setSopForm({ ...sopForm, auto_escalate_minutes: Number(e.target.value) })} /></div>
            <div>
              <Label>Eskalation an Rolle</Label>
              <Select value={sopForm.escalate_to_role} onValueChange={v => setSopForm({ ...sopForm, escalate_to_role: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Wählen" /></SelectTrigger>
                <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="office">Office</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Beschreibung</Label><Input className="bg-white text-black" onChange={e => setSopForm({ ...sopForm, description: e.target.value })} /></div>
            <div className="col-span-2">
              <Label>Schritte (eine pro Zeile) *</Label>
              <Textarea className="bg-white text-black min-h-[150px]" placeholder="1. Standort bestätigen&#10;2. Ersatzbus anfordern&#10;3. ..." onChange={e => setSopForm({ ...sopForm, stepsText: e.target.value })} />
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSopOpen(false)}>Abbrechen</Button><Button onClick={saveSop} className="bg-[#00CC36] text-black">SOP speichern</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet with SOP checklist */}
      <Sheet open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <SheetContent className="bg-zinc-950 border-zinc-800 text-white w-full sm:max-w-2xl overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white flex items-center gap-3 flex-wrap">
                  <span>{detail.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_COLORS[detail.severity]}`}>{detail.severity}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[detail.status]}`}>{detail.status}</span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {detail.description && (
                  <div className="rounded-lg bg-zinc-900 p-4 border border-zinc-800 text-sm text-zinc-300 whitespace-pre-wrap">{detail.description}</div>
                )}

                {(detail.sop_progress || []).length > 0 && (
                  <div className="rounded-lg bg-zinc-900 p-4 border border-zinc-800">
                    <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2"><ListChecks className="w-4 h-4" />SOP-Checkliste</h4>
                    <div className="space-y-2">
                      {(detail.sop_progress || []).map((step: any, i: number) => {
                        const isDone = !!(step.done ?? step.completed);
                        return (
                          <label key={i} className={`flex items-start gap-3 p-2 rounded cursor-pointer hover:bg-zinc-800 transition ${isDone ? "opacity-60" : ""}`}>
                            <input type="checkbox" checked={isDone} onChange={() => toggleStep(i)} className="mt-1" />
                            <div className="flex-1">
                              <div className={`text-sm ${isDone ? "line-through text-zinc-500" : "text-white"}`}><span className="font-mono text-xs text-emerald-400 mr-2">#{step.order}</span>{step.text}</div>
                              {step.completed_at && <div className="text-xs text-zinc-500 mt-0.5">Erledigt {fmtDateTime(step.completed_at)}</div>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {detail.sla_due_at && detail.status !== "resolved" && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm">
                    <span className="text-amber-300">SLA-Fälligkeit: </span><span className="text-white font-semibold">{fmtDateTime(detail.sla_due_at)}</span>
                  </div>
                )}

                {/* Anhänge */}
                <div className="rounded-lg bg-zinc-900 p-4 border border-zinc-800">
                  <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />Anhänge ({docs.length})
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Select value={docCategory} onValueChange={setDocCategory}>
                      <SelectTrigger className="bg-white text-black w-40 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photo">Foto</SelectItem>
                        <SelectItem value="report">Bericht</SelectItem>
                        <SelectItem value="police">Polizei-Akt</SelectItem>
                        <SelectItem value="insurance">Versicherung</SelectItem>
                        <SelectItem value="invoice">Rechnung</SelectItem>
                        <SelectItem value="other">Sonstiges</SelectItem>
                      </SelectContent>
                    </Select>
                    <label className="inline-flex items-center gap-2 cursor-pointer rounded-md bg-zinc-800 hover:bg-zinc-700 text-white px-3 h-9 text-sm">
                      <Upload className="w-4 h-4" />{uploading ? "Lade hoch…" : "Datei wählen"}
                      <input type="file" className="hidden" disabled={uploading} accept="image/*,application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(f); e.currentTarget.value = ""; }} />
                    </label>
                    <span className="text-xs text-zinc-500">max. 20 MB · Bilder, PDF</span>
                  </div>
                  {docs.length === 0 ? (
                    <div className="text-xs text-zinc-600">Noch keine Anhänge</div>
                  ) : (
                    <div className="space-y-2">
                      {docs.map(d => (
                        <div key={d.id} className="flex items-center gap-3 p-2 rounded bg-zinc-950/60 border border-zinc-800">
                          <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">{d.file_name}</div>
                            <div className="text-xs text-zinc-500">{d.category} · {((d.file_size || 0) / 1024).toFixed(0)} KB · {fmtDateTime(d.created_at)}</div>
                          </div>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-white" onClick={() => downloadDoc(d)}><Download className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => deleteDoc(d)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status-Aktionen (rollenbasiert via RPC) */}
                <div className="rounded-lg bg-zinc-900 p-4 border border-zinc-800">
                  <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">Status ändern</h4>
                  <div className="flex flex-wrap gap-2">
                    {detail.status === "open" && (
                      <Button onClick={() => changeStatus("in_progress")} variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"><PlayCircle className="w-4 h-4 mr-2" />In Bearbeitung (Fahrer/Office)</Button>
                    )}
                    {detail.status !== "resolved" && detail.status !== "escalated" && (
                      <Button onClick={() => changeStatus("escalated")} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10"><ArrowUp className="w-4 h-4 mr-2" />Eskalieren (Office/Admin)</Button>
                    )}
                    {detail.status !== "resolved" && (
                      <Button onClick={() => changeStatus("resolved")} className="bg-emerald-500 hover:bg-emerald-600 text-black"><CheckCircle2 className="w-4 h-4 mr-2" />Als gelöst markieren (Office/Admin)</Button>
                    )}
                    {detail.status === "resolved" && (
                      <Button onClick={() => changeStatus("open")} variant="outline" className="border-zinc-600">Erneut öffnen</Button>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Übergänge werden serverseitig nach Rolle geprüft und im Audit-Log protokolliert.</p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

function Card({ icon: Icon, label, value, color }: any) {
  return (
    <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-2"><Icon className={`w-5 h-5 ${color}`} /><span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span></div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
