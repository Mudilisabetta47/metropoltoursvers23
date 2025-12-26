import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bus, Calendar, MapPin, Clock, ArrowRight, Download, X, ChevronDown, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTicketDownload } from "@/hooks/useTicketDownload";

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

const BookingsPage = () => {
  const { user } = useAuth();
  const { downloadTicket, isDownloading } = useTicketDownload();
  const [filter, setFilter] = useState<"all" | "confirmed" | "completed" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBookings();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trip:trips(
            departure_date,
            departure_time,
            arrival_time,
            route:routes(name)
          ),
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

  const handleDownloadTicket = async (bookingId: string) => {
    setDownloadingId(bookingId);
    await downloadTicket(bookingId);
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
      loadBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Fehler beim Stornieren der Buchung');
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesFilter = filter === "all" || booking.status === filter;
    const matchesSearch = 
      booking.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.origin_stop.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.destination_stop.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${booking.passenger_first_name} ${booking.passenger_last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getDisplayStatus = (status: string) => {
    const departureDate = new Date();
    if (status === 'confirmed') {
      return { label: "Bestätigt", className: "bg-primary/10 text-primary" };
    }
    if (status === 'completed') {
      return { label: "Abgeschlossen", className: "bg-muted text-muted-foreground" };
    }
    if (status === 'cancelled') {
      return { label: "Storniert", className: "bg-destructive/10 text-destructive" };
    }
    return { label: "Ausstehend", className: "bg-accent/10 text-accent-foreground" };
  };

  const formatTime = (time: string) => time?.substring(0, 5) || '';

  const calculateDuration = (departure: string, arrival: string) => {
    const [depHours, depMins] = departure.split(':').map(Number);
    const [arrHours, arrMins] = arrival.split(':').map(Number);
    
    let totalMinutes = (arrHours * 60 + arrMins) - (depHours * 60 + depMins);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}min`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 pt-20 lg:pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 pt-20 lg:pt-24">
          <section className="bg-primary py-12 lg:py-16">
            <div className="container mx-auto px-4">
              <h1 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-2">
                Meine Buchungen
              </h1>
            </div>
          </section>
          <div className="container mx-auto px-4 py-16 text-center">
            <Bus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Bitte anmelden</h3>
            <p className="text-muted-foreground mb-6">
              Melden Sie sich an, um Ihre Buchungen zu sehen.
            </p>
            <Button asChild>
              <Link to="/auth">Jetzt anmelden</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      
      <main className="flex-1 pt-20 lg:pt-24">
        {/* Hero */}
        <section className="bg-primary py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-2">
              Meine Buchungen
            </h1>
            <p className="text-primary-foreground/80">
              Verwalten Sie Ihre Reisen und laden Sie Ihre Tickets herunter.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {/* Filters & Search */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Ticketnummer, Name oder Stadt suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all", "confirmed", "completed", "cancelled"] as const).map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(status)}
                >
                  {status === "all" && "Alle"}
                  {status === "confirmed" && "Bestätigt"}
                  {status === "completed" && "Abgeschlossen"}
                  {status === "cancelled" && "Storniert"}
                </Button>
              ))}
            </div>
          </div>

          {/* Bookings List */}
          {filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const statusConfig = getDisplayStatus(booking.status);
                const departureDate = new Date(booking.trip.departure_date);
                const duration = calculateDuration(booking.trip.departure_time, booking.trip.arrival_time);

                return (
                  <div
                    key={booking.id}
                    className="bg-card rounded-xl shadow-card overflow-hidden"
                  >
                    {/* Main Row */}
                    <div className="p-4 lg:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Date & Status */}
                        <div className="flex items-center gap-4 lg:w-48">
                          <div className="w-14 h-14 bg-primary/10 rounded-xl flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-primary">
                              {format(departureDate, "dd")}
                            </span>
                            <span className="text-xs text-primary uppercase">
                              {format(departureDate, "MMM", { locale: de })}
                            </span>
                          </div>
                          <div>
                            <div className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium inline-block mb-1",
                              statusConfig.className
                            )}>
                              {statusConfig.label}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">{booking.ticket_number}</div>
                          </div>
                        </div>

                        {/* Route */}
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-xl font-bold text-foreground">{formatTime(booking.trip.departure_time)}</div>
                              <div className="text-sm text-muted-foreground">{booking.origin_stop.city}</div>
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                              <div className="h-px bg-border flex-1" />
                              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                <Clock className="w-3 h-3" />
                                {duration}
                              </div>
                              <div className="h-px bg-border flex-1" />
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-foreground">{formatTime(booking.trip.arrival_time)}</div>
                              <div className="text-sm text-muted-foreground">{booking.destination_stop.city}</div>
                            </div>
                          </div>
                        </div>

                        {/* Price & Actions */}
                        <div className="flex items-center justify-between lg:justify-end gap-4">
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary">€{booking.price_paid.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">Sitz {booking.seat.seat_number}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                          >
                            <ChevronDown className={cn(
                              "w-5 h-5 transition-transform",
                              expandedBooking === booking.id && "rotate-180"
                            )} />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <div className={cn(
                      "overflow-hidden transition-all duration-300",
                      expandedBooking === booking.id ? "max-h-64" : "max-h-0"
                    )}>
                      <div className="px-4 lg:px-6 pb-4 lg:pb-6 pt-2 border-t border-border">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between">
                          <div className="space-y-2 text-sm">
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
                              <span>{booking.trip.route.name} • Sitzplatz {booking.seat.seat_number}</span>
                            </div>
                          </div>
                          {booking.status === "confirmed" && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelBooking(booking.id)}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Stornieren
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDownloadTicket(booking.id)}
                                disabled={downloadingId === booking.id}
                              >
                                {downloadingId === booking.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4 mr-2" />
                                )}
                                Ticket
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-xl shadow-card">
              <Bus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Keine Buchungen gefunden</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Keine Buchungen entsprechen Ihrer Suche."
                  : "Sie haben noch keine Reisen gebucht."}
              </p>
              <Button asChild>
                <Link to="/search">
                  Jetzt buchen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingsPage;
