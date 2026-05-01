import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Bus, Calendar, MapPin, Clock, ArrowRight, Download, X, ChevronDown, Search, 
  Loader2, Ticket, Mail, Timer, FileText, RotateCcw, Shield,
  CheckCircle2, Plane, Users, CreditCard
} from "lucide-react";
import { format, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";
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
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { WalletPassButton } from "@/components/bookings/WalletPassButton";

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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

// Countdown component
const Countdown = ({ targetDate }: { targetDate: string }) => {
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const target = new Date(targetDate);
  const days = differenceInDays(target, now);
  const hours = differenceInHours(target, now) % 24;
  const mins = differenceInMinutes(target, now) % 60;

  if (days < 0) return <span className="text-muted-foreground text-sm">Reise beendet</span>;

  return (
    <div className="flex items-center gap-3">
      <Timer className="w-4 h-4 text-primary" />
      <div className="flex gap-2">
        {days > 0 && (
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{days}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Tage</div>
          </div>
        )}
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">{hours}</div>
          <div className="text-[10px] text-muted-foreground uppercase">Std</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">{mins}</div>
          <div className="text-[10px] text-muted-foreground uppercase">Min</div>
        </div>
      </div>
    </div>
  );
};

const BookingsPage = () => {
  const { user, profile } = useAuth();
  const { downloadTicket } = useTicketDownload();
  const { protect } = useRecaptcha();
  const [filter, setFilter] = useState<"all" | "upcoming" | "past" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tourBookings, setTourBookings] = useState<TourBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // Guest lookup state
  const [ticketNumber, setTicketNumber] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [guestBooking, setGuestBooking] = useState<Booking | null>(null);
  const [guestTourBooking, setGuestTourBooking] = useState<any | null>(null);

  useEffect(() => {
    if (user) {
      loadBookings();
      loadTourBookings();
    } else {
      setIsLoading(false);
    }
  }, [user, profile]);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trip:trips(departure_date, departure_time, arrival_time, route:routes(name)),
          origin_stop:stops!bookings_origin_stop_id_fkey(name, city),
          destination_stop:stops!bookings_destination_stop_id_fkey(name, city),
          seat:seats(seat_number)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Fehler beim Laden der Buchungen');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTourBookings = async () => {
    if (!user) return;
    const userEmail = profile?.email || user.email;
    if (!userEmail) return;

    try {
      const { data: byUserId } = await supabase
        .from('tour_bookings')
        .select(`
          id, booking_number, status, contact_first_name, contact_last_name, 
          contact_email, participants, total_price, created_at, payment_method,
          tour:package_tours(destination, country, duration_days),
          tour_date:tour_dates(departure_date, return_date, duration_days),
          tariff:tour_tariffs(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: byEmail } = await supabase
        .from('tour_bookings')
        .select(`
          id, booking_number, status, contact_first_name, contact_last_name, 
          contact_email, participants, total_price, created_at, payment_method,
          tour:package_tours(destination, country, duration_days),
          tour_date:tour_dates(departure_date, return_date, duration_days),
          tariff:tour_tariffs(name)
        `)
        .eq('contact_email', userEmail.toLowerCase())
        .order('created_at', { ascending: false });

      const allBookings = [...(byUserId || []), ...(byEmail || [])];
      const uniqueMap = new Map<string, TourBooking>();
      for (const b of allBookings) {
        if (!uniqueMap.has(b.id)) {
          uniqueMap.set(b.id, b as unknown as TourBooking);
        }
      }
      setTourBookings(Array.from(uniqueMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Error loading tour bookings:', error);
    }
  };

  const handleGuestLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketNumber.trim() || !lookupEmail.trim()) {
      toast.error('Bitte füllen Sie alle Felder aus.');
      return;
    }
    setIsLookingUp(true);
    setGuestBooking(null);
    setGuestTourBooking(null);
    
    try {
      const human = await protect('booking_lookup');
      if (!human) {
        toast.error('Sicherheitsprüfung fehlgeschlagen.');
        setIsLookingUp(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke('lookup-booking', {
        body: { 
          ticketNumber: ticketNumber.trim().toUpperCase(),
          email: lookupEmail.trim().toLowerCase()
        }
      });
      if (error) throw error;
      if (data?.success && data?.booking) {
        if (data.type === 'tour') setGuestTourBooking(data.booking);
        else setGuestBooking(data.booking);
        toast.success('Buchung gefunden!');
      } else {
        toast.error(data?.error || 'Buchung nicht gefunden.');
      }
    } catch (error: any) {
      toast.error('Buchung nicht gefunden. Bitte überprüfen Sie Ihre Angaben.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleDownloadTicket = async (bookingId: string, ticketNum?: string, email?: string) => {
    setDownloadingId(bookingId);
    if (ticketNum && email) {
      await downloadTicket({ ticketNumber: ticketNum, email });
    } else {
      await downloadTicket(bookingId);
    }
    setDownloadingId(null);
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);
      if (error) throw error;
      toast.success('Buchung wurde storniert.');
      if (user) loadBookings();
    } catch (error) {
      toast.error('Fehler beim Stornieren der Buchung');
    }
  };

  const handleCancelTourBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase.functions.invoke('cancel-tour-booking', {
        body: { bookingId }
      });
      if (error) throw error;
      toast.success('Reisebuchung wurde storniert.');
      loadTourBookings();
    } catch (error) {
      toast.error('Fehler beim Stornieren. Bitte kontaktieren Sie uns.');
    }
  };

  const getDisplayStatus = (status: string) => {
    if (status === 'confirmed' || status === 'paid') return { label: "Bestätigt", icon: CheckCircle2, className: "bg-primary/10 text-primary border-primary/20" };
    if (status === 'completed') return { label: "Abgeschlossen", icon: CheckCircle2, className: "bg-muted text-muted-foreground border-border" };
    if (status === 'cancelled') return { label: "Storniert", icon: X, className: "bg-destructive/10 text-destructive border-destructive/20" };
    return { label: "Ausstehend", icon: Clock, className: "bg-accent/10 text-accent border-accent/20" };
  };

  const formatTime = (time: string) => time?.substring(0, 5) || '';

  const isUpcoming = (dateStr: string) => new Date(dateStr) > new Date();

  // Stats
  const stats = useMemo(() => {
    const totalTrips = bookings.length + tourBookings.length;
    const upcoming = bookings.filter(b => isUpcoming(b.trip.departure_date) && b.status !== 'cancelled').length
      + tourBookings.filter(tb => tb.tour_date && isUpcoming(tb.tour_date.departure_date) && tb.status !== 'cancelled').length;
    const totalSpent = bookings.reduce((s, b) => s + b.price_paid, 0) + tourBookings.reduce((s, tb) => s + (tb.total_price || 0), 0);
    return { totalTrips, upcoming, totalSpent };
  }, [bookings, tourBookings]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 pt-20 lg:pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // Guest view
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 pt-16 lg:pt-20">
          {/* Hero */}
          <section className="relative overflow-hidden py-20 lg:py-28 bg-secondary">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_70%)]" />
            <div className="container mx-auto px-4 relative z-10 text-center">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <Badge className="mb-5 bg-primary/20 text-primary border-0 text-sm px-4 py-1.5">
                  <Search className="w-3.5 h-3.5 mr-1.5" />
                  Buchung abrufen
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold text-secondary-foreground mb-5">
                  Ihre <span className="gradient-text">Reise</span> finden
                </h1>
                <p className="text-lg text-secondary-foreground/70 max-w-2xl mx-auto">
                  Geben Sie Ihre Buchungsnummer und E-Mail-Adresse ein, um Ihre Buchungsdetails abzurufen.
                </p>
              </motion.div>
            </div>
          </section>
          
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-lg mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="bg-card rounded-2xl border border-border p-8" style={{ boxShadow: "var(--shadow-elevated)" }}>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <Ticket className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-6">Buchung suchen</h2>
                  
                  <form onSubmit={handleGuestLookup} className="space-y-5">
                    <div>
                      <Label>Buchungs- / Ticketnummer *</Label>
                      <Input
                        value={ticketNumber}
                        onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
                        placeholder="MT-XXXXXXXX oder TKT-2025-123456"
                        className="mt-1.5 font-mono"
                        maxLength={20}
                      />
                    </div>
                    <div>
                      <Label>E-Mail-Adresse *</Label>
                      <div className="relative mt-1.5">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="email"
                          value={lookupEmail}
                          onChange={(e) => setLookupEmail(e.target.value)}
                          placeholder="ihre@email.de"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12" disabled={isLookingUp}>
                      {isLookingUp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                      {isLookingUp ? 'Suche läuft...' : 'Buchung suchen'}
                    </Button>
                  </form>
                </div>
              </motion.div>

              {/* Guest results */}
              {(guestBooking || guestTourBooking) && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                  <h3 className="text-lg font-bold text-foreground mb-4">Ihre Buchung</h3>
                  {guestBooking && renderBusCard(guestBooking, true)}
                  {guestTourBooking && renderTourCard(guestTourBooking)}
                </motion.div>
              )}

              {/* Login prompt */}
              <div className="text-center mt-10 p-8 bg-muted/50 rounded-2xl border border-border">
                <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  Melden Sie sich an, um alle Ihre Buchungen zu verwalten.
                </p>
                <Button variant="outline" asChild>
                  <Link to="/auth">Jetzt anmelden</Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  function renderBusCard(booking: Booking, isGuest = false) {
    const statusConfig = getDisplayStatus(booking.status);
    const StatusIcon = statusConfig.icon;
    const departureDate = new Date(booking.trip.departure_date);
    const upcoming = isUpcoming(booking.trip.departure_date);

    return (
      <div key={booking.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 transition-all" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="p-5 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Date block */}
            <div className="flex items-center gap-4 lg:w-56">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex flex-col items-center justify-center shrink-0">
                <span className="text-lg font-bold text-primary">{format(departureDate, "dd")}</span>
                <span className="text-xs text-primary uppercase">{format(departureDate, "MMM", { locale: de })}</span>
              </div>
              <div>
                <Badge variant="outline" className={cn("text-xs font-medium gap-1", statusConfig.className)}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </Badge>
                <div className="text-xs text-muted-foreground font-mono mt-1">{booking.ticket_number}</div>
              </div>
            </div>

            {/* Route */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">{formatTime(booking.trip.departure_time)}</div>
                  <div className="text-sm text-muted-foreground">{booking.origin_stop.city}</div>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="h-px bg-border flex-1" />
                  <Bus className="w-4 h-4 text-muted-foreground" />
                  <div className="h-px bg-border flex-1" />
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">{formatTime(booking.trip.arrival_time)}</div>
                  <div className="text-sm text-muted-foreground">{booking.destination_stop.city}</div>
                </div>
              </div>
            </div>

            {/* Price + Countdown */}
            <div className="flex items-center justify-between lg:justify-end gap-6">
              {upcoming && booking.status !== 'cancelled' && (
                <Countdown targetDate={booking.trip.departure_date} />
              )}
              <div className="text-right">
                <div className="text-xl font-bold text-primary">€{booking.price_paid.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Sitz {booking.seat.seat_number}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                className="shrink-0"
              >
                <ChevronDown className={cn("w-5 h-5 transition-transform", expandedBooking === booking.id && "rotate-180")} />
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded */}
        <div className={cn("overflow-hidden transition-all duration-300", expandedBooking === booking.id ? "max-h-80" : "max-h-0")}>
          <div className="px-5 lg:px-6 pb-5 lg:pb-6 pt-3 border-t border-border">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3 text-sm">
                <h4 className="font-semibold text-foreground">Reisedetails</h4>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{format(departureDate, "EEEE, dd. MMMM yyyy", { locale: de })}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{booking.origin_stop.name} → {booking.destination_stop.name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bus className="w-4 h-4" />
                  <span>{booking.trip.route.name} • Sitz {booking.seat.seat_number}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col gap-2">
                <h4 className="font-semibold text-foreground text-sm">Aktionen</h4>
                {booking.status !== "cancelled" && (
                  <WalletPassButton
                    bookingId={booking.id}
                    ticketNumber={booking.ticket_number}
                    bookingType="bus"
                  />
                )}
                {(booking.status === "confirmed" || booking.status === "pending") && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2"
                      onClick={() => isGuest 
                        ? handleDownloadTicket(booking.id, booking.ticket_number, lookupEmail)
                        : handleDownloadTicket(booking.id)
                      }
                      disabled={downloadingId === booking.id}
                    >
                      {downloadingId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Ticket herunterladen
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2"
                      onClick={() => handleDownloadTicket(booking.id)}
                      disabled={downloadingId === booking.id}
                    >
                      <FileText className="w-4 h-4" />
                      Buchungsbestätigung
                    </Button>
                    {!isGuest && upcoming && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        <X className="w-4 h-4" />
                        Stornieren
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderTourCard(tb: TourBooking) {
    const statusConfig = getDisplayStatus(tb.status);
    const StatusIcon = statusConfig.icon;
    const upcoming = tb.tour_date ? isUpcoming(tb.tour_date.departure_date) : false;
    const isExpanded = expandedBooking === tb.id;

    return (
      <div key={tb.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 transition-all" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {tb.tour_date && (
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex flex-col items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary">{format(new Date(tb.tour_date.departure_date), "dd")}</span>
                  <span className="text-xs text-primary uppercase">{format(new Date(tb.tour_date.departure_date), "MMM", { locale: de })}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={cn("text-xs font-medium gap-1", statusConfig.className)}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{tb.booking_number}</span>
                </div>
                <h3 className="font-semibold text-foreground">
                  {tb.tour?.destination}{tb.tour?.country ? `, ${tb.tour.country}` : ''}
                </h3>
                {tb.tour_date && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {format(new Date(tb.tour_date.departure_date), "dd.MM.yyyy")} – {format(new Date(tb.tour_date.return_date), "dd.MM.yyyy")}
                    {tb.tour_date.duration_days ? ` • ${tb.tour_date.duration_days} Tage` : ''}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {upcoming && tb.status !== 'cancelled' && tb.tour_date && (
                <Countdown targetDate={tb.tour_date.departure_date} />
              )}
              <div className="text-right">
                <div className="text-xl font-bold text-primary">€{tb.total_price?.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  <Users className="w-3 h-3" />
                  {tb.participants} Teilnehmer
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpandedBooking(isExpanded ? null : tb.id)}
                className="shrink-0"
              >
                <ChevronDown className={cn("w-5 h-5 transition-transform", isExpanded && "rotate-180")} />
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded details */}
        <div className={cn("overflow-hidden transition-all duration-300", isExpanded ? "max-h-96" : "max-h-0")}>
          <div className="px-5 lg:px-6 pb-5 lg:pb-6 pt-3 border-t border-border">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3 text-sm">
                <h4 className="font-semibold text-foreground">Reisedetails</h4>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{tb.tour?.destination}, {tb.tour?.country}</span>
                </div>
                {tb.tariff && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Ticket className="w-4 h-4" />
                    <span>Tarif: {tb.tariff.name}</span>
                  </div>
                )}
                {tb.payment_method && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="w-4 h-4" />
                    <span>Zahlung: {tb.payment_method === 'paypal' ? 'PayPal' : tb.payment_method === 'stripe' ? 'Kreditkarte' : tb.payment_method}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Gebucht: {format(new Date(tb.created_at), "dd.MM.yyyy, HH:mm", { locale: de })}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <h4 className="font-semibold text-foreground text-sm">Aktionen</h4>
                {(tb.status === 'confirmed' || tb.status === 'paid' || tb.status === 'pending') && (
                  <>
                    <Button variant="outline" size="sm" className="justify-start gap-2">
                      <FileText className="w-4 h-4" />
                      Buchungsbestätigung
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start gap-2">
                      <Download className="w-4 h-4" />
                      Rechnung herunterladen
                    </Button>
                    {upcoming && (
                      <WalletPassButton
                        bookingId={tb.id}
                        ticketNumber={tb.booking_number}
                        bookingType="tour"
                      />
                    )}
                    {upcoming && (
                      <>
                        <Button variant="outline" size="sm" className="justify-start gap-2">
                          <RotateCcw className="w-4 h-4" />
                          Umbuchung anfragen
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleCancelTourBooking(tb.id)}
                        >
                          <X className="w-4 h-4" />
                          Stornieren
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter logic
  const filteredBusBookings = bookings.filter(b => {
    const matchesSearch = !searchQuery || 
      b.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.origin_stop.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.destination_stop.city.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "all") return true;
    if (filter === "upcoming") return isUpcoming(b.trip.departure_date) && b.status !== 'cancelled';
    if (filter === "past") return !isUpcoming(b.trip.departure_date) && b.status !== 'cancelled';
    if (filter === "cancelled") return b.status === 'cancelled';
    return true;
  });

  const filteredTourBookings = tourBookings.filter(tb => {
    const matchesSearch = !searchQuery ||
      tb.booking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tb.contact_first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tb.tour?.destination?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "all") return true;
    if (filter === "upcoming") return tb.tour_date ? isUpcoming(tb.tour_date.departure_date) && tb.status !== 'cancelled' : false;
    if (filter === "past") return tb.tour_date ? !isUpcoming(tb.tour_date.departure_date) && tb.status !== 'cancelled' : false;
    if (filter === "cancelled") return tb.status === 'cancelled';
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-16 lg:pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 lg:py-24 bg-secondary">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_70%)]" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="mb-5 bg-primary/20 text-primary border-0 text-sm px-4 py-1.5">
                <Plane className="w-3.5 h-3.5 mr-1.5" />
                Meine Reisen
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-secondary-foreground mb-3">
                Willkommen zurück, <span className="gradient-text">{profile?.first_name || 'Reisender'}</span>
              </h1>
              <p className="text-lg text-secondary-foreground/70 max-w-2xl">
                Verwalten Sie Ihre Buchungen, laden Sie Dokumente herunter und behalten Sie Ihre kommenden Reisen im Blick.
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-4 mt-10 max-w-xl"
            >
              <div className="bg-background/10 backdrop-blur-sm rounded-xl p-4 border border-secondary-foreground/10">
                <div className="text-2xl font-bold text-secondary-foreground">{stats.totalTrips}</div>
                <div className="text-sm text-secondary-foreground/60">Gesamt</div>
              </div>
              <div className="bg-background/10 backdrop-blur-sm rounded-xl p-4 border border-secondary-foreground/10">
                <div className="text-2xl font-bold text-primary">{stats.upcoming}</div>
                <div className="text-sm text-secondary-foreground/60">Kommende</div>
              </div>
              <div className="bg-background/10 backdrop-blur-sm rounded-xl p-4 border border-secondary-foreground/10">
                <div className="text-2xl font-bold text-secondary-foreground">€{stats.totalSpent.toFixed(0)}</div>
                <div className="text-sm text-secondary-foreground/60">Ausgegeben</div>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 lg:py-12">
          {/* Filters */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col lg:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buchungsnummer, Ziel oder Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {([
                { key: "all", label: "Alle" },
                { key: "upcoming", label: "Kommende" },
                { key: "past", label: "Vergangene" },
                { key: "cancelled", label: "Storniert" },
              ] as const).map((f) => (
                <Button
                  key={f.key}
                  variant={filter === f.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f.key)}
                  className="rounded-full"
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Tour Bookings */}
          {filteredTourBookings.length > 0 && (
            <div className="space-y-4 mb-10">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Plane className="w-5 h-5 text-primary" />
                Pauschalreisen
              </h2>
              {filteredTourBookings.map((tb, i) => (
                <motion.div key={tb.id} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                  {renderTourCard(tb)}
                </motion.div>
              ))}
            </div>
          )}

          {/* Bus Bookings */}
          {filteredBusBookings.length > 0 && (
            <div className="space-y-4 mb-10">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Bus className="w-5 h-5 text-primary" />
                Busfahrten
              </h2>
              {filteredBusBookings.map((b, i) => (
                <motion.div key={b.id} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                  {renderBusCard(b)}
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {filteredBusBookings.length === 0 && filteredTourBookings.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center py-20 bg-card rounded-2xl border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Plane className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {searchQuery ? "Keine Ergebnisse" : "Noch keine Buchungen"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchQuery
                    ? "Keine Buchungen entsprechen Ihrer Suche."
                    : "Entdecken Sie unsere Reiseangebote und buchen Sie Ihre erste Reise."}
                </p>
                <Button asChild>
                  <Link to="/reisen">
                    Reisen entdecken
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingsPage;
