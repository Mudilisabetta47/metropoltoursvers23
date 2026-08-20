import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Bus, Shield, Wifi, Euro, MapPin, CheckCircle2 } from "lucide-react";
import { format, addDays } from "date-fns";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SearchForm from "@/components/booking/SearchForm";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/seo/SEO";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";

const CANONICAL = "https://www.metours.de/busreisen";
const TITLE = "Busreisen ab Hannover, Bremen & Hamburg | Metropol Tours";
const DESCRIPTION =
  "Günstige Busreisen mit Metropol Tours: Linienverbindungen nach Amsterdam, Paris, Rom & mehr sowie Pauschal-Busreisen an die Adria, Mittelmeer & Nordsee. Komfortabel, sicher, ab 19 €.";

interface Stop {
  id: string;
  name: string;
  city: string;
  stop_order: number;
  price_from_start: number;
}

interface Tour {
  id: string;
  slug: string | null;
  destination: string;
  country: string | null;
  price_from: number | null;
  hero_image_url: string | null;
  image_url: string | null;
  short_description: string | null;
  publish_status: string | null;
  is_active: boolean | null;
}


const FAQS = [
  {
    q: "Wie viel kostet eine Busreise mit Metropol Tours?",
    a: "Linienfahrten starten ab 19 €, Pauschal-Busreisen inkl. Hotel ab 499 € pro Person. Der Endpreis hängt von Strecke, Datum und Auslastung ab.",
  },
  {
    q: "Wo fahren die Busse ab?",
    a: "Hauptabfahrtsorte sind Hannover ZOB, Bremen Hbf und Hamburg ZOB. Für Hamburg gilt ein Zustiegsentgelt von 29 €, für Bremen 19 €.",
  },
  {
    q: "Wie lange ist ein Busticket gültig?",
    a: "Tickets von Metropol Tours sind für die gebuchte Verbindung und das gewählte Datum gültig. Eine Umbuchung ist bis 24 h vor Abfahrt möglich.",
  },
  {
    q: "Was ist im Preis enthalten?",
    a: "Sitzplatz, Gepäck (1 Koffer + 1 Handgepäck), WLAN, Klimaanlage, Bord-WC sowie professionelle, mehrsprachige Fahrer.",
  },
  {
    q: "Sind die Busreisen sicher?",
    a: "Ja. Alle Busse erfüllen EU-Sicherheitsstandards, werden regelmäßig gewartet und von ausgebildeten Fahrern im Doppelteam betrieben.",
  },
];

