import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2, MapPin, Clock, Bus, Route as RouteIcon, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

interface Line { id: string; code: string; name: string; description: string | null; color: string; line_type: string; is_active: boolean; }
interface Stop { id?: string; line_id?: string; stop_order: number; name: string; city: string | null; country: string | null; platform: string | null; lat: number; lng: number; arrival_offset_min: number; departure_offset_min: number; }
interface Schedule { id?: string; line_id?: string; departure_time: string; weekdays: number; valid_from: string; valid_until: string | null; base_price: number | null; is_active: boolean; }

const WEEKDAYS = [["Mo", 1], ["Di", 2], ["Mi", 4], ["Do", 8], ["Fr", 16], ["Sa", 32], ["So", 64]] as const;

export default function AdminLines() {
  const { toast } = useToast();
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Line | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("bus_lines").select("*").order("code");
    setLines((data as Line[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const loadDetails = async (lineId: string) => {
    const [s, sch] = await Promise.all([
      supabase.from("line_stops").select("*").eq("line_id", lineId).order("stop_order"),
      supabase.from("line_schedules").select("*").eq("line_id", lineId).order("departure_time"),
    ]);
    setStops((s.data as Stop[]) || []);
    setSchedules((sch.data as Schedule[]) || []);
  };

  const openNew = () => {
    setEditing({ id: "", code: "", name: "", description: "", color: "#00CC36", line_type: "line", is_active: true });
    setStops([]); setSchedules([]);
  };
  const openEdit = (l: Line) => { setEditing(l); loadDetails(l.id); };

  const saveLine = async () => {
    if (!editing) return;
    if (!editing.code || !editing.name) return toast({ title: "Code & Name erforderlich", variant: "destructive" });
    const payload = { code: editing.code, name: editing.name, description: editing.description, color: editing.color, line_type: editing.line_type, is_active: editing.is_active };
    let lineId = editing.id;
    if (lineId) {
      const { error } = await supabase.from("bus_lines").update(payload).eq("id", lineId);
      if (error) return toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      const { data, error } = await supabase.from("bus_lines").insert(payload).select().single();
      if (error) return toast({ title: "Fehler", description: error.message, variant: "destructive" });
      lineId = data.id;
    }
    // upsert stops
    await supabase.from("line_stops").delete().eq("line_id", lineId);
    if (stops.length) {
      await supabase.from("line_stops").insert(stops.map((s, i) => ({ ...s, id: undefined, line_id: lineId, stop_order: i + 1 })));
    }
    // upsert schedules (simple replace)
    await supabase.from("line_schedules").delete().eq("line_id", lineId);
    if (schedules.length) {
      await supabase.from("line_schedules").insert(schedules.map(s => ({ ...s, id: undefined, line_id: lineId })));
    }
    toast({ title: "✅ Linie gespeichert" });
    setEditing(null);
    load();
  };

  const removeLine = async (id: string) => {
    if (!confirm("Linie wirklich löschen? Alle Fahrten werden ebenfalls entfernt.")) return;
    await supabase.from("bus_lines").delete().eq("id", id);
    toast({ title: "Gelöscht" });
    load();
  };

  const addStop = () => setStops([...stops, { stop_order: stops.length + 1, name: "", city: "", country: "DE", platform: "", lat: 0, lng: 0, arrival_offset_min: 0, departure_offset_min: 0 }]);
  const updStop = (i: number, k: keyof Stop, v: any) => setStops(stops.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  const moveStop = (i: number, dir: -1 | 1) => {
    const n = [...stops]; const t = n[i + dir]; if (!t) return; n[i + dir] = n[i]; n[i] = t; setStops(n);
  };
  const delStop = (i: number) => setStops(stops.filter((_, idx) => idx !== i));

  const addSchedule = () => setSchedules([...schedules, { departure_time: "08:00", weekdays: 127, valid_from: new Date().toISOString().slice(0, 10), valid_until: null, base_price: 19, is_active: true }]);
  const updSch = (i: number, k: keyof Schedule, v: any) => setSchedules(schedules.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  const toggleDay = (i: number, bit: number) => {
    const cur = schedules[i].weekdays;
    updSch(i, "weekdays", (cur & bit) ? cur & ~bit : cur | bit);
  };
  const delSch = (i: number) => setSchedules(schedules.filter((_, idx) => idx !== i));

  return (
    <AdminLayout title="Linien & Fahrpläne" subtitle={`${lines.length} Linien · Fahrplanverwaltung`}>
      <div className="flex justify-end mb-4">
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Neue Linie</Button>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div> : (
        <div className="grid gap-3">
          {lines.map(l => (
            <Card key={l.id} className="bg-zinc-900 border-zinc-800 hover:border-emerald-600/50 cursor-pointer" onClick={() => openEdit(l)}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white" style={{ background: l.color }}>{l.code}</div>
                  <div>
                    <div className="font-semibold text-white">{l.name}</div>
                    <div className="text-xs text-zinc-500 capitalize">{l.line_type === "longdistance" ? "Fernbus" : l.line_type === "shuttle" ? "Shuttle" : "Linie"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={l.is_active ? "bg-emerald-600" : "bg-zinc-600"}>{l.is_active ? "Aktiv" : "Inaktiv"}</Badge>
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={(e) => { e.stopPropagation(); removeLine(l.id); }}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {lines.length === 0 && <p className="text-zinc-500 text-center py-8">Noch keine Linien angelegt.</p>}
        </div>
      )}

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="bg-zinc-950 border-zinc-800 text-white w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader><SheetTitle className="text-white">{editing?.id ? "Linie bearbeiten" : "Neue Linie"}</SheetTitle></SheetHeader>
          {editing && (
            <Tabs defaultValue="basics" className="mt-4">
              <TabsList className="bg-zinc-900 border border-zinc-800">
                <TabsTrigger value="basics"><RouteIcon className="w-4 h-4 mr-1" />Stammdaten</TabsTrigger>
                <TabsTrigger value="stops"><MapPin className="w-4 h-4 mr-1" />Haltestellen ({stops.length})</TabsTrigger>
                <TabsTrigger value="schedules"><Clock className="w-4 h-4 mr-1" />Fahrpläne ({schedules.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="basics" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-zinc-300">Code *</Label><Input value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value })} className="bg-zinc-900 border-zinc-700" placeholder="X810" /></div>
                  <div><Label className="text-zinc-300">Farbe</Label><Input type="color" value={editing.color} onChange={e => setEditing({ ...editing, color: e.target.value })} className="bg-zinc-900 border-zinc-700 h-10" /></div>
                </div>
                <div><Label className="text-zinc-300">Name *</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="bg-zinc-900 border-zinc-700" placeholder="Hannover → Amsterdam" /></div>
                <div><Label className="text-zinc-300">Beschreibung</Label><Textarea value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} className="bg-zinc-900 border-zinc-700" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-zinc-300">Typ</Label>
                    <Select value={editing.line_type} onValueChange={v => setEditing({ ...editing, line_type: v })}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700"><SelectItem value="line">Linie</SelectItem><SelectItem value="longdistance">Fernbus</SelectItem><SelectItem value="shuttle">Shuttle</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2"><Switch checked={editing.is_active} onCheckedChange={v => setEditing({ ...editing, is_active: v })} /><Label className="text-zinc-300">Aktiv</Label></div>
                </div>
              </TabsContent>

              <TabsContent value="stops" className="space-y-3 mt-4">
                {stops.map((s, i) => (
                  <Card key={i} className="bg-zinc-900 border-zinc-800"><CardContent className="py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-zinc-600" />
                      <Badge className="bg-emerald-600">{i + 1}</Badge>
                      <Input value={s.name} onChange={e => updStop(i, "name", e.target.value)} placeholder="Haltestelle" className="bg-zinc-950 border-zinc-700 flex-1" />
                      <Button size="sm" variant="ghost" onClick={() => moveStop(i, -1)} disabled={i === 0}>↑</Button>
                      <Button size="sm" variant="ghost" onClick={() => moveStop(i, 1)} disabled={i === stops.length - 1}>↓</Button>
                      <Button size="sm" variant="ghost" className="text-red-400" onClick={() => delStop(i)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <Input value={s.city || ""} onChange={e => updStop(i, "city", e.target.value)} placeholder="Stadt" className="bg-zinc-950 border-zinc-700" />
                      <Input value={s.country || ""} onChange={e => updStop(i, "country", e.target.value)} placeholder="Land" className="bg-zinc-950 border-zinc-700" />
                      <Input value={s.platform || ""} onChange={e => updStop(i, "platform", e.target.value)} placeholder="Bahnsteig" className="bg-zinc-950 border-zinc-700" />
                      <div />
                      <Input type="number" step="0.0000001" value={s.lat} onChange={e => updStop(i, "lat", parseFloat(e.target.value))} placeholder="Lat" className="bg-zinc-950 border-zinc-700" />
                      <Input type="number" step="0.0000001" value={s.lng} onChange={e => updStop(i, "lng", parseFloat(e.target.value))} placeholder="Lng" className="bg-zinc-950 border-zinc-700" />
                      <Input type="number" value={s.arrival_offset_min} onChange={e => updStop(i, "arrival_offset_min", parseInt(e.target.value) || 0)} placeholder="Ank. +min" className="bg-zinc-950 border-zinc-700" />
                      <Input type="number" value={s.departure_offset_min} onChange={e => updStop(i, "departure_offset_min", parseInt(e.target.value) || 0)} placeholder="Abf. +min" className="bg-zinc-950 border-zinc-700" />
                    </div>
                  </CardContent></Card>
                ))}
                <Button onClick={addStop} variant="outline" className="border-zinc-700 w-full"><Plus className="w-4 h-4 mr-2" />Haltestelle</Button>
              </TabsContent>

              <TabsContent value="schedules" className="space-y-3 mt-4">
                {schedules.map((s, i) => (
                  <Card key={i} className="bg-zinc-900 border-zinc-800"><CardContent className="py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <Input type="time" value={s.departure_time} onChange={e => updSch(i, "departure_time", e.target.value)} className="bg-zinc-950 border-zinc-700 w-32" />
                      <Input type="number" step="0.01" value={s.base_price || ""} onChange={e => updSch(i, "base_price", parseFloat(e.target.value))} placeholder="Preis €" className="bg-zinc-950 border-zinc-700 w-28" />
                      <div className="flex-1" />
                      <Switch checked={s.is_active} onCheckedChange={v => updSch(i, "is_active", v)} />
                      <Button size="sm" variant="ghost" className="text-red-400" onClick={() => delSch(i)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {WEEKDAYS.map(([lbl, bit]) => (
                        <Button key={lbl} size="sm" variant={s.weekdays & (bit as number) ? "default" : "outline"}
                          className={s.weekdays & (bit as number) ? "bg-emerald-600 hover:bg-emerald-700 h-8 w-12" : "border-zinc-700 h-8 w-12"}
                          onClick={() => toggleDay(i, bit as number)}>{lbl}</Button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" value={s.valid_from} onChange={e => updSch(i, "valid_from", e.target.value)} className="bg-zinc-950 border-zinc-700" />
                      <Input type="date" value={s.valid_until || ""} onChange={e => updSch(i, "valid_until", e.target.value || null)} className="bg-zinc-950 border-zinc-700" placeholder="Gültig bis" />
                    </div>
                  </CardContent></Card>
                ))}
                <Button onClick={addSchedule} variant="outline" className="border-zinc-700 w-full"><Plus className="w-4 h-4 mr-2" />Fahrplan-Eintrag</Button>
              </TabsContent>
            </Tabs>
          )}
          <div className="mt-6 flex gap-2">
            <Button onClick={saveLine} className="bg-emerald-600 hover:bg-emerald-700 flex-1"><Bus className="w-4 h-4 mr-2" />Speichern</Button>
            <Button variant="outline" className="border-zinc-700" onClick={() => setEditing(null)}>Abbrechen</Button>
          </div>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
