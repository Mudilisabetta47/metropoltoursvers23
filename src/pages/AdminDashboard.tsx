import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Route, Bus, Calendar, Plus, RefreshCw, FileText, Users, 
  AlertCircle, Clock, Euro, CheckCircle, TrendingUp,
  ChevronRight, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { UnifiedDashboard } from "@/components/admin/core/UnifiedDashboard";

// Status color system
const statusColors: Record<string, string> = {
  draft: "bg-zinc-500/20 text-zinc-300 border-zinc-600",
  pending: "bg-amber-500/20 text-amber-300 border-amber-600",
  confirmed: "bg-blue-500/20 text-blue-300 border-blue-600",
  paid: "bg-emerald-500/20 text-emerald-300 border-emerald-600",
  cancelled: "bg-red-500/20 text-red-300 border-red-600",
  in_progress: "bg-orange-500/20 text-orange-300 border-orange-600",
};

const statusLabels: Record<string, string> = {
  draft: "Entwurf",
  pending: "Offen",
  confirmed: "Bestätigt",
  paid: "Bezahlt",
  cancelled: "Storniert",
  in_progress: "In Bearbeitung",
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Stats
  const [stats, setStats] = useState({
    activeBookings: 0,
    activeBookingsDelta: 0,
    openItems: 0,
    urgentItems: 0,
    revenueMonth: 0,
    revenueLastMonth: 0,
    revenueDelta: 0,
    activeBuses: 0,
    totalBuses: 0,
    busesInMaintenance: 0,
    openPayments: 0,
    openPaymentsAmount: 0,
    todayDepartures: 0,
    newInquiries: 0,
  });

  // Work lists
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [upcomingDepartures, setUpcomingDepartures] = useState<any[]>([]);
  const [unpaidBookings, setUnpaidBookings] = useState<any[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
  const [todoItems, setTodoItems] = useState<any[]>([]);

  useEffect(() => {
    if (user && isAdmin) loadData();
  }, [user, isAdmin]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const today = format(now, "yyyy-MM-dd");
      const yesterday = format(new Date(now.getTime() - 86400000), "yyyy-MM-dd");

      const [
        bookingsRes,
        bookingsYesterdayRes,
        busesRes,
        inquiriesRes,
        departuresRes,
      ] = await Promise.all([
        supabase.from("tour_bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("tour_bookings").select("id", { count: "exact", head: true }).lt("created_at", yesterday),
        supabase.from("buses").select("*"),
        supabase.from("package_tour_inquiries").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("tour_dates").select("*, package_tours(destination)").gte("departure_date", today).order("departure_date").limit(10),
      ]);

      const bookings = bookingsRes.data || [];
      const buses = busesRes.data || [];
      const inquiries = inquiriesRes.data || [];
      const departures = departuresRes.data || [];

      // Calculate stats
      const activeBookings = bookings.filter(b => b.status !== "cancelled").length;
      const pendingCount = bookings.filter(b => b.status === "pending").length;
      const unpaidCount = bookings.filter(b => b.status === "pending" && !b.paid_at).length;
      
      const thisMonthBookings = bookings.filter(b => 
        new Date(b.created_at) >= startOfMonth && b.status !== "cancelled"
      );
      const lastMonthBookings = bookings.filter(b => 
        new Date(b.created_at) >= startOfLastMonth && 
        new Date(b.created_at) <= endOfLastMonth && 
        b.status !== "cancelled"
      );
      
      const revenueMonth = thisMonthBookings.reduce((s, b) => s + Number(b.total_price), 0);
      const revenueLastMonth = lastMonthBookings.reduce((s, b) => s + Number(b.total_price), 0);
      const revenueDelta = revenueLastMonth > 0 ? Math.round(((revenueMonth - revenueLastMonth) / revenueLastMonth) * 100) : 0;

      const activeBuses = buses.filter(b => b.is_active).length;
      const todayDeps = departures.filter(d => d.departure_date === today).length;

      // Urgent = overdue more than 7 days
      const urgentCount = bookings.filter(b => 
        b.status === "pending" && differenceInDays(now, new Date(b.created_at)) > 7
      ).length;

      setStats({
        activeBookings,
        activeBookingsDelta: activeBookings - (bookingsYesterdayRes.count || 0),
        openItems: pendingCount,
        urgentItems: urgentCount,
        revenueMonth,
        revenueLastMonth,
        revenueDelta,
        activeBuses,
        totalBuses: buses.length,
        busesInMaintenance: buses.filter(b => !b.is_active).length,
        openPayments: unpaidCount,
        openPaymentsAmount: bookings.filter(b => b.status === "pending" && !b.paid_at).reduce((s, b) => s + Number(b.total_price), 0),
        todayDepartures: todayDeps,
        newInquiries: inquiries.filter(i => i.status === "new").length,
      });

      // Work lists
      setPendingBookings(bookings.filter(b => b.status === "pending").slice(0, 8));
      setUnpaidBookings(bookings.filter(b => b.status === "pending" && !b.paid_at).slice(0, 5));
      setUpcomingDepartures(departures.slice(0, 6));
      setRecentInquiries(inquiries.filter(i => i.status === "new").slice(0, 5));

      // Build todo list
      const todos: any[] = [];
      if (pendingCount > 0) todos.push({ icon: FileText, text: `${pendingCount} Buchungen bestätigen`, link: "/admin/tour-bookings", urgent: urgentCount > 0 });
      if (unpaidCount > 0) todos.push({ icon: Euro, text: `${unpaidCount} Zahlungen prüfen`, link: "/admin/finances", urgent: false });
      if (todayDeps > 0) todos.push({ icon: Calendar, text: `${todayDeps} Abfahrten heute`, link: "/admin/departures", urgent: false });
      if (inquiries.filter(i => i.status === "new").length > 0) todos.push({ icon: Users, text: `${inquiries.filter(i => i.status === "new").length} neue Anfragen`, link: "/admin/inquiries", urgent: false });
      setTodoItems(todos);

      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
  };

  return (
    <AdminLayout 
      title="Operative Übersicht" 
      subtitle="Disposition & Tagesgeschäft"
      actions={
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Aktualisiert: {format(lastUpdate, "HH:mm")} Uhr</span>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 h-8 bg-zinc-800/50 border-zinc-700 text-zinc-300 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="today" className="text-white text-xs">Heute</SelectItem>
              <SelectItem value="week" className="text-white text-xs">Diese Woche</SelectItem>
              <SelectItem value="month" className="text-white text-xs">Dieser Monat</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading} className="h-8 border-zinc-700 text-zinc-400 hover:bg-zinc-800 text-xs">
            <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? "animate-spin" : ""}`} /> Aktualisieren
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Unified Live KPI Dashboard */}
        <UnifiedDashboard />

        {/* KPI Cards - Professional naming with secondary info */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <Card className="bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer" onClick={() => navigate("/admin/tour-bookings")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 font-medium">Aktive Buchungen</span>
                <FileText className="w-4 h-4 text-zinc-600" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.activeBookings}</div>
              <div className="flex items-center gap-1 mt-1">
                {stats.activeBookingsDelta > 0 ? (
                  <><ArrowUpRight className="w-3 h-3 text-emerald-400" /><span className="text-xs text-emerald-400">+{stats.activeBookingsDelta} seit gestern</span></>
                ) : stats.activeBookingsDelta < 0 ? (
                  <><ArrowDownRight className="w-3 h-3 text-red-400" /><span className="text-xs text-red-400">{stats.activeBookingsDelta} seit gestern</span></>
                ) : (
                  <span className="text-xs text-zinc-500">keine Änderung</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/80 border-zinc-800 hover:border-amber-600/50 transition-colors cursor-pointer" onClick={() => navigate("/admin/tour-bookings")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 font-medium">Offene Vorgänge</span>
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-400">{stats.openItems}</div>
              <div className="text-xs text-zinc-500 mt-1">
                {stats.urgentItems > 0 && <span className="text-red-400">{stats.urgentItems} dringend</span>}
                {stats.urgentItems === 0 && <span>alle aktuell</span>}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer" onClick={() => navigate("/admin/finances")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 font-medium">Umsatz {format(new Date(), "MMMM", { locale: de })}</span>
                <TrendingUp className="w-4 h-4 text-zinc-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">{formatCurrency(stats.revenueMonth)}</div>
              <div className="flex items-center gap-1 mt-1">
                {stats.revenueDelta > 0 ? (
                  <><ArrowUpRight className="w-3 h-3 text-emerald-400" /><span className="text-xs text-emerald-400">+{stats.revenueDelta}% zum Vormonat</span></>
                ) : stats.revenueDelta < 0 ? (
                  <><ArrowDownRight className="w-3 h-3 text-red-400" /><span className="text-xs text-red-400">{stats.revenueDelta}% zum Vormonat</span></>
                ) : (
                  <span className="text-xs text-zinc-500">wie Vormonat</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer" onClick={() => navigate("/admin/buses")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 font-medium">Einsatzbereite Fahrzeuge</span>
                <Bus className="w-4 h-4 text-zinc-600" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.activeBuses} <span className="text-sm text-zinc-500 font-normal">/ {stats.totalBuses}</span></div>
              <div className="text-xs text-zinc-500 mt-1">
                {stats.busesInMaintenance > 0 && <span className="text-orange-400">{stats.busesInMaintenance} in Wartung</span>}
                {stats.busesInMaintenance === 0 && <span>alle einsatzbereit</span>}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/80 border-zinc-800 hover:border-red-600/50 transition-colors cursor-pointer" onClick={() => navigate("/admin/finances")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 font-medium">Offene Zahlungen</span>
                <Euro className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-400">{stats.openPayments}</div>
              <div className="text-xs text-zinc-500 mt-1">{formatCurrency(stats.openPaymentsAmount)}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer" onClick={() => navigate("/admin/departures")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 font-medium">Abfahrten heute</span>
                <Calendar className="w-4 h-4 text-zinc-600" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.todayDepartures}</div>
              <div className="text-xs text-zinc-500 mt-1">
                {stats.newInquiries > 0 && <span className="text-blue-400">{stats.newInquiries} neue Anfragen</span>}
                {stats.newInquiries === 0 && <span>keine neuen Anfragen</span>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Compact, single line */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500 mr-2">Schnellaktionen:</span>
          <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600" onClick={() => navigate("/admin/tour-bookings")}>
            <Plus className="w-3 h-3 mr-1" /> Buchung erstellen
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-700" onClick={() => navigate("/admin/departures")}>
            <Calendar className="w-3 h-3 mr-1" /> Abfahrt planen
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-700" onClick={() => navigate("/admin/tour-builder")}>
            <Route className="w-3 h-3 mr-1" /> Reise anlegen
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-700" onClick={() => navigate("/admin/customers")}>
            <Users className="w-3 h-3 mr-1" /> Kunde erfassen
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-700" onClick={() => navigate("/admin/cost-estimate")}>
            <Euro className="w-3 h-3 mr-1" /> Kostenvoranschlag
          </Button>
        </div>

        {/* Todo List */}
        {todoItems.length > 0 && (
          <Card className="bg-amber-950/20 border-amber-800/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-300">Heute zu erledigen</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {todoItems.map((item, i) => (
                  <Button 
                    key={i} 
                    size="sm" 
                    variant="outline" 
                    className={`h-7 text-xs border-amber-700/50 hover:bg-amber-600 hover:text-white hover:border-amber-600 ${item.urgent ? "text-red-300 border-red-700/50" : "text-amber-200"}`}
                    onClick={() => navigate(item.link)}
                  >
                    <item.icon className="w-3 h-3 mr-1" /> {item.text}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Work Tables Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Pending Bookings Table */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-zinc-400 font-medium">Offene Buchungen</CardTitle>
              <Button size="sm" variant="ghost" className="h-6 text-xs text-zinc-500 hover:text-white" onClick={() => navigate("/admin/tour-bookings")}>
                Alle anzeigen <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {pendingBookings.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-sm flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Keine offenen Buchungen
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-500 text-xs h-8">Nr.</TableHead>
                      <TableHead className="text-zinc-500 text-xs h-8">Kunde</TableHead>
                      <TableHead className="text-zinc-500 text-xs h-8">Betrag</TableHead>
                      <TableHead className="text-zinc-500 text-xs h-8">Tage</TableHead>
                      <TableHead className="text-zinc-500 text-xs h-8">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingBookings.map((b, i) => {
                      const daysOpen = differenceInDays(new Date(), new Date(b.created_at));
                      return (
                        <TableRow 
                          key={b.id} 
                          className={`border-zinc-800 cursor-pointer hover:bg-zinc-800/50 ${i % 2 === 0 ? "bg-zinc-900/50" : ""}`}
                          onClick={() => navigate(`/admin/booking/${b.id}`)}
                        >
                          <TableCell className="text-emerald-400 font-mono text-xs py-2">{b.booking_number}</TableCell>
                          <TableCell className="text-white text-xs py-2 max-w-[120px] truncate">{b.contact_first_name} {b.contact_last_name}</TableCell>
                          <TableCell className="text-white text-xs py-2 font-medium">{formatCurrency(b.total_price)}</TableCell>
                          <TableCell className={`text-xs py-2 ${daysOpen > 7 ? "text-red-400" : daysOpen > 3 ? "text-amber-400" : "text-zinc-400"}`}>{daysOpen}d</TableCell>
                          <TableCell className="py-2">
                            <Badge className={`text-[10px] ${statusColors[b.status] || statusColors.pending}`}>{statusLabels[b.status] || b.status}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Departures */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-zinc-400 font-medium">Nächste Abfahrten</CardTitle>
              <Button size="sm" variant="ghost" className="h-6 text-xs text-zinc-500 hover:text-white" onClick={() => navigate("/admin/departures")}>
                Alle anzeigen <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingDepartures.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-sm">Keine anstehenden Abfahrten</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-500 text-xs h-8">Datum</TableHead>
                      <TableHead className="text-zinc-500 text-xs h-8">Ziel</TableHead>
                      <TableHead className="text-zinc-500 text-xs h-8">Plätze</TableHead>
                      <TableHead className="text-zinc-500 text-xs h-8">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingDepartures.map((d, i) => (
                      <TableRow key={d.id} className={`border-zinc-800 ${i % 2 === 0 ? "bg-zinc-900/50" : ""}`}>
                        <TableCell className="text-white text-xs py-2">{format(new Date(d.departure_date), "dd.MM.yy", { locale: de })}</TableCell>
                        <TableCell className="text-white text-xs py-2 max-w-[140px] truncate">{d.package_tours?.destination || "–"}</TableCell>
                        <TableCell className="text-xs py-2">
                          <span className={d.booked_seats / d.total_seats > 0.8 ? "text-emerald-400" : "text-zinc-400"}>
                            {d.booked_seats}/{d.total_seats}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge className={`text-[10px] ${d.status === "available" ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-500/20 text-zinc-300"}`}>
                            {d.status === "available" ? "Verfügbar" : d.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Unpaid Bookings */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-zinc-400 font-medium flex items-center gap-2">
                <Euro className="w-3.5 h-3.5 text-red-400" /> Unbezahlte Vorgänge
              </CardTitle>
              <Button size="sm" variant="ghost" className="h-6 text-xs text-zinc-500 hover:text-white" onClick={() => navigate("/admin/finances")}>
                Finanzen <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {unpaidBookings.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-sm flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Alle bezahlt
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-500 text-xs h-8">Nr.</TableHead>
                      <TableHead className="text-zinc-500 text-xs h-8">Kunde</TableHead>
                      <TableHead className="text-zinc-500 text-xs h-8">Offen</TableHead>
                      <TableHead className="text-zinc-500 text-xs h-8">Fällig</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unpaidBookings.map((b, i) => {
                      const daysOpen = differenceInDays(new Date(), new Date(b.created_at));
                      return (
                        <TableRow 
                          key={b.id} 
                          className={`border-zinc-800 cursor-pointer hover:bg-zinc-800/50 ${i % 2 === 0 ? "bg-zinc-900/50" : ""}`}
                          onClick={() => navigate(`/admin/booking/${b.id}`)}
                        >
                          <TableCell className="text-emerald-400 font-mono text-xs py-2">{b.booking_number}</TableCell>
                          <TableCell className="text-white text-xs py-2 max-w-[120px] truncate">{b.contact_first_name} {b.contact_last_name}</TableCell>
                          <TableCell className="text-red-400 text-xs py-2 font-medium">{formatCurrency(b.total_price)}</TableCell>
                          <TableCell className={`text-xs py-2 ${daysOpen > 7 ? "text-red-400 font-medium" : "text-zinc-400"}`}>{daysOpen} Tage</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* New Inquiries */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-zinc-400 font-medium flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-blue-400" /> Neue Anfragen
              </CardTitle>
              <Button size="sm" variant="ghost" className="h-6 text-xs text-zinc-500 hover:text-white" onClick={() => navigate("/admin/inquiries")}>
                Alle anzeigen <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentInquiries.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-sm">Keine neuen Anfragen</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-500 text-xs h-8">Datum</TableHead>
                      <TableHead className="text-zinc-500 text-xs h-8">Kunde</TableHead>
                      <TableHead className="text-zinc-500 text-xs h-8">Ziel</TableHead>
                      <TableHead className="text-zinc-500 text-xs h-8">Pers.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInquiries.map((inq, i) => (
                      <TableRow key={inq.id} className={`border-zinc-800 cursor-pointer hover:bg-zinc-800/50 ${i % 2 === 0 ? "bg-zinc-900/50" : ""}`}>
                        <TableCell className="text-zinc-400 text-xs py-2">{format(new Date(inq.created_at), "dd.MM.", { locale: de })}</TableCell>
                        <TableCell className="text-white text-xs py-2 max-w-[120px] truncate">{inq.first_name} {inq.last_name}</TableCell>
                        <TableCell className="text-white text-xs py-2 max-w-[100px] truncate">{inq.destination}</TableCell>
                        <TableCell className="text-zinc-400 text-xs py-2">{inq.participants}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
