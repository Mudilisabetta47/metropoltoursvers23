import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Plus, Loader2, Bus, Users, MapPin, Clock, Search, ChevronRight, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createCharterTrip, TRIP_CATEGORY_LABELS, type TripCategory } from "@/lib/charterTrips";

interface Row {
  id: string;
  title: string | null;
  trip_category: string;
  departure_date: string;
  departure_time: string;
  arrival_date: string | null;
  arrival_time: string;
  status: string;
  direction: string;
  bus_id: string;
  route_id: string;
  routes?: { name: string } | null;
  buses?: { name: string; license_plate: string } | null;
}

const emptyForm = {
  title: "",
  category: "charter" as TripCategory,
  busId: "",
  driverUserId: "",
  guideUserId: "",
  seatCapacity: "",
  internalNotes: "",
  origin: "",
  destination: "",
  intermediates: "",
  departureDate: format(new Date(), "yyyy-MM-dd"),
  departureTime: "08:00",
  arrivalDate: "",
  arrivalTime: "18:00",
  hasReturn: true,
  returnDate: "",
  returnDepartureTime: "10:00",
  returnArrivalDate: "",
  returnArrivalTime: "20:00",
};

export default function AdminCharterTrips() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ ...emptyForm });
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    const [t, b, r] = await Promise.all([
      supabase
        .from("trips")
        .select("*, routes(name), buses(name, license_plate)")
        .neq("trip_category", "line")
        .order("departure_date", { ascending: false })
        .limit(200),
      supabase.from("buses").select("id, name, license_plate, total_seats").eq("is_active", true).order("name"),
      supabase.from("user_roles").select("user_id, role").in("role", ["driver", "office", "admin"]),
    ]);
    const trips = (t.data as any as Row[]) || [];
    setRows(trips);
    setBuses(b.data || []);

    const ids = Array.from(new Set((r.data || []).map((x: any) => x.user_id)));
    if (ids.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email")
        .in("user_id", ids);
      setStaff(profiles || []);
    }

    if (trips.length) {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("trip_id")
        .in("trip_id", trips.map(x => x.id))
        .neq("status", "cancelled");
      const map: Record<string, number> = {};
      (bookings || []).forEach((x: any) => { map[x.trip_id] = (map[x.trip_id] || 0) + 1; });
      setCounts(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter(r =>
      (r.title || "").toLowerCase().includes(s) ||
      (r.routes?.name || "").toLowerCase().includes(s) ||
      (r.buses?.license_plate || "").toLowerCase().includes(s)
    );
  }, [rows, search]);

  const staffLabel = (p: any) =>
    `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email;

  const submit = async () => {
    if (!form.title.trim() || !form.busId || !form.origin.trim() || !form.destination.trim()) {
      toast({ title: "Bitte Fahrtname, Fahrzeug, Start und Ziel angeben", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { tripId } = await createCharterTrip({
        title: form.title.trim(),
        category: form.category,
        busId: form.busId,
        driverUserId: form.driverUserId || null,
        guideUserId: form.guideUserId || null,
        seatCapacity: form.seatCapacity ? parseInt(form.seatCapacity) : null,
        internalNotes: form.internalNotes || null,
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        intermediates: form.intermediates.split(",").map(s => s.trim()).filter(Boolean),
        departureDate: form.departureDate,
        departureTime: form.departureTime,
        arrivalDate: form.arrivalDate || form.departureDate,
        arrivalTime: form.arrivalTime,
        hasReturn: form.hasReturn,
        returnDate: form.returnDate || null,
        returnDepartureTime: form.returnDepartureTime,
        returnArrivalDate: form.returnArrivalDate || form.returnDate,
        returnArrivalTime: form.returnArrivalTime,
      });
      toast({ title: "Fahrt angelegt", description: "Fahrplan, Sitzplätze und Tracking wurden automatisch erzeugt." });
      setOpen(false);
      setForm({ ...emptyForm });
      navigate(`/admin/fahrten/${tripId}`);
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Fahrt wirklich löschen? Vorhandene Buchungen bleiben bestehen.")) return;
    const { error } = await supabase.from("trips").update({ is_active: false, status: "cancelled" } as any).eq("id", id);
    if (error) toast({ title: "Fehler", description: error.message, variant: "destructive" });
    else { toast({ title: "Fahrt storniert" }); load(); }
  };

  return (
    <AdminLayout title="Individuelle Fahrten" subtitle="Eigene Fahrten mit Fahrplan, Dienstplan, Tickets & Live-Tracking">
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Fahrt, Route oder Kennzeichen suchen…"
            className="pl-9 bg-zinc-950 border-zinc-700 text-white"
          />
        </div>
        <Button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-1" /> Neue Fahrt
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      ) : filtered.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-16 text-center text-zinc-500">
            Noch keine individuelle Fahrt angelegt.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map(t => (
            <Card key={t.id} className="bg-zinc-900 border-zinc-800 hover:border-emerald-600/40 transition">
              <CardContent className="py-3 flex flex-wrap items-center gap-3">
                <button onClick={() => navigate(`/admin/fahrten/${t.id}`)} className="flex-1 min-w-[200px] text-left">
                  <div className="font-semibold text-white">{t.title || t.routes?.name}</div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t.routes?.name}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(t.departure_date), "dd.MM.yyyy", { locale: de })} · {t.departure_time?.slice(0, 5)}
                    </span>
                    {t.buses && <span className="flex items-center gap-1"><Bus className="w-3 h-3" />{t.buses.license_plate}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{counts[t.id] || 0} Fahrgäste</span>
                  </div>
                </button>
                <Badge className="bg-zinc-700">{TRIP_CATEGORY_LABELS[t.trip_category] || t.trip_category}</Badge>
                {t.direction === "return" && <Badge variant="outline" className="border-zinc-600 text-zinc-300">Rückfahrt</Badge>}
                <Badge className={
                  t.status === "running" ? "bg-emerald-600" : t.status === "completed" ? "bg-zinc-600" : t.status === "cancelled" ? "bg-red-600" : "bg-blue-600"
                }>
                  {t.status === "running" ? "Unterwegs" : t.status === "completed" ? "Beendet" : t.status === "cancelled" ? "Storniert" : "Geplant"}
                </Badge>
                <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-red-400" onClick={() => remove(t.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-zinc-300" onClick={() => navigate(`/admin/fahrten/${t.id}`)}>
                  Öffnen <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white">Neue individuelle Fahrt</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300">Fahrtname *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="z. B. Betriebsausflug Müller GmbH" className="bg-zinc-900 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-300">Fahrtart</Label>
                <Select value={form.category} onValueChange={(v: any) => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {["charter", "private", "group", "special", "maiden"].map(c => (
                      <SelectItem key={c} value={c}>{TRIP_CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300">Start *</Label>
                <Input value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
                  placeholder="Hannover ZOB" className="bg-zinc-900 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-300">Ziel *</Label>
                <Input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                  placeholder="Novalja" className="bg-zinc-900 border-zinc-700 text-white mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-zinc-300">Zwischenhalte (Komma-getrennt)</Label>
              <Input value={form.intermediates} onChange={e => setForm(f => ({ ...f, intermediates: e.target.value }))}
                placeholder="Kassel, München, Salzburg" className="bg-zinc-900 border-zinc-700 text-white mt-1" />
            </div>

            <div className="grid md:grid-cols-4 gap-3">
              <div>
                <Label className="text-zinc-300">Abfahrt Datum</Label>
                <Input type="date" value={form.departureDate} onChange={e => setForm(f => ({ ...f, departureDate: e.target.value }))}
                  className="bg-zinc-900 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-300">Abfahrt Zeit</Label>
                <Input type="time" value={form.departureTime} onChange={e => setForm(f => ({ ...f, departureTime: e.target.value }))}
                  className="bg-zinc-900 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-300">Ankunft Datum</Label>
                <Input type="date" value={form.arrivalDate} onChange={e => setForm(f => ({ ...f, arrivalDate: e.target.value }))}
                  className="bg-zinc-900 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-300">Ankunft Zeit</Label>
                <Input type="time" value={form.arrivalTime} onChange={e => setForm(f => ({ ...f, arrivalTime: e.target.value }))}
                  className="bg-zinc-900 border-zinc-700 text-white mt-1" />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <Switch checked={form.hasReturn} onCheckedChange={v => setForm(f => ({ ...f, hasReturn: v }))} />
              <Label className="text-zinc-200 text-sm">Rückfahrt anlegen</Label>
            </div>

            {form.hasReturn && (
              <div className="grid md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-zinc-300">Rückfahrt Datum</Label>
                  <Input type="date" value={form.returnDate} onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))}
                    className="bg-zinc-900 border-zinc-700 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-zinc-300">Abfahrt Zeit</Label>
                  <Input type="time" value={form.returnDepartureTime} onChange={e => setForm(f => ({ ...f, returnDepartureTime: e.target.value }))}
                    className="bg-zinc-900 border-zinc-700 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-zinc-300">Ankunft Datum</Label>
                  <Input type="date" value={form.returnArrivalDate} onChange={e => setForm(f => ({ ...f, returnArrivalDate: e.target.value }))}
                    className="bg-zinc-900 border-zinc-700 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-zinc-300">Ankunft Zeit</Label>
                  <Input type="time" value={form.returnArrivalTime} onChange={e => setForm(f => ({ ...f, returnArrivalTime: e.target.value }))}
                    className="bg-zinc-900 border-zinc-700 text-white mt-1" />
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300">Fahrzeug *</Label>
                <Select value={form.busId} onValueChange={v => setForm(f => ({ ...f, busId: v }))}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white mt-1"><SelectValue placeholder="Bus wählen…" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {buses.map(b => <SelectItem key={b.id} value={b.id}>{b.name} · {b.license_plate} ({b.total_seats} Sitze)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300">Sitzplatzkapazität</Label>
                <Input type="number" value={form.seatCapacity} onChange={e => setForm(f => ({ ...f, seatCapacity: e.target.value }))}
                  placeholder="z. B. 49" className="bg-zinc-900 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-300">Fahrer</Label>
                <Select value={form.driverUserId || "none"} onValueChange={v => setForm(f => ({ ...f, driverUserId: v === "none" ? "" : v }))}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white mt-1"><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="none">– Später zuweisen –</SelectItem>
                    {staff.map(p => <SelectItem key={p.user_id} value={p.user_id}>{staffLabel(p)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300">Reiseleiter</Label>
                <Select value={form.guideUserId || "none"} onValueChange={v => setForm(f => ({ ...f, guideUserId: v === "none" ? "" : v }))}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white mt-1"><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="none">– Kein Reiseleiter –</SelectItem>
                    {staff.map(p => <SelectItem key={p.user_id} value={p.user_id}>{staffLabel(p)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-zinc-300">Interne Notizen</Label>
              <Textarea value={form.internalNotes} onChange={e => setForm(f => ({ ...f, internalNotes: e.target.value }))}
                className="bg-zinc-900 border-zinc-700 text-white mt-1" placeholder="Nur für Disposition und Fahrer sichtbar" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={submit} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fahrt anlegen"}
              </Button>
              <Button variant="outline" className="border-zinc-700" onClick={() => setOpen(false)}>Abbrechen</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
