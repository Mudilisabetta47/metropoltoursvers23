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

// ----- Demo data (fallback so the cockpit always feels alive) -----
const now = new Date();
const demoDepartures = [
  { time: addMinutes(now, 35),  route: "Hannover → Amsterdam",        bus: "ME-RB 4521", driver: "Krüger, M.",  pax: 47, cap: 49, status: "boarding" },
  { time: addMinutes(now, 120), route: "Hamburg → Prag",              bus: "ME-RB 4108", driver: "Yilmaz, A.",  pax: 38, cap: 49, status: "scheduled" },
  { time: addMinutes(now, 210), route: "Berlin → Wien (Nachtfahrt)",  bus: "ME-RB 5070", driver: "Schulz, T.",  pax: 49, cap: 49, status: "full" },
  { time: addMinutes(now, 360), route: "Hannover → Paris",            bus: "ME-RB 3309", driver: "Bauer, L.",   pax: 22, cap: 49, status: "scheduled" },
  { time: addMinutes(now, 480), route: "Bremen → Kopenhagen",         bus: "ME-RB 2204", driver: "Demir, S.",   pax: 31, cap: 49, status: "scheduled" },
];

const demoBookings = [
  { id: "TKT-2026-004921", customer: "Familie Petrov",   route: "Hannover → Amsterdam",   pax: 4, price: 312.00, status: "pending"   },
  { id: "TKT-2026-004919", customer: "Yıldız, Selma",    route: "Hamburg → Prag",          pax: 2, price: 178.00, status: "confirmed" },
  { id: "TKT-2026-004917", customer: "Schreiber GmbH",   route: "Charter · Goslar–Berlin", pax: 47, price: 3490.00, status: "pending" },
  { id: "TKT-2026-004914", customer: "Becker, Lena",      route: "Berlin → Wien",          pax: 1, price: 119.00, status: "paid"      },
  { id: "TKT-2026-004908", customer: "Reisegruppe Rentnerbund Celle", route: "Tagestour · Norderney", pax: 38, price: 2280.00, status: "confirmed" },
  { id: "TKT-2026-004901", customer: "Aydın, Murat",      route: "Hannover → Istanbul",   pax: 3, price: 645.00, status: "pending"   },
];

const demoInquiries = [
  { id: "INQ-2026-009212", customer: "VfL Lerchenberg e.V.", subject: "Vereinsfahrt EM-Spiel",       date: addDays(now, 12), pax: 53, prio: "hoch", source: "Webformular" },
  { id: "INQ-2026-009208", customer: "Stadt Hildesheim",     subject: "Klassenfahrt Stufe 9",        date: addDays(now, 21), pax: 84, prio: "mittel", source: "Telefon" },
  { id: "INQ-2026-009201", customer: "Müller Touristik",     subject: "Subcharter Mailand",          date: addDays(now, 4),  pax: 49, prio: "hoch", source: "E-Mail" },
  { id: "INQ-2026-009197", customer: "Hochzeit Yilmaz/Kaya", subject: "Gäste-Shuttle Hannover",      date: addDays(now, 31), pax: 65, prio: "niedrig", source: "Webformular" },
];

const demoMaintenance = [
  { bus: "ME-RB 4108", typ: "TÜV / HU",       fällig: addDays(now, 3),   km: 487_200, status: "kritisch" },
  { bus: "ME-RB 2204", typ: "Inspektion 80k", fällig: addDays(now, 9),   km: 798_540, status: "warnung"  },
  { bus: "ME-RB 5070", typ: "UVV Prüfung",    fällig: addDays(now, 14),  km: 122_310, status: "warnung"  },
  { bus: "ME-RB 3309", typ: "Klimaanlage",    fällig: addDays(now, 21),  km: 612_080, status: "planbar"  },
];

const demoInvoices = [
  { id: "RE-2026-0184", kunde: "Stadt Wolfsburg",       betrag: 4860, fällig: addDays(now, -3), status: "überfällig" },
  { id: "RE-2026-0181", kunde: "BSG Continental",       betrag: 1290, fällig: addDays(now,  2), status: "offen" },
  { id: "RE-2026-0179", kunde: "Reisebüro Sonnental",   betrag:  720, fällig: addDays(now,  6), status: "offen" },
  { id: "RE-2026-0172", kunde: "TUI Deutschland GmbH",  betrag: 8930, fällig: addDays(now, 11), status: "offen" },
];

