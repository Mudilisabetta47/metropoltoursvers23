import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Loader2, Clock, Bus, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-zinc-600", boarding: "bg-blue-600", in_transit: "bg-emerald-600",
  arrived: "bg-emerald-700", cancelled: "bg-red-600", delayed: "bg-amber-600",
};
const STATUS_LABELS: Record<string, string> = {
  scheduled: "Geplant", boarding: "Einsteigen", in_transit: "Unterwegs",
  arrived: "Angekommen", cancelled: "Ausgefallen", delayed: "Verspätet",
};

export default function AdminLineTrips() {
  const { toast } = useToast();
  const [trips, setTrips] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lineFilter, setLineFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [t, l, s] = await Promise.all([
      supabase.from("line_trips").select("*").eq("service_date", date).order("planned_departure"),
      supabase.from("bus_lines").select("*"),
      supabase.from("line_stops").select("*").order("stop_order"),
    ]);
    setTrips(t.data || []);
    setLines(l.data || []);
    setStops(s.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [date]);

  const getLine = (id: string) => lines.find(l => l.id === id);
  const getRoute = (lineId: string) => {
    const ls = stops.filter(s => s.line_id === lineId);
    if (!ls.length) return "–";
    return `${ls[0].city} → ${ls[ls.length - 1].city}`;
  };

  const updateStatus = async (trip: any, status: string) => {
    const patch: any = { status };
    if (status === "in_transit" && !trip.actual_departure) patch.actual_departure = new Date().toISOString();
    if (status === "arrived" && !trip.actual_arrival) patch.actual_arrival = new Date().toISOString();
    const { error } = await supabase.from("line_trips").update(patch).eq("id", trip.id);
    if (error) return toast({ title: "Fehler", description: error.message, variant: "destructive" });
    toast({ title: "✅ Status aktualisiert" });
    load();
  };

  const setDelay = async (trip: any) => {
    const min = parseInt(prompt("Verspätung in Minuten:", String(trip.delay_minutes)) || "0");
    if (isNaN(min)) return;
    await supabase.from("line_trips").update({ delay_minutes: min, status: min > 0 ? "delayed" : trip.status }).eq("id", trip.id);
    toast({ title: "Verspätung gespeichert" });
    load();
  };

  const filtered = trips.filter(t => lineFilter === "all" || t.line_id === lineFilter);
  const stats = {
    total: filtered.length,
    inTransit: filtered.filter(t => t.status === "in_transit").length,
    delayed: filtered.filter(t => t.delay_minutes > 0).length,
    arrived: filtered.filter(t => t.status === "arrived").length,
  };

  return (
    <AdminLayout title="Tages-Fahrten" subtitle={`Linienfahrten am ${format(new Date(date), "EEEE, dd.MM.yyyy", { locale: de })}`}>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-zinc-900 border-zinc-700 text-white w-48" />
        <Select value={lineFilter} onValueChange={setLineFilter}>
          <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white w-48"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700"><SelectItem value="all">Alle Linien</SelectItem>{lines.map(l => <SelectItem key={l.id} value={l.id}>{l.code} – {l.name}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={load} variant="outline" className="border-zinc-700"><RefreshCw className="w-4 h-4 mr-2" />Aktualisieren</Button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          ["Fahrten gesamt", stats.total, "bg-zinc-800"],
          ["Unterwegs", stats.inTransit, "bg-emerald-700"],
          ["Verspätet", stats.delayed, "bg-amber-700"],
          ["Angekommen", stats.arrived, "bg-emerald-900"],
        ].map(([l, v, c]: any) => (
          <Card key={l} className={`${c} border-zinc-800`}><CardContent className="py-4"><div className="text-xs text-zinc-300">{l}</div><div className="text-2xl font-bold text-white">{v}</div></CardContent></Card>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div> : (
        <Card className="bg-zinc-900 border-zinc-800">
          <Table>
            <TableHeader><TableRow className="border-zinc-800">
              <TableHead className="text-zinc-400">Trip-Nr.</TableHead>
              <TableHead className="text-zinc-400">Linie</TableHead>
              <TableHead className="text-zinc-400">Route</TableHead>
              <TableHead className="text-zinc-400">Abfahrt</TableHead>
              <TableHead className="text-zinc-400">Ankunft</TableHead>
              <TableHead className="text-zinc-400">Verspätung</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Aktionen</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(t => {
                const line = getLine(t.line_id);
                return (
                  <TableRow key={t.id} className="border-zinc-800">
                    <TableCell className="font-mono text-emerald-400">{t.trip_number}</TableCell>
                    <TableCell><Badge style={{ background: line?.color }}>{line?.code}</Badge></TableCell>
                    <TableCell className="text-white">{getRoute(t.line_id)}</TableCell>
                    <TableCell className="text-zinc-300">{format(new Date(t.planned_departure), "HH:mm")}</TableCell>
                    <TableCell className="text-zinc-300">{format(new Date(t.planned_arrival), "HH:mm")}</TableCell>
                    <TableCell>{t.delay_minutes > 0 ? <span className="text-amber-400">+{t.delay_minutes} min</span> : <span className="text-zinc-500">–</span>}</TableCell>
                    <TableCell><Badge className={STATUS_COLORS[t.status]}>{STATUS_LABELS[t.status]}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Select value={t.status} onValueChange={v => updateStatus(t, v)}>
                          <SelectTrigger className="h-8 w-32 bg-zinc-950 border-zinc-700 text-white text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700">{Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" onClick={() => setDelay(t)} title="Verspätung"><AlertCircle className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => window.open(`/verfolge/${t.trip_number}`, "_blank")} title="Tracking"><ExternalLink className="w-3 h-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-zinc-500">Keine Fahrten an diesem Tag</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      )}
    </AdminLayout>
  );
}
