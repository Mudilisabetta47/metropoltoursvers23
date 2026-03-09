import { useState, useEffect, useMemo } from "react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  Plus, Loader2, ChevronLeft, ChevronRight, Calendar, Clock,
  Bus, User, Trash2, Copy, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

interface Shift {
  id: string;
  user_id: string;
  shift_date: string;
  shift_start: string;
  shift_end: string | null;
  role: string;
  status: string;
  notes: string | null;
  assigned_bus_id: string | null;
  assigned_trip_id: string | null;
  actual_start: string | null;
  actual_end: string | null;
}

interface Employee {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  roles: string[];
}

interface BusOption {
  id: string;
  name: string;
  license_plate: string;
}

const SHIFT_ROLES = [
  { value: "driver", label: "Fahrer", color: "bg-amber-600" },
  { value: "guide", label: "Reiseleiter", color: "bg-blue-600" },
  { value: "office", label: "Büro", color: "bg-purple-600" },
  { value: "support", label: "Support", color: "bg-teal-600" },
];

const SHIFT_STATUSES = [
  { value: "scheduled", label: "Geplant", color: "bg-zinc-600" },
  { value: "confirmed", label: "Bestätigt", color: "bg-emerald-600" },
  { value: "in_progress", label: "Im Dienst", color: "bg-blue-600" },
  { value: "completed", label: "Abgeschlossen", color: "bg-green-600" },
  { value: "cancelled", label: "Abgesagt", color: "bg-red-600" },
];

