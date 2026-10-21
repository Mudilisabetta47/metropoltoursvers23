import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowRight, CalendarDays, MapPin, Mail, Phone, Sparkles, Bus, ShieldCheck, CalendarClock, CreditCard } from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/seo/SEO";
import AiBadge from "@/components/common/AiBadge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { absoluteUrl, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { selectSilvesterTours, silvesterFaq } from "@/lib/silvesterTours";
import hero from "@/assets/silvester-amsterdam-bus.png.asset.json";
import { PaymentBrandLogos } from "@/components/checkout/PaymentBrandLogos";

const dateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function SilvesterreisenPage() {
  const { data: tours = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["silvesterreisen", format(new Date(), "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase.from("package_tours")
        .select("id,destination,location,country,slug,image_url,hero_image_url,is_active,publish_status,seo_noindex,tour_dates(departure_date,return_date,price_basic,is_active,status)")
        .eq("is_active", true).eq("publish_status", "published");
      if (error) throw error;
      return selectSilvesterTours(data ?? [], format(new Date(), "yyyy-MM-dd"));
    },
  });
  const year = tours[0]?.dates[0]?.return_date.slice(0, 4);
  const schemas = [
    breadcrumbJsonLd([{ name: "Startseite", path: "/" }, { name: "Silvesterreisen", path: "/silvesterreisen" }]),
    faqJsonLd(silvesterFaq),
    { "@context": "https://schema.org", "@type": "CollectionPage", "@id": absoluteUrl("/silvesterreisen#page"), name: "Silvester-Busreisen mit METROPOL TOURS", url: absoluteUrl("/silvesterreisen"), mainEntity: {
      "@type": "ItemList", itemListElement: tours.filter(tour => !tour.seo_noindex).map((tour, index) => ({ "@type": "ListItem", position: index + 1, name: tour.destination, url: absoluteUrl(`/reisen/${tour.slug || tour.id}`) })),
    } },
  ];
  return <div className="silvester-campaign bg-background text-foreground">
    <SEO title="Silvester-Busreisen nach Paris & Amsterdam" description="Silvester mit METROPOL TOURS: Busreisen zum Jahreswechsel nach Paris und Amsterdam. Aktuelle Termine und Preise vergleichen, Reiseprogramm ansehen und online buchen." path="/silvesterreisen" image={hero.url} jsonLd={schemas} />
    <Header />
    <main>
      <section className="silvester-hero relative isolate overflow-hidden">
        <img src={hero.url} alt="Grüner METROPOL TOURS Reisebus am beleuchteten Amsterdamer Kanal – KI-generiertes Motiv" className="absolute inset-0 h-full w-full object-cover silvester-image" fetchPriority="high" width={1365} height={768} />
        <div className="absolute inset-0 silvester-shade" />
        <div className="container relative flex h-full flex-col justify-end px-4 pb-14 pt-32 lg:px-8 lg:pb-16">
          <p className="mb-5 flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="h-4 w-4" /> METROPOL TOURS · SILVESTERREISEN {year ? `→ ${year}` : ""}</p>
          <h1 className="silvester-title max-w-3xl font-bold leading-none">Silvester.<br /><span className="text-primary">Raus ins Leben.</span></h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground/85 md:text-lg">Paris oder Amsterdam. Deine Menschen. Ein neuer Anfang.<br />Mach den Jahreswechsel zu deiner nächsten Reise.</p>
          <div className="mt-7 flex flex-wrap items-center gap-5"><Button asChild size="lg" className="gap-3 rounded-lg"><a href="#reisen">Silvesterreise finden <ArrowDown className="h-4 w-4" /></a></Button><span className="text-sm text-foreground/70">Gemeinsam unterwegs. Gemeinsam ins neue Jahr.</span></div>
        </div>
        <AiBadge className="bottom-3 right-4" />
      </section>
      <div className="border-b border-border"><div className="container grid grid-cols-1 gap-4 px-4 py-6 text-sm sm:grid-cols-3 lg:px-8">{[{ icon: Bus, text: "Mit METROPOL TOURS unterwegs" }, { icon: CalendarDays, text: "Termine direkt aus unserer Reiseplanung" }, { icon: ShieldCheck, text: "Sicher online bezahlen mit Mollie" }].map(({ icon: Icon, text }) => <div className="flex items-center gap-3" key={text}><Icon className="h-5 w-5 shrink-0 text-primary" /><span>{text}</span></div>)}</div></div>
      <section aria-label="Zahlungsmethoden" className="border-b border-border bg-muted/40">
        <div className="container flex flex-col gap-6 px-4 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="space-y-3">
            <p className="text-sm font-semibold">Deine Reise. Deine Zahlungsart.</p>
            <PaymentBrandLogos brands={["visa", "mastercard", "amex", "klarna", "sepa", "paypal"]} />
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium">
              <span className="flex items-center gap-2"><CalendarClock className="h-5 w-5 shrink-0 text-primary" />Mit Klarna in 30 Tagen bezahlen</span>
              <span className="flex items-center gap-2"><CreditCard className="h-5 w-5 shrink-0 text-primary" />Klarna Ratenzahlung</span>
            </div>
            <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">Vorbehaltlich Verfügbarkeit und Bonitätsprüfung durch Klarna. Die verfügbaren Optionen und Bedingungen werden dir beim Bezahlen angezeigt.</p>
          </div>
        </div>
      </section>
      <section id="reisen" className="container scroll-mt-24 px-4 py-16 lg:px-8 lg:py-20">
        <p className="mb-8 flex items-start gap-3 border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground"><Bus className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span><strong className="text-foreground">Hin- und Rückfahrt enthalten.</strong> Hotel und Frühstück sind nicht enthalten – diese organisierst und bezahlst du selbst.</span></p>
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-3 text-sm font-semibold text-primary">DEIN JAHRESWECHSEL</p><h2 className="text-3xl font-bold md:text-4xl">Wohin startet dein neues Jahr?</h2></div><p className="max-w-sm text-sm leading-relaxed text-muted-foreground">Unsere Silvester-Busreisen. Deine Wahl.<br />Alle Details und Tarife findest du bei der jeweiligen Reise.</p></div>
        {isLoading ? <div role="status" className="py-12 text-muted-foreground">Reisen werden geladen …</div> : isError ? <div className="py-10"><p className="mb-4">Die Reisen konnten gerade nicht geladen werden.</p><Button variant="outline" onClick={() => refetch()}>Erneut laden</Button></div> : tours.length === 0 ? <p className="py-12 text-muted-foreground">Aktuell sind keine kommenden Silvestertermine freigegeben. Fragen? <a className="text-primary underline" href="mailto:kundenservice@metours.de">Schreib uns.</a></p> : <div className="grid gap-8 md:grid-cols-2">{tours.map(tour => <article key={tour.id} className="group overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
          <Link to={`/reisen/${tour.slug || tour.id}`} className="relative block aspect-[16/10] overflow-hidden" aria-label={`${tour.destination} ansehen`}>
            <img src={tour.hero_image_url || tour.image_url || hero.url} alt={tour.location} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
            <div className="absolute bottom-4 left-4 rounded bg-background/90 px-3 py-1.5 text-xs font-semibold">{tour.country}</div>
          </Link>
          <div className="p-6"><div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />{tour.location}</div><h3 className="text-2xl font-bold">{tour.destination}</h3><p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4 shrink-0" />{dateLabel(tour.dates[0].departure_date)} – {dateLabel(tour.dates[0].return_date)}</p><div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-5"><div>{tour.price ? <><span className="text-xs text-muted-foreground">ab · pro Person</span><p className="mt-1 text-3xl font-bold">{tour.price.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p></> : <span className="text-muted-foreground">Preis auf Anfrage</span>}</div><Button asChild className="gap-2 rounded-lg"><Link to={`/reisen/${tour.slug || tour.id}`}>Reise ansehen <ArrowRight className="h-4 w-4" /></Link></Button></div></div>
        </article>)}</div>}
      </section>
      <section className="border-y border-border bg-muted/40"><div className="container grid gap-10 px-4 py-16 md:grid-cols-2 lg:px-8"><h2 className="text-3xl leading-tight md:text-4xl">Nicht nur ein Jahreswechsel.<br /><span className="text-primary">Eine gemeinsame Erinnerung.</span></h2><div className="space-y-5 leading-relaxed text-muted-foreground"><p>Eine Silvester-Busreise nach Paris oder Amsterdam verbindet den Jahreswechsel mit einer Städtereise. Statt nur den Abend zu planen, sucht ihr euch ein Reiseziel und reist gemeinsam mit METROPOL TOURS.</p><p>Vergleiche die angebotenen Termine und Preise. Das konkrete Reiseprogramm, die Zustiege, enthaltenen Leistungen und optionalen Extras stehen auf deiner Reiseseite – so buchst du genau die Reise, die zu euch passt.</p><Button asChild variant="link" className="h-auto p-0"><Link to="/reisen">Alle Pauschalreisen entdecken <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></div></section>
      <section className="container grid gap-10 px-4 py-16 md:grid-cols-[1fr_1.5fr] lg:px-8"><div><p className="mb-3 text-sm font-semibold text-primary">GUT ZU WISSEN</p><h2 className="text-3xl">Fragen zu deiner<br />Silvesterreise?</h2></div><Accordion type="single" collapsible>{silvesterFaq.map((faq, index) => <AccordionItem value={String(index)} key={faq.q}><AccordionTrigger className="text-left text-base">{faq.q}</AccordionTrigger><AccordionContent className="leading-relaxed text-muted-foreground">{faq.a}</AccordionContent></AccordionItem>)}</Accordion></section>
      <section className="border-t border-border"><div className="container flex flex-wrap items-center justify-between gap-8 px-4 py-12 lg:px-8"><div><h2 className="text-2xl">Lieber persönlich planen?</h2><p className="mt-2 text-muted-foreground">Wir sind für deine Fragen und eure Gruppenreise da.</p></div><div className="flex flex-col gap-3"><a href="tel:+4951180781106" className="flex items-center gap-3 text-primary"><Phone className="h-4 w-4" />+49 511 80781106</a><a href="mailto:kundenservice@metours.de" className="flex items-center gap-3 break-all text-sm"><Mail className="h-4 w-4 shrink-0 text-primary" />kundenservice@metours.de</a></div></div></section>
    </main><Footer />
  </div>;
}