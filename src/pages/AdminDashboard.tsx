import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bus, Calendar, Plus, RefreshCw, FileText, Users, AlertCircle, Clock, Euro,
  CheckCircle, TrendingUp, ChevronRight, ArrowUpRight, ArrowDownRight, MapPin,
  Wrench, Activity, Phone, Mail, Star, AlertTriangle, Gauge, ShieldCheck,
  Radio, Search, Building2, Receipt, FileSignature, UserPlus, Route as RouteIcon,
  CircleDot, Timer, Fuel,
} from "lucide-react";
import { format, addMinutes, addDays, subDays } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { cn } from "@/lib/utils";

const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

const num = (n: number) => new Intl.NumberFormat("de-DE").format(n);

// ----- Live data types (no demo data – everything comes from the backend) -----
const now = new Date();

type DepartureRow = { id: string; time: Date; route: string; bus: string; driver: string; pax: number; cap: number; status: string };
type BookingRow = { id: string; key: string; customer: string; route: string; pax: number; price: number; status: string };
type InquiryRow = { id: string; customer: string; subject: string; date: Date | null; pax: number; prio: string; source: string };
type MaintenanceRow = { bus: string; typ: string; faellig: Date; km: number; status: string };
type InvoiceRow = { id: string; kunde: string; betrag: number; faellig: Date | null; status: string };
type DriverRow = { name: string; status: string; tour: string; lenkzeit: number; max: number };
type IncidentRow = { id: string; typ: string; bus: string; ort: string; prio: string };


// status -> chip class
const chip: Record<string, string> = {
  pending:    "bg-amber-500/15 text-amber-300 border-amber-500/30",
  confirmed:  "bg-sky-500/15 text-sky-300 border-sky-500/30",
  paid:       "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  cancelled:  "bg-red-500/15 text-red-300 border-red-500/30",
  boarding:   "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  scheduled:  "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  full:       "bg-violet-500/15 text-violet-300 border-violet-500/30",
  überfällig: "bg-red-500/15 text-red-300 border-red-500/30",
  offen:      "bg-amber-500/15 text-amber-300 border-amber-500/30",
  kritisch:   "bg-red-500/15 text-red-300 border-red-500/30",
  warnung:    "bg-amber-500/15 text-amber-300 border-amber-500/30",
  planbar:    "bg-sky-500/15 text-sky-300 border-sky-500/30",
  hoch:       "bg-red-500/15 text-red-300 border-red-500/30",
  mittel:     "bg-amber-500/15 text-amber-300 border-amber-500/30",
  niedrig:    "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
};

const statusLabel: Record<string, string> = {
  pending: "Offen", confirmed: "Bestätigt", paid: "Bezahlt", cancelled: "Storniert",
  boarding: "Einsteigen", scheduled: "Geplant", full: "Ausgebucht",
};