const AdminShifts = () => {
  const { toast } = useToast();
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [buses, setBuses] = useState<BusOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [form, setForm] = useState({
    user_id: "",
    shift_date: "",
    shift_start: "06:00",
    shift_end: "18:00",
    role: "driver",
    status: "scheduled",
    notes: "",
    assigned_bus_id: "",
  });

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i)),
    [currentWeek]
  );

  const weekEnd = addDays(currentWeek, 6);

  useEffect(() => {
    loadData();
  }, [currentWeek]);

  const loadData = async () => {
    setIsLoading(true);
    const startStr = format(currentWeek, "yyyy-MM-dd");
    const endStr = format(weekEnd, "yyyy-MM-dd");

    const [shiftsRes, rolesRes, busesRes] = await Promise.all([
      supabase
        .from("employee_shifts")
        .select("*")
        .gte("shift_date", startStr)
        .lte("shift_date", endStr)
        .order("shift_start", { ascending: true }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("buses").select("id, name, license_plate").eq("is_active", true),
    ]);

    // Build employee list from non-customer roles
    const userRoles: Record<string, string[]> = {};
    (rolesRes.data || []).forEach((r: any) => {
      if (r.role === "customer") return;
      if (!userRoles[r.user_id]) userRoles[r.user_id] = [];
      userRoles[r.user_id].push(r.role);
    });

    const userIds = Object.keys(userRoles);
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, first_name, last_name")
        .in("user_id", userIds);

      setEmployees((profiles || []).map((p: any) => ({
        user_id: p.user_id,
        email: p.email,
        first_name: p.first_name,
        last_name: p.last_name,
        roles: userRoles[p.user_id] || [],
      })));
    }

    setShifts((shiftsRes.data as Shift[]) || []);
    setBuses((busesRes.data as BusOption[]) || []);
    setIsLoading(false);
  };

  const openNew = (date?: Date) => {
    setEditingShift(null);
    setForm({
      user_id: "",
      shift_date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      shift_start: "06:00",
      shift_end: "18:00",
      role: "driver",
      status: "scheduled",
      notes: "",
      assigned_bus_id: "",
    });
    setEditModal(true);
  };

  const openEdit = (shift: Shift) => {
    setEditingShift(shift);
    const startTime = shift.shift_start ? format(new Date(shift.shift_start), "HH:mm") : "06:00";
    const endTime = shift.shift_end ? format(new Date(shift.shift_end), "HH:mm") : "18:00";
    setForm({
      user_id: shift.user_id,
      shift_date: shift.shift_date,
      shift_start: startTime,
      shift_end: endTime,
      role: shift.role,
      status: shift.status,
      notes: shift.notes || "",
      assigned_bus_id: shift.assigned_bus_id || "",
    });
    setEditModal(true);
  };

  const saveShift = async () => {
    if (!form.user_id || !form.shift_date) {
      toast({ title: "Bitte Mitarbeiter und Datum wählen", variant: "destructive" });
      return;
    }

    const shiftStartDt = `${form.shift_date}T${form.shift_start}:00`;
    const shiftEndDt = form.shift_end ? `${form.shift_date}T${form.shift_end}:00` : null;

    const payload = {
      user_id: form.user_id,
      shift_date: form.shift_date,
      shift_start: shiftStartDt,
      shift_end: shiftEndDt,
      role: form.role,
      status: form.status,
      notes: form.notes || null,
      assigned_bus_id: form.assigned_bus_id || null,
    };

    let error;
    if (editingShift) {
      ({ error } = await supabase.from("employee_shifts").update(payload).eq("id", editingShift.id));
    } else {
      ({ error } = await supabase.from("employee_shifts").insert(payload));
    }

    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: editingShift ? "Schicht aktualisiert" : "Schicht erstellt" });
    setEditModal(false);
    loadData();
  };

  const deleteShift = async (id: string) => {
    if (!confirm("Schicht wirklich löschen?")) return;
    await supabase.from("employee_shifts").delete().eq("id", id);
    toast({ title: "Schicht gelöscht" });
    loadData();
  };

  const duplicateShift = async (shift: Shift) => {
    const nextDate = format(addDays(parseISO(shift.shift_date), 7), "yyyy-MM-dd");
    const startTime = shift.shift_start ? format(new Date(shift.shift_start), "HH:mm") : "06:00";
    const endTime = shift.shift_end ? format(new Date(shift.shift_end), "HH:mm") : "18:00";

    await supabase.from("employee_shifts").insert({
      user_id: shift.user_id,
      shift_date: nextDate,
      shift_start: `${nextDate}T${startTime}:00`,
      shift_end: `${nextDate}T${endTime}:00`,
      role: shift.role,
      status: "scheduled",
      notes: shift.notes,
      assigned_bus_id: shift.assigned_bus_id,
    });

    toast({ title: "Schicht dupliziert", description: `Kopiert auf ${format(parseISO(nextDate), "dd.MM.yyyy")}` });
    // If duplicated into current week, reload
    if (parseISO(nextDate) >= currentWeek && parseISO(nextDate) <= weekEnd) {
      loadData();
    }
  };

  const getEmployeeName = (userId: string) => {
    const emp = employees.find(e => e.user_id === userId);
    if (!emp) return "Unbekannt";
    if (emp.first_name || emp.last_name) return `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
    return emp.email.split("@")[0];
  };

  const getBusName = (busId: string | null) => {
    if (!busId) return null;
    const bus = buses.find(b => b.id === busId);
    return bus ? `${bus.name} (${bus.license_plate})` : null;
  };

  const getRoleConfig = (role: string) => SHIFT_ROLES.find(r => r.value === role) || SHIFT_ROLES[0];
  const getStatusConfig = (status: string) => SHIFT_STATUSES.find(s => s.value === status) || SHIFT_STATUSES[0];

  const shiftsForDay = (date: Date) =>
    shifts.filter(s => isSameDay(parseISO(s.shift_date), date));

  // Stats
  const totalShifts = shifts.length;
  const uniqueEmployees = new Set(shifts.map(s => s.user_id)).size;
  const driverShifts = shifts.filter(s => s.role === "driver").length;
  const openShifts = shifts.filter(s => s.status === "scheduled").length;

  return (
    <AdminLayout
      title="Dienstpläne"
      subtitle={`KW ${format(currentWeek, "w", { locale: de })} — ${format(currentWeek, "dd.MM.", { locale: de })} bis ${format(weekEnd, "dd.MM.yyyy", { locale: de })}`}
      actions={
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => openNew()}>
          <Plus className="w-3 h-3 mr-1" /> Neue Schicht
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      ) : (
        <div className="space-y-5">
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Schichten", value: totalShifts, icon: Calendar, color: "text-emerald-400" },
              { label: "Mitarbeiter", value: uniqueEmployees, icon: Users, color: "text-blue-400" },
              { label: "Fahrer-Schichten", value: driverShifts, icon: Bus, color: "text-amber-400" },
              { label: "Offen", value: openShifts, icon: Clock, color: "text-zinc-400" },
            ].map(kpi => (
              <Card key={kpi.label} className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                      <div className="text-xs text-zinc-500">{kpi.label}</div>
                    </div>
                    <kpi.icon className={`w-5 h-5 ${kpi.color} opacity-40`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setCurrentWeek(w => subWeeks(w, 1))}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Vorherige Woche
            </Button>
            <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
              Heute
            </Button>
            <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setCurrentWeek(w => addWeeks(w, 1))}>
              Nächste Woche <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Weekly Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => {
              const dayShifts = shiftsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[180px] rounded-lg border p-2 transition-colors ${
                    isToday
                      ? "bg-emerald-950/20 border-emerald-800/50"
                      : "bg-zinc-900/50 border-zinc-800"
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className={`text-xs font-medium ${isToday ? "text-emerald-400" : "text-zinc-500"}`}>
                        {format(day, "EEE", { locale: de })}
                      </div>
                      <div className={`text-lg font-bold ${isToday ? "text-emerald-300" : "text-white"}`}>
                        {format(day, "dd")}
                      </div>
                    </div>
                    <button
                      onClick={() => openNew(day)}
                      className="w-6 h-6 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-emerald-400 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Shifts */}
                  <div className="space-y-1.5">
                    {dayShifts.map(shift => {
                      const roleConf = getRoleConfig(shift.role);
                      
                      const startTime = shift.shift_start ? format(new Date(shift.shift_start), "HH:mm") : "–";
                      const endTime = shift.shift_end ? format(new Date(shift.shift_end), "HH:mm") : "–";
                      const busName = getBusName(shift.assigned_bus_id);

                      return (
                        <div
                          key={shift.id}
                          className="group bg-zinc-800/80 hover:bg-zinc-800 rounded-md p-1.5 cursor-pointer border border-zinc-700/50 hover:border-zinc-600 transition-all"
                          onClick={() => openEdit(shift)}
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${roleConf.color}`} />
                            <span className="text-[11px] font-medium text-white truncate">
                              {getEmployeeName(shift.user_id)}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {startTime}–{endTime}
                          </div>
                          {busName && (
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Bus className="w-2.5 h-2.5" />
                              <span className="truncate">{busName}</span>
                            </div>
                          )}
                          {/* Hover Actions */}
                          <div className="hidden group-hover:flex gap-0.5 mt-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); duplicateShift(shift); }}
                              className="p-0.5 text-zinc-500 hover:text-blue-400"
                              title="Duplizieren (nächste Woche)"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteShift(shift.id); }}
                              className="p-0.5 text-zinc-500 hover:text-red-400"
                              title="Löschen"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {dayShifts.length === 0 && (
                      <div className="text-[10px] text-zinc-600 text-center py-3">Keine Schichten</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Employee Overview for the week */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                <Users className="w-4 h-4" /> Wochenübersicht Mitarbeiter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {employees.filter(e => shifts.some(s => s.user_id === e.user_id)).map(emp => {
                  const empShifts = shifts.filter(s => s.user_id === emp.user_id);
                  const totalHours = empShifts.reduce((sum, s) => {
                    if (!s.shift_start || !s.shift_end) return sum;
                    const diff = (new Date(s.shift_end).getTime() - new Date(s.shift_start).getTime()) / 3600000;
                    return sum + (diff > 0 ? diff : 0);
                  }, 0);

                  return (
                    <div key={emp.user_id} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                        <div>
                          <div className="text-sm text-white font-medium">{getEmployeeName(emp.user_id)}</div>
                          <div className="text-[10px] text-zinc-500">{emp.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-mono text-emerald-400">{totalHours.toFixed(1)}h</div>
                          <div className="text-[10px] text-zinc-500">{empShifts.length} Schicht{empShifts.length !== 1 ? "en" : ""}</div>
                        </div>
                        {/* Day dots */}
                        <div className="flex gap-0.5">
                          {weekDays.map(day => {
                            const hasShift = empShifts.some(s => isSameDay(parseISO(s.shift_date), day));
                            return (
                              <div
                                key={day.toISOString()}
                                className={`w-3 h-3 rounded-sm ${hasShift ? "bg-emerald-600" : "bg-zinc-800"}`}
                                title={format(day, "EEEE dd.MM.", { locale: de })}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {shifts.length === 0 && (
                  <div className="text-center text-zinc-500 py-4 text-sm">Keine Schichten in dieser Woche</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit/Create Modal */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              {editingShift ? "Schicht bearbeiten" : "Neue Schicht"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400">Mitarbeiter</Label>
              <Select value={form.user_id} onValueChange={v => setForm(f => ({ ...f, user_id: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Mitarbeiter wählen..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                  {employees.map(emp => (
                    <SelectItem key={emp.user_id} value={emp.user_id} className="text-white">
                      {emp.first_name || emp.last_name
                        ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
                        : emp.email}
                      {emp.roles.includes("driver") && " 🚌"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400">Datum</Label>
                <Input
                  type="date"
                  value={form.shift_date}
                  onChange={e => setForm(f => ({ ...f, shift_date: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400">Rolle</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {SHIFT_ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value} className="text-white">{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400">Beginn</Label>
                <Input
                  type="time"
                  value={form.shift_start}
                  onChange={e => setForm(f => ({ ...f, shift_start: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400">Ende</Label>
                <Input
                  type="time"
                  value={form.shift_end}
                  onChange={e => setForm(f => ({ ...f, shift_end: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {SHIFT_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value} className="text-white">{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400">Fahrzeug (optional)</Label>
                <Select value={form.assigned_bus_id} onValueChange={v => setForm(f => ({ ...f, assigned_bus_id: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue placeholder="Keins" /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="" className="text-white">– Kein Fahrzeug –</SelectItem>
                    {buses.map(b => (
                      <SelectItem key={b.id} value={b.id} className="text-white">
                        {b.name} ({b.license_plate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-zinc-400">Notizen</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white min-h-[60px]"
                placeholder="z.B. Sonderfahrt nach Zagreb, Vertretung für..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            {editingShift && (
              <Button variant="ghost" className="text-red-400 hover:text-red-300 mr-auto" onClick={() => { deleteShift(editingShift.id); setEditModal(false); }}>
                <Trash2 className="w-3 h-3 mr-1" /> Löschen
              </Button>
            )}
            <Button variant="ghost" onClick={() => setEditModal(false)} className="text-zinc-400">Abbrechen</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={saveShift}>
              {editingShift ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminShifts;
