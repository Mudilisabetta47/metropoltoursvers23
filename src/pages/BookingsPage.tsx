import { useState } from "react";
import { Link } from "react-router-dom";
import { Bus, Calendar, MapPin, Clock, ArrowRight, Download, X, ChevronDown, Search } from "lucide-react";
import { format, addHours } from "date-fns";
import { de } from "date-fns/locale";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Booking {
  id: string;
  bookingNumber: string;
  status: "upcoming" | "completed" | "cancelled";
  from: string;
  to: string;
  departureDate: Date;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  passengers: number;
  price: number;
}

const mockBookings: Booking[] = [
  {
    id: "1",
    bookingNumber: "GB-ABC123XY",
    status: "upcoming",
    from: "Berlin",
    to: "München",
    departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    departureTime: "10:30",
    arrivalTime: "16:45",
    duration: "6h 15min",
    passengers: 2,
    price: 49.98,
  },
  {
    id: "2",
    bookingNumber: "GB-DEF456ZW",
    status: "upcoming",
    from: "Hamburg",
    to: "Köln",
    departureDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    departureTime: "08:00",
    arrivalTime: "13:15",
    duration: "5h 15min",
    passengers: 1,
    price: 29.99,
  },
  {
    id: "3",
    bookingNumber: "GB-GHI789UV",
    status: "completed",
    from: "Frankfurt",
    to: "Wien",
    departureDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    departureTime: "14:00",
    arrivalTime: "21:45",
    duration: "7h 45min",
    passengers: 1,
    price: 39.99,
  },
  {
    id: "4",
    bookingNumber: "GB-JKL012ST",
    status: "cancelled",
    from: "Stuttgart",
    to: "Zürich",
    departureDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    departureTime: "09:30",
    arrivalTime: "13:00",
    duration: "3h 30min",
    passengers: 3,
    price: 89.97,
  },
];

const BookingsPage = () => {
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  const filteredBookings = mockBookings.filter((booking) => {
    const matchesFilter = filter === "all" || booking.status === filter;
    const matchesSearch = booking.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.to.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDownloadTicket = (bookingNumber: string) => {
    toast.success(`Ticket ${bookingNumber} wird heruntergeladen...`);
  };

  const handleCancelBooking = (bookingNumber: string) => {
    toast.success(`Buchung ${bookingNumber} wurde storniert.`);
  };

  const statusConfig = {
    upcoming: { label: "Bevorstehend", className: "bg-primary/10 text-primary" },
    completed: { label: "Abgeschlossen", className: "bg-muted text-muted-foreground" },
    cancelled: { label: "Storniert", className: "bg-destructive/10 text-destructive" },
  };

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
                placeholder="Buchungsnummer oder Stadt suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all", "upcoming", "completed", "cancelled"] as const).map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(status)}
                >
                  {status === "all" && "Alle"}
                  {status === "upcoming" && "Bevorstehend"}
                  {status === "completed" && "Abgeschlossen"}
                  {status === "cancelled" && "Storniert"}
                </Button>
              ))}
            </div>
          </div>

          {/* Bookings List */}
          {filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
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
                            {format(booking.departureDate, "dd")}
                          </span>
                          <span className="text-xs text-primary uppercase">
                            {format(booking.departureDate, "MMM", { locale: de })}
                          </span>
                        </div>
                        <div>
                          <div className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium inline-block mb-1",
                            statusConfig[booking.status].className
                          )}>
                            {statusConfig[booking.status].label}
                          </div>
                          <div className="text-xs text-muted-foreground">{booking.bookingNumber}</div>
                        </div>
                      </div>

                      {/* Route */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-xl font-bold text-foreground">{booking.departureTime}</div>
                            <div className="text-sm text-muted-foreground">{booking.from}</div>
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="h-px bg-border flex-1" />
                            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                              <Clock className="w-3 h-3" />
                              {booking.duration}
                            </div>
                            <div className="h-px bg-border flex-1" />
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-foreground">{booking.arrivalTime}</div>
                            <div className="text-sm text-muted-foreground">{booking.to}</div>
                          </div>
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex items-center justify-between lg:justify-end gap-4">
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">€{booking.price.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">{booking.passengers} {booking.passengers === 1 ? "Person" : "Personen"}</div>
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
                            <span>{format(booking.departureDate, "EEEE, dd. MMMM yyyy", { locale: de })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{booking.from} Hauptbahnhof → {booking.to} ZOB</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Bus className="w-4 h-4" />
                            <span>METROPOL TOURS • Direktverbindung</span>
                          </div>
                        </div>
                        {booking.status === "upcoming" && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.bookingNumber)}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Stornieren
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDownloadTicket(booking.bookingNumber)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Ticket
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