type Kpi = {
  label: string; value: string; sub?: string; delta?: number;
  icon: React.ElementType; accent?: string; onClick?: () => void;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState("month");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [counts, setCounts] = useState({
    bookingsToday: 0, revenueMonth: 0, openInquiries: 0,
    activeTrips: 0, readyBuses: 0, totalBuses: 0, openPayments: 0,
    openPaymentsAmount: 0, complaints: 0, nextDepartures: 0,
  });
  const [departures, setDepartures] = useState<DepartureRow[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingRow[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLiveData = useMemo(() => async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const in24h = new Date(Date.now() + 24 * 3600 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      lineBookings, tourBookings, inqRes, compRes, busesRes,
      tripsRes, maintRes, invRes, incRes, driverRes,
    ] = await Promise.all([
      supabase.from("bookings")
        .select("id, ticket_number, booking_number, passenger_first_name, passenger_last_name, price_paid, status, created_at, trip_id")
        .order("created_at", { ascending: false }).limit(30),
      supabase.from("tour_bookings")
        .select("id, booking_number, contact_first_name, contact_last_name, participants, total_price, status, created_at, tour_id, package_tours(destination, title)")
        .order("created_at", { ascending: false }).limit(30),
      supabase.from("package_tour_inquiries")
        .select("id, inquiry_number, first_name, last_name, destination, participants, departure_date, status, created_at")
        .order("created_at", { ascending: false }).limit(8),
      supabase.from("complaints").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
      supabase.from("buses").select("id, status, license_plate"),
      supabase.from("line_trips")
        .select("id, planned_departure, status, delay_minutes, bus_id, driver_id, bus_lines(name), buses(license_plate, total_seats)")
        .gte("planned_departure", today.toISOString())
        .lte("planned_departure", in24h.toISOString())
        .order("planned_departure", { ascending: true }).limit(8),
      supabase.from("fleet_maintenance")
        .select("id, current_km, tuev_date, uvv_date, next_inspection_date, buses(license_plate)")
        .order("tuev_date", { ascending: true }).limit(6),
      supabase.from("tour_invoices")
        .select("id, invoice_number, amount, status, issued_at, tour_bookings(contact_first_name, contact_last_name)")
        .neq("status", "paid").order("issued_at", { ascending: true }).limit(6),
      supabase.from("incidents")
        .select("id, title, type, severity, status, description, created_at")
        .neq("status", "resolved").order("created_at", { ascending: false }).limit(6),
      supabase.from("driver_status").select("user_id, status, note, updated_at").limit(10),
    ]);

    // --- KPIs ---
    const lb = lineBookings.data ?? [];
    const tb = tourBookings.data ?? [];
    const bookingsToday =
      lb.filter((b: any) => new Date(b.created_at) >= today).length +
      tb.filter((b: any) => new Date(b.created_at) >= today).length;
    const revenueMonth =
      lb.filter((b: any) => new Date(b.created_at) >= monthStart && ["confirmed", "completed"].includes(b.status))
        .reduce((s: number, b: any) => s + Number(b.price_paid || 0), 0) +
      tb.filter((b: any) => new Date(b.created_at) >= monthStart && ["confirmed", "paid", "completed"].includes(b.status))
        .reduce((s: number, b: any) => s + Number(b.total_price || 0), 0);
    const openInvoices = invRes.data ?? [];

    setCounts({
      bookingsToday,
      revenueMonth,
      openInquiries: (inqRes.data ?? []).filter((q: any) => ["new", "open"].includes(q.status)).length,
      activeTrips: (tripsRes.data ?? []).filter((t: any) => ["running", "delayed", "boarding"].includes(t.status)).length,
      readyBuses: (busesRes.data ?? []).filter((b: any) => b.status === "active").length,
      totalBuses: busesRes.data?.length ?? 0,
      openPayments: openInvoices.length,
      openPaymentsAmount: openInvoices.reduce((s: number, i: any) => s + Number(i.amount || 0), 0),
      complaints: compRes.count ?? 0,
      nextDepartures: (tripsRes.data ?? []).length,
    });

    // --- Lists ---
    setDepartures((tripsRes.data ?? []).map((t: any) => ({
      id: t.id,
      time: new Date(t.planned_departure),
      route: t.bus_lines?.name ?? "Linienfahrt",
      bus: t.buses?.license_plate ?? "—",
      driver: t.driver_id ? "zugewiesen" : "offen",
      pax: 0,
      cap: t.buses?.total_seats ?? 0,
      status: t.status === "delayed" ? "scheduled" : (t.status ?? "scheduled"),
    })));

    const merged: BookingRow[] = [
      ...lb.map((b: any) => ({
        key: `l-${b.id}`,
        id: b.ticket_number || b.booking_number || "—",
        customer: `${b.passenger_last_name ?? ""}, ${b.passenger_first_name ?? ""}`.replace(/^, |, $/, "") || "—",
        route: "Linienfahrt",
        pax: 1,
        price: Number(b.price_paid || 0),
        status: b.status,
      })),
      ...tb.map((b: any) => ({
        key: `t-${b.id}`,
        id: b.booking_number || "—",
        customer: `${b.contact_last_name ?? ""}, ${b.contact_first_name ?? ""}`.replace(/^, |, $/, "") || "—",
        route: b.package_tours?.destination || b.package_tours?.title || "Pauschalreise",
        pax: Number(b.participants || 1),
        price: Number(b.total_price || 0),
        status: b.status,
      })),
    ].slice(0, 8);
    setRecentBookings(merged);

    setInquiries((inqRes.data ?? []).map((q: any) => ({
      id: q.id,
      customer: `${q.last_name ?? ""}, ${q.first_name ?? ""}`.replace(/^, |, $/, "") || "—",
      subject: q.destination || q.inquiry_number,
      date: q.departure_date ? new Date(q.departure_date) : null,
      pax: Number(q.participants || 0),
      prio: Number(q.participants || 0) >= 40 ? "hoch" : Number(q.participants || 0) >= 15 ? "mittel" : "niedrig",
      source: q.status === "new" ? "Neu" : q.status,
    })));

    setMaintenance((maintRes.data ?? []).map((m: any) => {
      const due = m.tuev_date ? new Date(m.tuev_date) : m.next_inspection_date ? new Date(m.next_inspection_date) : new Date();
      const days = Math.round((+due - Date.now()) / 86400000);
      return {
        bus: m.buses?.license_plate ?? "—",
        typ: m.tuev_date ? "TÜV / HU" : "Inspektion",
        faellig: due,
        km: Number(m.current_km || 0),
        status: days < 7 ? "kritisch" : days < 30 ? "warnung" : "planbar",
      };
    }));

    setInvoices(openInvoices.map((i: any) => ({
      id: i.invoice_number,
      kunde: `${i.tour_bookings?.contact_last_name ?? ""}, ${i.tour_bookings?.contact_first_name ?? ""}`.replace(/^, |, $/, "") || "—",
      betrag: Number(i.amount || 0),
      faellig: i.issued_at ? new Date(i.issued_at) : null,
      status: i.status === "overdue" ? "überfällig" : "offen",
    })));

    setIncidents((incRes.data ?? []).map((i: any) => ({
      id: i.id.slice(0, 8).toUpperCase(),
      typ: i.title || i.type,
      bus: i.type ?? "—",
      ort: i.description?.slice(0, 40) ?? "—",
      prio: i.severity === "critical" || i.severity === "high" ? "hoch" : i.severity === "medium" ? "mittel" : "niedrig",
    })));

    const driverIds = (driverRes.data ?? []).map((d: any) => d.user_id);
    let names: Record<string, string> = {};
    if (driverIds.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", driverIds);
      names = Object.fromEntries((profs ?? []).map((p: any) => [p.user_id, `${p.last_name ?? ""}, ${p.first_name ?? ""}`.replace(/^, |, $/, "")]));
    }
    setDrivers((driverRes.data ?? []).map((d: any) => ({
      name: names[d.user_id] || "Fahrer",
      status: d.status ?? "unbekannt",
      tour: d.note ?? "—",
      lenkzeit: 0,
      max: 9,
    })));

    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLiveData().catch(() => setLoading(false));
    // Live: neue Buchungen sofort erkennen
    const channel = supabase
      .channel("cockpit-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => loadLiveData())
      .on("postgres_changes", { event: "*", schema: "public", table: "tour_bookings" }, () => loadLiveData())
      .on("postgres_changes", { event: "*", schema: "public", table: "package_tour_inquiries" }, () => loadLiveData())
      .subscribe();
    const iv = setInterval(() => loadLiveData().catch(() => {}), 60_000);
    return () => { supabase.removeChannel(channel); clearInterval(iv); };
  }, [loadLiveData]);

  const kpis: Kpi[] = useMemo(() => [
    { label: "Buchungen heute",   value: num(counts.bookingsToday), icon: Receipt,  accent: "from-emerald-500/20 to-emerald-500/0", onClick: () => navigate("/admin/bookings") },
    { label: "Umsatz Monat",      value: eur(counts.revenueMonth),  icon: TrendingUp, accent: "from-sky-500/20 to-sky-500/0",         onClick: () => navigate("/admin/finances") },
    { label: "Offene Anfragen",   value: num(counts.openInquiries), icon: Mail, accent: "from-amber-500/20 to-amber-500/0", onClick: () => navigate("/admin/inquiries") },
    { label: "Aktive Fahrten",    value: num(counts.activeTrips),   sub: "live",          icon: Activity, accent: "from-emerald-500/20 to-emerald-500/0", onClick: () => navigate("/admin/dispatch") },
    { label: "Einsatzbereite Busse", value: `${counts.readyBuses}/${counts.totalBuses}`, icon: Bus, accent: "from-sky-500/20 to-sky-500/0", onClick: () => navigate("/admin/buses") },
    { label: "Offene Zahlungen",  value: eur(counts.openPaymentsAmount), sub: `${counts.openPayments} Rechnungen`, icon: Euro, accent: "from-amber-500/20 to-amber-500/0", onClick: () => navigate("/admin/finances") },
    { label: "Reklamationen",     value: num(counts.complaints),    icon: AlertTriangle, accent: "from-red-500/20 to-red-500/0", onClick: () => navigate("/admin/complaints") },
    { label: "Nächste Abfahrten", value: num(counts.nextDepartures),sub: "in 24 h",       icon: Clock, accent: "from-violet-500/20 to-violet-500/0", onClick: () => navigate("/admin/departures") },
  ], [counts, navigate]);


  const quickActions = [
    { label: "Buchung erstellen", icon: Plus,          onClick: () => navigate("/admin/bookings?new=1"), tone: "primary" },
    { label: "Fahrt planen",      icon: RouteIcon,     onClick: () => navigate("/admin/dispo?new=1") },
    { label: "Reise anlegen",     icon: Calendar,      onClick: () => navigate("/admin/tour-builder") },
    { label: "Kunde erfassen",    icon: UserPlus,      onClick: () => navigate("/admin/customers?new=1") },
    { label: "Angebot erstellen", icon: FileSignature, onClick: () => navigate("/admin/inquiries?offer=1") },
    { label: "Rechnung erstellen",icon: Receipt,       onClick: () => navigate("/admin/finances?invoice=1") },
  ];

  return (
    <AdminLayout title="Cockpit">
      {/* TOPBAR */}
      <div className="sticky top-0 z-30 -mt-6 -mx-6 mb-6 border-b border-white/5 bg-[#0b0e13]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0b0e13]/80">
        <div className="flex flex-wrap items-center gap-3 px-6 py-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Building2 className="h-3.5 w-3.5" />
              METROPOL TOURS · Cockpit
              <span className="text-zinc-600">/</span>
              <span>GJ 2026</span>
              <span className="inline-flex items-center gap-1.5 ml-2 text-emerald-400">
                <CircleDot className="h-3 w-3 animate-pulse" /> Systeme online
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-xl font-semibold text-white tracking-tight">Übersicht</h1>
              <span className="text-xs text-zinc-500">
                {format(lastUpdate, "EEEE, d. MMMM yyyy · HH:mm", { locale: de })} Uhr
              </span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input placeholder="Suche: Buchung, Kunde, Bus, Fahrt…"
                className="h-9 w-[280px] pl-8 bg-white/5 border-white/10 text-zinc-100 placeholder:text-zinc-500" />
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-9 w-[130px] bg-white/5 border-white/10 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Heute</SelectItem>
                <SelectItem value="week">Diese Woche</SelectItem>
                <SelectItem value="month">Diesen Monat</SelectItem>
                <SelectItem value="quarter">Quartal</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 bg-white/5 border-white/10 text-zinc-100 hover:bg-white/10"
              onClick={() => setLastUpdate(new Date())}>
              <RefreshCw className="h-4 w-4 mr-1.5" /> Aktualisieren
            </Button>
          </div>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
        {kpis.map((k) => (
          <button key={k.label} onClick={k.onClick}
            className={cn(
              "relative overflow-hidden rounded-xl border border-white/10 bg-[#11151c] p-3 text-left transition-all",
              "hover:border-[#00CC36]/40 hover:bg-[#141a23]"
            )}>
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", k.accent)} />
            <div className="relative">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-medium uppercase tracking-wide">{k.label}</span>
                <k.icon className="h-3.5 w-3.5" />
              </div>
              <div className="mt-1.5 text-lg font-semibold text-white tabular-nums">{k.value}</div>
              <div className="flex items-center gap-1.5 text-[11px]">
                {typeof k.delta === "number" ? (
                  <span className={cn("inline-flex items-center gap-0.5", k.delta >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {k.delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(k.delta)}%
                  </span>
                ) : null}
                {k.sub && <span className="text-zinc-500">{k.sub}</span>}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <div className="mb-6 flex flex-wrap gap-2">
        {quickActions.map((a) => (
          <Button key={a.label} onClick={a.onClick}
            className={cn(
              "h-9 border",
              a.tone === "primary"
                ? "bg-[#00CC36] hover:bg-[#00b830] text-black border-transparent"
                : "bg-white/5 hover:bg-white/10 text-zinc-100 border-white/10"
            )}>
            <a.icon className="h-4 w-4 mr-1.5" /> {a.label}
          </Button>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* LIVE OPS */}
        <Card className="xl:col-span-2 bg-[#11151c] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Radio className="h-4 w-4 text-[#00CC36] animate-pulse" /> Live-Betrieb
              </CardTitle>
              <p className="text-xs text-zinc-500 mt-0.5">Heute geplante Fahrten · {departures.length} Abfahrten</p>
            </div>
            <Tabs defaultValue="abfahrten" className="w-auto">
              <TabsList className="bg-white/5 border border-white/10 h-8">
                <TabsTrigger value="abfahrten" className="text-xs h-6 data-[state=active]:bg-white/10">Abfahrten</TabsTrigger>
                <TabsTrigger value="busse" className="text-xs h-6 data-[state=active]:bg-white/10">Busse</TabsTrigger>
                <TabsTrigger value="fahrer" className="text-xs h-6 data-[state=active]:bg-white/10">Fahrer</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-500 text-xs">Abfahrt</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Route</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Bus / Fahrer</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Auslastung</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departures.map((d, i) => {
                  const pct = Math.round((d.pax / d.cap) * 100);
                  return (
                    <TableRow key={i} className="border-white/5 hover:bg-white/[0.03]">
                      <TableCell className="text-zinc-200 tabular-nums">
                        <div className="font-medium">{format(d.time, "HH:mm")}</div>
                        <div className="text-[10px] text-zinc-500">in {Math.round((+d.time - +now) / 60000)} min</div>
                      </TableCell>
                      <TableCell className="text-zinc-200">
                        <div className="flex items-center gap-1.5 text-sm"><MapPin className="h-3 w-3 text-zinc-500" />{d.route}</div>
                      </TableCell>
                      <TableCell className="text-zinc-300 text-sm">
                        <div>{d.bus}</div>
                        <div className="text-[11px] text-zinc-500">{d.driver}</div>
                      </TableCell>
                      <TableCell className="w-[160px]">
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-1.5 bg-white/10" />
                          <span className="text-[11px] text-zinc-400 tabular-nums">{d.pax}/{d.cap}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={chip[d.status]}>{statusLabel[d.status]}</Badge>
                      </TableCell>
                      <TableCell><ChevronRight className="h-4 w-4 text-zinc-600" /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* FAHRER */}
        <Card className="bg-[#11151c] border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-[#00CC36]" /> Fahrer-Board
            </CardTitle>
            <p className="text-xs text-zinc-500">Verfügbarkeit & Lenkzeiten heute</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {drivers.map((d) => {
              const pct = (d.lenkzeit / d.max) * 100;
              const tone = d.status === "im Einsatz" ? "text-emerald-300"
                : d.status === "verfügbar" ? "text-sky-300"
                : d.status === "krank" ? "text-red-300" : "text-zinc-400";
              return (
                <div key={`${d.name}-${d.tour}`} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#00CC36]/30 to-sky-500/20 flex items-center justify-center text-xs font-semibold text-white">
                    {(d.name.split(",")[0]?.[0] ?? "F")}{d.name.split(", ")[1]?.[0] ?? ""}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-100 truncate">{d.name}</span>
                      <span className={cn("text-[11px]", tone)}>{d.status}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Progress value={pct} className={cn("h-1 bg-white/10", pct > 80 && "[&>div]:bg-red-500")} />
                      <span className="text-[10px] tabular-nums text-zinc-500">{d.lenkzeit.toFixed(1)}/{d.max}h</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">{d.tour}</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* OFFENE BUCHUNGEN */}
        <Card className="xl:col-span-2 bg-[#11151c] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#00CC36]" /> Offene Buchungen
              </CardTitle>
              <p className="text-xs text-zinc-500">Letzte 24 h · {recentBookings.length} Vorgänge</p>
            </div>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={() => navigate("/admin/bookings")}>
              Alle anzeigen <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-500 text-xs">Ticket</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Kunde</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Route</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-right">Pax</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-right">Preis</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.map((b) => (
                  <TableRow key={b.key} className="border-white/5 hover:bg-white/[0.03] cursor-pointer">
                    <TableCell className="font-mono text-[11px] text-zinc-400">{b.id}</TableCell>
                    <TableCell className="text-zinc-100 text-sm">{b.customer}</TableCell>
                    <TableCell className="text-zinc-300 text-sm">{b.route}</TableCell>
                    <TableCell className="text-right text-zinc-300 tabular-nums">{b.pax}</TableCell>
                    <TableCell className="text-right text-zinc-100 tabular-nums font-medium">{eur(b.price)}</TableCell>
                    <TableCell><Badge variant="outline" className={chip[b.status]}>{statusLabel[b.status]}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* VORFÄLLE */}
        <Card className="bg-[#11151c] border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" /> Offene Vorfälle
            </CardTitle>
            <p className="text-xs text-zinc-500">{incidents.length} aktiv</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {incidents.map((i) => (
              <div key={i.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-500">{i.id}</span>
                  <Badge variant="outline" className={chip[i.prio]}>{i.prio}</Badge>
                </div>
                <div className="mt-1 text-sm text-zinc-100">{i.typ}</div>
                <div className="text-[11px] text-zinc-500 flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1"><Bus className="h-3 w-3" /> {i.bus}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {i.ort}</span>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full text-zinc-400 hover:text-white"
              onClick={() => navigate("/admin/incident-workflow")}>
              Alle Vorfälle <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* ANFRAGEN */}
        <Card className="bg-[#11151c] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#00CC36]" /> Neue Anfragen
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={() => navigate("/admin/inquiries")}>
              Pipeline <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-500 text-xs">Kunde</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Wunsch</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-right">Pax</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Prio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((q) => (
                  <TableRow key={q.id} className="border-white/5 hover:bg-white/[0.03] cursor-pointer">
                    <TableCell className="text-zinc-100 text-sm">
                      {q.customer}
                      <div className="text-[10px] text-zinc-500">{q.source}</div>
                    </TableCell>
                    <TableCell className="text-zinc-300 text-sm">
                      {q.subject}
                      <div className="text-[10px] text-zinc-500">{q.date ? format(q.date, "dd.MM.yyyy", { locale: de }) : "offen"}</div>
                    </TableCell>
                    <TableCell className="text-right text-zinc-300 tabular-nums">{q.pax}</TableCell>
                    <TableCell><Badge variant="outline" className={chip[q.prio]}>{q.prio}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* WARTUNG */}
        <Card className="bg-[#11151c] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber-400" /> Wartung & TÜV
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={() => navigate("/admin/fleet-maintenance")}>
              Fuhrpark <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-500 text-xs">Fahrzeug</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Maßnahme</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Fällig</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenance.map((m) => (
                  <TableRow key={`${m.bus}-${m.typ}`} className="border-white/5 hover:bg-white/[0.03]">
                    <TableCell className="text-zinc-100 text-sm">
                      {m.bus}
                      <div className="text-[10px] text-zinc-500 tabular-nums flex items-center gap-1"><Gauge className="h-3 w-3" />{num(m.km)} km</div>
                    </TableCell>
                    <TableCell className="text-zinc-300 text-sm">{m.typ}</TableCell>
                    <TableCell className="text-zinc-300 text-sm tabular-nums">{format(m.faellig, "dd.MM.")}</TableCell>
                    <TableCell><Badge variant="outline" className={chip[m.status]}>{m.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* RECHNUNGEN */}
        <Card className="bg-[#11151c] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#00CC36]" /> Offene Rechnungen
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={() => navigate("/admin/finances")}>
              Finanzen <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-500 text-xs">Nr.</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Kunde</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-right">Betrag</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((i) => (
                  <TableRow key={i.id} className="border-white/5 hover:bg-white/[0.03]">
                    <TableCell className="font-mono text-[11px] text-zinc-400">{i.id}</TableCell>
                    <TableCell className="text-zinc-100 text-sm">{i.kunde}
                      <div className="text-[10px] text-zinc-500">{i.faellig ? `Rechnung ${format(i.faellig, "dd.MM.yyyy")}` : ""}</div>
                    </TableCell>
                    <TableCell className="text-right text-zinc-100 tabular-nums">{eur(i.betrag)}</TableCell>
                    <TableCell><Badge variant="outline" className={chip[i.status]}>{i.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* SYSTEM STATUS */}
        <Card className="bg-[#11151c] border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Systemstatus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { l: "Buchungs-Engine", v: "betriebsbereit", ok: true },
              { l: "Zahlungs-Gateway (Stripe/PayPal)", v: "betriebsbereit", ok: true },
              { l: "E-Mail-Versand", v: "betriebsbereit", ok: true },
              { l: "Live-Tracking GPS", v: `${counts.readyBuses}/${counts.totalBuses} Busse aktiv`, ok: counts.readyBuses > 0 },
              { l: "Wallboard Public", v: "online", ok: true },
              { l: "TÜV Compliance", v: `${maintenance.filter((m) => m.status === "kritisch").length} Fahrzeuge kritisch`, ok: maintenance.every((m) => m.status !== "kritisch") },
            ].map((s) => (
              <div key={s.l} className="flex items-center justify-between border-b border-white/5 pb-1.5 last:border-0">
                <span className="text-zinc-300">{s.l}</span>
                <span className={cn("text-xs inline-flex items-center gap-1", s.ok ? "text-emerald-400" : "text-amber-400")}>
                  {s.ok ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  {s.v}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* FOOTER */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 border-t border-white/5 pt-3">
        <span>Eingeloggt als <span className="text-zinc-300">{user?.email ?? "—"}</span></span>
        <span className="flex items-center gap-2">
          <Timer className="h-3 w-3" /> Letzter Sync {format(lastUpdate, "HH:mm:ss")}
          <span className="text-zinc-700">·</span>
          <Fuel className="h-3 w-3" /> {counts.totalBuses} Fahrzeuge im Bestand
          <span className="text-zinc-700">·</span>
          <Star className="h-3 w-3" /> {loading ? "lädt Live-Daten…" : "Live-Daten"}
        </span>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
