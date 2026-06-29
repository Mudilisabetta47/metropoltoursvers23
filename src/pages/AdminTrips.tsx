import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, AlertTriangle, Clock, Bus, MapPin, Copy, Bell, History, Filter, ExternalLink } from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { de } from "date-fns/locale";
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

interface TripRow {
  id: string;
  trip_uid: string;
  source_type: "line_trip" | "package_tour_date";
  source_id: string;
  departure_at: string | null;
  origin: string | null;
  destination: string | null;
  status: string;
  current_delay_min: number;
  delay_reason: string | null;
  delay_updated_at: string | null;
}

interface DelayEvent {
  id: string;
  trip_uid: string;
  delay_min: number;
  reason: string | null;
  reported_by: string | null;
  notified_count: number | null;
  notify_requested: boolean | null;
  created_at: string;
}

const REASONS = ["Stau", "Panne", "Wetter", "Polizeikontrolle", "Verspätete Anschlussfahrt", "Sonstiges"];

export default function AdminTrips() {
  const { toast } = useToast();
  const [rows, setRows] = useState<TripRow[]>([]);
  const [events, setEvents] = useState<DelayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRange, setFilterRange] = useState<"today" | "tomorrow" | "week" | "all">("week");
  const [filterType, setFilterType] = useState<"all" | "line_trip" | "package_tour_date">("all");
  const [filterDelay, setFilterDelay] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<TripRow | null>(null);
  const [delayMin, setDelayMin] = useState(0);
  const [delayReason, setDelayReason] = useState("Stau");
  const [delayReasonExtra, setDelayReasonExtra] = useState("");
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [r, e] = await Promise.all([
      supabase.from("trip_registry").select("*").order("departure_at", { ascending: true, nullsFirst: false }),
      supabase.from("trip_delay_events").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setRows((r.data as TripRow[]) || []);
    setEvents((e.data as DelayEvent[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("admin-trips")
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_registry" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_delay_events" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filterType !== "all" && r.source_type !== filterType) return false;
      if (filterDelay && r.current_delay_min <= 0) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!r.trip_uid.toLowerCase().includes(s) && !(r.origin || "").toLowerCase().includes(s) && !(r.destination || "").toLowerCase().includes(s)) return false;
      }
      if (!r.departure_at) return filterRange === "all";
      const d = new Date(r.departure_at);
      if (filterRange === "today") return isToday(d);
      if (filterRange === "tomorrow") return isTomorrow(d);
      if (filterRange === "week") return isThisWeek(d, { weekStartsOn: 1 });
      return true;
    });
  }, [rows, filterType, filterDelay, filterRange, search]);

  const stats = useMemo(() => ({
    total: rows.length,
    today: rows.filter(r => r.departure_at && isToday(new Date(r.departure_at))).length,
    delayed: rows.filter(r => r.current_delay_min > 0).length,
    line: rows.filter(r => r.source_type === "line_trip").length,
    tour: rows.filter(r => r.source_type === "package_tour_date").length,
  }), [rows]);

  const openEdit = (t: TripRow) => {
    setEditing(t);
    setDelayMin(t.current_delay_min || 0);
    setDelayReason(t.delay_reason && REASONS.includes(t.delay_reason) ? t.delay_reason : (t.delay_reason ? "Sonstiges" : "Stau"));
    setDelayReasonExtra(t.delay_reason && !REASONS.includes(t.delay_reason) ? t.delay_reason : "");
    setNotify(true);
  };

  const submitDelay = async () => {
    if (!editing) return;
    setSaving(true);
    const reason = delayReason === "Sonstiges" ? delayReasonExtra.trim() : delayReason;
    const { data, error } = await supabase.rpc("report_trip_delay", {
      p_trip_uid: editing.trip_uid,
      p_delay_min: delayMin,
      p_reason: reason || null,
      p_notify: notify,
    });
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }
    if (notify && delayMin > 0) {
      try {
        await supabase.functions.invoke("notify-trip-delay", { body: { trip_uid: editing.trip_uid, event_id: data } });
        toast({ title: "Verspätung gemeldet & Fahrgäste benachrichtigt" });
      } catch (e: any) {
        toast({ title: "Verspätung gemeldet", description: "E-Mail-Versand fehlgeschlagen: " + e.message, variant: "destructive" });
      }
    } else {
      toast({ title: delayMin === 0 ? "Verspätung zurückgesetzt" : "Verspätung gemeldet" });
    }
    setSaving(false);
    setEditing(null);
    load();
  };

  const copy = (uid: string) => {
    navigator.clipboard.writeText(uid);
    toast({ title: "Trip-ID kopiert", description: uid });
  };

  return (
    <AdminLayout title="Alle Fahrten" subtitle="Linien & Pauschalreisen · Verspätungen & Benachrichtigungen">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[
          { label: "Gesamt", v: stats.total, c: "text-white" },
          { label: "Heute", v: stats.today, c: "text-emerald-400" },
          { label: "Verspätet", v: stats.delayed, c: "text-red-400" },
          { label: "Linien", v: stats.line, c: "text-blue-400" },
          { label: "Pauschal", v: stats.tour, c: "text-amber-400" },
        ].map(s => (
          <Card key={s.label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-4">
              <div className="text-xs uppercase text-zinc-500">{s.label}</div>
              <div className={`text-2xl font-bold mt-1 ${s.c}`}>{s.v}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="trips">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="trips"><Bus className="w-4 h-4 mr-1" />Fahrten ({filtered.length})</TabsTrigger>
          <TabsTrigger value="history"><History className="w-4 h-4 mr-1" />Verspätungs-Historie ({events.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-4">
          <Card className="bg-zinc-900 border-zinc-800 mb-3">
            <CardContent className="py-3 flex flex-wrap gap-2 items-center">
              <Filter className="w-4 h-4 text-zinc-500" />
              <Select value={filterRange} onValueChange={(v: any) => setFilterRange(v)}>
                <SelectTrigger className="w-36 bg-zinc-950 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="today">Heute</SelectItem>
                  <SelectItem value="tomorrow">Morgen</SelectItem>
                  <SelectItem value="week">Diese Woche</SelectItem>
                  <SelectItem value="all">Alle</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger className="w-44 bg-zinc-950 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="line_trip">Linienfahrten</SelectItem>
                  <SelectItem value="package_tour_date">Pauschalreisen</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 px-2">
                <Switch checked={filterDelay} onCheckedChange={setFilterDelay} />
                <Label className="text-xs text-zinc-300">Nur verspätete</Label>
              </div>
              <Input placeholder="Suche Trip-ID, Strecke…" value={search} onChange={e => setSearch(e.target.value)} className="bg-zinc-950 border-zinc-700 max-w-xs" />
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-zinc-500 text-center py-12">Keine Fahrten im gewählten Filter.</p>
          ) : (
            <div className="grid gap-2">
              {filtered.map(t => (
                <Card key={t.id} className="bg-zinc-900 border-zinc-800 hover:border-emerald-600/40 transition">
                  <CardContent className="py-3 flex items-center gap-3 flex-wrap">
                    <button onClick={() => copy(t.trip_uid)} className="flex items-center gap-1 font-mono text-xs px-2 py-1 rounded bg-zinc-800 text-emerald-300 hover:bg-zinc-700">
                      {t.trip_uid} <Copy className="w-3 h-3" />
                    </button>
                    <Badge className={t.source_type === "line_trip" ? "bg-blue-600" : "bg-amber-600"}>
                      {t.source_type === "line_trip" ? "Linie" : "Pauschal"}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-zinc-200">
                      <MapPin className="w-3 h-3 text-zinc-500" />
                      <span className="truncate max-w-[200px]">{t.origin || "—"}</span>
                      <span className="text-zinc-600">→</span>
                      <span className="truncate max-w-[200px]">{t.destination || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <Clock className="w-3 h-3" />
                      {t.departure_at ? format(new Date(t.departure_at), "dd.MM. HH:mm", { locale: de }) : "—"}
                    </div>
                    {t.current_delay_min > 0 ? (
                      <Badge className="bg-red-600 gap-1"><AlertTriangle className="w-3 h-3" />+{t.current_delay_min} min</Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-600/50 text-emerald-400">Pünktlich</Badge>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      <Link to={`/verfolge/${encodeURIComponent(t.trip_uid)}`} target="_blank">
                        <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white"><ExternalLink className="w-3 h-3 mr-1" />Verfolgen</Button>
                      </Link>
                      <Button size="sm" onClick={() => openEdit(t)} className={t.current_delay_min > 0 ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}>
                        <Bell className="w-3 h-3 mr-1" />Verspätung melden
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {events.length === 0 ? (
            <p className="text-zinc-500 text-center py-12">Noch keine Verspätungen gemeldet.</p>
          ) : (
            <div className="grid gap-2">
              {events.map(ev => (
                <Card key={ev.id} className="bg-zinc-900 border-zinc-800">
                  <CardContent className="py-3 flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs text-emerald-300">{ev.trip_uid}</span>
                    <Badge className={ev.delay_min > 0 ? "bg-red-600" : "bg-zinc-600"}>{ev.delay_min > 0 ? `+${ev.delay_min} min` : "zurückgesetzt"}</Badge>
                    <span className="text-sm text-zinc-300">{ev.reason || "—"}</span>
                    <span className="text-xs text-zinc-500 ml-auto">{format(new Date(ev.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                    {ev.notify_requested && (
                      <Badge variant="outline" className="border-emerald-600/50 text-emerald-400">
                        {ev.notified_count ?? 0} Mails
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <SheetContent className="bg-zinc-950 border-zinc-800 text-white w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle className="text-white">Verspätung melden</SheetTitle></SheetHeader>
          {editing && (
            <div className="mt-4 space-y-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-3 text-sm">
                  <div className="font-mono text-emerald-300 mb-1">{editing.trip_uid}</div>
                  <div className="text-zinc-300">{editing.origin} → {editing.destination}</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {editing.departure_at ? format(new Date(editing.departure_at), "dd.MM.yyyy HH:mm", { locale: de }) : "—"}
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label className="text-zinc-300">Verspätung (Minuten)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input type="number" min={0} max={1440} value={delayMin} onChange={e => setDelayMin(Math.max(0, Math.min(1440, parseInt(e.target.value) || 0)))} className="bg-zinc-900 border-zinc-700" />
                  <div className="flex gap-1">
                    {[5, 15, 30, 60].map(n => (
                      <Button key={n} size="sm" variant="outline" className="border-zinc-700" onClick={() => setDelayMin(n)}>+{n}</Button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-1">0 setzt die Verspätung zurück.</p>
              </div>

              <div>
                <Label className="text-zinc-300">Grund</Label>
                <Select value={delayReason} onValueChange={setDelayReason}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                {delayReason === "Sonstiges" && (
                  <Textarea value={delayReasonExtra} onChange={e => setDelayReasonExtra(e.target.value)} placeholder="Bitte beschreiben…" className="mt-2 bg-zinc-900 border-zinc-700" />
                )}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <Switch checked={notify} onCheckedChange={setNotify} disabled={delayMin === 0} />
                <div>
                  <Label className="text-zinc-200 text-sm">Fahrgäste per E-Mail benachrichtigen</Label>
                  <p className="text-xs text-zinc-500">Alle bestätigten Buchungen dieser Fahrt erhalten die neue Abfahrtszeit.</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={submitDelay} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Bell className="w-4 h-4 mr-1" />Melden</>}
                </Button>
                <Button variant="outline" className="border-zinc-700" onClick={() => setEditing(null)}>Abbrechen</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
