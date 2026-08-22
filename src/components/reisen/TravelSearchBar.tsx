import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Bus, Luggage, Search, CalendarDays, User, Sparkles, ChevronRight, Percent, Compass, X,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

export interface SearchTour {
  id: string;
  slug?: string | null;
  destination: string;
  country: string;
  duration_days: number;
  price_from: number;
  departure_date: string;
  image: string;
  category?: string | null;
}

interface TravelSearchBarProps {
  tours: SearchTour[];
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  activeTab: "pauschal" | "kurz";
  onTabChange: (tab: "pauschal" | "kurz") => void;
  className?: string;
}

const TravelSearchBar = ({ tours, query, onQueryChange, onSearch, activeTab, onTabChange, className }: TravelSearchBarProps) => {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dialogQuery, setDialogQuery] = useState("");
  const [range, setRange] = useState<DateRange | undefined>();
  const [travellers, setTravellers] = useState(2);

  const tabs = [
    { key: "pauschal" as const, label: "Pauschalreisen", icon: Bus },
    { key: "kurz" as const, label: "Kurzurlaub", icon: Luggage },
  ];

  const destinations = useMemo(() => {
    const isWeekend = (t: SearchTour) => (t.category || "").toLowerCase() === "weekend";
    const scoped = tours.filter(t => (activeTab === "kurz" ? isWeekend(t) : !isWeekend(t)));
    if (!dialogQuery.trim()) return scoped.slice(0, 12);
    const q = dialogQuery.toLowerCase();
    return scoped
      .filter(t =>
        t.destination.toLowerCase().includes(q) || t.country.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [tours, dialogQuery, activeTab]);

  const openTour = (t: SearchTour) => {
    setPickerOpen(false);
    const isWeekend = (t.category || "").toLowerCase() === "weekend";
    navigate(isWeekend ? `/wochenendtrips/${t.slug || t.id}` : `/reisen/${t.slug || t.id}`);
  };

  const surpriseMe = () => {
    const pool = destinations.length > 0 ? destinations : tours;
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    openTour(pick);
  };

  const rangeLabel = range?.from
    ? `${format(range.from, "dd.MM.", { locale: de })}${range.to ? ` – ${format(range.to, "dd.MM.yy", { locale: de })}` : ""}`
    : "beliebiger Zeitraum";

  return (
    <div className={cn("w-full max-w-5xl", className)}>
      {/* Tab strip */}
      <div className="flex items-center gap-1 rounded-t-2xl bg-foreground/95 px-2 pt-2 pb-1 backdrop-blur-xl">
        {tabs.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-background/75 hover:bg-background/10 hover:text-background"
              )}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div className="flex flex-col overflow-hidden rounded-b-2xl bg-card shadow-2xl md:flex-row md:items-stretch">
        {/* Destination */}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex flex-1 items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/60"
        >
          <Search className="h-5 w-5 shrink-0 text-primary" />
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">Reiseziel oder Hotel</span>
            <span className="block truncate text-base font-bold text-primary">
              {query || "Wohin möchtest du reisen?"}
            </span>
          </span>
        </button>

        <div className="hidden w-px bg-border md:block" />

        {/* Period */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="flex flex-1 items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/60">
              <CalendarDays className="h-5 w-5 shrink-0 text-foreground" />
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">Reisezeitraum</span>
                <span className="block truncate text-base font-bold text-foreground">{rangeLabel}</span>
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <div className="hidden w-px bg-border md:block" />

        {/* Travellers */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="flex flex-1 items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/60">
              <User className="h-5 w-5 shrink-0 text-foreground" />
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">Reisende</span>
                <span className="block truncate text-base font-bold text-foreground">
                  {travellers} {travellers === 1 ? "Person" : "Personen"}
                </span>
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="start">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Reisende</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setTravellers(Math.max(1, travellers - 1))}
                  className="h-8 w-8 rounded-md bg-muted font-semibold text-foreground">-</button>
                <span className="w-5 text-center font-semibold text-foreground">{travellers}</span>
                <button type="button" onClick={() => setTravellers(Math.min(20, travellers + 1))}
                  className="h-8 w-8 rounded-md bg-muted font-semibold text-foreground">+</button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* CTA */}
        <button
          type="button"
          onClick={onSearch}
          className="flex items-center justify-center bg-primary px-8 py-4 text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Angebote suchen
        </button>
      </div>

      {/* Destination picker overlay */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto p-4 sm:p-6">
          <div className="sticky -top-4 z-10 -mx-4 -mt-4 bg-card px-4 pb-3 pt-4 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6">
            <Input
              autoFocus
              value={dialogQuery}
              onChange={(e) => setDialogQuery(e.target.value)}
              placeholder="Reiseziel oder Hotel"
              className="h-12 rounded-xl border-2 border-primary/60 text-base"
            />
          </div>

          <div className="space-y-2">
            <button type="button" onClick={surpriseMe}
              className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-muted">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Compass className="h-6 w-6" />
              </span>
              <span className="flex-1">
                <span className="block font-bold text-foreground">Beliebige Urlaubsregion</span>
                <span className="block text-sm text-muted-foreground">Zufallsreise – lass dich inspirieren!</span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            <button type="button" onClick={() => { setPickerOpen(false); onSearch(); }}
              className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-muted">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
                <Percent className="h-6 w-6" />
              </span>
              <span className="flex-1">
                <span className="block font-bold text-foreground">Aktuelle Angebote</span>
                <span className="block text-sm text-muted-foreground">Alle aktiven Pauschalreisen ansehen</span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            <button type="button" onClick={() => { setPickerOpen(false); onTabChange("kurz"); onSearch(); }}
              className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-muted">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Luggage className="h-6 w-6" />
              </span>
              <span className="flex-1">
                <span className="block font-bold text-foreground">Kurzurlaub buchen leicht gemacht</span>
                <span className="block text-sm text-muted-foreground">Wochenendtrips ab Hannover & Umgebung</span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              {dialogQuery ? "Treffer" : "Beliebte Reiseziele"}
            </h3>
            {destinations.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Keine Reise gefunden.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {destinations.map((t) => (
                  <button key={t.id} type="button" onClick={() => openTour(t)}
                    className="group relative h-24 overflow-hidden rounded-xl text-left">
                    <img src={t.image} alt={t.destination} loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <span className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                    <span className="absolute bottom-3 left-4 right-4">
                      <span className="block text-lg font-bold leading-tight text-white drop-shadow">{t.destination}</span>
                      <span className="block text-xs text-white/85">{t.duration_days} Tage · ab {t.price_from} €</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="button" onClick={() => setPickerOpen(false)}
            className="mx-auto mt-1 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" /> Schließen
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TravelSearchBar;
