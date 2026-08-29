import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Loader2, ArrowLeft, Plus, Trash2, Copy, MapPin, Users, CalendarClock,
  Radio, Play, Square, Ticket, ExternalLink, Bus, UserCog,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import WalletPassButton from "@/components/bookings/WalletPassButton";
import { STOP_TYPE_LABELS, TRIP_CATEGORY_LABELS, CHARTER_SOURCE_TYPES } from "@/lib/charterTrips";

export default function AdminCharterTripDetail() {
  const { tripId } = useParams<{ tripId: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<any>(null);
  const [registry, setRegistry] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [position, setPosition] = useState<any>(null);

  const [newStop, setNewStop] = useState({ label: "", location: "", stop_type: "stop", planned_arrival: "", planned_departure: "", notes: "" });
  const [newShift, setNewShift] = useState({ user_id: "", role: "driver", shift_start: "", shift_end: "" });
  const [pax, setPax] = useState({ first_name: "", last_name: "", email: "", phone: "", seat_id: "" });
  const [bulk, setBulk] = useState("");
  const [busy, setBusy] = useState(false);
  const [seats, setSeats] = useState<any[]>([]);
  const [sendConfirmation, setSendConfirmation] = useState(true);


  const load = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    const { data: t } = await supabase
      .from("trips")
      .select("*, routes(*), buses(*)")
      .eq("id", tripId)
      .maybeSingle();
    setTrip(t);

    const [reg, sch, sh, bk, pos] = await Promise.all([
      supabase.from("trip_registry").select("*").eq("source_id", tripId).in("source_type", CHARTER_SOURCE_TYPES).maybeSingle(),
      supabase.from("trip_schedule_stops").select("*").eq("trip_id", tripId).order("sort_order"),
      supabase.from("employee_shifts").select("*").eq("assigned_trip_id", tripId).order("shift_start"),
      supabase.from("bookings").select("*, seats(seat_number)").eq("trip_id", tripId).order("created_at"),
      supabase.from("bus_positions_live").select("*").eq("trip_id", tripId).maybeSingle(),
    ]);
    setRegistry(reg.data);
    setSchedule(sch.data || []);
    setShifts(sh.data || []);
    setBookings(bk.data || []);
    setPosition(pos.data);

    const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("role", ["driver", "office", "admin"]);
    const ids = Array.from(new Set((roles || []).map((r: any) => r.user_id)));
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name, email").in("user_id", ids);
      setStaff(profiles || []);
    }
    setLoading(false);
  }, [tripId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!tripId) return;
    const ch = supabase.channel(`charter-${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bus_positions_live", filter: `trip_id=eq.${tripId}` }, (p: any) => setPosition(p.new))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "trips", filter: `id=eq.${tripId}` }, (p: any) => setTrip((t: any) => ({ ...t, ...p.new })))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tripId]);

  const staffName = (id: string) => {
    const p = staff.find(s => s.user_id === id);
    return p ? (`${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email) : id?.slice(0, 8);
  };

  const trackingUrl = registry?.trip_uid ? `${window.location.origin}/verfolge/${registry.trip_uid}` : null;

  const setStatus = async (status: string) => {
    const patch: any = { status };
    if (status === "running") patch.started_at = new Date().toISOString();
    if (status === "completed") patch.ended_at = new Date().toISOString();
    const { error } = await supabase.from("trips").update(patch).eq("id", tripId!);
    if (error) toast({ title: "Fehler", description: error.message, variant: "destructive" });
    else { toast({ title: status === "running" ? "Fahrt gestartet" : "Fahrt beendet" }); load(); }
  };

  const addStop = async () => {
    if (!newStop.label.trim()) return;
    const { error } = await supabase.from("trip_schedule_stops").insert({
      trip_id: tripId!,
      label: newStop.label.trim(),
      location: newStop.location || null,
      stop_type: newStop.stop_type,
      planned_arrival: newStop.planned_arrival ? new Date(newStop.planned_arrival).toISOString() : null,
      planned_departure: newStop.planned_departure ? new Date(newStop.planned_departure).toISOString() : null,
      notes: newStop.notes || null,
      sort_order: schedule.length,
    } as any);
    if (error) toast({ title: "Fehler", description: error.message, variant: "destructive" });
    else { setNewStop({ label: "", location: "", stop_type: "stop", planned_arrival: "", planned_departure: "", notes: "" }); load(); }
  };

  const delStop = async (id: string) => {
    await supabase.from("trip_schedule_stops").delete().eq("id", id);
    load();
  };

  const addShift = async () => {
    if (!newShift.user_id || !newShift.shift_start) {
      toast({ title: "Mitarbeiter und Beginn wählen", variant: "destructive" });
      return;
    }
    const start = new Date(newShift.shift_start);
    const { error } = await supabase.from("employee_shifts").insert({
      user_id: newShift.user_id,
      role: newShift.role,
      shift_date: format(start, "yyyy-MM-dd"),
      shift_start: start.toISOString(),
      shift_end: newShift.shift_end ? new Date(newShift.shift_end).toISOString() : null,
      assigned_trip_id: tripId!,
      assigned_bus_id: trip?.bus_id || null,
      status: "scheduled",
      notes: trip?.title || null,
    } as any);
    if (error) toast({ title: "Fehler", description: error.message, variant: "destructive" });
    else { setNewShift({ user_id: "", role: "driver", shift_start: "", shift_end: "" }); toast({ title: "Einsatz geplant" }); load(); }
  };

  const delShift = async (id: string) => {
    await supabase.from("employee_shifts").delete().eq("id", id);
    load();
  };

  const createPassengers = async (list: any[]) => {
    setBusy(true);
    const { error } = await supabase.rpc("create_charter_passengers", { p_trip_id: tripId!, p_passengers: list as any });
    setBusy(false);
    if (error) toast({ title: "Fehler", description: error.message, variant: "destructive" });
    else { toast({ title: `${list.length} Fahrgast/Fahrgäste angelegt` }); load(); }
  };

  const addSingle = () => {
    if (!pax.first_name.trim()) { toast({ title: "Vorname erforderlich", variant: "destructive" }); return; }
    createPassengers([pax]).then(() => setPax({ first_name: "", last_name: "", email: "", phone: "" }));
  };

  const addBulk = () => {
    const lines = bulk.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const list = lines.map(l => {
      const [first, last, email, phone] = l.split(/[;,\t]/).map(x => (x || "").trim());
      return { first_name: first || "Fahrgast", last_name: last || "", email: email || "", phone: phone || "" };
    });
    createPassengers(list).then(() => setBulk(""));
  };

  if (loading) {
    return <AdminLayout title="Fahrt"><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div></AdminLayout>;
  }
  if (!trip) {
    return <AdminLayout title="Fahrt"><p className="text-zinc-400">Fahrt nicht gefunden.</p></AdminLayout>;
  }

  return (
    <AdminLayout title={trip.title || trip.routes?.name} subtitle={`${TRIP_CATEGORY_LABELS[trip.trip_category] || trip.trip_category} · ${format(new Date(trip.departure_date), "dd.MM.yyyy", { locale: de })} · ${trip.departure_time?.slice(0, 5)} Uhr`}>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Link to="/admin/fahrten"><Button variant="ghost" size="sm" className="text-zinc-400"><ArrowLeft className="w-4 h-4 mr-1" />Alle Fahrten</Button></Link>
        <Badge className={trip.status === "running" ? "bg-emerald-600" : trip.status === "completed" ? "bg-zinc-600" : "bg-blue-600"}>
          {trip.status === "running" ? "Unterwegs" : trip.status === "completed" ? "Beendet" : "Geplant"}
        </Badge>
        {registry?.trip_uid && (
          <button
            onClick={() => { navigator.clipboard.writeText(trackingUrl!); toast({ title: "Tracking-Link kopiert" }); }}
            className="flex items-center gap-1 font-mono text-xs px-2 py-1 rounded bg-zinc-800 text-emerald-300 hover:bg-zinc-700"
          >
            {registry.trip_uid} <Copy className="w-3 h-3" />
          </button>
        )}
        <div className="ml-auto flex gap-2">
          {trip.status !== "running" ? (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setStatus("running")}><Play className="w-4 h-4 mr-1" />Fahrt starten</Button>
          ) : (
            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => setStatus("completed")}><Square className="w-4 h-4 mr-1" />Fahrt beenden</Button>
          )}
          {trackingUrl && (
            <a href={trackingUrl} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="border-zinc-700"><ExternalLink className="w-4 h-4 mr-1" />Tracking</Button>
            </a>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-3 mb-4">
        {[
          { icon: MapPin, label: "Strecke", value: trip.routes?.description || trip.routes?.name },
          { icon: Bus, label: "Fahrzeug", value: trip.buses ? `${trip.buses.name} · ${trip.buses.license_plate}` : "—" },
          { icon: Users, label: "Fahrgäste", value: `${bookings.filter(b => b.status !== "cancelled").length}${trip.seat_capacity ? ` / ${trip.seat_capacity}` : ""}` },
          { icon: UserCog, label: "Personal", value: `${shifts.length} eingeteilt` },
        ].map(s => (
          <Card key={s.label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-xs uppercase text-zinc-500"><s.icon className="w-3 h-3" />{s.label}</div>
              <div className="text-sm text-white mt-1 font-medium truncate">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {trip.internal_notes && (
        <Card className="bg-zinc-900 border-zinc-800 mb-4">
          <CardContent className="py-3 text-sm text-zinc-300"><span className="text-zinc-500">Interne Notiz: </span>{trip.internal_notes}</CardContent>
        </Card>
      )}

      <Tabs defaultValue="schedule">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="schedule"><CalendarClock className="w-4 h-4 mr-1" />Fahrplan ({schedule.length})</TabsTrigger>
          <TabsTrigger value="staff"><UserCog className="w-4 h-4 mr-1" />Dienstplan ({shifts.length})</TabsTrigger>
          <TabsTrigger value="pax"><Ticket className="w-4 h-4 mr-1" />Fahrgäste ({bookings.length})</TabsTrigger>
          <TabsTrigger value="live"><Radio className="w-4 h-4 mr-1" />Live-Tracking</TabsTrigger>
        </TabsList>

        {/* Fahrplan */}
        <TabsContent value="schedule" className="mt-4 space-y-3">
          {schedule.map(s => (
            <Card key={s.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-3 flex flex-wrap items-center gap-3">
                <Badge className="bg-zinc-700">{STOP_TYPE_LABELS[s.stop_type] || s.stop_type}</Badge>
                <div className="font-medium text-white">{s.label}</div>
                <div className="text-xs text-zinc-400">
                  {s.planned_arrival && <>an {format(new Date(s.planned_arrival), "dd.MM. HH:mm")}</>}
                  {s.planned_arrival && s.planned_departure && " · "}
                  {s.planned_departure && <>ab {format(new Date(s.planned_departure), "dd.MM. HH:mm")}</>}
                </div>
                {s.notes && <span className="text-xs text-zinc-500">{s.notes}</span>}
                <Button size="sm" variant="ghost" className="ml-auto text-zinc-500 hover:text-red-400" onClick={() => delStop(s.id)}><Trash2 className="w-4 h-4" /></Button>
              </CardContent>
            </Card>
          ))}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-white">Haltepunkt hinzufügen</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-6 gap-2 items-end">
              <div className="md:col-span-2">
                <Label className="text-zinc-400 text-xs">Bezeichnung</Label>
                <Input value={newStop.label} onChange={e => setNewStop(s => ({ ...s, label: e.target.value }))} className="bg-zinc-950 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Art</Label>
                <Select value={newStop.stop_type} onValueChange={v => setNewStop(s => ({ ...s, stop_type: v }))}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {Object.entries(STOP_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Ankunft</Label>
                <Input type="datetime-local" value={newStop.planned_arrival} onChange={e => setNewStop(s => ({ ...s, planned_arrival: e.target.value }))} className="bg-zinc-950 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Abfahrt</Label>
                <Input type="datetime-local" value={newStop.planned_departure} onChange={e => setNewStop(s => ({ ...s, planned_departure: e.target.value }))} className="bg-zinc-950 border-zinc-700 text-white mt-1" />
              </div>
              <Button onClick={addStop} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-1" />Hinzufügen</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dienstplan */}
        <TabsContent value="staff" className="mt-4 space-y-3">
          {shifts.map(s => (
            <Card key={s.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-3 flex flex-wrap items-center gap-3">
                <div className="font-medium text-white">{staffName(s.user_id)}</div>
                <Badge className="bg-zinc-700 capitalize">{s.role}</Badge>
                <span className="text-xs text-zinc-400">
                  {format(new Date(s.shift_start), "dd.MM. HH:mm", { locale: de })}
                  {s.shift_end && ` – ${format(new Date(s.shift_end), "dd.MM. HH:mm", { locale: de })}`}
                </span>
                <Badge variant="outline" className="border-zinc-700 text-zinc-300">{s.status}</Badge>
                <Button size="sm" variant="ghost" className="ml-auto text-zinc-500 hover:text-red-400" onClick={() => delShift(s.id)}><Trash2 className="w-4 h-4" /></Button>
              </CardContent>
            </Card>
          ))}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-white">Mitarbeiter einteilen</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-5 gap-2 items-end">
              <div>
                <Label className="text-zinc-400 text-xs">Mitarbeiter</Label>
                <Select value={newShift.user_id} onValueChange={v => setNewShift(s => ({ ...s, user_id: v }))}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white mt-1"><SelectValue placeholder="Wählen…" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {staff.map(p => <SelectItem key={p.user_id} value={p.user_id}>{staffName(p.user_id)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Funktion</Label>
                <Select value={newShift.role} onValueChange={v => setNewShift(s => ({ ...s, role: v }))}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="driver">Fahrer</SelectItem>
                    <SelectItem value="second_driver">Beifahrer</SelectItem>
                    <SelectItem value="guide">Reiseleiter</SelectItem>
                    <SelectItem value="office">Büro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Beginn</Label>
                <Input type="datetime-local" value={newShift.shift_start} onChange={e => setNewShift(s => ({ ...s, shift_start: e.target.value }))} className="bg-zinc-950 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Ende</Label>
                <Input type="datetime-local" value={newShift.shift_end} onChange={e => setNewShift(s => ({ ...s, shift_end: e.target.value }))} className="bg-zinc-950 border-zinc-700 text-white mt-1" />
              </div>
              <Button onClick={addShift} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-1" />Einteilen</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fahrgäste */}
        <TabsContent value="pax" className="mt-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-white">Einzelnen Fahrgast anlegen</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Vorname" value={pax.first_name} onChange={e => setPax(p => ({ ...p, first_name: e.target.value }))} className="bg-zinc-950 border-zinc-700 text-white" />
                  <Input placeholder="Nachname" value={pax.last_name} onChange={e => setPax(p => ({ ...p, last_name: e.target.value }))} className="bg-zinc-950 border-zinc-700 text-white" />
                  <Input placeholder="E-Mail" value={pax.email} onChange={e => setPax(p => ({ ...p, email: e.target.value }))} className="bg-zinc-950 border-zinc-700 text-white" />
                  <Input placeholder="Telefon" value={pax.phone} onChange={e => setPax(p => ({ ...p, phone: e.target.value }))} className="bg-zinc-950 border-zinc-700 text-white" />
                </div>
                <Button onClick={addSingle} disabled={busy} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" />Ticket erzeugen</>}
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-white">Mehrere Fahrgäste (eine Zeile pro Person)</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  rows={5}
                  value={bulk}
                  onChange={e => setBulk(e.target.value)}
                  placeholder={"Max;Mustermann;max@example.de;+49170...\nAnna;Schmidt;anna@example.de"}
                  className="bg-zinc-950 border-zinc-700 text-white font-mono text-xs"
                />
                <Button onClick={addBulk} disabled={busy} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Users className="w-4 h-4 mr-1" />Gruppe anlegen</>}
                </Button>
              </CardContent>
            </Card>
          </div>

          {bookings.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">Noch keine Fahrgäste.</p>
          ) : (
            <div className="grid gap-2">
              {bookings.map(b => (
                <Card key={b.id} className="bg-zinc-900 border-zinc-800">
                  <CardContent className="py-3 flex flex-wrap items-center gap-3">
                    <div className="font-medium text-white">{b.passenger_first_name} {b.passenger_last_name}</div>
                    <Badge className="bg-zinc-700">Platz {b.seats?.seat_number || "—"}</Badge>
                    <span className="font-mono text-xs text-emerald-300">{b.ticket_number}</span>
                    <span className="font-mono text-xs text-zinc-500">{b.booking_number}</span>
                    <span className="text-xs text-zinc-400">{b.passenger_email}</span>
                    <div className="ml-auto flex items-center gap-2">
                      {trackingUrl && (
                        <a href={trackingUrl} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost" className="text-zinc-400"><Radio className="w-3 h-3 mr-1" />Tracking</Button>
                        </a>
                      )}
                      <WalletPassButton bookingId={b.id} ticketNumber={b.ticket_number} customerEmail={b.passenger_email} size="sm" variant="outline" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Live */}
        <TabsContent value="live" className="mt-4 space-y-3">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-zinc-300">
                <Radio className={`w-4 h-4 ${position ? "text-emerald-400 animate-pulse" : "text-zinc-600"}`} />
                {position ? "GPS-Signal aktiv" : "Noch kein GPS-Signal – der Fahrer startet die Fahrt in der Fahrer-App."}
              </div>
              {position && (
                <div className="text-xs text-zinc-400 space-y-1">
                  <div>Position: {Number(position.lat).toFixed(5)}, {Number(position.lng).toFixed(5)}</div>
                  {position.speed_kmh != null && <div>Geschwindigkeit: {Math.round(position.speed_kmh)} km/h</div>}
                  {position.updated_at && <div>Letztes Update: {format(new Date(position.updated_at), "dd.MM.yyyy HH:mm:ss", { locale: de })}</div>}
                </div>
              )}
              {trackingUrl && (
                <div className="pt-2">
                  <Label className="text-zinc-400 text-xs">Sicherer Fahrgast-Link</Label>
                  <div className="flex gap-2 mt-1">
                    <Input readOnly value={trackingUrl} className="bg-zinc-950 border-zinc-700 text-white font-mono text-xs" />
                    <Button variant="outline" className="border-zinc-700" onClick={() => { navigator.clipboard.writeText(trackingUrl); toast({ title: "Link kopiert" }); }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