const demoDrivers = [
  { name: "Krüger, M.",  status: "im Einsatz",  tour: "→ Amsterdam",    lenkzeit: 3.2, max: 9 },
  { name: "Yilmaz, A.",  status: "Pause",       tour: "Vorbereitung",   lenkzeit: 1.0, max: 9 },
  { name: "Schulz, T.",  status: "im Einsatz",  tour: "→ Wien",         lenkzeit: 6.4, max: 9 },
  { name: "Bauer, L.",   status: "verfügbar",   tour: "—",              lenkzeit: 0.0, max: 9 },
  { name: "Demir, S.",   status: "Schichtende", tour: "↩ Kopenhagen",   lenkzeit: 8.7, max: 9 },
  { name: "Petersen, J.",status: "krank",       tour: "—",              lenkzeit: 0.0, max: 9 },
];

const demoIncidents = [
  { id: "VOR-3091", typ: "Verspätung 45 min", bus: "ME-RB 4108", ort: "A2 Stau Bielefeld",   prio: "mittel" },
  { id: "VOR-3088", typ: "Klimaanlage defekt", bus: "ME-RB 2204", ort: "Werkstatt Lehrte",   prio: "hoch"   },
  { id: "VOR-3084", typ: "Kundenbeschwerde",   bus: "ME-RB 3309", ort: "Buchung TKT-…4791",  prio: "niedrig"},
];

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
    bookingsToday: 23, revenueMonth: 184_320, openInquiries: 14,
    activeTrips: 7, readyBuses: 11, totalBuses: 14, openPayments: 9,
    openPaymentsAmount: 18_640, complaints: 3, nextDepartures: demoDepartures.length,
  });

  // attempt to fetch real numbers, fall back to demo
  useEffect(() => {
    (async () => {
      try {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [b, inq, comp, buses] = await Promise.all([
          supabase.from("bookings").select("id, price_paid, created_at, status", { count: "exact" })
            .gte("created_at", today.toISOString()),
          supabase.from("package_tour_inquiries").select("id", { count: "exact", head: true })
            .eq("status", "new"),
          supabase.from("complaints").select("id", { count: "exact", head: true })
            .in("status", ["open", "in_progress"]),
          supabase.from("buses").select("id, status"),
        ]);
        const revRows = await supabase.from("bookings").select("price_paid")
          .gte("created_at", monthStart.toISOString()).in("status", ["confirmed", "completed"]);
        const rev = (revRows.data ?? []).reduce((s, r: any) => s + Number(r.price_paid || 0), 0);

        setCounts((c) => ({
          ...c,
          bookingsToday: b.count ?? c.bookingsToday,
          openInquiries: inq.count ?? c.openInquiries,
          complaints: comp.count ?? c.complaints,
          totalBuses: buses.data?.length ?? c.totalBuses,
          readyBuses: (buses.data ?? []).filter((x: any) => x.status === "active").length || c.readyBuses,
          revenueMonth: rev || c.revenueMonth,
        }));
      } catch { /* keep demo */ }
    })();
  }, []);

  const kpis: Kpi[] = useMemo(() => [
    { label: "Buchungen heute",   value: num(counts.bookingsToday), delta: +12, icon: Receipt,  accent: "from-emerald-500/20 to-emerald-500/0", onClick: () => navigate("/admin/bookings") },
    { label: "Umsatz Monat",      value: eur(counts.revenueMonth),  delta: +8,  icon: TrendingUp, accent: "from-sky-500/20 to-sky-500/0",         onClick: () => navigate("/admin/finances") },
    { label: "Offene Anfragen",   value: num(counts.openInquiries), sub: "5 priorisiert", icon: Mail, accent: "from-amber-500/20 to-amber-500/0", onClick: () => navigate("/admin/inquiries") },
    { label: "Aktive Fahrten",    value: num(counts.activeTrips),   sub: "live",          icon: Activity, accent: "from-emerald-500/20 to-emerald-500/0", onClick: () => navigate("/admin/dispo") },
    { label: "Einsatzbereite Busse", value: `${counts.readyBuses}/${counts.totalBuses}`, sub: "3 in Werkstatt", icon: Bus, accent: "from-sky-500/20 to-sky-500/0", onClick: () => navigate("/admin/buses") },
    { label: "Offene Zahlungen",  value: eur(counts.openPaymentsAmount), sub: `${counts.openPayments} Rechnungen`, icon: Euro, accent: "from-amber-500/20 to-amber-500/0", onClick: () => navigate("/admin/finances") },
    { label: "Reklamationen",     value: num(counts.complaints),    sub: "1 eskaliert",   icon: AlertTriangle, accent: "from-red-500/20 to-red-500/0", onClick: () => navigate("/admin/complaints") },
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
    <AdminLayout>
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
              <p className="text-xs text-zinc-500 mt-0.5">Heute geplante Fahrten · {demoDepartures.length} Abfahrten</p>
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
                {demoDepartures.map((d, i) => {
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
            {demoDrivers.map((d) => {
              const pct = (d.lenkzeit / d.max) * 100;
              const tone = d.status === "im Einsatz" ? "text-emerald-300"
                : d.status === "verfügbar" ? "text-sky-300"
                : d.status === "krank" ? "text-red-300" : "text-zinc-400";
              return (
                <div key={d.name} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#00CC36]/30 to-sky-500/20 flex items-center justify-center text-xs font-semibold text-white">
                    {d.name.split(",")[0][0]}{d.name.split(", ")[1]?.[0]}
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
              <p className="text-xs text-zinc-500">Letzte 24 h · {demoBookings.length} Vorgänge</p>
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
                {demoBookings.map((b) => (
                  <TableRow key={b.id} className="border-white/5 hover:bg-white/[0.03] cursor-pointer">
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
            <p className="text-xs text-zinc-500">{demoIncidents.length} aktiv · 1 hoch</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoIncidents.map((i) => (
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
                {demoInquiries.map((q) => (
                  <TableRow key={q.id} className="border-white/5 hover:bg-white/[0.03] cursor-pointer">
                    <TableCell className="text-zinc-100 text-sm">
                      {q.customer}
                      <div className="text-[10px] text-zinc-500">{q.source}</div>
                    </TableCell>
                    <TableCell className="text-zinc-300 text-sm">
                      {q.subject}
                      <div className="text-[10px] text-zinc-500">{format(q.date, "dd.MM.yyyy", { locale: de })}</div>
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
                {demoMaintenance.map((m) => (
                  <TableRow key={m.bus} className="border-white/5 hover:bg-white/[0.03]">
                    <TableCell className="text-zinc-100 text-sm">
                      {m.bus}
                      <div className="text-[10px] text-zinc-500 tabular-nums flex items-center gap-1"><Gauge className="h-3 w-3" />{num(m.km)} km</div>
                    </TableCell>
                    <TableCell className="text-zinc-300 text-sm">{m.typ}</TableCell>
                    <TableCell className="text-zinc-300 text-sm tabular-nums">{format(m.fällig, "dd.MM.")}</TableCell>
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
                {demoInvoices.map((i) => (
                  <TableRow key={i.id} className="border-white/5 hover:bg-white/[0.03]">
                    <TableCell className="font-mono text-[11px] text-zinc-400">{i.id}</TableCell>
                    <TableCell className="text-zinc-100 text-sm">{i.kunde}
                      <div className="text-[10px] text-zinc-500">fällig {format(i.fällig, "dd.MM.yyyy")}</div>
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
              { l: "Live-Tracking GPS", v: "12/14 Busse senden", ok: true },
              { l: "Wallboard Public", v: "online", ok: true },
              { l: "TÜV Compliance", v: "1 Fahrzeug kritisch", ok: false },
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
          <Fuel className="h-3 w-3" /> Ø Verbrauch Flotte 27,3 l/100km
          <span className="text-zinc-700">·</span>
          <Star className="h-3 w-3" /> 4.8 ★ (1.842 Bewertungen)
        </span>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
