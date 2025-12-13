import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Users, ArrowRight, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface SearchFormProps {
  variant?: "hero" | "compact";
  className?: string;
}

const popularCities = [
  "Berlin", "München", "Hamburg", "Köln", "Frankfurt", 
  "Stuttgart", "Düsseldorf", "Wien", "Zürich", "Amsterdam"
];

const SearchForm = ({ variant = "hero", className }: SearchFormProps) => {
  const navigate = useNavigate();
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [passengers, setPassengers] = useState(1);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  const swapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const handleSearch = () => {
    const searchParams = new URLSearchParams({
      from: fromCity,
      to: toCity,
      date: departureDate ? format(departureDate, "yyyy-MM-dd") : "",
      returnDate: returnDate ? format(returnDate, "yyyy-MM-dd") : "",
      passengers: passengers.toString(),
    });
    navigate(`/search?${searchParams.toString()}`);
  };

  const filteredFromCities = popularCities.filter(city =>
    city.toLowerCase().includes(fromCity.toLowerCase())
  );

  const filteredToCities = popularCities.filter(city =>
    city.toLowerCase().includes(toCity.toLowerCase())
  );

  const isHero = variant === "hero";

  return (
    <div className={cn(
      "w-full",
      isHero ? "glass-card p-6 lg:p-8" : "bg-card rounded-xl shadow-card p-4",
      className
    )}>
      <div className={cn(
        "grid gap-4",
        isHero ? "lg:grid-cols-[1fr,auto,1fr,1fr,1fr,auto,auto] lg:items-end" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-6"
      )}>
        {/* From City */}
        <div className="relative">
          <label className={cn(
            "block text-sm font-medium mb-2",
            isHero ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            Von
          </label>
          <div className="relative">
            <MapPin className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5",
              isHero ? "text-primary" : "text-muted-foreground"
            )} />
            <input
              type="text"
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              onFocus={() => setShowFromSuggestions(true)}
              onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
              placeholder="Stadt eingeben"
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary",
                isHero 
                  ? "bg-background/90 border-border/50 text-foreground placeholder:text-muted-foreground" 
                  : "bg-background border-input text-foreground"
              )}
            />
            {showFromSuggestions && fromCity && filteredFromCities.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-elevated overflow-hidden">
                {filteredFromCities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setFromCity(city);
                      setShowFromSuggestions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <button
          type="button"
          onClick={swapCities}
          className={cn(
            "self-end p-3 rounded-lg transition-all duration-200",
            isHero 
              ? "bg-primary/20 hover:bg-primary/30 text-primary-foreground mb-0 lg:mb-0" 
              : "bg-muted hover:bg-muted/80 text-muted-foreground",
            "hidden lg:flex items-center justify-center"
          )}
        >
          <ArrowLeftRight className="w-5 h-5" />
        </button>

        {/* To City */}
        <div className="relative">
          <label className={cn(
            "block text-sm font-medium mb-2",
            isHero ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            Nach
          </label>
          <div className="relative">
            <MapPin className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5",
              isHero ? "text-primary" : "text-muted-foreground"
            )} />
            <input
              type="text"
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
              onFocus={() => setShowToSuggestions(true)}
              onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
              placeholder="Stadt eingeben"
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary",
                isHero 
                  ? "bg-background/90 border-border/50 text-foreground placeholder:text-muted-foreground" 
                  : "bg-background border-input text-foreground"
              )}
            />
            {showToSuggestions && toCity && filteredToCities.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-elevated overflow-hidden">
                {filteredToCities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setToCity(city);
                      setShowToSuggestions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Departure Date */}
        <div>
          <label className={cn(
            "block text-sm font-medium mb-2",
            isHero ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            Hinfahrt
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-2 pl-3 pr-4 py-3 rounded-lg border transition-all duration-200 text-left",
                  "focus:outline-none focus:ring-2 focus:ring-primary",
                  isHero 
                    ? "bg-background/90 border-border/50 text-foreground" 
                    : "bg-background border-input text-foreground"
                )}
              >
                <Calendar className={cn(
                  "w-5 h-5 shrink-0",
                  isHero ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(!departureDate && "text-muted-foreground")}>
                  {departureDate ? format(departureDate, "dd. MMM", { locale: de }) : "Datum wählen"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={departureDate}
                onSelect={setDepartureDate}
                disabled={(date) => date < new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Return Date */}
        <div>
          <label className={cn(
            "block text-sm font-medium mb-2",
            isHero ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            Rückfahrt (optional)
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-2 pl-3 pr-4 py-3 rounded-lg border transition-all duration-200 text-left",
                  "focus:outline-none focus:ring-2 focus:ring-primary",
                  isHero 
                    ? "bg-background/90 border-border/50 text-foreground" 
                    : "bg-background border-input text-foreground"
                )}
              >
                <Calendar className={cn(
                  "w-5 h-5 shrink-0",
                  isHero ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(!returnDate && "text-muted-foreground")}>
                  {returnDate ? format(returnDate, "dd. MMM", { locale: de }) : "Datum wählen"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={returnDate}
                onSelect={setReturnDate}
                disabled={(date) => date < (departureDate || new Date())}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Passengers */}
        <div>
          <label className={cn(
            "block text-sm font-medium mb-2",
            isHero ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            Reisende
          </label>
          <div className={cn(
            "flex items-center gap-3 pl-3 pr-2 py-2 rounded-lg border",
            isHero 
              ? "bg-background/90 border-border/50" 
              : "bg-background border-input"
          )}>
            <Users className={cn(
              "w-5 h-5 shrink-0",
              isHero ? "text-primary" : "text-muted-foreground"
            )} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPassengers(Math.max(1, passengers - 1))}
                className="w-8 h-8 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-foreground font-semibold transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center font-medium text-foreground">{passengers}</span>
              <button
                type="button"
                onClick={() => setPassengers(Math.min(9, passengers + 1))}
                className="w-8 h-8 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-foreground font-semibold transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className={cn("self-end", isHero && "lg:col-span-1")}>
          <Button
            onClick={handleSearch}
            variant={isHero ? "accent" : "default"}
            size="lg"
            className="w-full"
          >
            <span>Suchen</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchForm;
