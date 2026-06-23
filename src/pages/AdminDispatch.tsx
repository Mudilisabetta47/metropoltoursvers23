import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bus, User, Calendar, ChevronLeft, ChevronRight, RefreshCw,
  CheckCircle2, Circle, AlertTriangle, MapPin, Users, Clock, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay } from "date-fns";
import { de } from "date-fns/locale";

type BookingRow = {
  id: string;
  booking_number: string;
  booking_type: string;
  customer_name: string;
  pickup_location: string | null;
  destination_location: string | null;
  departure_at: string;
  passenger_count: number | null;
  vehicle_class: string | null;
  assigned_bus: string | null;
  assigned_driver: string | null;
  booking_status: string;
  dispatch_status: string;
  pretrip_checklist: Array<{ key: string; done: boolean; label: string }> | null;
  internal_notes: string | null;
};

type BusRow = { id: string; name: string; license_plate: string; total_seats: number };
type DriverRow = { user_id: string; first_name: string | null; last_name: string | null; email: string };

const DEFAULT_CHECKLIST = [
  { key: "vehicle_check", label: "Fahrzeugcheck (Reifen, Öl, Wasser)", done: false },
  { key: "documents", label: "Fahrzeugpapiere & TÜV-Nachweis an Bord", done: false },
  { key: "first_aid", label: "Verbandkasten & Warndreieck geprüft", done: false },
  { key: "cleanliness", label: "Innenreinigung & WC kontrolliert", done: false },
  { key: "fuel", label: "Tank voll / AdBlue ausreichend", done: false },
  { key: "passenger_list", label: "Teilnehmerliste & Tickets an Bord", done: false },
  { key: "route_briefing", label: "Routen- und Pausenplanung mit Fahrer besprochen", done: false },
  { key: "customer_call", label: "Kunde / Gruppenleiter telefonisch bestätigt", done: false },
];

const dispatchStages = [
  { key: "ungeplant", label: "Ungeplant", color: "bg-zinc-700 text-zinc-200" },
  { key: "geplant", label: "Geplant", color: "bg-blue-600/30 text-blue-200" },
  { key: "bereit", label: "Bereit zur Abfahrt", color: "bg-amber-600/30 text-amber-200" },
  { key: "unterwegs", label: "Unterwegs", color: "bg-emerald-600/30 text-emerald-200" },
  { key: "abgeschlossen", label: "Abgeschlossen", color: "bg-zinc-800 text-zinc-400" },
];

const stageOf = (k: string) => dispatchStages.find(s => s.key === k) || dispatchStages[0];