const BusreisenPage = () => {
  const navigate = useNavigate();
  const [stops, setStops] = useState<Stop[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);

  // SEO head

  // Data
  useEffect(() => {
    (async () => {
      const [{ data: stopData }, { data: tourData }] = await Promise.all([
        supabase.from("stops").select("*").order("stop_order"),
        supabase
          .from("package_tours")
          .select("id, slug, destination, country, price_from, hero_image_url, image_url, short_description, publish_status, is_active")
          .neq("publish_status", "archived")
          .order("price_from", { ascending: true })
          .limit(6),

      ]);
      setStops(stopData || []);
      const sortedTours = [...(tourData || [])].sort((a: any, b: any) => {
        const rank = (t: any) => (t.publish_status === "published" && t.is_active !== false ? 0 : 1);
        return rank(a) - rank(b);
      });
      setTours(sortedTours as Tour[]);

    })();
  }, []);

  // Build a small list of popular routes from German hubs to international destinations
  const hubs = ["Hannover", "Bremen", "Hamburg"];
  const popularRoutes = (() => {
    const result: { from: Stop; to: Stop; price: number }[] = [];
    const seen = new Set<string>();
    for (const hub of hubs) {
      const from = stops.find((s) => s.city === hub);
      if (!from) continue;
      const targets = stops.filter(
        (s) => !hubs.includes(s.city) && s.stop_order > from.stop_order,
      );
      for (const to of targets) {
        const key = `${from.city}-${to.city}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const price = Math.max(19, (to.price_from_start || 0) - (from.price_from_start || 0));
        result.push({ from, to, price });
        if (result.length >= 9) return result;
      }
    }
    return result;
  })();

  const goToRoute = (from: Stop, to: Stop) => {
    const tomorrow = addDays(new Date(), 1);
    const params = new URLSearchParams({
      fromStopId: from.id,
      toStopId: to.id,
      from: from.name,
      to: to.name,
      date: format(tomorrow, "yyyy-MM-dd"),
      passengers: "1",
    });
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Busreisen ab Bremen, Hamburg & Hannover – Termine & Preise"
        description="Komfortable Busreisen mit Metropol Tours: aktuelle Verbindungen und Termine ab Bremen, Hamburg, Hannover und Berlin. Moderne Reisebusse mit WLAN und Klimaanlage."
        path="/busreisen"
        jsonLd={[
          breadcrumbJsonLd([{ name: "Startseite", path: "/" }, { name: "Busreisen", path: "/busreisen" }]),
          faqJsonLd(FAQS),
        ]}
      />
      <Header />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="container mx-auto px-4">
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary">Start</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Busreisen</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
              <Bus className="w-4 h-4" />
              Busreisen ab Norddeutschland
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Busreisen ab Hannover, Bremen & Hamburg –{" "}
              <span className="text-primary">günstig, sicher, komfortabel</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed">
              Über 30 europäische Ziele im Linienverkehr und exklusive Pauschal-Busreisen mit
              Hotel. Tagesabfahrten, modernste Reisebusse und transparente Preise ab 19 €.
            </p>

            <div className="flex flex-wrap gap-4 text-sm">
              {[
                { icon: Shield, label: "EU-zertifizierte Sicherheit" },
                { icon: Wifi, label: "WLAN & Klimaanlage" },
                { icon: Euro, label: "Bestpreis-Garantie" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-foreground">
                  <item.icon className="w-4 h-4 text-primary" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <SearchForm variant="hero" />
          </div>
        </div>
      </section>

      {/* Popular bus routes — internal linking to /search */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Beliebte <span className="text-primary">Bus-Strecken</span> in Europa
            </h2>
            <p className="text-muted-foreground text-lg">
              Direktverbindungen ab unseren Hauptabfahrtsorten – täglich oder mehrmals
              wöchentlich.
            </p>
          </div>

          {popularRoutes.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularRoutes.map((route) => (
                <button
                  key={`${route.from.id}-${route.to.id}`}
                  onClick={() => goToRoute(route.from, route.to)}
                  className="text-left bg-card border border-border/40 rounded-2xl p-5 hover:border-primary/40 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <MapPin className="w-4 h-4 text-primary" />
                      Bus {route.from.city} – {route.to.city}
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Komfortabler Reisebus, WLAN, Bord-WC. Tägliche Abfahrten.
                  </div>
                  <div className="text-2xl font-bold text-primary">ab {route.price} €</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Strecken werden geladen…</p>
          )}

          <div className="mt-10 text-center">
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/search">Alle Busverbindungen ansehen</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pauschal-Busreisen — internal linking to /reisen/:slug */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Pauschal-<span className="text-primary">Busreisen</span> mit Hotel
            </h2>
            <p className="text-muted-foreground text-lg">
              Bus, Hotel und Transfers in einem Paket – ideal für Strand-, Städte- und
              Rundreisen ans Mittelmeer und an die Adria.
            </p>
          </div>

          {tours.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map((tour) => {
                const img = tour.hero_image_url || tour.image_url || "/placeholder.svg";
                const slug = tour.slug || tour.id;
                const bookable = tour.publish_status === "published" && tour.is_active !== false;
                return (
                  <Link
                    key={tour.id}
                    to={`/reisen/${slug}`}
                    className="group bg-card border border-border/40 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                      <img
                        src={img}
                        alt={`Busreise nach ${tour.destination}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      {!bookable && (
                        <span className="absolute top-3 left-3 rounded-full bg-background/90 border border-border px-3 py-1 text-xs font-semibold text-foreground">
                          Demnächst buchbar
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="text-xs text-muted-foreground mb-1">{tour.country}</div>
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        Busreise nach {tour.destination}
                      </h3>
                      {tour.short_description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {tour.short_description}
                        </p>
                      )}
                      {tour.price_from != null && (
                        <div className="text-primary font-bold">
                          ab {Number(tour.price_from).toLocaleString("de-DE")} €
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">Reisen werden geladen…</p>
          )}

          <div className="mt-10 text-center">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/reisen">
                Alle Pauschal-Busreisen <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-10 max-w-2xl">
            Warum Busreisen mit <span className="text-primary">Metropol Tours</span>?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Moderne 4- & 5-Sterne-Reisebusse mit Beinfreiheit",
              "Erfahrene Doppelfahrer für lange Strecken",
              "Transparente Preise – keine versteckten Gebühren",
              "Flexibles Umbuchen bis 24 h vor Abfahrt",
              "Persönlicher Service ab Hannover, Bremen & Hamburg",
              "Sicheres Online-Bezahlen mit Stripe & PayPal",
            ].map((item) => (
              <div key={item} className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-10 text-center">
            Häufige Fragen zu Busreisen
          </h2>
          <Accordion type="single" collapsible className="bg-card rounded-2xl border border-border/40 px-6">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Internal link footer */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-6">Weitere Reisearten entdecken</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/wochenendtrips" className="px-5 py-2 rounded-full bg-card border border-border hover:border-primary hover:text-primary transition">Wochenendtrips</Link>
            <Link to="/reisen" className="px-5 py-2 rounded-full bg-card border border-border hover:border-primary hover:text-primary transition">Pauschalreisen</Link>
            <Link to="/business" className="px-5 py-2 rounded-full bg-card border border-border hover:border-primary hover:text-primary transition">Gruppen- & Firmenreisen</Link>
            <Link to="/search" className="px-5 py-2 rounded-full bg-card border border-border hover:border-primary hover:text-primary transition">Linienverkehr suchen</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BusreisenPage;
