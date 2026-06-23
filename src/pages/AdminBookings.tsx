import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus, Search, Filter, Download, RefreshCw, MoreHorizontal, Eye, Edit3,
  Trash2, Receipt, Bus, Users, MapPin, Calendar, Euro, Phone, Mail, Building2,
  FileText, Clock, ChevronRight, X, ArrowUpRight, CircleDot,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Booking = Tables<"admin_bookings">;

const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

const BOOKING_TYPES = [
  { v: "reise",    l: "Reisebuchung",     icon: Calendar },
  { v: "charter",  l: "Busanmietung",     icon: Bus },
  { v: "gruppe",   l: "Gruppenreise",     icon: Users },
  { v: "firma",    l: "Firmenfahrt",      icon: Building2 },
  { v: "transfer", l: "Flughafentransfer",icon: ArrowUpRight },
  { v: "event",    l: "Eventfahrt",       icon: Receipt },
];

const BOOKING_STATUS = [
  { v: "anfrage",       l: "Anfrage",      tone: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
  { v: "angebot",       l: "Angebot",      tone: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  { v: "gebucht",       l: "Gebucht",      tone: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  { v: "bestaetigt",    l: "Bestätigt",    tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { v: "abgeschlossen", l: "Abgeschlossen",tone: "bg-zinc-600/20 text-zinc-300 border-zinc-500/30" },
  { v: "storniert",     l: "Storniert",    tone: "bg-red-500/15 text-red-300 border-red-500/30" },
];

const PAYMENT_STATUS = [
  { v: "offen",         l: "Offen",        tone: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  { v: "teilbezahlt",   l: "Teilbezahlt",  tone: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  { v: "bezahlt",       l: "Bezahlt",      tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { v: "ueberfaellig",  l: "Überfällig",   tone: "bg-red-500/15 text-red-300 border-red-500/30" },
  { v: "storniert",     l: "Storniert",    tone: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
];

const VEHICLE_CLASSES = [
  "Kleinbus", "Minibus VIP", "Reisebus 49 Sitze", "Komfortklasse", "VIP-Coach",
  "Doppeldecker", "2x Reisebus", "Subcharter",
];

const lookupType = (v: string) => BOOKING_TYPES.find((t) => t.v === v);
const lookupStatus = (v: string) => BOOKING_STATUS.find((s) => s.v === v);
const lookupPayment = (v: string) => PAYMENT_STATUS.find((p) => p.v === v);

const emptyDraft = (): Partial<TablesInsert<"admin_bookings">> => ({
  booking_type: "reise",
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  pickup_location: "",
  destination_location: "",
  departure_at: new Date(Date.now() + 86_400_000).toISOString().slice(0, 16),
  return_at: "",
  passenger_count: 1,
  vehicle_class: "Reisebus 49 Sitze",
  assigned_bus: "",
  assigned_driver: "",
  price_net: 0,
  price_gross: 0,
  payment_status: "offen",
  booking_status: "anfrage",
  internal_notes: "",
  customer_notes: "",
});

const AdminBookings = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [draft, setDraft] = useState<Partial<TablesInsert<"admin_bookings">>>(emptyDraft());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_bookings")
      .select("*")
      .is("archived_at", null)
      .order("departure_at", { ascending: true });
    if (error) toast.error("Buchungen konnten nicht geladen werden");
    else setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-open create drawer when ?new=1
  useEffect(() => {
    if (params.get("new") === "1") {
      setDraft(emptyDraft());
      setCreateOpen(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.booking_status !== statusFilter) return false;
      if (paymentFilter !== "all" && r.payment_status !== paymentFilter) return false;
      if (typeFilter !== "all" && r.booking_type !== typeFilter) return false;
      if (!q) return true;
      return (
        r.booking_number.toLowerCase().includes(q) ||
        r.customer_name.toLowerCase().includes(q) ||
        (r.customer_email ?? "").toLowerCase().includes(q) ||
        r.pickup_location.toLowerCase().includes(q) ||
        r.destination_location.toLowerCase().includes(q) ||
        (r.assigned_bus ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter, paymentFilter, typeFilter]);

  const kpis = useMemo(() => {
    const total = rows.length;
    const open = rows.filter((r) => ["anfrage", "angebot"].includes(r.booking_status)).length;
    const confirmed = rows.filter((r) => r.booking_status === "bestaetigt").length;
    const revenue = rows
      .filter((r) => ["bestaetigt", "abgeschlossen"].includes(r.booking_status))
      .reduce((s, r) => s + Number(r.price_gross || 0), 0);
    const overdue = rows.filter((r) => r.payment_status === "ueberfaellig").length;
    return { total, open, confirmed, revenue, overdue };
  }, [rows]);

  const handleSave = async () => {
    if (!draft.customer_name || !draft.pickup_location || !draft.destination_location || !draft.departure_at) {
      toast.error("Bitte Pflichtfelder ausfüllen (Kunde, Abholort, Ziel, Abfahrt).");
      return;
    }
    setSaving(true);
    const payload: TablesInsert<"admin_bookings"> = {
      booking_type: draft.booking_type!,
      customer_name: draft.customer_name!,
      customer_email: draft.customer_email || null,
      customer_phone: draft.customer_phone || null,
      pickup_location: draft.pickup_location!,
      destination_location: draft.destination_location!,
      departure_at: new Date(draft.departure_at as string).toISOString(),
      return_at: draft.return_at ? new Date(draft.return_at as string).toISOString() : null,
      passenger_count: Number(draft.passenger_count) || 1,
      vehicle_class: draft.vehicle_class || null,
      assigned_bus: draft.assigned_bus || null,
      assigned_driver: draft.assigned_driver || null,
      price_net: Number(draft.price_net) || 0,
      price_gross: Number(draft.price_gross) || 0,
      payment_status: draft.payment_status!,
      booking_status: draft.booking_status!,
      internal_notes: draft.internal_notes || null,
      customer_notes: draft.customer_notes || null,
    } as TablesInsert<"admin_bookings">;

    const { data, error } = await supabase.from("admin_bookings").insert(payload).select().single();
    setSaving(false);
    if (error) { toast.error("Speichern fehlgeschlagen: " + error.message); return; }
    toast.success(`Buchung ${data?.booking_number} angelegt`);
    setCreateOpen(false);
    setDraft(emptyDraft());
    load();
  };

  const updateStatus = async (id: string, field: "booking_status" | "payment_status", value: string) => {
    const { error } = await supabase.from("admin_bookings").update({ [field]: value }).eq("id", id);
    if (error) { toast.error("Update fehlgeschlagen"); return; }
    toast.success("Aktualisiert");
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    if (detail?.id === id) setDetail({ ...detail, [field]: value });
  };

  const archive = async (id: string) => {
    const { error } = await supabase.from("admin_bookings").update({ archived_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Archivieren fehlgeschlagen"); return; }
    toast.success("Archiviert");
    setRows((rs) => rs.filter((r) => r.id !== id));
    setDetail(null);
  };

  const exportCsv = () => {
    const head = ["Nr.","Art","Kunde","Email","Abfahrt","Abholort","Ziel","Pax","Klasse","Bus","Fahrer","Brutto","Zahlung","Status"];
    const lines = filtered.map((r) => [
      r.booking_number, lookupType(r.booking_type)?.l, r.customer_name, r.customer_email,
      format(new Date(r.departure_at), "dd.MM.yyyy HH:mm"), r.pickup_location, r.destination_location,
      r.passenger_count, r.vehicle_class, r.assigned_bus, r.assigned_driver,
      Number(r.price_gross).toFixed(2).replace(".", ","), r.payment_status, r.booking_status,
    ].map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(";"));
    const csv = [head.join(";"), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `buchungen-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };

  return (
    <AdminLayout title="Buchungen">
      {/* HEADER */}
      <div className="-mt-6 -mx-6 px-6 py-4 border-b border-white/5 bg-[#0b0e13] mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Receipt className="h-3.5 w-3.5" /> METROPOL TOURS / Cockpit / <span className="text-zinc-300">Buchungen</span>
            </div>
            <h1 className="text-xl font-semibold text-white mt-1">Reise- & Bus-Buchungen</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Zentrale Bearbeitung aller Buchungsarten – von der Anfrage bis zur Abrechnung.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 bg-white/5 border-white/10 text-zinc-100 hover:bg-white/10" onClick={load}>
              <RefreshCw className="h-4 w-4 mr-1.5" /> Aktualisieren
            </Button>
            <Button variant="outline" size="sm" className="h-9 bg-white/5 border-white/10 text-zinc-100 hover:bg-white/10" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-1.5" /> CSV Export
            </Button>
            <Button size="sm" className="h-9 bg-[#00CC36] hover:bg-[#00b830] text-black" onClick={() => { setDraft(emptyDraft()); setCreateOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Neue Buchung
            </Button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
          {[
            { l: "Buchungen gesamt", v: kpis.total, icon: Receipt, tone: "text-zinc-200" },
            { l: "Offen / Angebot",  v: kpis.open,  icon: Clock, tone: "text-amber-300" },
            { l: "Bestätigt",        v: kpis.confirmed, icon: CircleDot, tone: "text-emerald-300" },
            { l: "Umsatz (best.)",   v: eur(kpis.revenue), icon: Euro, tone: "text-sky-300" },
            { l: "Überfällige Zahlungen", v: kpis.overdue, icon: Euro, tone: "text-red-300" },
          ].map((k) => (
            <div key={k.l} className="rounded-lg border border-white/10 bg-[#11151c] px-3 py-2.5">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-zinc-500">
                <span>{k.l}</span><k.icon className="h-3.5 w-3.5" />
              </div>
              <div className={cn("mt-1 text-lg font-semibold tabular-nums", k.tone)}>{k.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTER BAR */}
      <Card className="bg-[#11151c] border-white/10 mb-4">
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche: Buchungsnr., Kunde, Route, Bus…"
              className="pl-8 h-9 bg-white/5 border-white/10 text-zinc-100 placeholder:text-zinc-500" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-[160px] bg-white/5 border-white/10 text-zinc-100"><SelectValue placeholder="Art" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Arten</SelectItem>
              {BOOKING_TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[160px] bg-white/5 border-white/10 text-zinc-100"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              {BOOKING_STATUS.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="h-9 w-[160px] bg-white/5 border-white/10 text-zinc-100"><SelectValue placeholder="Zahlung" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Zahlungen</SelectItem>
              {PAYMENT_STATUS.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}
            </SelectContent>
          </Select>
          {(search || statusFilter !== "all" || paymentFilter !== "all" || typeFilter !== "all") && (
            <Button variant="ghost" size="sm" className="h-9 text-zinc-400"
              onClick={() => { setSearch(""); setStatusFilter("all"); setPaymentFilter("all"); setTypeFilter("all"); }}>
              <X className="h-4 w-4 mr-1" /> Zurücksetzen
            </Button>
          )}
          <div className="ml-auto text-xs text-zinc-500">
            {filtered.length} von {rows.length} angezeigt
            {selected.size > 0 && <span className="ml-2 text-[#00CC36]">· {selected.size} ausgewählt</span>}
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="bg-[#11151c] border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="w-8">
                  <Checkbox checked={selected.size > 0 && selected.size === filtered.length} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="text-zinc-500 text-xs">Buchungsnr.</TableHead>
                <TableHead className="text-zinc-500 text-xs">Art</TableHead>
                <TableHead className="text-zinc-500 text-xs">Kunde</TableHead>
                <TableHead className="text-zinc-500 text-xs">Route</TableHead>
                <TableHead className="text-zinc-500 text-xs">Abfahrt</TableHead>
                <TableHead className="text-zinc-500 text-xs text-right">Pax</TableHead>
                <TableHead className="text-zinc-500 text-xs">Bus / Fahrer</TableHead>
                <TableHead className="text-zinc-500 text-xs text-right">Brutto</TableHead>
                <TableHead className="text-zinc-500 text-xs">Zahlung</TableHead>
                <TableHead className="text-zinc-500 text-xs">Status</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={12} className="text-center text-zinc-500 py-12">Lade Buchungen…</TableCell></TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={12} className="text-center text-zinc-500 py-12">Keine Buchungen mit diesen Filtern.</TableCell></TableRow>
              )}
              {filtered.map((r) => {
                const ty = lookupType(r.booking_type);
                const st = lookupStatus(r.booking_status);
                const py = lookupPayment(r.payment_status);
                const TyIcon = ty?.icon ?? Receipt;
                return (
                  <TableRow key={r.id} className="border-white/5 hover:bg-white/[0.03] cursor-pointer" onClick={() => setDetail(r)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.has(r.id)} onCheckedChange={(c) => {
                        const n = new Set(selected); c ? n.add(r.id) : n.delete(r.id); setSelected(n);
                      }} />
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-zinc-400">{r.booking_number}</TableCell>
                    <TableCell className="text-zinc-200">
                      <span className="inline-flex items-center gap-1.5 text-sm"><TyIcon className="h-3.5 w-3.5 text-zinc-500" />{ty?.l}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-zinc-100">{r.customer_name}</div>
                      <div className="text-[11px] text-zinc-500">{r.customer_email ?? "—"}</div>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-300">
                      <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-zinc-500" />{r.pickup_location}</div>
                      <div className="text-[11px] text-zinc-500 pl-4">→ {r.destination_location}</div>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-300 tabular-nums">
                      <div>{format(new Date(r.departure_at), "dd.MM.yyyy", { locale: de })}</div>
                      <div className="text-[11px] text-zinc-500">{format(new Date(r.departure_at), "HH:mm")} Uhr</div>
                    </TableCell>
                    <TableCell className="text-right text-zinc-200 tabular-nums">{r.passenger_count}</TableCell>
                    <TableCell className="text-sm text-zinc-300">
                      <div>{r.assigned_bus ?? <span className="text-zinc-600">— offen —</span>}</div>
                      <div className="text-[11px] text-zinc-500">{r.assigned_driver ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-right text-zinc-100 tabular-nums font-medium">{eur(Number(r.price_gross))}</TableCell>
                    <TableCell><Badge variant="outline" className={py?.tone}>{py?.l}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={st?.tone}>{st?.l}</Badge></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#11151c] border-white/10">
                          <DropdownMenuItem onClick={() => setDetail(r)}><Eye className="h-4 w-4 mr-2" />Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(r.id, "booking_status", "bestaetigt")}>
                            <CircleDot className="h-4 w-4 mr-2" />Bestätigen
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(r.id, "payment_status", "bezahlt")}>
                            <Euro className="h-4 w-4 mr-2" />Als bezahlt markieren
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-400" onClick={() => archive(r.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />Archivieren
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CREATE DRAWER */}
      <BookingDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        saving={saving}
      />

      {/* DETAIL DRAWER */}
      <DetailDrawer
        booking={detail}
        onClose={() => setDetail(null)}
        onStatus={updateStatus}
        onArchive={archive}
      />
    </AdminLayout>
  );
};

// ============================================================
// CREATE DRAWER
// ============================================================
function BookingDrawer({
  open, onOpenChange, draft, setDraft, onSave, saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  draft: Partial<TablesInsert<"admin_bookings">>;
  setDraft: (d: Partial<TablesInsert<"admin_bookings">>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const set = (k: keyof TablesInsert<"admin_bookings">, v: unknown) => setDraft({ ...draft, [k]: v as never });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl bg-[#0b0e13] border-l border-white/10 p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-white/5">
          <SheetTitle className="text-white flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#00CC36]" /> Neue Buchung anlegen
          </SheetTitle>
          <SheetDescription className="text-zinc-500">
            Anfrage, Angebot oder bestätigte Buchung – inkl. Kunde, Route, Fahrzeug, Preis & Status.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Summary */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Wird angelegt als</span>
            <div className="flex items-center gap-2 text-zinc-200">
              <Badge variant="outline" className={lookupStatus(draft.booking_status ?? "anfrage")?.tone}>
                {lookupStatus(draft.booking_status ?? "anfrage")?.l}
              </Badge>
              <span className="text-zinc-500">·</span>
              <span>{lookupType(draft.booking_type ?? "reise")?.l}</span>
              <span className="text-zinc-500">·</span>
              <span className="tabular-nums">{eur(Number(draft.price_gross) || 0)}</span>
            </div>
          </div>

          <Section title="Buchungsart">
            <div className="grid grid-cols-3 gap-2">
              {BOOKING_TYPES.map((t) => {
                const Icon = t.icon;
                const active = draft.booking_type === t.v;
                return (
                  <button key={t.v} type="button" onClick={() => set("booking_type", t.v)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left text-sm flex items-center gap-2 transition",
                      active ? "border-[#00CC36] bg-[#00CC36]/10 text-white" : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
                    )}>
                    <Icon className="h-4 w-4" />{t.l}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Kunde & Kontakt">
            <Row>
              <Field label="Kundenname *">
                <Input value={draft.customer_name ?? ""} onChange={(e) => set("customer_name", e.target.value)}
                  placeholder="z. B. Familie Petrov / Schreiber GmbH" />
              </Field>
            </Row>
            <Row>
              <Field label="E-Mail" icon={Mail}>
                <Input type="email" value={draft.customer_email ?? ""} onChange={(e) => set("customer_email", e.target.value)} placeholder="kontakt@beispiel.de" />
              </Field>
              <Field label="Telefon" icon={Phone}>
                <Input value={draft.customer_phone ?? ""} onChange={(e) => set("customer_phone", e.target.value)} placeholder="+49 …" />
              </Field>
            </Row>
          </Section>

          <Section title="Route & Termin">
            <Row>
              <Field label="Abholort *" icon={MapPin}>
                <Input value={draft.pickup_location ?? ""} onChange={(e) => set("pickup_location", e.target.value)} placeholder="z. B. Hannover ZOB" />
              </Field>
              <Field label="Zielort *" icon={MapPin}>
                <Input value={draft.destination_location ?? ""} onChange={(e) => set("destination_location", e.target.value)} placeholder="z. B. Amsterdam Sloterdijk" />
              </Field>
            </Row>
            <Row>
              <Field label="Abfahrt *" icon={Calendar}>
                <Input type="datetime-local" value={String(draft.departure_at ?? "").slice(0, 16)} onChange={(e) => set("departure_at", e.target.value)} />
              </Field>
              <Field label="Rückkehr" icon={Calendar}>
                <Input type="datetime-local" value={String(draft.return_at ?? "").slice(0, 16)} onChange={(e) => set("return_at", e.target.value)} />
              </Field>
            </Row>
          </Section>

          <Section title="Teilnehmer & Fahrzeug">
            <Row>
              <Field label="Teilnehmer / Sitze" icon={Users}>
                <Input type="number" min={1} value={draft.passenger_count ?? 1} onChange={(e) => set("passenger_count", Number(e.target.value))} />
              </Field>
              <Field label="Fahrzeugklasse" icon={Bus}>
                <Select value={draft.vehicle_class ?? ""} onValueChange={(v) => set("vehicle_class", v)}>
                  <SelectTrigger><SelectValue placeholder="Wählen…" /></SelectTrigger>
                  <SelectContent>
                    {VEHICLE_CLASSES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </Row>
            <Row>
              <Field label="Bus (optional)"><Input value={draft.assigned_bus ?? ""} onChange={(e) => set("assigned_bus", e.target.value)} placeholder="z. B. ME-RB 4521" /></Field>
              <Field label="Fahrer (optional)"><Input value={draft.assigned_driver ?? ""} onChange={(e) => set("assigned_driver", e.target.value)} placeholder="z. B. Krüger, M." /></Field>
            </Row>
          </Section>

          <Section title="Preis & Zahlung">
            <Row>
              <Field label="Preis netto" icon={Euro}>
                <Input type="number" step="0.01" value={draft.price_net ?? 0} onChange={(e) => set("price_net", Number(e.target.value))} />
              </Field>
              <Field label="Preis brutto" icon={Euro}>
                <Input type="number" step="0.01" value={draft.price_gross ?? 0} onChange={(e) => set("price_gross", Number(e.target.value))} />
              </Field>
            </Row>
            <Row>
              <Field label="Zahlungsstatus">
                <Select value={draft.payment_status ?? "offen"} onValueChange={(v) => set("payment_status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_STATUS.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Buchungsstatus">
                <Select value={draft.booking_status ?? "anfrage"} onValueChange={(v) => set("booking_status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BOOKING_STATUS.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </Row>
          </Section>

          <Section title="Notizen">
            <Field label="Interne Notiz">
              <Textarea rows={2} value={draft.internal_notes ?? ""} onChange={(e) => set("internal_notes", e.target.value)} placeholder="Nur intern sichtbar." />
            </Field>
            <Field label="Kundennotiz">
              <Textarea rows={2} value={draft.customer_notes ?? ""} onChange={(e) => set("customer_notes", e.target.value)} placeholder="Sichtbar für Kunden auf Bestätigung." />
            </Field>
          </Section>
        </div>

        {/* Sticky action bar */}
        <div className="border-t border-white/10 bg-[#0b0e13] px-6 py-3 flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400">Abbrechen</Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="bg-white/5 border-white/10 text-zinc-100 hover:bg-white/10"
              onClick={() => { set("booking_status", "anfrage"); onSave(); }} disabled={saving}>
              Als Entwurf speichern
            </Button>
            <Button onClick={onSave} disabled={saving} className="bg-[#00CC36] hover:bg-[#00b830] text-black">
              {saving ? "Speichere…" : "Buchung anlegen"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// DETAIL DRAWER
// ============================================================
function DetailDrawer({
  booking, onClose, onStatus, onArchive,
}: {
  booking: Booking | null;
  onClose: () => void;
  onStatus: (id: string, f: "booking_status" | "payment_status", v: string) => void;
  onArchive: (id: string) => void;
}) {
  if (!booking) return null;
  const ty = lookupType(booking.booking_type);
  const st = lookupStatus(booking.booking_status);
  const py = lookupPayment(booking.payment_status);

  return (
    <Sheet open={!!booking} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl bg-[#0b0e13] border-l border-white/10 p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-white text-base flex items-center gap-2">
                <span className="font-mono text-sm text-zinc-400">{booking.booking_number}</span>
                <Badge variant="outline" className={st?.tone}>{st?.l}</Badge>
                <Badge variant="outline" className={py?.tone}>{py?.l}</Badge>
              </SheetTitle>
              <SheetDescription className="text-zinc-400 mt-1">
                {ty?.l} · {booking.customer_name}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-4 bg-white/5 border border-white/10 w-fit">
            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-white/10">Übersicht</TabsTrigger>
            <TabsTrigger value="customer" className="text-xs data-[state=active]:bg-white/10">Kunde</TabsTrigger>
            <TabsTrigger value="route"    className="text-xs data-[state=active]:bg-white/10">Fahrt</TabsTrigger>
            <TabsTrigger value="finance"  className="text-xs data-[state=active]:bg-white/10">Finanzen</TabsTrigger>
            <TabsTrigger value="history"  className="text-xs data-[state=active]:bg-white/10">Verlauf</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TabsContent value="overview" className="space-y-3 m-0">
              <Detail label="Buchungsnummer" value={booking.booking_number} />
              <Detail label="Art" value={ty?.l ?? booking.booking_type} />
              <Detail label="Kunde" value={booking.customer_name} />
              <Detail label="Route" value={`${booking.pickup_location} → ${booking.destination_location}`} />
              <Detail label="Abfahrt" value={format(new Date(booking.departure_at), "EEEE, dd. MMMM yyyy · HH:mm", { locale: de }) + " Uhr"} />
              {booking.return_at && (
                <Detail label="Rückkehr" value={format(new Date(booking.return_at), "EEEE, dd. MMMM yyyy · HH:mm", { locale: de }) + " Uhr"} />
              )}
              <Detail label="Teilnehmer" value={`${booking.passenger_count} Pax · ${booking.vehicle_class ?? "—"}`} />
              <Detail label="Bus / Fahrer" value={`${booking.assigned_bus ?? "— offen —"}  ·  ${booking.assigned_driver ?? "— offen —"}`} />
              <Detail label="Brutto" value={eur(Number(booking.price_gross))} />
              {booking.internal_notes && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-amber-300 mb-1">Interne Notiz</div>
                  <div className="text-sm text-zinc-200 whitespace-pre-wrap">{booking.internal_notes}</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="customer" className="space-y-3 m-0">
              <Detail label="Name" value={booking.customer_name} />
              <Detail label="E-Mail" value={booking.customer_email ?? "—"} />
              <Detail label="Telefon" value={booking.customer_phone ?? "—"} />
              <Detail label="B2B-Kunde" value={booking.b2b_customer_id ? "verknüpft" : "—"} />
              {booking.customer_notes && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Kundennotiz</div>
                  <div className="text-sm text-zinc-200 whitespace-pre-wrap">{booking.customer_notes}</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="route" className="space-y-3 m-0">
              <Detail label="Abholort" value={booking.pickup_location} />
              <Detail label="Zielort" value={booking.destination_location} />
              <Detail label="Abfahrt" value={format(new Date(booking.departure_at), "dd.MM.yyyy HH:mm")} />
              <Detail label="Rückkehr" value={booking.return_at ? format(new Date(booking.return_at), "dd.MM.yyyy HH:mm") : "—"} />
              <Detail label="Pax" value={String(booking.passenger_count)} />
              <Detail label="Fahrzeugklasse" value={booking.vehicle_class ?? "—"} />
              <Detail label="Zugew. Bus" value={booking.assigned_bus ?? "— offen —"} />
              <Detail label="Zugew. Fahrer" value={booking.assigned_driver ?? "— offen —"} />
            </TabsContent>

            <TabsContent value="finance" className="space-y-3 m-0">
              <Detail label="Netto" value={eur(Number(booking.price_net))} />
              <Detail label="Brutto" value={eur(Number(booking.price_gross))} />
              <Detail label="Zahlungsstatus" value={py?.l ?? booking.payment_status} />
              <div className="pt-2">
                <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-2">Schnellaktionen</div>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_STATUS.map((p) => (
                    <Button key={p.v} variant="outline" size="sm"
                      className={cn("h-8 bg-white/5 border-white/10 text-zinc-200 hover:bg-white/10",
                        booking.payment_status === p.v && "ring-1 ring-[#00CC36]/60")}
                      onClick={() => onStatus(booking.id, "payment_status", p.v)}>
                      {p.l}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-2 m-0">
              <TimelineRow when={booking.created_at} text="Buchung angelegt" />
              <TimelineRow when={booking.updated_at} text="Zuletzt aktualisiert" />
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-zinc-500">
                Detaillierte Verlaufsprotokollierung (Statuswechsel, Zahlungen, Mailversand) wird im nächsten Iterationsschritt aktiviert.
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* sticky action bar */}
        <div className="border-t border-white/10 bg-[#0b0e13] px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">Status setzen</span>
            <Select value={booking.booking_status} onValueChange={(v) => onStatus(booking.id, "booking_status", v)}>
              <SelectTrigger className="h-8 w-[160px] bg-white/5 border-white/10 text-zinc-100"><SelectValue /></SelectTrigger>
              <SelectContent>{BOOKING_STATUS.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-red-400 hover:bg-red-500/10" size="sm" onClick={() => onArchive(booking.id)}>
              <Trash2 className="h-4 w-4 mr-1" /> Archivieren
            </Button>
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-zinc-100 hover:bg-white/10">
              <FileText className="h-4 w-4 mr-1" /> Bestätigung PDF
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// helpers
// ============================================================
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{children}</div>;
}
function Field({ label, icon: Icon, children }: { label: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-zinc-400 flex items-center gap-1">{Icon && <Icon className="h-3 w-3" />}{label}</Label>
      {children}
    </div>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-2">
      <span className="text-xs text-zinc-500 min-w-[120px]">{label}</span>
      <span className="text-sm text-zinc-100 text-right tabular-nums">{value}</span>
    </div>
  );
}
function TimelineRow({ when, text }: { when: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="h-1.5 w-1.5 rounded-full bg-[#00CC36]" />
      <span className="text-zinc-300">{text}</span>
      <span className="text-xs text-zinc-500 tabular-nums ml-auto">{format(new Date(when), "dd.MM.yyyy HH:mm")}</span>
    </div>
  );
}

export default AdminBookings;
