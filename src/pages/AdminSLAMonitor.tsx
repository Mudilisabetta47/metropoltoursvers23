import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataTable, DataTableColumn } from "@/components/admin/core/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Clock, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fmt = (d: string | null) => d ? new Date(d).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

const REASONS = [
  { value: "traffic", label: "Stau / Verkehr" },
  { value: "weather", label: "Wetter" },
  { value: "technical", label: "Technischer Defekt" },
  { value: "passenger", label: "Fahrgast-Vorfall" },
  { value: "border", label: "Grenzkontrolle" },
  { value: "operational", label: "Betrieblich" },
  { value: "other", label: "Sonstiges" },
];

export default function AdminSLAMonitor() {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const [{ data }, { data: t }] = await Promise.all([
      supabase.from("trip_otp_log").select("*, trip:trips(departure_date, departure_time, route_id)").gte("recorded_at", since).order("recorded_at", { ascending: false }).limit(1000),
      supabase.from("trips").select("id, departure_date, departure_time, route_id").gte("departure_date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)).order("departure_date", { ascending: false }).limit(200),
    ]);
    setRows(data || []); setTrips(t || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [days]);

  const stats = useMemo(() => {
    const total = rows.length;
    const onTime = rows.filter(r => (r.delay_minutes ?? 0) <= 5).length;
    const minor = rows.filter(r => r.delay_minutes > 5 && r.delay_minutes <= 15).length;
    const major = rows.filter(r => r.delay_minutes > 15 && r.delay_minutes <= 30).length;
    const severe = rows.filter(r => r.delay_minutes > 30).length;
    const otp = total > 0 ? (onTime / total) * 100 : 0;
    const avgDelay = total > 0 ? rows.reduce((s, r) => s + (r.delay_minutes || 0), 0) / total : 0;
    // Reason distribution
    const reasonMap: Record<string, number> = {};
    rows.filter(r => r.delay_minutes > 5).forEach(r => { reasonMap[r.delay_reason || "other"] = (reasonMap[r.delay_reason || "other"] || 0) + 1; });
    const topReasons = Object.entries(reasonMap).sort(([, a], [, b]) => b - a).slice(0, 5);
    return { total, onTime, minor, major, severe, otp, avgDelay, topReasons };
  }, [rows]);

  const save = async () => {
    if (!form.trip_id || !form.scheduled_departure || !form.actual_departure) return toast.error("Trip, Soll- & Ist-Abfahrt erforderlich");
    const delay = Math.round((new Date(form.actual_departure).getTime() - new Date(form.scheduled_departure).getTime()) / 60000);
    const { error } = await supabase.from("trip_otp_log").insert({ ...form, delay_minutes: delay });
    if (error) return toast.error(error.message);
    toast.success("Pünktlichkeitsdaten erfasst"); setOpen(false); setForm({}); load();
  };

  const columns: DataTableColumn<any>[] = [
    { key: "date", header: "Soll-Abfahrt", accessor: r => fmt(r.scheduled_departure), sortValue: r => r.scheduled_departure },
    { key: "actual", header: "Ist-Abfahrt", accessor: r => fmt(r.actual_departure), sortValue: r => r.actual_departure || "" },
    { key: "delay", header: "Verspätung", accessor: r => {
      const d = r.delay_minutes || 0;
      const cls = d <= 5 ? "text-emerald-400" : d <= 15 ? "text-amber-400" : "text-red-400";
      return <span className={`font-semibold ${cls}`}>{d > 0 ? `+${d}` : d} min</span>;
    }, sortValue: r => r.delay_minutes || 0 },
    { key: "reason", header: "Ursache", accessor: r => REASONS.find(x => x.value === r.delay_reason)?.label || r.delay_reason || "—" },
    { key: "trip", header: "Trip", accessor: r => r.trip ? `${r.trip.departure_date} ${r.trip.departure_time?.slice(0, 5)}` : r.trip_id?.slice(0, 8) },
  ];

  return (
    <AdminLayout title="SLA & Pünktlichkeit" subtitle="On-Time-Performance, Verspätungsanalyse, Ursachen"
      actions={<>
        <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
          <SelectTrigger className="w-32 bg-white text-black mr-2"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="7">7 Tage</SelectItem><SelectItem value="30">30 Tage</SelectItem><SelectItem value="90">90 Tage</SelectItem></SelectContent>
        </Select>
        <Button onClick={() => setOpen(true)} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black"><Plus className="w-4 h-4 mr-2" />Erfassen</Button>
      </>}>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 p-4 col-span-2">
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-emerald-300 uppercase tracking-wider">On-Time-Performance</span>{stats.otp >= 90 ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-amber-400" />}</div>
          <div className="text-4xl font-bold text-emerald-400">{stats.otp.toFixed(1)}%</div>
          <div className="text-xs text-zinc-400 mt-1">Ø {stats.avgDelay.toFixed(1)} Min Verspätung</div>
        </div>
        <Card icon={CheckCircle2} label="Pünktlich (≤5)" value={stats.onTime} color="text-emerald-400" />
        <Card icon={Clock} label="Leicht (6-15)" value={stats.minor} color="text-amber-400" />
        <Card icon={AlertCircle} label=">15 Min" value={stats.major + stats.severe} color="text-red-400" />
      </div>

      {stats.topReasons.length > 0 && (
        <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-4 mb-6">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">Top Verspätungsursachen</h3>
          <div className="space-y-2">
            {stats.topReasons.map(([reason, count]) => {
              const pct = (count / Math.max(stats.minor + stats.major + stats.severe, 1)) * 100;
              return (
                <div key={reason}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-zinc-300">{REASONS.find(r => r.value === reason)?.label || reason}</span><span className="text-zinc-500">{count} ({pct.toFixed(0)}%)</span></div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-500 to-red-500" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <DataTable data={rows} columns={columns} rowKey={r => r.id} isLoading={loading} exportFilename={`otp-${days}d`} emptyMessage="Noch keine OTP-Daten" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl">
          <DialogHeader><DialogTitle>Pünktlichkeit erfassen</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Fahrt *</Label>
              <Select value={form.trip_id} onValueChange={v => setForm({ ...form, trip_id: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Fahrt wählen" /></SelectTrigger>
                <SelectContent>{trips.map(t => <SelectItem key={t.id} value={t.id}>{t.departure_date} · {t.departure_time?.slice(0,5)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Soll-Abfahrt *</Label><Input type="datetime-local" className="bg-white text-black" onChange={e => setForm({ ...form, scheduled_departure: e.target.value })} /></div>
            <div><Label>Ist-Abfahrt *</Label><Input type="datetime-local" className="bg-white text-black" onChange={e => setForm({ ...form, actual_departure: e.target.value })} /></div>
            <div><Label>Soll-Ankunft</Label><Input type="datetime-local" className="bg-white text-black" onChange={e => setForm({ ...form, scheduled_arrival: e.target.value })} /></div>
            <div><Label>Ist-Ankunft</Label><Input type="datetime-local" className="bg-white text-black" onChange={e => setForm({ ...form, actual_arrival: e.target.value })} /></div>
            <div className="col-span-2">
              <Label>Verspätungsursache</Label>
              <Select value={form.delay_reason} onValueChange={v => setForm({ ...form, delay_reason: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Wählen" /></SelectTrigger>
                <SelectContent>{REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button><Button onClick={save} className="bg-[#00CC36] text-black">Speichern</Button></DialogFooter>
        </DialogContent>
      </Dialog>
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
