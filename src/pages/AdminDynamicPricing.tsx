import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Sparkles, Activity, Target } from "lucide-react";

type Rule = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  priority: number;
  route_id: string | null;
  applies_to_all: boolean;
  weekdays: number[] | null;
  hour_from: number | null;
  hour_to: number | null;
  days_before_min: number | null;
  days_before_max: number | null;
  occupancy_min: number | null;
  occupancy_max: number | null;
  date_from: string | null;
  date_to: string | null;
  adjustment_type: string;
  adjustment_value: number;
  min_price: number | null;
  max_price: number | null;
};

type Competitor = {
  id: string;
  competitor_name: string;
  origin_city: string;
  destination_city: string;
  travel_date: string;
  price: number;
  notes: string | null;
  source_url: string | null;
  captured_at: string;
};

type LogEntry = {
  id: string;
  rule_name: string | null;
  old_price: number | null;
  new_price: number | null;
  reason: string | null;
  applied_at: string;
};

const WEEKDAYS = ["Mo","Di","Mi","Do","Fr","Sa","So"];

const emptyRule: Partial<Rule> = {
  name: "",
  description: "",
  is_active: true,
  priority: 100,
  applies_to_all: true,
  adjustment_type: "percent",
  adjustment_value: 0,
};

export default function AdminDynamicPricing() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Rule> | null>(null);
  const [compEditing, setCompEditing] = useState<Partial<Competitor> | null>(null);

  const load = async () => {
    setLoading(true);
    const [r, c, l, ro] = await Promise.all([
      supabase.from("dynamic_pricing_rules").select("*").order("priority", { ascending: true }),
      supabase.from("competitor_prices").select("*").order("captured_at", { ascending: false }).limit(200),
      supabase.from("pricing_log").select("*").order("applied_at", { ascending: false }).limit(100),
      supabase.from("routes").select("id,name").order("name"),
    ]);
    setRules((r.data as Rule[]) || []);
    setCompetitors((c.data as Competitor[]) || []);
    setLogs((l.data as LogEntry[]) || []);
    setRoutes(ro.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveRule = async () => {
    if (!editing?.name) { toast.error("Name erforderlich"); return; }
    const payload: any = { ...editing };
    delete payload.id;
    const res = editing.id
      ? await supabase.from("dynamic_pricing_rules").update(payload).eq("id", editing.id)
      : await supabase.from("dynamic_pricing_rules").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Regel gespeichert");
    setEditing(null); load();
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Regel wirklich löschen?")) return;
    const { error } = await supabase.from("dynamic_pricing_rules").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Gelöscht"); load(); }
  };

  const toggleRule = async (r: Rule) => {
    await supabase.from("dynamic_pricing_rules").update({ is_active: !r.is_active }).eq("id", r.id);
    load();
  };

  const saveCompetitor = async () => {
    if (!compEditing?.competitor_name || !compEditing.origin_city || !compEditing.destination_city || !compEditing.travel_date || !compEditing.price) {
      toast.error("Alle Pflichtfelder ausfüllen"); return;
    }
    const { error } = await supabase.from("competitor_prices").insert(compEditing as any);
    if (error) toast.error(error.message); else { toast.success("Erfasst"); setCompEditing(null); load(); }
  };

  const deleteCompetitor = async (id: string) => {
    await supabase.from("competitor_prices").delete().eq("id", id);
    load();
  };

  const toggleWeekday = (d: number) => {
    if (!editing) return;
    const cur = editing.weekdays || [];
    const next = cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d].sort();
    setEditing({ ...editing, weekdays: next.length ? next : null });
  };

  const formatAdjust = (r: Rule) => {
    const sign = r.adjustment_value >= 0 ? "+" : "";
    if (r.adjustment_type === "percent") return `${sign}${r.adjustment_value}%`;
    if (r.adjustment_type === "absolute") return `${sign}${r.adjustment_value} €`;
    return `= ${r.adjustment_value} €`;
  };

  return (
    <AdminLayout title="Dynamic Pricing Pro" subtitle="Intelligente Preisregeln, Konkurrenz-Monitoring & Audit">
      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="rules"><Sparkles className="w-4 h-4 mr-2" />Preisregeln ({rules.length})</TabsTrigger>
          <TabsTrigger value="competitors"><Target className="w-4 h-4 mr-2" />Konkurrenz ({competitors.length})</TabsTrigger>
          <TabsTrigger value="log"><Activity className="w-4 h-4 mr-2" />Audit-Log ({logs.length})</TabsTrigger>
        </TabsList>

        {/* RULES */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-zinc-400">Regeln werden nach Priorität (niedrig zuerst) ausgewertet.</div>
            <Button onClick={() => setEditing({ ...emptyRule })} className="bg-[#00CC36] text-black hover:bg-[#00CC36]/90">
              <Plus className="w-4 h-4 mr-2" />Neue Regel
            </Button>
          </div>

          <div className="grid gap-3">
            {loading ? <div className="text-zinc-500">Lade...</div> :
              rules.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                  Noch keine Regeln. Erstelle die erste!
                </div>
              ) : rules.map(r => (
                <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Switch checked={r.is_active} onCheckedChange={() => toggleRule(r)} />
                      <span className="font-semibold text-white">{r.name}</span>
                      <Badge variant="outline" className="text-xs">P{r.priority}</Badge>
                      {r.applies_to_all && <Badge className="bg-blue-500/20 text-blue-300 text-xs">Alle Strecken</Badge>}
                      {r.weekdays?.length && <Badge variant="outline" className="text-xs">{r.weekdays.map(d => WEEKDAYS[d]).join(",")}</Badge>}
                      {r.days_before_min !== null && <Badge variant="outline" className="text-xs">≤{r.days_before_min}T vor</Badge>}
                      {r.occupancy_min !== null && <Badge variant="outline" className="text-xs">{r.occupancy_min}-{r.occupancy_max}% voll</Badge>}
                    </div>
                    {r.description && <p className="text-xs text-zinc-400 truncate">{r.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-lg font-bold flex items-center gap-1 ${r.adjustment_value >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {r.adjustment_value >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {formatAdjust(r)}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(r)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteRule(r.id)}><Trash2 className="w-4 h-4 text-rose-400" /></Button>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>

        {/* COMPETITORS */}
        <TabsContent value="competitors" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-zinc-400">Konkurrenzpreise erfassen für strategische Entscheidungen.</div>
            <Button onClick={() => setCompEditing({ travel_date: new Date().toISOString().slice(0,10) })} className="bg-[#00CC36] text-black hover:bg-[#00CC36]/90">
              <Plus className="w-4 h-4 mr-2" />Preis erfassen
            </Button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Anbieter</th>
                  <th className="text-left p-3">Strecke</th>
                  <th className="text-left p-3">Reisedatum</th>
                  <th className="text-right p-3">Preis</th>
                  <th className="text-left p-3">Erfasst</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {competitors.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-8 text-zinc-500">Noch keine Konkurrenzpreise erfasst</td></tr>
                ) : competitors.map(c => (
                  <tr key={c.id} className="border-t border-zinc-800 text-white">
                    <td className="p-3 font-medium">{c.competitor_name}</td>
                    <td className="p-3">{c.origin_city} → {c.destination_city}</td>
                    <td className="p-3">{new Date(c.travel_date).toLocaleDateString("de-DE")}</td>
                    <td className="p-3 text-right font-bold">{Number(c.price).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</td>
                    <td className="p-3 text-xs text-zinc-400">{new Date(c.captured_at).toLocaleDateString("de-DE")}</td>
                    <td className="p-3"><Button size="sm" variant="ghost" onClick={() => deleteCompetitor(c.id)}><Trash2 className="w-4 h-4 text-rose-400" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* LOG */}
        <TabsContent value="log" className="space-y-4">
          <div className="text-sm text-zinc-400">Letzte 100 automatische Preisanpassungen.</div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Zeit</th>
                  <th className="text-left p-3">Regel</th>
                  <th className="text-right p-3">Alt</th>
                  <th className="text-right p-3">Neu</th>
                  <th className="text-left p-3">Grund</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={5} className="text-center p-8 text-zinc-500">Noch keine Anpassungen geloggt</td></tr>
                ) : logs.map(l => (
                  <tr key={l.id} className="border-t border-zinc-800 text-white">
                    <td className="p-3 text-xs text-zinc-400">{new Date(l.applied_at).toLocaleString("de-DE")}</td>
                    <td className="p-3">{l.rule_name || "—"}</td>
                    <td className="p-3 text-right">{l.old_price ? `${Number(l.old_price).toFixed(2)} €` : "—"}</td>
                    <td className="p-3 text-right font-bold text-emerald-400">{l.new_price ? `${Number(l.new_price).toFixed(2)} €` : "—"}</td>
                    <td className="p-3 text-xs text-zinc-400">{l.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* RULE DIALOG */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Regel bearbeiten" : "Neue Preisregel"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={editing.name || ""} onChange={e => setEditing({ ...editing, name: e.target.value })} className="bg-white text-black" placeholder="z.B. Last Minute Rabatt" />
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} className="bg-white text-black" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Priorität (kleiner = höher)</Label>
                  <Input type="number" value={editing.priority ?? 100} onChange={e => setEditing({ ...editing, priority: parseInt(e.target.value) || 100 })} className="bg-white text-black" />
                </div>
                <div className="flex items-end gap-2">
                  <Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                  <Label>Aktiv</Label>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-3">
                <h4 className="text-sm font-semibold mb-2">Geltungsbereich</h4>
                <div className="flex items-center gap-2 mb-2">
                  <Switch checked={editing.applies_to_all ?? true} onCheckedChange={(v) => setEditing({ ...editing, applies_to_all: v, route_id: v ? null : editing.route_id })} />
                  <Label>Für alle Strecken</Label>
                </div>
                {!editing.applies_to_all && (
                  <Select value={editing.route_id || ""} onValueChange={(v) => setEditing({ ...editing, route_id: v })}>
                    <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Strecke wählen" /></SelectTrigger>
                    <SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>

              <div className="border-t border-zinc-800 pt-3">
                <h4 className="text-sm font-semibold mb-2">Bedingungen (alle optional)</h4>
                <Label className="text-xs">Wochentage</Label>
                <div className="flex gap-1 mb-3">
                  {WEEKDAYS.map((w, i) => (
                    <button key={i} type="button" onClick={() => toggleWeekday(i)}
                      className={`px-3 py-1.5 rounded text-xs font-medium ${editing.weekdays?.includes(i) ? "bg-[#00CC36] text-black" : "bg-zinc-800 text-zinc-400"}`}>{w}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Tage vor Abfahrt min</Label><Input type="number" value={editing.days_before_min ?? ""} onChange={e => setEditing({ ...editing, days_before_min: e.target.value ? parseInt(e.target.value) : null })} className="bg-white text-black" /></div>
                  <div><Label className="text-xs">max</Label><Input type="number" value={editing.days_before_max ?? ""} onChange={e => setEditing({ ...editing, days_before_max: e.target.value ? parseInt(e.target.value) : null })} className="bg-white text-black" /></div>
                  <div><Label className="text-xs">Auslastung min %</Label><Input type="number" value={editing.occupancy_min ?? ""} onChange={e => setEditing({ ...editing, occupancy_min: e.target.value ? parseInt(e.target.value) : null })} className="bg-white text-black" /></div>
                  <div><Label className="text-xs">max %</Label><Input type="number" value={editing.occupancy_max ?? ""} onChange={e => setEditing({ ...editing, occupancy_max: e.target.value ? parseInt(e.target.value) : null })} className="bg-white text-black" /></div>
                  <div><Label className="text-xs">Datum von</Label><Input type="date" value={editing.date_from || ""} onChange={e => setEditing({ ...editing, date_from: e.target.value || null })} className="bg-white text-black" /></div>
                  <div><Label className="text-xs">Datum bis</Label><Input type="date" value={editing.date_to || ""} onChange={e => setEditing({ ...editing, date_to: e.target.value || null })} className="bg-white text-black" /></div>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-3">
                <h4 className="text-sm font-semibold mb-2">Anpassung</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Typ</Label>
                    <Select value={editing.adjustment_type} onValueChange={(v) => setEditing({ ...editing, adjustment_type: v })}>
                      <SelectTrigger className="bg-white text-black"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Prozent (+/-)</SelectItem>
                        <SelectItem value="absolute">Absolut € (+/-)</SelectItem>
                        <SelectItem value="set">Festpreis €</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Wert</Label><Input type="number" step="0.01" value={editing.adjustment_value ?? 0} onChange={e => setEditing({ ...editing, adjustment_value: parseFloat(e.target.value) || 0 })} className="bg-white text-black" /></div>
                  <div><Label className="text-xs">Min Preis €</Label><Input type="number" step="0.01" value={editing.min_price ?? ""} onChange={e => setEditing({ ...editing, min_price: e.target.value ? parseFloat(e.target.value) : null })} className="bg-white text-black" /></div>
                  <div><Label className="text-xs">Max Preis €</Label><Input type="number" step="0.01" value={editing.max_price ?? ""} onChange={e => setEditing({ ...editing, max_price: e.target.value ? parseFloat(e.target.value) : null })} className="bg-white text-black" /></div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Abbrechen</Button>
            <Button onClick={saveRule} className="bg-[#00CC36] text-black hover:bg-[#00CC36]/90">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* COMPETITOR DIALOG */}
      <Dialog open={!!compEditing} onOpenChange={(o) => !o && setCompEditing(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>Konkurrenzpreis erfassen</DialogTitle></DialogHeader>
          {compEditing && (
            <div className="space-y-3">
              <div><Label>Anbieter *</Label><Input value={compEditing.competitor_name || ""} onChange={e => setCompEditing({ ...compEditing, competitor_name: e.target.value })} className="bg-white text-black" placeholder="Flixbus, BlaBlaCar, ..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Von *</Label><Input value={compEditing.origin_city || ""} onChange={e => setCompEditing({ ...compEditing, origin_city: e.target.value })} className="bg-white text-black" placeholder="Hannover" /></div>
                <div><Label>Nach *</Label><Input value={compEditing.destination_city || ""} onChange={e => setCompEditing({ ...compEditing, destination_city: e.target.value })} className="bg-white text-black" placeholder="Berlin" /></div>
                <div><Label>Reisedatum *</Label><Input type="date" value={compEditing.travel_date || ""} onChange={e => setCompEditing({ ...compEditing, travel_date: e.target.value })} className="bg-white text-black" /></div>
                <div><Label>Preis € *</Label><Input type="number" step="0.01" value={compEditing.price || ""} onChange={e => setCompEditing({ ...compEditing, price: parseFloat(e.target.value) })} className="bg-white text-black" /></div>
              </div>
              <div><Label>Quelle (URL)</Label><Input value={compEditing.source_url || ""} onChange={e => setCompEditing({ ...compEditing, source_url: e.target.value })} className="bg-white text-black" /></div>
              <div><Label>Notizen</Label><Textarea value={compEditing.notes || ""} onChange={e => setCompEditing({ ...compEditing, notes: e.target.value })} className="bg-white text-black" rows={2} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCompEditing(null)}>Abbrechen</Button>
            <Button onClick={saveCompetitor} className="bg-[#00CC36] text-black hover:bg-[#00CC36]/90">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
