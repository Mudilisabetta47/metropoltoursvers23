import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Bus, Calendar, MapPin, Clock, ArrowRight, Download, X, Search,
  Loader2, Ticket, Mail, FileText, RotateCcw, Shield,
  CheckCircle2, Plane, Users, CreditCard, Radio, Sparkles, Compass
} from "lucide-react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, isToday, isYesterday } from "date-fns";
import { de } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTicketDownload } from "@/hooks/useTicketDownload";
import { useTourDocuments } from "@/hooks/useTourDocuments";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { WalletPassButton } from "@/components/bookings/WalletPassButton";
import journeyHero from "@/assets/journey-hero.jpg";

interface Booking {
  id: string;
  ticket_number: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  passenger_first_name: string;
  passenger_last_name: string;
  price_paid: number;
  created_at: string;
  trip: {
    departure_date: string;
    departure_time: string;
    arrival_time: string;
    route: { name: string };
  };
  origin_stop: { name: string; city: string };
  destination_stop: { name: string; city: string };
  seat: { seat_number: string };
}

interface TourBooking {
  id: string;
  booking_number: string;
  status: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  participants: number;
  total_price: number;
  created_at: string;
  payment_method?: string | null;
  tour?: { destination: string; country: string; duration_days: number } | null;
  tour_date?: { departure_date: string; return_date: string; duration_days: number | null } | null;
  tariff?: { name: string } | null;
}

type TimelineItem =
  | { kind: "bus"; date: Date; data: Booking; isUpcoming: boolean }
  | { kind: "tour"; date: Date; data: TourBooking; isUpcoming: boolean };

const TRACKING_BEFORE_H = 12;
const TRACKING_AFTER_H = 12;

const Countdown = ({ targetDate }: { targetDate: string }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const target = new Date(targetDate);
  const days = differenceInDays(target, now);
  const hours = differenceInHours(target, now) % 24;
  const mins = differenceInMinutes(target, now) % 60;
  if (days < 0) return null;
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
      <Sparkles className="w-3 h-3" />
      {days > 0 ? `in ${days} Tagen` : hours > 0 ? `in ${hours} Std ${mins} Min` : `in ${mins} Min`}
    </div>
  );
};