const AdminDispatch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [day, setDay] = useState<Date>(startOfDay(new Date()));
  const [horizonDays, setHorizonDays] = useState(7);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<BookingRow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, [day, horizonDays]);

  const load = async () => {
    setIsLoading(true);
    try {
      const from = day.toISOString();
      const to = addDays(day, horizonDays).toISOString();
      const [b, bs, dr] = await Promise.all([
        supabase.from("admin_bookings")
          .select("id,booking_number,booking_type,customer_name,pickup_location,destination_location,departure_at,passenger_count,vehicle_class,assigned_bus,assigned_driver,booking_status,dispatch_status,pretrip_checklist,internal_notes")
          .gte("departure_at", from).lt("departure_at", to)
          .order("departure_at", { ascending: true }),
        supabase.from("buses").select("id,name,license_plate,total_seats").eq("is_active", true).order("name"),
        supabase.from("user_roles").select("user_id").eq("role", "driver"),
      ]);
      setBookings((b.data || []) as BookingRow[]);
      setBuses((bs.data || []) as BusRow[]);
      const ids = (dr.data || []).map((x: any) => x.user_id);
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles").select("user_id,first_name,last_name,email").in("user_id", ids);
        setDrivers((profs || []) as DriverRow[]);
      } else {
        setDrivers([]);
      }
    } catch (e) {
      console.error(e);
    } finally { setIsLoading(false); }
  };

  const driverName = (id: string | null) => {
    if (!id) return null;
    const d = drivers.find(x => x.user_id === id || x.email === id);
    if (d) return [d.first_name, d.last_name].filter(Boolean).join(" ") || d.email;
    return id;
  };

  // Group by day
  const grouped = useMemo(() => {
    const m = new Map<string, BookingRow[]>();
    bookings.forEach(b => {
      const key = format(new Date(b.departure_at), "yyyy-MM-dd");
      const arr = m.get(key) || []; arr.push(b); m.set(key, arr);
    });
    return Array.from(m.entries()).sort(([a],[b]) => a.localeCompare(b));
  }, [bookings]);

  const conflicts = useMemo(() => {
    const set = new Set<string>();
    const byBus = new Map<string, BookingRow[]>();
    const byDrv = new Map<string, BookingRow[]>();
    bookings.forEach(b => {
      if (b.assigned_bus) {
        const arr = byBus.get(b.assigned_bus) || []; arr.push(b); byBus.set(b.assigned_bus, arr);
      }
      if (b.assigned_driver) {
        const arr = byDrv.get(b.assigned_driver) || []; arr.push(b); byDrv.set(b.assigned_driver, arr);
      }
    });
    [byBus, byDrv].forEach(map => {
      map.forEach(arr => {
        if (arr.length < 2) return;
        arr.sort((x,y) => x.departure_at.localeCompare(y.departure_at));
        for (let i = 1; i < arr.length; i++) {
          const a = new Date(arr[i-1].departure_at).getTime();
          const c = new Date(arr[i].departure_at).getTime();
          if (Math.abs(c - a) < 8 * 3600 * 1000) {
            set.add(arr[i-1].id); set.add(arr[i].id);
          }
        }
      });
    });
    return set;
  }, [bookings]);

  const updateBooking = async (id: string, patch: Partial<BookingRow>) => {
    setSaving(true);
    const { error } = await supabase.from("admin_bookings").update(patch as never).eq("id", id);
    setSaving(false);
    if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); return false; }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...patch } as BookingRow : b));
    setSelected(prev => prev && prev.id === id ? { ...prev, ...patch } as BookingRow : prev);
    return true;
  };

  const assignBus = async (b: BookingRow, busId: string) => {
    const bus = buses.find(x => x.id === busId);
    await updateBooking(b.id, {
      assigned_bus: bus ? `${bus.name} · ${bus.license_plate}` : null,
      dispatch_status: b.assigned_driver ? "bereit" : "geplant",
    });
  };

  const assignDriver = async (b: BookingRow, drvId: string) => {
    const d = drivers.find(x => x.user_id === drvId);
    const label = d ? ([d.first_name, d.last_name].filter(Boolean).join(" ") || d.email) : drvId;
    await updateBooking(b.id, {
      assigned_driver: label,
      dispatch_status: b.assigned_bus ? "bereit" : "geplant",
    });
  };

  const toggleChecklistItem = async (key: string) => {
    if (!selected) return;
    const list = (selected.pretrip_checklist && selected.pretrip_checklist.length ? selected.pretrip_checklist : DEFAULT_CHECKLIST);
    const next = list.map(i => i.key === key ? { ...i, done: !i.done } : i);
    await updateBooking(selected.id, { pretrip_checklist: next });
  };

  const setDispatchStatus = async (b: BookingRow, status: string) => {
    await updateBooking(b.id, { dispatch_status: status });
  };

  // KPIs
  const todayBookings = bookings.filter(b => format(new Date(b.departure_at), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
  const unassigned = bookings.filter(b => !b.assigned_bus || !b.assigned_driver).length;
  const readyToday = todayBookings.filter(b => b.dispatch_status === "bereit" || b.dispatch_status === "unterwegs").length;
  const enRoute = bookings.filter(b => b.dispatch_status === "unterwegs").length;

  return (
    <AdminLayout
      title="Disposition — Fahrtenplanung"
      subtitle="Buchungen mit Fahrzeug und Fahrer disponieren"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300" onClick={() => setDay(addDays(day, -1))}><ChevronLeft className="w-4 h-4" /></Button>
          <div className="text-sm text-white font-medium px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-md min-w-[180px] text-center">
            {format(day, "EEEE, d. MMM yyyy", { locale: de })}
          </div>
          <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300" onClick={() => setDay(addDays(day, 1))}><ChevronRight className="w-4 h-4" /></Button>
          <Select value={String(horizonDays)} onValueChange={v => setHorizonDays(Number(v))}>
            <SelectTrigger className="w-32 bg-zinc-900 border-zinc-700 text-zinc-300"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Nur heute</SelectItem>
              <SelectItem value="3">3 Tage</SelectItem>
              <SelectItem value="7">7 Tage</SelectItem>
              <SelectItem value="14">14 Tage</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading} className="border-zinc-700 text-zinc-300">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Fahrten am Tag", value: todayBookings.length, accent: "text-white", icon: Calendar },
          { label: "Nicht disponiert", value: unassigned, accent: "text-amber-400", icon: AlertTriangle },
          { label: "Heute bereit", value: readyToday, accent: "text-emerald-400", icon: CheckCircle2 },
          { label: "Unterwegs", value: enRoute, accent: "text-blue-400", icon: Bus },
        ].map((k, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-4 pb-3 flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${k.accent}`}>{k.value}</div>
                <div className="text-xs text-zinc-500">{k.label}</div>
              </div>
              <k.icon className="w-6 h-6 text-zinc-700" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resource pool */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 mb-2">
              <Bus className="w-3.5 h-3.5" /> Verfügbare Fahrzeuge ({buses.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {buses.map(b => (
                <Badge key={b.id} variant="outline" className="border-zinc-700 text-zinc-300 bg-zinc-800/40 font-normal">
                  {b.name} · {b.license_plate} · {b.total_seats} Sitze
                </Badge>
              ))}
              {!buses.length && <span className="text-xs text-zinc-500">Keine Fahrzeuge gepflegt</span>}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 mb-2">
              <User className="w-3.5 h-3.5" /> Fahrer im Pool ({drivers.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {drivers.map(d => (
                <Badge key={d.user_id} variant="outline" className="border-zinc-700 text-zinc-300 bg-zinc-800/40 font-normal">
                  {[d.first_name, d.last_name].filter(Boolean).join(" ") || d.email}
                </Badge>
              ))}
              {!drivers.length && <span className="text-xs text-zinc-500">Noch keine Fahrer mit Rolle „driver" hinterlegt</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Day groups */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400" />
        </div>
      ) : !grouped.length ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center text-zinc-500">
            Im gewählten Zeitraum keine Fahrten gefunden.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dayKey, rows]) => (
            <div key={dayKey}>
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
                  {format(new Date(dayKey + "T00:00:00"), "EEEE, d. MMMM", { locale: de })}
                </h2>
                <span className="text-xs text-zinc-500">{rows.length} Fahrt{rows.length === 1 ? "" : "en"}</span>
              </div>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-0 divide-y divide-zinc-800">
                  {rows.map(b => {
                    const stage = stageOf(b.dispatch_status);
                    const isConflict = conflicts.has(b.id);
                    const checklist = b.pretrip_checklist && b.pretrip_checklist.length ? b.pretrip_checklist : DEFAULT_CHECKLIST;
                    const done = checklist.filter(c => c.done).length;
                    return (
                      <div key={b.id} className={`px-4 py-3 grid grid-cols-12 gap-3 items-center hover:bg-zinc-800/30 ${isConflict ? "bg-red-950/30" : ""}`}>
                        <div className="col-span-12 md:col-span-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-zinc-500">{b.booking_number}</span>
                            <Badge className="text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700">{b.booking_type}</Badge>
                            {isConflict && (
                              <span className="text-[10px] text-red-300 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Konflikt</span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-white mt-0.5">{b.customer_name}</div>
                          <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {b.pickup_location || "—"} → {b.destination_location || "—"}
                          </div>
                        </div>

                        <div className="col-span-6 md:col-span-2 text-xs text-zinc-300">
                          <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-zinc-500" /> {format(new Date(b.departure_at), "HH:mm")} Uhr</div>
                          <div className="flex items-center gap-1 mt-0.5"><Users className="w-3 h-3 text-zinc-500" /> {b.passenger_count ?? "—"} Pax</div>
                        </div>

                        <div className="col-span-6 md:col-span-2">
                          <Select value={buses.find(x => `${x.name} · ${x.license_plate}` === b.assigned_bus)?.id || ""} onValueChange={(v) => assignBus(b, v)}>
                            <SelectTrigger className="h-8 bg-zinc-950 border-zinc-700 text-xs text-zinc-200">
                              <SelectValue placeholder="Bus zuweisen…" />
                            </SelectTrigger>
                            <SelectContent>
                              {buses.map(x => (
                                <SelectItem key={x.id} value={x.id}>{x.name} · {x.license_plate}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-6 md:col-span-2">
                          <Select value={drivers.find(d => ([d.first_name,d.last_name].filter(Boolean).join(" ") || d.email) === b.assigned_driver)?.user_id || ""} onValueChange={(v) => assignDriver(b, v)}>
                            <SelectTrigger className="h-8 bg-zinc-950 border-zinc-700 text-xs text-zinc-200">
                              <SelectValue placeholder="Fahrer zuweisen…" />
                            </SelectTrigger>
                            <SelectContent>
                              {drivers.map(d => (
                                <SelectItem key={d.user_id} value={d.user_id}>{[d.first_name,d.last_name].filter(Boolean).join(" ") || d.email}</SelectItem>
                              ))}
                              {!drivers.length && <div className="px-2 py-1 text-xs text-zinc-500">Keine Fahrer</div>}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-4 md:col-span-2">
                          <Select value={b.dispatch_status} onValueChange={(v) => setDispatchStatus(b, v)}>
                            <SelectTrigger className={`h-8 text-xs border-zinc-700 ${stage.color}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {dispatchStages.map(s => (
                                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-8 md:col-span-1 flex items-center justify-end gap-2">
                          <button onClick={() => setSelected(b)} className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {done}/{checklist.length}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Pre-Trip Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="bg-zinc-950 border-zinc-800 text-white w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white">
                  Pre-Trip Checkliste · <span className="font-mono text-zinc-400 text-sm">{selected.booking_number}</span>
                </SheetTitle>
                <div className="text-xs text-zinc-400">
                  {selected.customer_name} · {format(new Date(selected.departure_at), "dd.MM.yyyy HH:mm")} Uhr
                </div>
              </SheetHeader>

              <div className="mt-4 space-y-1.5">
                {((selected.pretrip_checklist && selected.pretrip_checklist.length) ? selected.pretrip_checklist : DEFAULT_CHECKLIST).map(item => (
                  <button
                    key={item.key}
                    onClick={() => toggleChecklistItem(item.key)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm border transition-colors ${
                      item.done ? "bg-emerald-900/30 border-emerald-700/40 text-emerald-200" : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800/60"
                    }`}
                  >
                    {item.done ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-zinc-600" />}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                <div className="text-xs uppercase tracking-wide text-zinc-500">Interne Notiz</div>
                <Textarea
                  defaultValue={selected.internal_notes || ""}
                  onBlur={(e) => updateBooking(selected.id, { internal_notes: e.target.value })}
                  placeholder="z.B. Treffpunkt 15 Min früher, Rampe für Rollstuhl…"
                  className="bg-zinc-900 border-zinc-800 text-white min-h-[100px]"
                />
              </div>

              <div className="mt-5 flex gap-2">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 flex-1" disabled={saving} onClick={() => setDispatchStatus(selected, "bereit")}>
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Als bereit markieren
                </Button>
                <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300" onClick={() => navigate(`/admin/bus-bookings?focus=${selected.id}`)}>
                  Buchung öffnen
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
};

export default AdminDispatch;
