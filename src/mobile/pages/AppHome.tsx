import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Ticket } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { LogoLight } from "@/components/brand/Logo";
import { Skeleton } from "@/components/ui/skeleton";
import { useMobileTours } from "@/mobile/hooks/useMobileTours";
import { useMyTrips } from "@/mobile/hooks/useMyTrips";
import { TourCardMobile, money } from "@/mobile/components/TourCardMobile";
import { MobileTourSearch } from "@/mobile/components/MobileTourSearch";

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function AppHome() {
  const { data: tours, isLoading } = useMobileTours();
  const { trips } = useMyTrips();

  const featured = useMemo(
    () => (tours ?? []).filter((t) => t.is_featured || t.tour_dates?.length).slice(0, 8),
    [tours],
  );
  const destinations = useMemo(() => {
    const map = new Map<string, { country: string; image: string | null; count: number }>();
    (tours ?? []).forEach((t) => {
      const key = t.country || t.destination;
      const cur = map.get(key);
      map.set(key, {
        country: key,
        image: cur?.image ?? t.hero_image_url ?? t.image_url ?? null,
        count: (cur?.count ?? 0) + 1,
      });
    });
    return [...map.values()].slice(0, 8);
  }, [tours]);

  const offers = useMemo(
    () => (tours ?? []).filter((t) => (t.discount_percent ?? 0) > 0).slice(0, 5),
    [tours],
  );

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return trips
      .filter((t) => t.status !== "cancelled" && (t.tour_date?.departure_date ?? "") >= today)
      .sort((a, b) =>
        (a.tour_date?.departure_date ?? "").localeCompare(b.tour_date?.departure_date ?? ""),
      )[0];
  }, [trips]);

  const heroImage =
    featured[0]?.hero_image_url || featured[0]?.image_url || "/brand/metropol-logo.png";

  return (
    <div className="pb-6">
      {/* Hero */}
      <section className="relative h-[68vh] min-h-[500px] max-h-[680px] w-full overflow-hidden">
        <img
          src={heroImage}
          alt="Busreise mit METROPOL TOURS – Panoramabus auf Europareise"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-black/85" />
        <div
          className="relative flex h-full flex-col justify-between px-5 pb-6"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
        >
          <LogoLight size="sm" />
          <div className="pb-2">
            <motion.h1
              variants={fade}
              initial="hidden"
              animate="show"
              className="max-w-[15ch] text-[34px] font-bold leading-[1.06] tracking-tight text-white"
            >
              Deine nächste Reise beginnt hier.
            </motion.h1>
            <motion.p
              variants={fade}
              custom={1}
              initial="hidden"
              animate="show"
              className="mt-3 max-w-[32ch] text-sm text-white/80"
            >
              Handverlesene Busreisen durch Europa – komfortabel, sicher und persönlich begleitet.
            </motion.p>

            <motion.div
              variants={fade}
              custom={2}
              initial="hidden"
              animate="show"
              className="mt-6"
            >
              <MobileTourSearch tours={tours ?? []} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Empfehlungen */}
      <Section title="Empfohlene Reisen" action={{ label: "Alle", to: "/app/reisen" }}>
        {isLoading ? (
          <div className="flex gap-3 overflow-hidden px-5">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="aspect-[16/15] w-[84vw] max-w-[350px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featured.map((t) => (
              <div key={t.id} className="snap-start">
                <TourCardMobile tour={t} variant="hero" />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Beliebte Ziele */}
      {destinations.length > 0 && (
        <Section title="Beliebte Reiseziele">
          <div className="flex gap-2.5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {destinations.map((d) => (
              <Link
                key={d.country}
                to={`/app/reisen?q=${encodeURIComponent(d.country)}`}
                className="relative h-24 w-36 shrink-0 overflow-hidden rounded-2xl"
              >
                {d.image ? (
                  <img
                    src={d.image}
                    alt={`Reiseziel ${d.country}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
                <div className="absolute inset-0 bg-black/35" />
                <span className="absolute bottom-2 left-2.5 text-sm font-semibold text-white">
                  {d.country}
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {upcoming && (
        <Section title="Deine nächste Reise">
          <div className="px-5">
            <Link to={`/app/ticket/${upcoming.booking_number}`} className="block overflow-hidden rounded-2xl border border-primary/30 bg-secondary p-4 text-secondary-foreground shadow-card active:scale-[0.99]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20"><Ticket className="h-5 w-5 text-primary" /></div>
                <div className="min-w-0 flex-1"><p className="text-[11px] uppercase text-secondary-foreground/60">Bevorstehende Buchung</p><p className="truncate text-base font-semibold">{upcoming.tour?.destination ?? "Reise"}</p><p className="text-xs text-secondary-foreground/70">{upcoming.tour_date?.departure_date ? format(parseISO(upcoming.tour_date.departure_date), "EEEE, dd. MMMM yyyy", { locale: de }) : upcoming.booking_number}</p></div>
                <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
              </div>
            </Link>
          </div>
        </Section>
      )}

      {/* Angebote */}
      {offers.length > 0 && (
        <Section title="Aktuelle Angebote">
          <div className="space-y-3 px-5">
            {offers.map((t) => (
              <div key={t.id} className="relative">
                <TourCardMobile tour={t} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Alle Reisen */}
      <Section title="Alle Reisen" action={{ label: "Mehr", to: "/app/reisen" }}>
        <div className="space-y-3 px-5">
          {isLoading
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
            : (tours ?? []).slice(0, 5).map((t) => <TourCardMobile key={t.id} tour={t} />)}
        </div>
      </Section>

      {!isLoading && (tours ?? []).length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          Aktuell sind keine Reisen veröffentlicht. Schau bald wieder vorbei.
        </p>
      )}

      <p className="px-5 pt-6 text-center text-xs text-muted-foreground">
        ab-Preise pro Person. Endpreis inkl. Zustieg & Extras im Buchungsschritt.{" "}
        {money(null) === "auf Anfrage" ? "" : ""}
      </p>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; to: string };
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center justify-between px-5">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {action && (
          <Link to={action.to} className="text-sm font-medium text-primary">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
