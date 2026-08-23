import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { MobileTour } from "@/mobile/hooks/useMobileTours";

const matchesTour = (tour: MobileTour, term: string) =>
  [tour.destination, tour.country, tour.location, tour.category, tour.short_description]
    .filter(Boolean)
    .some((value) => String(value).toLocaleLowerCase("de").includes(term));

export function MobileTourSearch({ tours }: { tours: MobileTour[] }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const term = query.trim().toLocaleLowerCase("de");
  const suggestions = useMemo(
    () => (term ? tours.filter((tour) => matchesTour(tour, term)) : tours.filter((tour) => tour.is_featured)).slice(0, 6),
    [term, tours],
  );

  const showAll = () => {
    setOpen(false);
    navigate(`/app/reisen${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      <DrawerTrigger asChild>
        <Button
          variant="hero"
          className="h-14 w-full justify-start rounded-xl px-4 text-left shadow-elevated"
        >
          <Search className="h-5 w-5 text-primary" />
          <span className="font-medium text-foreground/70">Wo möchtest du hin?</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[88dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
        <DrawerHeader className="px-5 pb-2 text-left">
          <DrawerTitle>Reiseziel finden</DrawerTitle>
          <DrawerDescription>Durchsuche alle aktuell vorhandenen Reisen.</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-5 pb-5">
          <div className="relative sticky top-0 z-10 bg-background pb-3">
            <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-primary" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && showAll()}
              placeholder="Ziel, Land oder Reise"
              className="h-12 rounded-xl border-2 border-primary/50 pl-11 text-base"
              inputMode="search"
            />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            {term ? `${suggestions.length} passende Vorschläge` : "Beliebte Reiseziele"}
          </p>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {suggestions.map((tour) => (
              <button
                key={tour.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(`/app/reisen/${tour.slug || tour.id}`);
                }}
                className="flex min-h-16 w-full items-center gap-3 px-3 py-2.5 text-left active:bg-muted"
              >
                <img
                  src={tour.hero_image_url || tour.image_url || "/brand/metropol-logo.png"}
                  alt=""
                  className="h-12 w-16 shrink-0 rounded-lg object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{tour.destination}</span>
                  <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {tour.country || tour.location || "Europa"}
                    {tour.duration_days ? ` · ${tour.duration_days} Tage` : ""}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
              </button>
            ))}
          </div>
          {term && suggestions.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Keine passende Reise gefunden.</p>
          )}
          <Button onClick={showAll} className="mt-4 h-12 w-full rounded-xl">
            {term ? "Alle Ergebnisse anzeigen" : "Alle Reisen entdecken"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}