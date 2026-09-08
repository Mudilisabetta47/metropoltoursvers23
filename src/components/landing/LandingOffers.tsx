import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchLandingOffers,
  matchesOffer,
  offerMatcherForSlug,
  type LandingOffer,
} from "@/lib/landingOffers";

const dateFmt = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : null;

const priceFmt = (v: number | null) =>
  v != null
    ? v.toLocaleString("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 })
    : null;

function OfferCard({ offer }: { offer: LandingOffer }) {
  const dep = dateFmt(offer.departureDate);
  const ret = dateFmt(offer.returnDate);
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      {offer.image && (
        <img
          src={offer.image}
          alt={`Busreise nach ${offer.title} mit METROPOL TOURS`}
          loading="lazy"
          className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold">{offer.title}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {offer.country && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" /> {offer.country}
            </span>
          )}
          {offer.departureCity && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" /> ab {offer.departureCity}
            </span>
          )}
          {offer.departureTime && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" /> {offer.departureTime}
            </span>
          )}
        </p>

        {(dep || ret) && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm">
            <CalendarDays className="h-4 w-4 text-primary" />
            {dep}
            {ret ? ` – ${ret}` : ""}
          </p>
        )}

        {offer.seatsLeft != null && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            {offer.seatsLeft > 0 ? `${offer.seatsLeft} Plätze frei` : "Ausgebucht"}
          </p>
        )}

        {offer.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {offer.description}
          </p>
        )}

        <div className="mt-4 flex items-end justify-between gap-3 pt-2">
          {offer.price != null ? (
            <p className="text-sm text-muted-foreground">
              ab <span className="text-xl font-bold text-foreground">{priceFmt(offer.price)}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Preis auf Anfrage</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to={offer.url}>Details ansehen</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={offer.price != null ? offer.url : "/business"}>
              {offer.price != null ? "Jetzt buchen" : "Anfrage stellen"}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

/**
 * Zeigt echte, im Backend gepflegte Fahrten passend zur Landingpage.
 * Ohne Treffer erscheint ein Anfrage-Bereich plus alternative Reisen.
 */
export default function LandingOffers({ slug, title }: { slug: string; title: string }) {
  const [offers, setOffers] = useState<LandingOffer[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchLandingOffers()
      .then((data) => active && setOffers(data))
      .catch(() => active && setOffers([]));
    return () => {
      active = false;
    };
  }, []);

  const matcher = useMemo(() => offerMatcherForSlug(slug), [slug]);
  const matched = useMemo(
    () => (offers ?? []).filter((o) => matchesOffer(o, matcher)).slice(0, 6),
    [offers, matcher],
  );
  const alternatives = useMemo(
    () => (offers ?? []).filter((o) => !matched.includes(o)).slice(0, 3),
    [offers, matched],
  );

  if (offers === null) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        {matched.length > 0 ? (
          <>
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">Aktuelle Fahrten &amp; Reisen</h2>
            <p className="mb-10 max-w-2xl text-muted-foreground">
              Alle Termine kommen direkt aus unserem Buchungssystem – so sehen Sie immer den
              aktuellen Stand für {title}.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {matched.map((o) => (
                <OfferCard key={`${o.kind}-${o.id}`} offer={o} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-8 md:p-12">
              <h2 className="text-2xl font-bold md:text-3xl">
                Aktuell keine feste Abfahrt – Ihre Reise planen wir individuell
              </h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
                Für diesen Bereich ist derzeit kein veröffentlichter Termin im System. Wir stellen
                Ihnen Fahrt, Zeiten und Preis auf Basis Ihrer Wünsche zusammen – in der Regel
                innerhalb von 24 Stunden.
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link to="/business">
                  Individuelle Busreise anfragen <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {alternatives.length > 0 && (
              <div className="mt-12">
                <h3 className="mb-6 text-xl font-semibold">Diese Reisen sind aktuell buchbar</h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {alternatives.map((o) => (
                    <OfferCard key={`${o.kind}-${o.id}`} offer={o} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
