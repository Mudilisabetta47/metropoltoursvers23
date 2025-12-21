import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowRight, Clock, Bus, Filter, Wifi, Plug, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SearchForm from "@/components/booking/SearchForm";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Trip {
  id: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  base_price: number;
  bus_id: string;
  route_id: string;
  route: {
    name: string;
  };
  bus: {
    name: string;
    amenities: string[] | null;
    total_seats: number;
  };
}

interface Stop {
  id: string;
  name: string;
  city: string;
  stop_order: number;
  price_from_start: number;
}

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const fromStopId = searchParams.get("fromStopId") || "";
  const toStopId = searchParams.get("toStopId") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const dateStr = searchParams.get("date");
  const passengers = parseInt(searchParams.get("passengers") || "1");
  
  const searchDate = dateStr ? new Date(dateStr) : new Date();
  
  const [sortBy, setSortBy] = useState<"price" | "departure">("departure");
  const [filterPrice, setFilterPrice] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [originStop, setOriginStop] = useState<Stop | null>(null);
  const [destinationStop, setDestinationStop] = useState<Stop | null>(null);
  const [tripPrices, setTripPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (fromStopId && toStopId && dateStr) {
      loadTripsAndStops();
    }
  }, [fromStopId, toStopId, dateStr]);

  const loadTripsAndStops = async () => {
    setIsLoading(true);
    try {
      // Load stops info
      const { data: stopsData, error: stopsError } = await supabase
        .from('stops')
        .select('*')
        .in('id', [fromStopId, toStopId]);

      if (stopsError) throw stopsError;

      const origin = stopsData?.find(s => s.id === fromStopId);
      const destination = stopsData?.find(s => s.id === toStopId);
      setOriginStop(origin || null);
      setDestinationStop(destination || null);

      if (!origin || !destination) {
        setTrips([]);
        setIsLoading(false);
        return;
      }

      // Load trips for the date
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select(`
          *,
          route:routes(*),
          bus:buses(*)
        `)
        .eq('route_id', origin.route_id)
        .eq('departure_date', dateStr)
        .eq('is_active', true)
        .order('departure_time');

      if (tripsError) throw tripsError;

      setTrips(tripsData || []);

      // Calculate prices for each trip using the database function
      const prices: Record<string, number> = {};
      for (const trip of tripsData || []) {
        const { data: priceData, error: priceError } = await supabase
          .rpc('calculate_trip_price', {
            p_trip_id: trip.id,
            p_origin_stop_id: fromStopId,
            p_destination_stop_id: toStopId
          });

        if (!priceError && priceData !== null) {
          prices[trip.id] = priceData;
        } else {
          // Fallback to simple calculation
          prices[trip.id] = destination.price_from_start - origin.price_from_start;
        }
      }
      setTripPrices(prices);

    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedTrips = [...trips].sort((a, b) => {
    if (sortBy === "price") {
      return (tripPrices[a.id] || 0) - (tripPrices[b.id] || 0);
    }
    return a.departure_time.localeCompare(b.departure_time);
  }).filter(trip => {
    if (filterPrice) {
      return (tripPrices[trip.id] || 0) <= filterPrice;
    }
    return true;
  });

  const handleBookTrip = (tripId: string) => {
    navigate(`/checkout?tripId=${tripId}&fromStopId=${fromStopId}&toStopId=${toStopId}&passengers=${passengers}`);
  };

  const amenityIcons: Record<string, React.ReactNode> = {
    wifi: <Wifi className="w-4 h-4" />,
    power: <Plug className="w-4 h-4" />,
    coffee: <Coffee className="w-4 h-4" />,
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:mm
  };

  const calculateDuration = (departure: string, arrival: string) => {
    const [dh, dm] = departure.split(':').map(Number);
    const [ah, am] = arrival.split(':').map(Number);
    let totalMins = (ah * 60 + am) - (dh * 60 + dm);
    if (totalMins < 0) totalMins += 24 * 60; // Next day arrival
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}min`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      
      <main className="flex-1 pt-20 lg:pt-24">
        {/* Search Form */}
        <div className="bg-primary py-6">
          <div className="container mx-auto px-4">
            <SearchForm 
              variant="compact" 
              initialFrom={from}
              initialTo={to}
              initialDate={searchDate}
              initialPassengers={passengers}
            />
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
                {(["departure", "price"] as const).map((sort) => (
                  <Button
                    key={sort}
                    variant={sortBy === sort ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy(sort)}
                  >
                    {sort === "departure" && "Abfahrt"}
                    {sort === "price" && "Preis"}
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
                  {(["departure", "price"] as const).map((sort) => (
                    <Button
                      key={sort}
                      variant={sortBy === sort ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy(sort)}
                    >
                      {sort === "departure" && "Abfahrt"}
                      {sort === "price" && "Preis"}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Max. Preis</label>
                <div className="flex gap-2">
                  {[null, 30, 50, 80].map((price) => (
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

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Trip List */}
          {!isLoading && (
            <div className="space-y-4">
              {sortedTrips.map((trip) => {
                const price = tripPrices[trip.id] || 0;
                const amenities = trip.bus?.amenities || [];
                
                return (
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
                              {formatTime(trip.departure_time)}
                            </div>
                            <div className="text-sm text-muted-foreground">{originStop?.name || from}</div>
                          </div>
                          
                          <div className="flex-1 flex items-center gap-2">
                            <div className="h-px bg-border flex-1" />
                            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                              <Clock className="w-3 h-3" />
                              {calculateDuration(trip.departure_time, trip.arrival_time)}
                            </div>
                            <div className="h-px bg-border flex-1" />
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-foreground">
                              {formatTime(trip.arrival_time)}
                            </div>
                            <div className="text-sm text-muted-foreground">{destinationStop?.name || to}</div>
                          </div>
                        </div>

                        {/* Amenities */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Bus className="w-4 h-4 text-primary" />
                            <span>METROPOL TOURS</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {amenities.map((amenity) => (
                              <span
                                key={amenity}
                                className="text-muted-foreground"
                                title={amenity}
                              >
                                {amenityIcons[amenity]}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Price & CTA */}
                      <div className="flex items-center justify-between lg:flex-col lg:items-end gap-2">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            €{price.toFixed(2)}
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
                );
              })}
            </div>
          )}

          {!isLoading && sortedTrips.length === 0 && (
            <div className="text-center py-16">
              <Bus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Keine Verbindungen gefunden</h3>
              <p className="text-muted-foreground">Bitte versuchen Sie ein anderes Datum oder ändern Sie Ihre Suche.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
