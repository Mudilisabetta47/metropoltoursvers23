import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format, addHours, addMinutes } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowRight, Clock, Bus, Filter, SortAsc, Wifi, Plug, Coffee, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SearchForm from "@/components/booking/SearchForm";
import { cn } from "@/lib/utils";

interface Trip {
  id: string;
  from: string;
  to: string;
  departureTime: Date;
  arrivalTime: Date;
  duration: string;
  price: number;
  originalPrice?: number;
  operator: string;
  amenities: string[];
  seatsLeft: number;
}

// Generate mock trips
const generateTrips = (from: string, to: string, date: Date): Trip[] => {
  const baseTrips = [
    { durationHours: 5, durationMins: 30, basePrice: 24.99 },
    { durationHours: 6, durationMins: 0, basePrice: 19.99 },
    { durationHours: 5, durationMins: 45, basePrice: 29.99 },
    { durationHours: 6, durationMins: 15, basePrice: 22.99 },
    { durationHours: 5, durationMins: 15, basePrice: 34.99 },
    { durationHours: 7, durationMins: 0, basePrice: 17.99 },
  ];

  const departureTimes = [6, 8, 10, 12, 14, 16, 18, 20];

  return departureTimes.flatMap((hour, idx) => {
    const tripVariant = baseTrips[idx % baseTrips.length];
    const departure = new Date(date);
    departure.setHours(hour, Math.random() > 0.5 ? 0 : 30, 0, 0);
    
    const arrival = addMinutes(addHours(departure, tripVariant.durationHours), tripVariant.durationMins);
    
    return {
      id: `trip-${idx}`,
      from: from || "Berlin",
      to: to || "München",
      departureTime: departure,
      arrivalTime: arrival,
      duration: `${tripVariant.durationHours}h ${tripVariant.durationMins}min`,
      price: tripVariant.basePrice + (Math.random() * 10 - 5),
      originalPrice: Math.random() > 0.6 ? tripVariant.basePrice + 15 : undefined,
      operator: "GreenBus",
      amenities: ["wifi", "power", "coffee"],
      seatsLeft: Math.floor(Math.random() * 15) + 1,
    };
  });
};

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const from = searchParams.get("from") || "Berlin";
  const to = searchParams.get("to") || "München";
  const dateStr = searchParams.get("date");
  const passengers = parseInt(searchParams.get("passengers") || "1");
  
  const searchDate = dateStr ? new Date(dateStr) : new Date();
  
  const [sortBy, setSortBy] = useState<"price" | "departure" | "duration">("departure");
  const [filterPrice, setFilterPrice] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const trips = useMemo(() => generateTrips(from, to, searchDate), [from, to, searchDate]);

  const sortedTrips = useMemo(() => {
    let result = [...trips];
    
    if (filterPrice) {
      result = result.filter(trip => trip.price <= filterPrice);
    }
    
    switch (sortBy) {
      case "price":
        return result.sort((a, b) => a.price - b.price);
      case "duration":
        return result.sort((a, b) => a.duration.localeCompare(b.duration));
      default:
        return result.sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime());
    }
  }, [trips, sortBy, filterPrice]);

  const handleBookTrip = (tripId: string) => {
    navigate(`/checkout?tripId=${tripId}&passengers=${passengers}`);
  };

  const amenityIcons: Record<string, React.ReactNode> = {
    wifi: <Wifi className="w-4 h-4" />,
    power: <Plug className="w-4 h-4" />,
    coffee: <Coffee className="w-4 h-4" />,
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      
      <main className="flex-1 pt-20 lg:pt-24">
        {/* Search Form */}
        <div className="bg-primary py-6">
          <div className="container mx-auto px-4">
            <SearchForm variant="compact" />
          </div>
        </div>

        {/* Results Header */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                {from} <ArrowRight className="inline w-5 h-5 mx-2 text-primary" /> {to}
              </h1>
              <p className="text-muted-foreground">
                {format(searchDate, "EEEE, dd. MMMM yyyy", { locale: de })} • {passengers} {passengers === 1 ? "Reisender" : "Reisende"} • {sortedTrips.length} Verbindungen
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sortieren:</span>
                {(["departure", "price", "duration"] as const).map((sort) => (
                  <Button
                    key={sort}
                    variant={sortBy === sort ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy(sort)}
                  >
                    {sort === "departure" && "Abfahrt"}
                    {sort === "price" && "Preis"}
                    {sort === "duration" && "Dauer"}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Filters */}
          <div className={cn(
            "lg:hidden overflow-hidden transition-all duration-300",
            showFilters ? "max-h-48 mb-4" : "max-h-0"
          )}>
            <div className="bg-card rounded-xl p-4 shadow-card">
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">Sortieren nach</label>
                <div className="flex gap-2">
                  {(["departure", "price", "duration"] as const).map((sort) => (
                    <Button
                      key={sort}
                      variant={sortBy === sort ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy(sort)}
                    >
                      {sort === "departure" && "Abfahrt"}
                      {sort === "price" && "Preis"}
                      {sort === "duration" && "Dauer"}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Max. Preis</label>
                <div className="flex gap-2">
                  {[null, 20, 30, 40].map((price) => (
                    <Button
                      key={price ?? "all"}
                      variant={filterPrice === price ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterPrice(price)}
                    >
                      {price ? `≤ €${price}` : "Alle"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trip List */}
          <div className="space-y-4">
            {sortedTrips.map((trip) => (
              <div
                key={trip.id}
                className="bg-card rounded-xl shadow-card p-4 lg:p-6 hover:shadow-elevated transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Time & Route */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {format(trip.departureTime, "HH:mm")}
                        </div>
                        <div className="text-sm text-muted-foreground">{trip.from}</div>
                      </div>
                      
                      <div className="flex-1 flex items-center gap-2">
                        <div className="h-px bg-border flex-1" />
                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3" />
                          {trip.duration}
                        </div>
                        <div className="h-px bg-border flex-1" />
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {format(trip.arrivalTime, "HH:mm")}
                        </div>
                        <div className="text-sm text-muted-foreground">{trip.to}</div>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Bus className="w-4 h-4 text-primary" />
                        <span>{trip.operator}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {trip.amenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="text-muted-foreground"
                            title={amenity}
                          >
                            {amenityIcons[amenity]}
                          </span>
                        ))}
                      </div>
                      {trip.seatsLeft <= 5 && (
                        <span className="text-sm text-destructive font-medium">
                          Nur noch {trip.seatsLeft} Plätze!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between lg:flex-col lg:items-end gap-2">
                    <div className="text-right">
                      {trip.originalPrice && (
                        <div className="text-sm text-muted-foreground line-through">
                          €{trip.originalPrice.toFixed(2)}
                        </div>
                      )}
                      <div className="text-2xl font-bold text-primary">
                        €{trip.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">pro Person</div>
                    </div>
                    <Button
                      variant="accent"
                      onClick={() => handleBookTrip(trip.id)}
                    >
                      Auswählen
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sortedTrips.length === 0 && (
            <div className="text-center py-16">
              <Bus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Keine Verbindungen gefunden</h3>
              <p className="text-muted-foreground">Bitte versuchen Sie ein anderes Datum oder ändern Sie Ihre Filter.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
