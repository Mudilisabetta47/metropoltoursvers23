import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Percent, Sparkles, Ticket, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { LogoLight } from "@/components/brand/Logo";
import { useMobileTours } from "@/mobile/hooks/useMobileTours";
import { useMyTrips } from "@/mobile/hooks/useMyTrips";
import { TourCardMobile, money } from "@/mobile/components/TourCardMobile";
import { MobileTourSearch } from "@/mobile/components/MobileTourSearch";
import { useAppHomeContent } from "@/mobile/hooks/useAppContent";
import { EASE, Reveal, Shimmer } from "@/mobile/components/motion";
import { isNativeApp } from "@/mobile/lib/native";

const IOS_DIAGNOSTIC_MARKER = "METROPOL-IOS-DIAG-2026-08-31";

const heroItem = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 + 0.09 * i, duration: 0.55, ease: EASE },
  }),
};

export default function AppHome() {
  const { data: tours, isLoading } = useMobileTours();
  const { trips } = useMyTrips();
  const { content: cms } = useAppHomeContent();

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
    cms.heroImageUrl ||
    featured[0]?.hero_image_url ||
    featured[0]?.image_url ||
    "/brand/metropol-logo.png";

  const bentoTours = (tours ?? []).slice(0, 2);
  const cheapest = useMemo(() => {
    const prices = (tours ?? []).map((t) => t.price_from).filter((p): p is number => !!p);
    return prices.length ? Math.min(...prices) : null;
  }, [tours]);

  return (
    <div className="pb-8">
      {/* ---------------------------------------------------------- HERO */}
      <section className="relative">
        <div className="relative h-[62vh] min-h-[460px] max-h-[600px] w-full overflow-hidden">
          <motion.img
            src={heroImage}
            alt="Busreise mit METROPOL TOURS – Panoramabus auf Europareise"
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.6, ease: EASE }}
          />
          {/* Dunkel oben für Logo, weiß nach unten für nahtlosen Übergang */}
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/60 via-secondary/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-background via-background/80 to-transparent" />

          <div
            className="relative flex h-full flex-col justify-between px-6 pb-16"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.1rem)" }}
          >
            <motion.div
              variants={heroItem}
              initial="hidden"
              animate="show"
              className="flex items-center justify-between"
            >
              <div>
                <LogoLight size="sm" />
                {isNativeApp() && (
                  <span className="mt-1 block text-[8px] font-semibold text-white/70">
                    {IOS_DIAGNOSTIC_MARKER}
                  </span>
                )}
              </div>
              <span className="flex h-10 items-center gap-2 rounded-full app-glass px-3 text-[10px] font-black uppercase tracking-widest text-white">
                <motion.span
                  className="h-2 w-2 rounded-full bg-primary"
                  animate={{ opacity: [1, 0.3, 1], scale: [1, 0.85, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                Live
              </span>
            </motion.div>

            <div>
              <motion.p
                variants={heroItem}
                custom={0.5}
                initial="hidden"
                animate="show"
                className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary"
              >
                Busreisen · Tickets · Europa
              </motion.p>
              <motion.h1
                variants={heroItem}
                custom={1}
                initial="hidden"
                animate="show"
                className="max-w-[16ch] text-[36px] font-extrabold leading-[1.03] tracking-tight text-foreground"
              >
                {cms.heroTitle}
              </motion.h1>
              <motion.p
                variants={heroItem}
                custom={2}
                initial="hidden"
                animate="show"
                className="mt-3 max-w-[34ch] text-[14px] font-medium leading-relaxed text-muted-foreground"
              >
                {cms.heroSubtitle}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Schwebende Suche – überlappt den Hero */}
        <motion.div
          variants={heroItem}
          custom={3}
          initial="hidden"
          animate="show"
          className="relative z-10 -mt-10 px-5"
        >
          <MobileTourSearch tours={tours ?? []} />
          <div className="mt-3 flex items-center justify-center gap-4 text-[11px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Sichere Zahlung
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Digitale Tickets
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Persönlich betreut
            </span>
          </div>
        </motion.div>
      </section>

      {/* --------------------------------------------------------- BANNER */}
      {cms.bannerEnabled && (cms.bannerTitle || cms.bannerText) && (
        <Reveal className="px-5 pt-7">
          <Link
            to={cms.bannerLink || "/app/reisen"}
            className="flex items-center gap-3 rounded-[24px] border border-primary/25 bg-primary/[0.07] p-4 transition-transform active:scale-[0.985]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
              <Sparkles className="h-5 w-5 text-primary" />
            </span>
            <span className="min-w-0 flex-1">
              {cms.bannerTitle && (
                <span className="block text-[14px] font-bold leading-tight">{cms.bannerTitle}</span>
              )}
              {cms.bannerText && (
                <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
                  {cms.bannerText}
                </span>
              )}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
          </Link>
        </Reveal>
      )}

      {/* ------------------------------------------------ NÄCHSTE REISE */}
      {upcoming && (
        <Section title="Deine nächste Reise">
          <div className="px-5">
            <Link
              to={`/app/ticket/${upcoming.booking_number}`}
              className="block overflow-hidden rounded-[28px] bg-secondary p-5 text-white transition-transform active:scale-[0.985] app-elevate"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">
                    Bevorstehende Buchung
                  </p>
                  <p className="truncate text-[17px] font-extrabold leading-tight">
                    {upcoming.tour?.destination ?? "Reise"}
                  </p>
                  <p className="text-[12px] font-medium text-white/65">
                    {upcoming.tour_date?.departure_date
                      ? format(parseISO(upcoming.tour_date.departure_date), "EEEE, dd. MMMM yyyy", {
                          locale: de,
                        })
                      : upcoming.booking_number}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
              </div>
            </Link>
          </div>
        </Section>
      )}

      {/* ------------------------------------------------- EMPFEHLUNGEN */}
      {cms.showFeatured && (
        <Section title={cms.sectionFeatured} action={{ label: "Alle", to: "/app/reisen" }}>
          {isLoading ? (
            <div className="flex gap-3 overflow-hidden px-5">
              {[0, 1].map((i) => (
                <Shimmer key={i} className="aspect-[16/15] w-[86vw] max-w-[352px] rounded-[32px]" />
              ))}
            </div>
          ) : (
            <div className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {featured.map((t, i) => (
                <motion.div
                  key={t.id}
                  className="snap-start"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.5, ease: EASE }}
                >
                  <TourCardMobile tour={t} variant="hero" />
                </motion.div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* --------------------------------------------------- BENTO GRID */}
      <Section title="Schnell entdecken">
        <div className="grid grid-cols-2 gap-3.5 px-5">
          {bentoTours[0] && (
            <Reveal className="col-span-2">
              <Link
                to={`/app/reisen/${bentoTours[0].slug || bentoTours[0].id}`}
                className="app-card group relative col-span-2 block overflow-hidden p-3 transition-transform active:scale-[0.985]"
              >
                <div className="relative h-44 overflow-hidden rounded-[24px]">
                  <img
                    src={
                      bentoTours[0].hero_image_url ||
                      bentoTours[0].image_url ||
                      "/brand/metropol-logo.png"
                    }
                    alt={`Reise nach ${bentoTours[0].destination}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/70 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                    Highlight
                  </span>
                </div>
                <div className="flex items-end justify-between px-1.5 pb-1 pt-3.5">
                  <div className="min-w-0">
                    <h3 className="truncate text-[18px] font-extrabold leading-tight">
                      {bentoTours[0].destination}
                    </h3>
                    <p className="text-[12px] font-medium text-muted-foreground">
                      {bentoTours[0].duration_days
                        ? `${bentoTours[0].duration_days} Tage`
                        : "Busreise"}{" "}
                      · {bentoTours[0].country || "Europa"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="app-eyebrow block text-primary">ab</span>
                    <span className="text-[19px] font-extrabold leading-none tracking-tight">
                      {money(bentoTours[0].price_from)}
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          )}

          <Reveal delay={0.05}>
            <Link
              to="/app/reisen"
              className="flex aspect-square flex-col justify-between rounded-[28px] bg-secondary p-5 text-white transition-transform active:scale-[0.97]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
                <Users className="h-4 w-4 text-primary-foreground" />
              </span>
              <span>
                <span className="block text-[15px] font-extrabold leading-snug">
                  Alle
                  <br />
                  Reisen
                </span>
                <span className="mt-1 block text-[11px] font-bold text-primary">
                  {(tours ?? []).length} Angebote
                </span>
              </span>
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <Link
              to="/app/tickets"
              className="app-card-flat flex aspect-square flex-col justify-between p-5 transition-transform active:scale-[0.97]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
                <Ticket className="h-4 w-4 text-primary" />
              </span>
              <span>
                <span className="block text-[15px] font-extrabold leading-snug">
                  Meine
                  <br />
                  Tickets
                </span>
                <span className="mt-1 block text-[11px] font-semibold text-muted-foreground">
                  Offline verfügbar
                </span>
              </span>
            </Link>
          </Reveal>

          {cheapest != null && (
            <Reveal delay={0.15} className="col-span-2">
              <Link
                to="/app/reisen"
                className="flex items-center gap-3.5 rounded-[28px] border border-border/60 bg-card p-4 transition-transform active:scale-[0.985]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <Percent className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold leading-tight">
                    Reisen schon ab {money(cheapest)}
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    Inklusive Reisebus, Hotel &amp; Betreuung
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-primary" />
              </Link>
            </Reveal>
          )}
        </div>
      </Section>

      {/* ----------------------------------------------- BELIEBTE ZIELE */}
      {cms.showDestinations && destinations.length > 0 && (
        <Section title={cms.sectionDestinations}>
          <div className="flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {destinations.map((d) => (
              <motion.div key={d.country} whileTap={{ scale: 0.96 }} className="shrink-0">
                <Link
                  to={`/app/reisen?q=${encodeURIComponent(d.country)}`}
                  className="relative block h-32 w-44 overflow-hidden rounded-[24px] border border-border/50"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/85 via-secondary/15 to-transparent" />
                  <span className="absolute bottom-3 left-3.5">
                    <span className="block text-[15px] font-extrabold text-white">{d.country}</span>
                    <span className="text-[11px] font-semibold text-white/70">
                      {d.count} {d.count === 1 ? "Reise" : "Reisen"}
                    </span>
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* ---------------------------------------------------- ANGEBOTE */}
      {cms.showOffers && offers.length > 0 && (
        <Section title={cms.sectionOffers}>
          <div className="space-y-3.5 px-5">
            {offers.map((t, i) => (
              <Reveal key={t.id} delay={0.04 * i}>
                <TourCardMobile tour={t} />
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* -------------------------------------------------- ALLE REISEN */}
      {cms.showAll && (
        <Section title={cms.sectionAll} action={{ label: "Mehr", to: "/app/reisen" }}>
          <div className="space-y-3.5 px-5">
            {isLoading
              ? [0, 1, 2].map((i) => <Shimmer key={i} className="h-[132px] rounded-[28px]" />)
              : (tours ?? [])
                  .slice(0, 5)
                  .map((t, i) => (
                    <Reveal key={t.id} delay={0.04 * i}>
                      <TourCardMobile tour={t} />
                    </Reveal>
                  ))}
          </div>
        </Section>
      )}

      {!isLoading && (tours ?? []).length === 0 && (
        <div className="px-5 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-muted">
            <Sparkles className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="mt-4 text-[15px] font-bold">Noch keine Reisen veröffentlicht</p>
          <p className="mx-auto mt-1.5 max-w-[30ch] text-[13px] text-muted-foreground">
            Wir stellen gerade neue Ziele zusammen. Schau in Kürze wieder vorbei.
          </p>
        </div>
      )}

      <p className="px-8 pt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
        {cms.footerNote}
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
    <section className="mt-9">
      <div className="mb-4 flex items-baseline justify-between px-5">
        <h2 className="text-[20px] font-extrabold tracking-tight">{title}</h2>
        {action && (
          <Link
            to={action.to}
            className="text-[11px] font-black uppercase tracking-[0.14em] text-primary"
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
