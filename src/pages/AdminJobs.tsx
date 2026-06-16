import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Briefcase, Loader2, Save, X, MapPin, Clock, Users, ExternalLink } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface JobListing {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string | null;
  requirements: string[];
  benefits: string[];
  salary_range: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface JobApplication {
  id: string;
  job_listing_id: string | null;
}

const EMPLOYMENT_TYPES = ["Vollzeit", "Teilzeit", "Minijob", "Werkstudent", "Praktikum", "Freelance"];
const DEPARTMENTS = ["Fahrdienst", "Disposition", "Office", "Vertrieb", "Marketing", "IT", "Werkstatt", "Allgemein"];

const emptyForm: Omit<JobListing, "id" | "created_at" | "updated_at"> = {
  title: "",
  department: "Fahrdienst",
  location: "Düsseldorf",
  employment_type: "Vollzeit",
  description: "",
  requirements: [],
  benefits: [],
  salary_range: "",
  is_active: true,
  sort_order: 0,
};

const AdminJobs = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [appCounts, setAppCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [reqInput, setReqInput] = useState("");
  const [benInput, setBenInput] = useState("");

  const load = async () => {
    setLoading(true);
    const { data: jobsData, error } = await (supabase as any)
      .from("job_listings")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Fehler beim Laden", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    setJobs((jobsData as JobListing[]) || []);

    // Count applications per job
    const { data: apps } = await (supabase as any)
      .from("job_applications")
      .select("job_listing_id");
    const counts: Record<string, number> = {};
    ((apps as JobApplication[]) || []).forEach(a => {
      if (a.job_listing_id) counts[a.job_listing_id] = (counts[a.job_listing_id] || 0) + 1;
    });
    setAppCounts(counts);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: jobs.length });
    setReqInput("");
    setBenInput("");
    setDialogOpen(true);
  };

  const openEdit = (job: JobListing) => {
    setEditingId(job.id);
    setForm({
      title: job.title,
      department: job.department,
      location: job.location,
      employment_type: job.employment_type,
      description: job.description || "",
      requirements: job.requirements || [],
      benefits: job.benefits || [],
      salary_range: job.salary_range || "",
      is_active: job.is_active,
      sort_order: job.sort_order,
    });
    setReqInput("");
    setBenInput("");
    setDialogOpen(true);
  };

  const addReq = () => {
    const v = reqInput.trim();
    if (!v) return;
    setForm(f => ({ ...f, requirements: [...f.requirements, v] }));
    setReqInput("");
  };
  const removeReq = (i: number) => setForm(f => ({ ...f, requirements: f.requirements.filter((_, idx) => idx !== i) }));

  const addBen = () => {
    const v = benInput.trim();
    if (!v) return;
    setForm(f => ({ ...f, benefits: [...f.benefits, v] }));
    setBenInput("");
  };
  const removeBen = (i: number) => setForm(f => ({ ...f, benefits: f.benefits.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: "Titel ist erforderlich", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      title: form.title.trim(),
      salary_range: form.salary_range?.trim() || null,
      description: form.description?.trim() || null,
    };

    const { error } = editingId
      ? await (supabase as any).from("job_listings").update(payload).eq("id", editingId)
      : await (supabase as any).from("job_listings").insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: "Speichern fehlgeschlagen", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "Stelle aktualisiert" : "Stelle angelegt" });
    setDialogOpen(false);
    load();
  };

  const togglePublish = async (job: JobListing) => {
    const { error } = await (supabase as any)
      .from("job_listings")
      .update({ is_active: !job.is_active })
      .eq("id", job.id);
    if (error) {
      toast({ title: "Aktion fehlgeschlagen", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: job.is_active ? "Stelle offline" : "Stelle veröffentlicht" });
    load();
  };

  const move = async (job: JobListing, direction: -1 | 1) => {
    const sorted = [...jobs].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(j => j.id === job.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await (supabase as any).from("job_listings").update({ sort_order: other.sort_order }).eq("id", job.id);
    await (supabase as any).from("job_listings").update({ sort_order: job.sort_order }).eq("id", other.id);
    load();
  };

  const doDelete = async () => {
    if (!deleteId) return;
    const { error } = await (supabase as any).from("job_listings").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Löschen fehlgeschlagen", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Stelle gelöscht" });
    }
    setDeleteId(null);
    load();
  };

  const activeCount = jobs.filter(j => j.is_active).length;
  const totalApps = Object.values(appCounts).reduce((a, b) => a + b, 0);

  return (
    <AdminLayout
      title="Meine Stellen"
      subtitle="Stellenangebote anlegen, bearbeiten und veröffentlichen"
      actions={
        <div className="flex items-center gap-2">
          <a
            href="/karriere"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 h-9 rounded-lg text-xs text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Karriere-Seite
          </a>
          <Button onClick={openCreate} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black font-semibold h-9">
            <Plus className="w-4 h-4 mr-1" /> Neue Stelle
          </Button>
        </div>
      }
    >
      {/* Stat strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Veröffentlicht", value: activeCount, icon: Eye, color: "text-[#00CC36]" },
          { label: "Entwürfe / Inaktiv", value: jobs.length - activeCount, icon: EyeOff, color: "text-zinc-400" },
          { label: "Bewerbungen gesamt", value: totalApps, icon: Users, color: "text-blue-400" },
        ].map((s, i) => (
          <div key={i} className="cockpit-glass rounded-xl p-4 flex items-center gap-4">
            <div className="size-11 rounded-lg bg-white/[0.04] flex items-center justify-center">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white font-cockpit-mono leading-none">{s.value}</div>
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="cockpit-glass-strong rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Lade Stellen…
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="size-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-7 h-7 text-zinc-500" />
            </div>
            <h3 className="text-white font-semibold mb-1">Noch keine Stellen angelegt</h3>
            <p className="text-zinc-400 text-sm mb-6">Lege die erste Position an, damit sie auf der Karriere-Seite erscheint.</p>
            <Button onClick={openCreate} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black font-semibold">
              <Plus className="w-4 h-4 mr-1" /> Erste Stelle anlegen
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {[...jobs].sort((a, b) => a.sort_order - b.sort_order).map((job, idx, arr) => (
              <div key={job.id} className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-3">
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 shrink-0 pt-1">
                    <button
                      onClick={() => move(job, -1)}
                      disabled={idx === 0}
                      className="size-5 flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-xs"
                      title="Nach oben"
                    >▲</button>
                    <button
                      onClick={() => move(job, 1)}
                      disabled={idx === arr.length - 1}
                      className="size-5 flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-xs"
                      title="Nach unten"
                    >▼</button>
                  </div>

                  {/* Main */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="font-semibold text-white truncate">{job.title}</h3>
                      {job.is_active ? (
                        <Badge className="bg-[#00CC36]/15 text-[#00CC36] border-[#00CC36]/30 hover:bg-[#00CC36]/20 text-[10px]">LIVE</Badge>
                      ) : (
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px]">ENTWURF</Badge>
                      )}
                      {appCounts[job.id] > 0 && (
                        <Badge variant="outline" className="border-blue-500/40 text-blue-300 bg-blue-500/10 text-[10px]">
                          {appCounts[job.id]} Bewerbung{appCounts[job.id] !== 1 ? "en" : ""}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.department}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.employment_type}</span>
                      {job.salary_range && <span className="text-[#00CC36]">{job.salary_range}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => togglePublish(job)}
                      className="size-8 rounded-md hover:bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white"
                      title={job.is_active ? "Offline nehmen" : "Veröffentlichen"}
                    >
                      {job.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(job)}
                      className="size-8 rounded-md hover:bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white"
                      title="Bearbeiten"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(job.id)}
                      className="size-8 rounded-md hover:bg-red-500/10 flex items-center justify-center text-zinc-400 hover:text-red-400"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f1218] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingId ? "Stelle bearbeiten" : "Neue Stelle anlegen"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div>
              <Label className="text-zinc-300">Jobtitel *</Label>
              <Input
                className="mt-1.5 bg-[#151920] border-white/10 text-white"
                placeholder="z.B. Busfahrer:in (m/w/d)"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-zinc-300">Abteilung</Label>
                <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                  <SelectTrigger className="mt-1.5 bg-[#151920] border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300">Standort</Label>
                <Input
                  className="mt-1.5 bg-[#151920] border-white/10 text-white"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-zinc-300">Anstellung</Label>
                <Select value={form.employment_type} onValueChange={v => setForm(f => ({ ...f, employment_type: v }))}>
                  <SelectTrigger className="mt-1.5 bg-[#151920] border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{EMPLOYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-zinc-300">Gehaltsspanne (optional)</Label>
              <Input
                className="mt-1.5 bg-[#151920] border-white/10 text-white"
                placeholder="z.B. 38.000–48.000 € / Jahr"
                value={form.salary_range || ""}
                onChange={e => setForm(f => ({ ...f, salary_range: e.target.value }))}
              />
            </div>

            <div>
              <Label className="text-zinc-300">Beschreibung</Label>
              <Textarea
                className="mt-1.5 min-h-[110px] bg-[#151920] border-white/10 text-white"
                placeholder="Was macht die Position aus? Welche Aufgaben?"
                value={form.description || ""}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Requirements */}
            <div>
              <Label className="text-zinc-300">Anforderungen</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  className="bg-[#151920] border-white/10 text-white"
                  placeholder="Anforderung hinzufügen…"
                  value={reqInput}
                  onChange={e => setReqInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addReq(); } }}
                />
                <Button type="button" onClick={addReq} variant="outline" className="border-white/10 text-white hover:bg-white/5">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {form.requirements.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {form.requirements.map((r, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm bg-white/[0.03] rounded-md px-3 py-2">
                      <span className="flex-1 text-zinc-200">{r}</span>
                      <button onClick={() => removeReq(i)} className="text-zinc-500 hover:text-red-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Benefits */}
            <div>
              <Label className="text-zinc-300">Benefits</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  className="bg-[#151920] border-white/10 text-white"
                  placeholder="Benefit hinzufügen…"
                  value={benInput}
                  onChange={e => setBenInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addBen(); } }}
                />
                <Button type="button" onClick={addBen} variant="outline" className="border-white/10 text-white hover:bg-white/5">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {form.benefits.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {form.benefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm bg-white/[0.03] rounded-md px-3 py-2">
                      <span className="flex-1 text-zinc-200">{b}</span>
                      <button onClick={() => removeBen(i)} className="text-zinc-500 hover:text-red-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Publish toggle */}
            <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-4 py-3 border border-white/[0.06]">
              <div>
                <div className="text-sm font-medium text-white">Sofort veröffentlichen</div>
                <div className="text-xs text-zinc-400">Sichtbar auf der Karriere-Seite, sobald gespeichert.</div>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/10 text-white hover:bg-white/5">
              Abbrechen
            </Button>
            <Button onClick={save} disabled={saving} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black font-semibold">
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              {editingId ? "Speichern" : "Stelle anlegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-[#0f1218] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Stelle wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Die Stelle wird unwiderruflich entfernt. Bereits eingegangene Bewerbungen bleiben erhalten, sind aber nicht mehr zugeordnet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5">Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-red-500 hover:bg-red-600 text-white">Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminJobs;
