import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MobileHeader } from "@/mobile/MobileAppShell";
import { useMobileTours } from "@/mobile/hooks/useMobileTours";
import { TourCardMobile } from "@/mobile/components/TourCardMobile";

export default function AppTours() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState<string | null>(null);
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
    return (tours ?? []).filter((t) => {
      const matchesTerm =
        !term ||
        [t.destination, t.country, t.location, t.category, t.short_description]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term));
      const matchesCat = !category || t.category === category;
      return matchesTerm && matchesCat;
    });
  }, [tours, q, category]);

  return (
    <div>
      <MobileHeader title="Reisen" subtitle={`${filtered.length} Reisen verfügbar`} />

      <div className="sticky top-[86px] z-30 bg-background/90 px-5 py-3 backdrop-blur-xl">
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
          ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-3xl" />)
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
