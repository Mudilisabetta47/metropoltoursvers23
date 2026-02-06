import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Users, ArrowRight, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
interface Stop {
  id: string;
  name: string;
  city: string;
  stop_order: number;
  route_id: string;
}
interface SearchFormProps {
  variant?: "hero" | "compact";
  className?: string;
  initialFrom?: string;
  initialTo?: string;
  initialDate?: Date;
  initialPassengers?: number;
}
const SearchForm = ({
  variant = "hero",
  className,
  initialFrom = "",
  initialTo = "",
  initialDate,
  initialPassengers = 1
}: SearchFormProps) => {
  const navigate = useNavigate();
  const [stops, setStops] = useState<Stop[]>([]);
  const [fromStop, setFromStop] = useState<Stop | null>(null);
  const [toStop, setToStop] = useState<Stop | null>(null);
  const [fromSearch, setFromSearch] = useState(initialFrom);
  const [toSearch, setToSearch] = useState(initialTo);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(initialDate);
  const [returnDate, setReturnDate] = useState<Date>();
  const [passengers, setPassengers] = useState(initialPassengers);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  useEffect(() => {
    loadStops();
  }, []);
  useEffect(() => {
    // Set initial from/to stops based on search params
    if (stops.length > 0 && initialFrom) {
      const found = stops.find(s => s.name === initialFrom || s.city === initialFrom);
      if (found) {
        setFromStop(found);
        setFromSearch(found.name);
      }
    }
    if (stops.length > 0 && initialTo) {
      const found = stops.find(s => s.name === initialTo || s.city === initialTo);
      if (found) {
        setToStop(found);
        setToSearch(found.name);
      }
    }
  }, [stops, initialFrom, initialTo]);
  const loadStops = async () => {
    const {
      data,
      error
    } = await supabase.from('stops').select('*').order('stop_order');
    if (error) {
      console.error('Error loading stops:', error);
      return;
    }
    setStops(data || []);
  };
  const swapCities = () => {
    const tempStop = fromStop;
    const tempSearch = fromSearch;
    setFromStop(toStop);
    setFromSearch(toSearch);
    setToStop(tempStop);
    setToSearch(tempSearch);
  };
  const handleSearch = () => {
    if (!fromStop || !toStop || !departureDate) {
      return;
    }
    const searchParams = new URLSearchParams({
      fromStopId: fromStop.id,
      toStopId: toStop.id,
      from: fromStop.name,
      to: toStop.name,
      date: format(departureDate, "yyyy-MM-dd"),
      returnDate: returnDate ? format(returnDate, "yyyy-MM-dd") : "",
      passengers: passengers.toString()
    });
    navigate(`/search?${searchParams.toString()}`);
  };

  // Filter stops based on search and exclude already selected stops
  const getAvailableFromStops = () => {
    return stops.filter(stop => {
      // If search is empty, show all valid stops
      const matchesSearch = fromSearch.trim() === '' || stop.name.toLowerCase().includes(fromSearch.toLowerCase()) || stop.city.toLowerCase().includes(fromSearch.toLowerCase());
      // Can't select the same stop as destination
      const notDestination = !toStop || stop.id !== toStop.id;
      // Can only select stops that come before the destination (if destination is selected)
      const isValidOrder = !toStop || stop.stop_order < toStop.stop_order;
      return matchesSearch && notDestination && isValidOrder;
    });
  };
  const getAvailableToStops = () => {
    return stops.filter(stop => {
      // If search is empty, show all valid stops
      const matchesSearch = toSearch.trim() === '' || stop.name.toLowerCase().includes(toSearch.toLowerCase()) || stop.city.toLowerCase().includes(toSearch.toLowerCase());
      // Can't select the same stop as origin
      const notOrigin = !fromStop || stop.id !== fromStop.id;
      // Can only select stops that come after the origin (if origin is selected)
      const isValidOrder = !fromStop || stop.stop_order > fromStop.stop_order;
      return matchesSearch && notOrigin && isValidOrder;
    });
  };
  const isHero = variant === "hero";
  return <div className={cn("w-full", isHero ? "glass-card p-6 lg:p-8" : "bg-card rounded-xl shadow-card p-4", className)}>
      <div className={cn("grid gap-4", isHero ? "lg:grid-cols-[1fr,auto,1fr,1fr,1fr,auto,auto] lg:items-end" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-6")}>
        {/* From City */}
        <div className="relative">
          <label className={cn("block text-sm font-medium mb-2 text-primary", isHero ? "text-primary-foreground/80" : "text-muted-foreground")}>
            Von
          </label>
          <div className="relative">
            <MapPin className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5", isHero ? "text-primary" : "text-muted-foreground")} />
            <input type="text" value={fromSearch} onChange={e => {
            setFromSearch(e.target.value);
            setFromStop(null);
          }} onFocus={() => setShowFromSuggestions(true)} onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)} placeholder="Abfahrtsort" className={cn("w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200", "focus:outline-none focus:ring-2 focus:ring-primary", isHero ? "bg-background/90 border-border/50 text-foreground placeholder:text-muted-foreground" : "bg-background border-input text-foreground")} />
            {showFromSuggestions && getAvailableFromStops().length > 0 && <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-elevated overflow-hidden">
                {getAvailableFromStops().map(stop => <button key={stop.id} type="button" onClick={() => {
              setFromStop(stop);
              setFromSearch(stop.name);
              setShowFromSuggestions(false);
            }} className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{stop.name}</div>
                      <div className="text-xs text-muted-foreground">{stop.city}</div>
                    </div>
                  </button>)}
              </div>}
          </div>
        </div>

        {/* Swap Button */}
        <button type="button" onClick={swapCities} className={cn("self-end p-3 rounded-lg transition-all duration-200", isHero ? "bg-primary/20 hover:bg-primary/30 text-primary-foreground mb-0 lg:mb-0" : "bg-muted hover:bg-muted/80 text-muted-foreground", "hidden lg:flex items-center justify-center")}>
          <ArrowLeftRight className="w-5 h-5" />
        </button>

        {/* To City */}
        <div className="relative">
          <label className={cn("block text-sm font-medium mb-2 text-primary", isHero ? "text-primary-foreground/80" : "text-muted-foreground")}>
            Nach
          </label>
          <div className="relative">
            <MapPin className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5", isHero ? "text-primary" : "text-muted-foreground")} />
            <input type="text" value={toSearch} onChange={e => {
            setToSearch(e.target.value);
            setToStop(null);
          }} onFocus={() => setShowToSuggestions(true)} onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)} placeholder="Zielort" className={cn("w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200", "focus:outline-none focus:ring-2 focus:ring-primary", isHero ? "bg-background/90 border-border/50 text-foreground placeholder:text-muted-foreground" : "bg-background border-input text-foreground")} />
            {showToSuggestions && getAvailableToStops().length > 0 && <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-elevated overflow-hidden">
                {getAvailableToStops().map(stop => <button key={stop.id} type="button" onClick={() => {
              setToStop(stop);
              setToSearch(stop.name);
              setShowToSuggestions(false);
            }} className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{stop.name}</div>
                      <div className="text-xs text-muted-foreground">{stop.city}</div>
                    </div>
                  </button>)}
              </div>}
          </div>
        </div>

        {/* Departure Date */}
        <div>
          <label className={cn("block text-sm font-medium mb-2 text-primary", isHero ? "text-primary-foreground/80" : "text-muted-foreground")}>
            Hinfahrt
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn("w-full flex items-center gap-2 pl-3 pr-4 py-3 rounded-lg border transition-all duration-200 text-left", "focus:outline-none focus:ring-2 focus:ring-primary", isHero ? "bg-background/90 border-border/50 text-foreground" : "bg-background border-input text-foreground")}>
                <Calendar className={cn("w-5 h-5 shrink-0", isHero ? "text-primary" : "text-muted-foreground")} />
                <span className={cn(!departureDate && "text-muted-foreground")}>
                  {departureDate ? format(departureDate, "dd. MMM", {
                  locale: de
                }) : "Datum wählen"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={departureDate} onSelect={setDepartureDate} disabled={date => date < new Date()} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        {/* Return Date */}
        <div>
          <label className={cn("block text-sm font-medium mb-2 text-primary", isHero ? "text-primary-foreground/80" : "text-muted-foreground")}>
            Rückfahrt (optional)
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn("w-full flex items-center gap-2 pl-3 pr-4 py-3 rounded-lg border transition-all duration-200 text-left", "focus:outline-none focus:ring-2 focus:ring-primary", isHero ? "bg-background/90 border-border/50 text-foreground" : "bg-background border-input text-foreground")}>
                <Calendar className={cn("w-5 h-5 shrink-0", isHero ? "text-primary" : "text-muted-foreground")} />
                <span className={cn(!returnDate && "text-muted-foreground")}>
                  {returnDate ? format(returnDate, "dd. MMM", {
                  locale: de
                }) : "Datum wählen"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={returnDate} onSelect={setReturnDate} disabled={date => date < (departureDate || new Date())} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        {/* Passengers */}
        <div>
          <label className={cn("block text-sm font-medium mb-2 text-primary", isHero ? "text-primary-foreground/80" : "text-muted-foreground")}>
            Reisende
          </label>
          <div className={cn("flex items-center gap-3 pl-3 pr-2 py-2 rounded-lg border", isHero ? "bg-background/90 border-border/50" : "bg-background border-input")}>
            <Users className={cn("w-5 h-5 shrink-0", isHero ? "text-primary" : "text-muted-foreground")} />
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPassengers(Math.max(1, passengers - 1))} className="w-8 h-8 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-foreground font-semibold transition-colors">
                -
              </button>
              <span className="w-8 text-center font-medium text-foreground">{passengers}</span>
              <button type="button" onClick={() => setPassengers(Math.min(9, passengers + 1))} className="w-8 h-8 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-foreground font-semibold transition-colors">
                +
              </button>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className={cn("self-end", isHero && "lg:col-span-1")}>
          <Button onClick={handleSearch} variant={isHero ? "accent" : "default"} size="lg" className="w-full" disabled={!fromStop || !toStop || !departureDate}>
            <span>Suchen</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>;
};
export default SearchForm;