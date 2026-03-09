import { useState, useEffect, useMemo } from "react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  Plus, Loader2, ChevronLeft, ChevronRight, Calendar, Clock,
  Bus, Trash2, Copy, Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  { value: "driver", label: "Fahrer", short: "F" },
  { value: "guide", label: "Reiseleiter", short: "RL" },
  { value: "office", label: "Büro", short: "B" },
  { value: "support", label: "Support", short: "S" },
];

const SHIFT_STATUSES = [
  { value: "scheduled", label: "Geplant" },
  { value: "confirmed", label: "Bestätigt" },
  { value: "in_progress", label: "Im Dienst" },
  { value: "completed", label: "Abgeschlossen" },
  { value: "cancelled", label: "Abgesagt" },
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

  const openNew = (date?: Date, employeeId?: string) => {
    setEditingShift(null);
    setForm({
      user_id: employeeId || "",
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
    return bus ? bus.name : null;
  };

  const getRoleShort = (role: string) => SHIFT_ROLES.find(r => r.value === role)?.short || "?";

  // Get all employees that have shifts this week + all employees for the table
  const activeEmployeeIds = useMemo(() => {
    const ids = new Set(shifts.map(s => s.user_id));
    return employees.filter(e => ids.has(e.user_id));
  }, [shifts, employees]);

  const handlePrint = () => {
    window.print();
  };

  const kwNumber = format(currentWeek, "w", { locale: de });

  return (
    <AdminLayout
      title="Dienstplan"
      subtitle={`KW ${kwNumber} — ${format(currentWeek, "dd.MM.", { locale: de })} bis ${format(weekEnd, "dd.MM.yyyy", { locale: de })}`}
      actions={
        <div className="flex gap-2 print:hidden">
          <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300" onClick={handlePrint}>
            <Printer className="w-3 h-3 mr-1" /> Drucken
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => openNew()}>
            <Plus className="w-3 h-3 mr-1" /> Neue Schicht
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      ) : (
        <div className="space-y-4">
          {/* Week Navigation — hidden on print */}
          <div className="flex items-center justify-between print:hidden">
            <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setCurrentWeek(w => subWeeks(w, 1))}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Vorherige
            </Button>
            <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
              Aktuelle Woche
            </Button>
            <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setCurrentWeek(w => addWeeks(w, 1))}>
              Nächste <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* ===== PRINT HEADER — only visible on print ===== */}
          <div className="hidden print:block mb-4">
            <div className="text-center border-b-2 border-black pb-3 mb-4">
              <h1 className="text-2xl font-bold text-black">METROPOL TOURS — Dienstplan</h1>
              <p className="text-lg text-black mt-1">
                Kalenderwoche {kwNumber} | {format(currentWeek, "dd.MM.yyyy")} – {format(weekEnd, "dd.MM.yyyy")}
              </p>
              <p className="text-sm text-gray-500 mt-1">Erstellt am {format(new Date(), "dd.MM.yyyy, HH:mm", { locale: de })} Uhr</p>
            </div>
          </div>

          {/* ===== MAIN TABLE — the office-style Dienstplan ===== */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm print:text-xs" id="shift-table">
              {/* Table Header */}
              <thead>
                <tr>
                  <th className="border border-zinc-700 print:border-gray-400 bg-zinc-800 print:bg-gray-100 text-left px-3 py-2 text-zinc-300 print:text-black font-semibold w-44 print:w-32">
                    Mitarbeiter
                  </th>
                  {weekDays.map(day => {
                    const isToday = isSameDay(day, new Date());
                    return (
                      <th
                        key={day.toISOString()}
                        className={`border border-zinc-700 print:border-gray-400 px-2 py-2 text-center font-semibold min-w-[120px] print:min-w-[80px] ${
                          isToday
                            ? "bg-emerald-900/40 print:bg-yellow-50 text-emerald-300 print:text-black"
                            : "bg-zinc-800 print:bg-gray-100 text-zinc-300 print:text-black"
                        }`}
                      >
                        <div className="text-xs uppercase">{format(day, "EEE", { locale: de })}</div>
                        <div className="text-base print:text-sm">{format(day, "dd.MM.")}</div>
                      </th>
                    );
                  })}
                  <th className="border border-zinc-700 print:border-gray-400 bg-zinc-800 print:bg-gray-100 px-2 py-2 text-center text-zinc-300 print:text-black font-semibold w-20">
                    Σ Std.
                  </th>
                </tr>
              </thead>

              {/* Table Body — one row per employee */}
              <tbody>
                {activeEmployeeIds.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="border border-zinc-700 print:border-gray-400 text-center py-8 text-zinc-500 print:text-gray-400">
                      Keine Schichten in dieser Woche. Klicke auf „Neue Schicht" um loszulegen.
                    </td>
                  </tr>
                ) : (
                  activeEmployeeIds.map((emp, empIdx) => {
                    const empShifts = shifts.filter(s => s.user_id === emp.user_id);
                    const totalHours = empShifts.reduce((sum, s) => {
                      if (!s.shift_start || !s.shift_end) return sum;
                      const diff = (new Date(s.shift_end).getTime() - new Date(s.shift_start).getTime()) / 3600000;
                      return sum + (diff > 0 ? diff : 0);
                    }, 0);

                    return (
                      <tr key={emp.user_id} className={empIdx % 2 === 0 ? "bg-zinc-900/50 print:bg-white" : "bg-zinc-900 print:bg-gray-50"}>
                        {/* Employee name cell */}
                        <td className="border border-zinc-700 print:border-gray-400 px-3 py-2 font-medium text-white print:text-black whitespace-nowrap">
                          <div className="flex items-center justify-between">
                            <span>{getEmployeeName(emp.user_id)}</span>
                            <span className="text-[10px] text-zinc-500 print:text-gray-500 ml-1">
                              {emp.roles.filter(r => r !== "customer").map(r => getRoleShort(r === "admin" ? "office" : r)).join("/")}
                            </span>
                          </div>
                        </td>

                        {/* Day cells */}
                        {weekDays.map(day => {
                          const dayShifts = empShifts.filter(s => isSameDay(parseISO(s.shift_date), day));
                          const isToday = isSameDay(day, new Date());

                          return (
                            <td
                              key={day.toISOString()}
                              className={`border border-zinc-700 print:border-gray-400 px-1 py-1 align-top cursor-pointer hover:bg-zinc-800 print:hover:bg-transparent transition-colors ${
                                isToday ? "bg-emerald-950/10 print:bg-yellow-50/50" : ""
                              }`}
                              onClick={() => {
                                if (dayShifts.length === 0) openNew(day, emp.user_id);
                              }}
                            >
                              {dayShifts.length > 0 ? (
                                <div className="space-y-1">
                                  {dayShifts.map(shift => {
                                    const startTime = shift.shift_start ? format(new Date(shift.shift_start), "HH:mm") : "–";
                                    const endTime = shift.shift_end ? format(new Date(shift.shift_end), "HH:mm") : "–";
                                    const busName = getBusName(shift.assigned_bus_id);
                                    const roleShort = getRoleShort(shift.role);
                                    const isCancelled = shift.status === "cancelled";

                                    return (
                                      <div
                                        key={shift.id}
                                        className={`group relative rounded px-1.5 py-1 text-[11px] print:text-[9px] leading-tight cursor-pointer border transition-colors ${
                                          isCancelled
                                            ? "bg-red-950/30 border-red-800/50 print:bg-red-50 print:border-red-300 line-through opacity-60"
                                            : shift.status === "confirmed"
                                            ? "bg-emerald-950/30 border-emerald-800/50 print:bg-green-50 print:border-green-300"
                                            : "bg-zinc-800 border-zinc-700 print:bg-white print:border-gray-300"
                                        }`}
                                        onClick={(e) => { e.stopPropagation(); openEdit(shift); }}
                                      >
                                        {/* Time range */}
                                        <div className="font-mono font-semibold text-white print:text-black">
                                          {startTime}–{endTime}
                                        </div>
                                        {/* Role badge */}
                                        <div className="text-zinc-400 print:text-gray-600">
                                          [{roleShort}]
                                          {busName && <span className="ml-1">🚌 {busName}</span>}
                                        </div>
                                        {/* Notes */}
                                        {shift.notes && (
                                          <div className="text-zinc-500 print:text-gray-500 italic truncate max-w-[100px] print:max-w-none">
                                            {shift.notes}
                                          </div>
                                        )}
                                        {/* Hover actions — hidden on print */}
                                        <div className="hidden group-hover:flex gap-1 absolute -top-2 -right-1 print:hidden">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); duplicateShift(shift); }}
                                            className="w-5 h-5 rounded bg-zinc-700 hover:bg-blue-600 flex items-center justify-center"
                                            title="In nächste Woche kopieren"
                                          >
                                            <Copy className="w-2.5 h-2.5 text-white" />
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); deleteShift(shift.id); }}
                                            className="w-5 h-5 rounded bg-zinc-700 hover:bg-red-600 flex items-center justify-center"
                                            title="Löschen"
                                          >
                                            <Trash2 className="w-2.5 h-2.5 text-white" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-center text-zinc-700 print:text-gray-300 py-2 text-lg print:hidden">
                                  +
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Total hours cell */}
                        <td className="border border-zinc-700 print:border-gray-400 px-2 py-2 text-center font-mono font-bold text-emerald-400 print:text-black">
                          {totalHours.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Summary row */}
                {activeEmployeeIds.length > 0 && (
                  <tr className="bg-zinc-800 print:bg-gray-200 font-semibold">
                    <td className="border border-zinc-700 print:border-gray-400 px-3 py-2 text-zinc-300 print:text-black">
                      Gesamt
                    </td>
                    {weekDays.map(day => {
                      const dayCount = shifts.filter(s => isSameDay(parseISO(s.shift_date), day) && s.status !== "cancelled").length;
                      return (
                        <td key={day.toISOString()} className="border border-zinc-700 print:border-gray-400 px-2 py-2 text-center text-zinc-400 print:text-black">
                          {dayCount > 0 ? `${dayCount} Schicht${dayCount !== 1 ? "en" : ""}` : "–"}
                        </td>
                      );
                    })}
                    <td className="border border-zinc-700 print:border-gray-400 px-2 py-2 text-center font-mono text-emerald-400 print:text-black">
                      {shifts
                        .filter(s => s.status !== "cancelled")
                        .reduce((sum, s) => {
                          if (!s.shift_start || !s.shift_end) return sum;
                          const diff = (new Date(s.shift_end).getTime() - new Date(s.shift_start).getTime()) / 3600000;
                          return sum + (diff > 0 ? diff : 0);
                        }, 0)
                        .toFixed(1)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Legend — visible on both screen and print */}
          <div className="flex flex-wrap gap-4 text-xs text-zinc-500 print:text-gray-600 mt-2 print:mt-4">
            <span className="font-semibold">Legende:</span>
            {SHIFT_ROLES.map(r => (
              <span key={r.value}>[{r.short}] = {r.label}</span>
            ))}
          </div>

          {/* Print footer */}
          <div className="hidden print:block mt-8 pt-4 border-t border-gray-300">
            <div className="flex justify-between text-xs text-gray-500">
              <span>METROPOL TOURS GmbH — Dienstplan KW {kwNumber}</span>
              <span>Unterschrift Disponent: ________________________</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== PRINT STYLES ===== */}
      <style>{`
        @media print {
          /* Hide everything except our content */
          body * { visibility: hidden; }
          #shift-table, #shift-table * { visibility: visible; }
          
          /* Actually, let's do it properly with the print classes */
          aside, header, .print\\:hidden { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
          
          /* Make the page use the full width */
          @page {
            size: landscape;
            margin: 10mm;
          }
          
          /* Force light mode for print */
          :root, body, html, .dark {
            background: white !important;
            color: black !important;
            color-scheme: light !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Override all dark mode colors */
          *, *::before, *::after {
            visibility: visible !important;
            background-color: transparent !important;
            color: black !important;
            border-color: #999 !important;
            box-shadow: none !important;
          }
          
          /* Keep table header background */
          th {
            background-color: #f3f4f6 !important;
            color: black !important;
            font-weight: 600 !important;
          }

          /* Shift cells keep subtle bg */
          td .rounded {
            border: 1px solid #ccc !important;
            padding: 2px 4px !important;
          }
          
          /* Hide sidebar and non-print elements */
          aside, nav, header, .print\\:hidden {
            display: none !important;
          }
          
          .hidden.print\\:block {
            display: block !important;
            color: black !important;
          }
          
          /* Print header styling */
          .hidden.print\\:block h1,
          .hidden.print\\:block h2,
          .hidden.print\\:block p {
            color: black !important;
          }
          
          main {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            background: white !important;
          }
          
          th, td {
            border: 1px solid #999 !important;
            padding: 4px 6px !important;
            background: white !important;
          }
        }
      `}</style>

      {/* ===== CREATE/EDIT MODAL ===== */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              {editingShift ? "Schicht bearbeiten" : "Neue Schicht anlegen"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Employee */}
            <div>
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Mitarbeiter *</Label>
              <Select value={form.user_id || "unset"} onValueChange={v => setForm(f => ({ ...f, user_id: v === "unset" ? "" : v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                  <SelectValue placeholder="Mitarbeiter wählen..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                  <SelectItem value="unset" className="text-zinc-500">– Bitte wählen –</SelectItem>
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

            {/* Date + Role row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wider">Datum *</Label>
                <Input
                  type="date"
                  value={form.shift_date}
                  onChange={e => setForm(f => ({ ...f, shift_date: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wider">Funktion</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {SHIFT_ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value} className="text-white">{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Time row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Dienstbeginn
                </Label>
                <Input
                  type="time"
                  value={form.shift_start}
                  onChange={e => setForm(f => ({ ...f, shift_start: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1 font-mono text-lg"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Dienstende
                </Label>
                <Input
                  type="time"
                  value={form.shift_end}
                  onChange={e => setForm(f => ({ ...f, shift_end: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1 font-mono text-lg"
                />
              </div>
            </div>

            {/* Status + Bus row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wider">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {SHIFT_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value} className="text-white">{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wider flex items-center gap-1">
                  <Bus className="w-3 h-3" /> Fahrzeug
                </Label>
                <Select value={form.assigned_bus_id || "none"} onValueChange={v => setForm(f => ({ ...f, assigned_bus_id: v === "none" ? "" : v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1"><SelectValue placeholder="Keins" /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="none" className="text-white">– Kein Fahrzeug –</SelectItem>
                    {buses.map(b => (
                      <SelectItem key={b.id} value={b.id} className="text-white">
                        {b.name} ({b.license_plate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Bemerkungen</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white min-h-[60px] mt-1"
                placeholder="z.B. Sonderfahrt Zagreb, Vertretung für M. Müller..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2 mt-2">
            {editingShift && (
              <Button variant="ghost" className="text-red-400 hover:text-red-300 mr-auto" onClick={() => { deleteShift(editingShift.id); setEditModal(false); }}>
                <Trash2 className="w-3 h-3 mr-1" /> Löschen
              </Button>
            )}
            <Button variant="ghost" onClick={() => setEditModal(false)} className="text-zinc-400">Abbrechen</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={saveShift}>
              {editingShift ? "Speichern" : "Schicht anlegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminShifts;