const BookingsPage = () => {
  const { user, profile } = useAuth();
  const { downloadTicket } = useTicketDownload();
  const { openDocument, isGenerating: isGeneratingTourDocument } = useTourDocuments();
  const { protect } = useRecaptcha();

  const [filter, setFilter] = useState<"all" | "upcoming" | "past" | "cancelled">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tourBookings, setTourBookings] = useState<TourBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Guest lookup
  const [ticketNumber, setTicketNumber] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [guestBooking, setGuestBooking] = useState<Booking | null>(null);
  const [guestTourBooking, setGuestTourBooking] = useState<any | null>(null);

  useEffect(() => {
    if (user) {
      loadAll();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const loadAll = async () => {
    setIsLoading(true);
    await Promise.all([loadBookings(), loadTourBookings()]);
    setIsLoading(false);
  };

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          trip:trips(departure_date, departure_time, arrival_time, route:routes(name)),
          origin_stop:stops!bookings_origin_stop_id_fkey(name, city),
          destination_stop:stops!bookings_destination_stop_id_fkey(name, city),
          seat:seats(seat_number)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBookings((data as any) || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadTourBookings = async () => {
    if (!user) return;
    const userEmail = profile?.email || user.email;
    try {
      const queries = [
        supabase
          .from("tour_bookings")
          .select(`
            id, booking_number, status, contact_first_name, contact_last_name,
            contact_email, participants, total_price, created_at, payment_method,
            tour:package_tours(destination, country, duration_days),
            tour_date:tour_dates(departure_date, return_date, duration_days),
            tariff:tour_tariffs(name)
          `)
          .eq("user_id", user.id),
        userEmail
          ? supabase
              .from("tour_bookings")
              .select(`
                id, booking_number, status, contact_first_name, contact_last_name,
                contact_email, participants, total_price, created_at, payment_method,
                tour:package_tours(destination, country, duration_days),
                tour_date:tour_dates(departure_date, return_date, duration_days),
                tariff:tour_tariffs(name)
              `)
              .eq("contact_email", userEmail.toLowerCase())
          : Promise.resolve({ data: [] as any[] } as any),
      ];
      const [r1, r2] = await Promise.all(queries);
      const all = [...((r1 as any).data || []), ...((r2 as any).data || [])];
      const map = new Map<string, TourBooking>();
      all.forEach((b: any) => map.set(b.id, b));
      setTourBookings(
        Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleGuestLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketNumber.trim() || !lookupEmail.trim()) {
      toast.error("Bitte füllen Sie alle Felder aus.");
      return;
    }
    setIsLookingUp(true);
    setGuestBooking(null);
    setGuestTourBooking(null);
    try {
      const human = await protect("booking_lookup");
      if (!human) {
        toast.error("Sicherheitsprüfung fehlgeschlagen.");
        return;
      }
      const { data, error } = await supabase.functions.invoke("lookup-booking", {
        body: {
          ticketNumber: ticketNumber.trim().toUpperCase(),
          email: lookupEmail.trim().toLowerCase(),
        },
      });
      if (error) throw error;
      if (data?.success && data?.booking) {
        if (data.type === "tour") setGuestTourBooking(data.booking);
        else setGuestBooking(data.booking);
        toast.success("Buchung gefunden!");
      } else {
        toast.error(data?.error || "Buchung nicht gefunden.");
      }
    } catch {
      toast.error("Buchung nicht gefunden.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleDownloadTicket = async (bookingId: string, ticketNum?: string, email?: string) => {
    setDownloadingId(bookingId);
    if (ticketNum && email) await downloadTicket({ ticketNumber: ticketNum, email });
    else await downloadTicket(bookingId);
    setDownloadingId(null);
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
      if (error) throw error;
      toast.success("Buchung storniert.");
      loadBookings();
    } catch {
      toast.error("Fehler beim Stornieren.");
    }
  };

  const handleCancelTourBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase.functions.invoke("cancel-tour-booking", { body: { bookingId } });
      if (error) throw error;
      toast.success("Reisebuchung storniert.");
      loadTourBookings();
    } catch {
      toast.error("Fehler beim Stornieren.");
    }
  };

  const statusMeta = (status: string) => {
    if (status === "confirmed" || status === "paid")
      return { label: "Bestätigt", icon: CheckCircle2, dot: "bg-emerald-500", chip: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
    if (status === "completed")
      return { label: "Abgeschlossen", icon: CheckCircle2, dot: "bg-zinc-400", chip: "bg-muted text-muted-foreground border-border" };
    if (status === "cancelled")
      return { label: "Storniert", icon: X, dot: "bg-destructive", chip: "bg-destructive/10 text-destructive border-destructive/20" };
    return { label: "Ausstehend", icon: Clock, dot: "bg-amber-500", chip: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
  };

  const isUpcoming = (dateStr: string) => new Date(dateStr) > new Date();

  const isTrackable = (b: Booking) => {
    if (b.status === "cancelled") return false;
    const dep = new Date(`${b.trip.departure_date}T${b.trip.departure_time || "00:00"}`);
    const arr = new Date(`${b.trip.departure_date}T${b.trip.arrival_time || "23:59"}`);
    const opens = new Date(dep.getTime() - TRACKING_BEFORE_H * 3600_000);
    const closes = new Date(arr.getTime() + TRACKING_AFTER_H * 3600_000);
    const now = new Date();
    return now >= opens && now <= closes;
  };

  const stats = useMemo(() => {
    const totalTrips = bookings.length + tourBookings.length;
    const upcoming =
      bookings.filter((b) => isUpcoming(b.trip.departure_date) && b.status !== "cancelled").length +
      tourBookings.filter(
        (tb) => tb.tour_date && isUpcoming(tb.tour_date.departure_date) && tb.status !== "cancelled"
      ).length;
    const totalSpent =
      bookings.reduce((s, b) => s + b.price_paid, 0) +
      tourBookings.reduce((s, tb) => s + (tb.total_price || 0), 0);
    const countries = new Set<string>();
    tourBookings.forEach((tb) => tb.tour?.country && countries.add(tb.tour.country));
    return { totalTrips, upcoming, totalSpent, countries: countries.size };
  }, [bookings, tourBookings]);

  // ============ TIMELINE ============
  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    const matchesSearch = (txt: string) =>
      !searchQuery || txt.toLowerCase().includes(searchQuery.toLowerCase());

    bookings.forEach((b) => {
      const upc = isUpcoming(b.trip.departure_date);
      const passes =
        filter === "all" ||
        (filter === "upcoming" && upc && b.status !== "cancelled") ||
        (filter === "past" && !upc && b.status !== "cancelled") ||
        (filter === "cancelled" && b.status === "cancelled");
      const txt = `${b.ticket_number} ${b.origin_stop.city} ${b.destination_stop.city} ${b.trip.route.name}`;
      if (passes && matchesSearch(txt)) {
        items.push({ kind: "bus", date: new Date(b.trip.departure_date), data: b, isUpcoming: upc });
      }
    });

    tourBookings.forEach((tb) => {
      if (!tb.tour_date) return;
      const upc = isUpcoming(tb.tour_date.departure_date);
      const passes =
        filter === "all" ||
        (filter === "upcoming" && upc && tb.status !== "cancelled") ||
        (filter === "past" && !upc && tb.status !== "cancelled") ||
        (filter === "cancelled" && tb.status === "cancelled");
      const txt = `${tb.booking_number} ${tb.tour?.destination || ""} ${tb.tour?.country || ""}`;
      if (passes && matchesSearch(txt)) {
        items.push({ kind: "tour", date: new Date(tb.tour_date.departure_date), data: tb, isUpcoming: upc });
      }
    });

    return items.sort((a, b) =>
      filter === "past" ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime()
    );
  }, [bookings, tourBookings, filter, searchQuery]);

  // ============ RENDER ============

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // GUEST VIEW
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 pt-16 lg:pt-20">
          <section className="relative overflow-hidden py-20 lg:py-28 bg-secondary">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_70%)]" />
            <div className="container mx-auto px-4 relative z-10 text-center">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <Badge className="mb-5 bg-primary/20 text-primary border-0 text-sm px-4 py-1.5">
                  <Search className="w-3.5 h-3.5 mr-1.5" /> Buchung abrufen
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold text-secondary-foreground mb-5">
                  Ihre <span className="gradient-text">Reise</span> finden
                </h1>
                <p className="text-lg text-secondary-foreground/70 max-w-2xl mx-auto">
                  Geben Sie Ihre Buchungsnummer und E-Mail-Adresse ein.
                </p>
              </motion.div>
            </div>
          </section>
          <div className="container mx-auto px-4 py-12 max-w-lg">
            <div className="bg-card rounded-2xl border border-border p-8" style={{ boxShadow: "var(--shadow-elevated)" }}>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Ticket className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-6">Buchung suchen</h2>
              <form onSubmit={handleGuestLookup} className="space-y-5">
                <div>
                  <Label>Buchungs- / Ticketnummer *</Label>
                  <Input value={ticketNumber} onChange={(e) => setTicketNumber(e.target.value.toUpperCase())} placeholder="TKT-2025-123456" className="mt-1.5 font-mono" maxLength={20} />
                </div>
                <div>
                  <Label>E-Mail-Adresse *</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" value={lookupEmail} onChange={(e) => setLookupEmail(e.target.value)} placeholder="ihre@email.de" className="pl-10" />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12" disabled={isLookingUp}>
                  {isLookingUp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  {isLookingUp ? "Suche läuft..." : "Buchung suchen"}
                </Button>
              </form>
            </div>

            {(guestBooking || guestTourBooking) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-4">
                <h3 className="text-lg font-bold text-foreground">Ihre Buchung</h3>
                {guestBooking && <GuestBusCard booking={guestBooking} email={lookupEmail} onDownload={() => handleDownloadTicket(guestBooking.id, guestBooking.ticket_number, lookupEmail)} downloading={downloadingId === guestBooking.id} />}
              </motion.div>
            )}

            <div className="text-center mt-10 p-8 bg-muted/50 rounded-2xl border border-border">
              <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Melden Sie sich an, um alle Buchungen & Live-Tracking zu nutzen.</p>
              <Button variant="outline" asChild>
                <Link to="/auth">Jetzt anmelden</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-16 lg:pt-20">
        {/* ───── HERO ───── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={journeyHero}
              alt="Reise"
              className="w-full h-full object-cover"
              width={1600}
              height={900}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/95 via-secondary/85 to-secondary/70" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.25),transparent_60%)]" />
          </div>

          <div className="container mx-auto px-4 relative z-10 py-16 lg:py-24">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="mb-4 bg-white/15 text-white border-white/20 backdrop-blur text-sm px-4 py-1.5">
                <Compass className="w-3.5 h-3.5 mr-1.5" /> Reise-Tagebuch
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-3 leading-tight">
                Hallo {profile?.first_name || "Reisender"},
                <br />
                <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
                  deine Reisen warten.
                </span>
              </h1>
              <p className="text-lg text-white/80 max-w-2xl">
                Alle Tickets, Dokumente und Live-Standorte deiner Busse an einem Ort.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-10 max-w-3xl"
            >
              {[
                { label: "Gesamt", value: stats.totalTrips, icon: Ticket },
                { label: "Kommend", value: stats.upcoming, icon: Sparkles, accent: true },
                { label: "Länder", value: stats.countries, icon: Compass },
                { label: "Investiert", value: `€${stats.totalSpent.toFixed(0)}`, icon: CreditCard },
              ].map((s) => (
                <div
                  key={s.label}
                  className={cn(
                    "rounded-2xl p-4 border backdrop-blur-md",
                    s.accent ? "bg-primary/20 border-primary/30" : "bg-white/10 border-white/15"
                  )}
                >
                  <s.icon className={cn("w-4 h-4 mb-2", s.accent ? "text-primary-foreground" : "text-white/70")} />
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-white/70">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ───── CONTROLS ───── */}
        <section className="sticky top-16 lg:top-20 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="container mx-auto px-4 py-3 flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Reise, Ziel, Buchungsnummer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-full bg-muted/50 border-0"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5">
              {([
                { key: "upcoming", label: "Kommend", count: stats.upcoming },
                { key: "past", label: "Vergangen" },
                { key: "cancelled", label: "Storniert" },
                { key: "all", label: "Alle" },
              ] as const).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "shrink-0 px-4 h-9 rounded-full text-sm font-medium transition-all border",
                    filter === f.key
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
                  )}
                >
                  {f.label}
                  {"count" in f && f.count ? (
                    <span className={cn("ml-2 px-1.5 rounded-full text-[10px]", filter === f.key ? "bg-background/20" : "bg-primary/10 text-primary")}>{f.count}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ───── TIMELINE ───── */}
        <section className="container mx-auto px-4 py-10 lg:py-14">
          {timeline.length === 0 ? (
            <EmptyState searchQuery={searchQuery} />
          ) : (
            <div className="relative max-w-4xl mx-auto">
              {/* spine */}
              <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent lg:-translate-x-1/2" />

              <div className="space-y-10">
                <AnimatePresence mode="popLayout">
                  {timeline.map((item, i) => (
                    <TimelineRow
                      key={`${item.kind}-${item.data.id}`}
                      item={item}
                      index={i}
                      onDownload={(id, num) => handleDownloadTicket(id, num)}
                      downloadingId={downloadingId}
                      onCancelBus={handleCancelBooking}
                      onCancelTour={handleCancelTourBooking}
                      onOpenTourDoc={(tb, type) => openDocument({ bookingId: tb.id, bookingNumber: tb.booking_number }, type)}
                      tourDocLoading={isGeneratingTourDocument}
                      isTrackable={isTrackable}
                      statusMeta={statusMeta}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

// ============ COMPONENTS ============

const niceDateLabel = (d: Date) => {
  if (isToday(d)) return "Heute";
  if (isYesterday(d)) return "Gestern";
  return format(d, "EEEE, dd. MMMM yyyy", { locale: de });
};

const TimelineRow = ({
  item,
  index,
  onDownload,
  downloadingId,
  onCancelBus,
  onCancelTour,
  onOpenTourDoc,
  tourDocLoading,
  isTrackable,
  statusMeta,
}: {
  item: TimelineItem;
  index: number;
  onDownload: (id: string, ticketNum?: string) => void;
  downloadingId: string | null;
  onCancelBus: (id: string) => void;
  onCancelTour: (id: string) => void;
  onOpenTourDoc: (tb: TourBooking, type: "confirmation" | "invoice") => void;
  tourDocLoading: boolean;
  isTrackable: (b: Booking) => boolean;
  statusMeta: (s: string) => { label: string; icon: any; dot: string; chip: string };
}) => {
  const sideLeft = index % 2 === 0;
  const s = statusMeta(item.data.status);
  const StatusIcon = s.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05, duration: 0.45 }}
      className="relative lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6 items-start"
    >
      {/* Date pill (mobile = above, desktop = opposite side) */}
      <div className={cn("hidden lg:block", sideLeft ? "order-1 text-right pr-2" : "order-3 text-left pl-2")}>
        <div className="inline-flex flex-col gap-1.5 items-end">
          <div className={cn("text-xs uppercase tracking-wide text-muted-foreground", !sideLeft && "lg:text-left")}>{format(item.date, "yyyy")}</div>
          <div className={cn("text-base font-semibold text-foreground", !sideLeft && "lg:text-left")}>
            {niceDateLabel(item.date)}
          </div>
          {item.isUpcoming && item.data.status !== "cancelled" && (
            <Countdown
              targetDate={
                item.kind === "bus"
                  ? item.data.trip.departure_date
                  : (item.data as TourBooking).tour_date!.departure_date
              }
            />
          )}
        </div>
      </div>

      {/* Spine dot */}
      <div className="absolute left-4 lg:left-1/2 top-6 -translate-x-1/2 z-10">
        <div className={cn("w-4 h-4 rounded-full ring-4 ring-background", s.dot)} />
      </div>

      {/* Card */}
      <div className={cn("pl-12 lg:pl-0", sideLeft ? "lg:order-3" : "lg:order-1")}>
        {/* mobile date */}
        <div className="lg:hidden mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">{niceDateLabel(item.date)}</div>
          {item.isUpcoming && item.data.status !== "cancelled" && (
            <Countdown
              targetDate={
                item.kind === "bus"
                  ? item.data.trip.departure_date
                  : (item.data as TourBooking).tour_date!.departure_date
              }
            />
          )}
        </div>

        {item.kind === "bus" ? (
          <BusCard
            booking={item.data}
            statusMeta={s}
            StatusIcon={StatusIcon}
            trackable={isTrackable(item.data)}
            onDownload={() => onDownload(item.data.id)}
            downloading={downloadingId === item.data.id}
            onCancel={() => onCancelBus(item.data.id)}
            upcoming={item.isUpcoming}
          />
        ) : (
          <TourCard
            tb={item.data}
            statusMeta={s}
            StatusIcon={StatusIcon}
            onOpenDoc={(type) => onOpenTourDoc(item.data, type)}
            docLoading={tourDocLoading}
            onCancel={() => onCancelTour(item.data.id)}
            upcoming={item.isUpcoming}
          />
        )}
      </div>

      {/* Empty other side for alignment */}
      <div className={cn("hidden lg:block", sideLeft ? "lg:order-3" : "lg:order-1")} />
    </motion.div>
  );
};

const BusCard = ({
  booking,
  statusMeta: s,
  StatusIcon,
  trackable,
  onDownload,
  downloading,
  onCancel,
  upcoming,
}: {
  booking: Booking;
  statusMeta: { label: string; chip: string };
  StatusIcon: any;
  trackable: boolean;
  onDownload: () => void;
  downloading: boolean;
  onCancel: () => void;
  upcoming: boolean;
}) => (
  <div className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all" style={{ boxShadow: "var(--shadow-card)" }}>
    {trackable && (
      <div className="bg-gradient-to-r from-emerald-500 to-primary px-4 py-2 flex items-center justify-between text-white text-sm">
        <span className="flex items-center gap-2 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          Live verfügbar
        </span>
        <Link to={`/track/${booking.id}`} className="inline-flex items-center gap-1 font-semibold hover:underline">
          Bus tracken <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    )}

    <div className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[11px] gap-1", s.chip)}>
            <StatusIcon className="w-3 h-3" />
            {s.label}
          </Badge>
          <span className="text-[11px] text-muted-foreground font-mono">{booking.ticket_number}</span>
        </div>
        <Badge variant="secondary" className="text-[11px] gap-1">
          <Bus className="w-3 h-3" /> Sitz {booking.seat.seat_number}
        </Badge>
      </div>

      <h3 className="font-bold text-lg text-foreground mb-1">{booking.trip.route.name}</h3>

      <div className="flex items-stretch gap-3 mt-4">
        <div className="flex-1">
          <div className="text-2xl font-bold tabular-nums">{booking.trip.departure_time?.substring(0, 5)}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {booking.origin_stop.city}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center px-2">
          <div className="w-12 h-px bg-border" />
          <Bus className="w-3.5 h-3.5 text-muted-foreground my-1" />
          <div className="w-12 h-px bg-border" />
        </div>
        <div className="flex-1 text-right">
          <div className="text-2xl font-bold tabular-nums">{booking.trip.arrival_time?.substring(0, 5)}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 justify-end">
            <MapPin className="w-3 h-3" />
            {booking.destination_stop.city}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
        <div className="text-lg font-bold text-primary">€{booking.price_paid.toFixed(2)}</div>
        <div className="flex gap-2 flex-wrap justify-end">
          {(booking.status === "confirmed" || booking.status === "pending") && (
            <>
              <WalletPassButton bookingId={booking.id} ticketNumber={booking.ticket_number} bookingType="bus" />
              <Button size="sm" variant="outline" onClick={onDownload} disabled={downloading} className="gap-1.5">
                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Ticket
              </Button>
              {upcoming && (
                <Button size="sm" variant="ghost" onClick={onCancel} className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5">
                  <X className="w-3.5 h-3.5" /> Stornieren
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

const TourCard = ({
  tb,
  statusMeta: s,
  StatusIcon,
  onOpenDoc,
  docLoading,
  onCancel,
  upcoming,
}: {
  tb: TourBooking;
  statusMeta: { label: string; chip: string };
  StatusIcon: any;
  onOpenDoc: (type: "confirmation" | "invoice") => void;
  docLoading: boolean;
  onCancel: () => void;
  upcoming: boolean;
}) => (
  <div className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all" style={{ boxShadow: "var(--shadow-card)" }}>
    <div className="h-1.5 bg-gradient-to-r from-primary via-emerald-400 to-amber-300" />
    <div className="p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[11px] gap-1", s.chip)}>
            <StatusIcon className="w-3 h-3" /> {s.label}
          </Badge>
          <span className="text-[11px] text-muted-foreground font-mono">{tb.booking_number}</span>
        </div>
        <Badge variant="secondary" className="text-[11px] gap-1">
          <Users className="w-3 h-3" /> {tb.participants} Pax
        </Badge>
      </div>

      <h3 className="font-bold text-lg text-foreground">
        {tb.tour?.destination}
        {tb.tour?.country ? <span className="text-muted-foreground font-normal">, {tb.tour.country}</span> : null}
      </h3>

      {tb.tour_date && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
          <Calendar className="w-4 h-4 text-primary" />
          {format(new Date(tb.tour_date.departure_date), "dd.MM.yyyy")} –{" "}
          {format(new Date(tb.tour_date.return_date), "dd.MM.yyyy")}
          {tb.tour_date.duration_days ? ` • ${tb.tour_date.duration_days} Tage` : ""}
        </div>
      )}

      {tb.tariff && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1.5">
          <Ticket className="w-4 h-4 text-primary" /> Tarif: {tb.tariff.name}
        </div>
      )}

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
        <div>
          <div className="text-lg font-bold text-primary">€{tb.total_price?.toFixed(2)}</div>
          {tb.payment_method && (
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {tb.payment_method === "paypal" ? "PayPal" : tb.payment_method === "stripe" ? "Karte" : tb.payment_method}
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {(tb.status === "confirmed" || tb.status === "paid" || tb.status === "pending") && (
            <>
              <WalletPassButton bookingId={tb.id} ticketNumber={tb.booking_number} customerEmail={tb.contact_email} bookingType="tour" />
              <Button size="sm" variant="outline" onClick={() => onOpenDoc("confirmation")} disabled={docLoading} className="gap-1.5">
                {docLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                Bestätigung
              </Button>
              <Button size="sm" variant="outline" onClick={() => onOpenDoc("invoice")} disabled={docLoading} className="gap-1.5">
                <Download className="w-3.5 h-3.5" /> Rechnung
              </Button>
              {upcoming && (
                <Button size="sm" variant="ghost" onClick={onCancel} className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5">
                  <X className="w-3.5 h-3.5" /> Stornieren
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

const GuestBusCard = ({ booking, email, onDownload, downloading }: { booking: Booking; email: string; onDownload: () => void; downloading: boolean }) => (
  <div className="bg-card border border-border rounded-2xl p-5">
    <div className="flex items-center justify-between mb-3">
      <Badge variant="outline" className="text-xs font-mono">{booking.ticket_number}</Badge>
      <span className="text-xs text-muted-foreground">Sitz {booking.seat?.seat_number}</span>
    </div>
    <h3 className="font-bold mb-1">{booking.trip?.route?.name}</h3>
    <div className="text-sm text-muted-foreground mb-4">
      {format(new Date(booking.trip.departure_date), "dd.MM.yyyy")} • {booking.origin_stop?.city} → {booking.destination_stop?.city}
    </div>
    <div className="flex gap-2">
      <WalletPassButton bookingId={booking.id} ticketNumber={booking.ticket_number} customerEmail={email} bookingType="bus" />
      <Button size="sm" onClick={onDownload} disabled={downloading} className="gap-1.5">
        {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        Ticket
      </Button>
    </div>
  </div>
);

const EmptyState = ({ searchQuery }: { searchQuery: string }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 max-w-md mx-auto">
    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
      <Compass className="w-10 h-10 text-primary" />
    </div>
    <h3 className="text-2xl font-bold mb-2">{searchQuery ? "Keine Ergebnisse" : "Dein Reise-Tagebuch ist leer"}</h3>
    <p className="text-muted-foreground mb-6">
      {searchQuery ? "Keine Buchungen entsprechen deiner Suche." : "Entdecke unsere Reiseangebote und starte dein nächstes Abenteuer."}
    </p>
    <Button asChild size="lg">
      <Link to="/reisen">
        Reisen entdecken <ArrowRight className="w-4 h-4 ml-2" />
      </Link>
    </Button>
  </motion.div>
);

export default BookingsPage;
