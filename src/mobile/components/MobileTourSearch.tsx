import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { motion } from "framer-motion";
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
import { nativeHaptic } from "@/mobile/lib/native";

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
        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          className="flex w-full items-center gap-2 rounded-[24px] border border-border/60 bg-card p-2 pl-4 text-left shadow-[0_20px_50px_-24px_hsl(150_20%_8%_/_0.45)]"
        >
          <Search className="h-5 w-5 shrink-0 text-primary" strokeWidth={2.5} />
          <span className="min-w-0 flex-1 py-3">
            <span className="block truncate text-[15px] font-semibold text-foreground">
              Wohin geht die Reise?
            </span>
            <span className="block truncate text-[11px] font-medium text-muted-foreground">
              Ziel, Land oder Termin suchen
            </span>
          </span>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-primary text-primary-foreground">
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </span>
        </motion.button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[88dvh] rounded-t-[32px] pb-[env(safe-area-inset-bottom)]">
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
              className="h-14 rounded-2xl border-2 border-primary/40 pl-11 text-base font-medium"
              inputMode="search"
            />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            {term ? `${suggestions.length} passende Vorschläge` : "Beliebte Reiseziele"}
          </p>
          <div className="divide-y divide-border/60 overflow-hidden rounded-[24px] border border-border/60 bg-card">
            {suggestions.map((tour) => (
              <button
                key={tour.id}
                type="button"
                onClick={() => {
                  void nativeHaptic("light");
                  setOpen(false);
                  navigate(`/app/reisen/${tour.slug || tour.id}`);
                }}
                className="flex min-h-16 w-full items-center gap-3 px-3 py-2.5 text-left active:bg-muted"
              >
                <img
                  src={tour.hero_image_url || tour.image_url || "/brand/metropol-logo.png"}
                  alt=""
                  className="h-14 w-16 shrink-0 rounded-2xl object-cover"
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