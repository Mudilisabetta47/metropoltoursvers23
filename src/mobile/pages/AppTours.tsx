import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowUpDown, Filter, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MobileHeader } from "@/mobile/MobileAppShell";
import { useMobileTours } from "@/mobile/hooks/useMobileTours";
import { TourCardMobile } from "@/mobile/components/TourCardMobile";

export default function AppTours() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState("featured");
  const { data: tours, isLoading } = useMobileTours();

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (q) next.set("q", q);
    else next.delete("q");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const categories = useMemo(
    () => [...new Set((tours ?? []).map((t) => t.category).filter(Boolean))] as string[],
    [tours],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const result = (tours ?? []).filter((t) => {
      const matchesTerm =
        !term ||
        [t.destination, t.country, t.location, t.category, t.short_description]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term));
      const matchesCat = !category || t.category === category;
      const days = t.duration_days ?? 0;
      const matchesDuration = !duration || (duration === "short" ? days <= 4 : duration === "week" ? days >= 5 && days <= 8 : days >= 9);
      const next = t.tour_dates?.[0];
      const matchesAvailability = !onlyAvailable || !next || next.total_seats == null || (next.total_seats - (next.booked_seats ?? 0)) > 0;
      return matchesTerm && matchesCat && matchesDuration && matchesAvailability;
    });
    return result.sort((a, b) => sort === "price" ? (a.price_from ?? Infinity) - (b.price_from ?? Infinity) : sort === "date" ? (a.tour_dates?.[0]?.departure_date ?? "9999").localeCompare(b.tour_dates?.[0]?.departure_date ?? "9999") : Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)));
  }, [tours, q, category, duration, onlyAvailable, sort]);

  const activeFilterCount = Number(Boolean(duration)) + Number(onlyAvailable);

  return (
    <div>
      <MobileHeader title="Reisen" subtitle={`${filtered.length} Reisen verfügbar`} />

      <div className="sticky top-[86px] z-30 border-b border-border/50 bg-background/90 px-5 py-3 backdrop-blur-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ziel, Land oder Stichwort"
            className="h-12 rounded-2xl pl-10 pr-10"
            inputMode="search"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Suche zurücksetzen"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Drawer>
            <DrawerTrigger asChild><Button variant="outline" size="sm" className="h-10 flex-1"><Filter className="h-4 w-4" /> Filter{activeFilterCount ? ` (${activeFilterCount})` : ""}</Button></DrawerTrigger>
            <DrawerContent className="pb-[env(safe-area-inset-bottom)]">
              <DrawerHeader className="text-left"><DrawerTitle>Reisen filtern</DrawerTitle></DrawerHeader>
              <div className="space-y-5 px-5 pb-6">
                <div><Label className="mb-2 block">Reisedauer</Label><div className="flex flex-wrap gap-2"><Chip active={duration === null} onClick={() => setDuration(null)}>Alle</Chip><Chip active={duration === "short"} onClick={() => setDuration("short")}>1–4 Tage</Chip><Chip active={duration === "week"} onClick={() => setDuration("week")}>5–8 Tage</Chip><Chip active={duration === "long"} onClick={() => setDuration("long")}>9+ Tage</Chip></div></div>
                <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border p-3"><Checkbox checked={onlyAvailable} onCheckedChange={(checked) => setOnlyAvailable(checked === true)} /><span className="text-sm font-medium">Nur buchbare Reisen</span></label>
              </div>
            </DrawerContent>
          </Drawer>
          <Select value={sort} onValueChange={setSort}><SelectTrigger className="h-10 flex-1 rounded-lg"><ArrowUpDown className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="featured">Empfohlen</SelectItem><SelectItem value="date">Nächster Termin</SelectItem><SelectItem value="price">Preis aufsteigend</SelectItem></SelectContent></Select>
        </div>

        {categories.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Chip active={!category} onClick={() => setCategory(null)}>
              Alle
            </Chip>
            {categories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 px-5 pt-2">
        {isLoading
          ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
          : filtered.map((t) => <TourCardMobile key={t.id} tour={t} />)}
        {!isLoading && filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Keine Reise gefunden. Versuche einen anderen Suchbegriff.
          </p>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
