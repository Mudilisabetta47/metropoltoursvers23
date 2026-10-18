import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarDays, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import SEO from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { COMPANY, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { parisSpecial, parisInquiryUrl } from "@/content/parisSpecial";
import parisHero from "@/assets/paris-silvester-fireworks.jpg";
import parisAvenue from "@/assets/paris-silvester-avenue.jpg";

const faqs = [
  { q: "Wann findet die Paris-Reise statt?", a: "Die Reise findet vom 30. Dezember 2026 bis zum 1. Januar 2027 statt. Den Jahreswechsel verbringen Sie in Paris." },
  { q: "Was kostet die Reise?", a: "Den aktuellen Reisepreis erhalten Sie auf Anfrage bei METROPOL TOURS. Schreiben Sie uns die Anzahl der Reisenden und Ihren gewünschten Zustiegsort." },
  { q: "Wo kann ich zusteigen?", a: "Die Zustiegsorte und genauen Abfahrtszeiten teilen wir Ihnen mit Ihrem Angebot mit. Nennen Sie uns bei Ihrer Anfrage Ihren gewünschten Abfahrtsort." },
  { q: "Sind Hotel, Eintritte oder Silvesterveranstaltungen enthalten?", a: "Die verbindlichen Leistungen erhalten Sie mit Ihrem Angebot. Die abgebildeten Sehenswürdigkeiten sind Eindrücke von Paris und keine Zusage für Eintritte, Besichtigungen oder eine bestimmte Silvesterveranstaltung." },
  { q: "Wie kann ich die Reise anfragen?", a: `Über „Reise anfragen“ können Sie uns eine E-Mail mit dem passenden Betreff senden. Alternativ erreichen Sie uns unter ${COMPANY.phone} oder ${COMPANY.email}. Eine Anfrage ist noch keine Buchung.` },
];

export default function ParisSpecialPage() {
  const reduced = useReducedMotion();
  const reveal = {
    initial: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 25 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: reduced ? 0 : 0.7 },
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <SEO title="Silvester Night in Paris · 30.12.2026–01.01.2027" description="Mit METROPOL TOURS zum Jahreswechsel nach Paris: Silvester Night in Paris vom 30. Dezember 2026 bis 1. Januar 2027. Jetzt Reiseinformationen anfragen." path={parisSpecial.path} jsonLd={[breadcrumbJsonLd([{ name: "Startseite", path: "/" }, { name: parisSpecial.name, path: parisSpecial.path }]), faqJsonLd(faqs)]} />
      <Header />
      <main className="pt-16 lg:pt-20">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={parisHero} alt="Illustratives Silvestermotiv: Feuerwerk über dem Eiffelturm und der Seine in Paris" width={1920} height={1088} fetchPriority="high" className="h-full w-full object-cover object-right" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/30" />
          </div>
          <div className="relative container mx-auto max-w-6xl px-4 py-20 md:py-28">
            <motion.div {...reveal} className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"><Sparkles className="h-4 w-4" /> METROPOL TOURS SPECIAL</span>
              <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">{parisSpecial.name}</h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">Ein neues Jahr. Eine besondere Stadt. Erleben Sie den Jahreswechsel in Paris mit METROPOL TOURS.</p>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm"><li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{parisSpecial.dateLabel}</li><li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Paris, Frankreich</li></ul>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button asChild size="lg"><a href="#anfrage">Reise anfragen <ArrowRight /></a></Button>
                <Button asChild size="lg" variant="outline"><a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}><Phone />{COMPANY.phone}</a></Button>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">KI-generiertes Silvestermotiv · keine Zusage für ein bestimmtes Feuerwerk</p>
            </motion.div>
          </div>
        </section>

        <section id="reise" className="scroll-mt-36 px-5 py-20 md:py-28">
          <motion.div {...reveal} className="mx-auto max-w-6xl">
            <p className="text-sm font-semibold text-primary">DER JAHRESWECHSEL. MAL ANDERS.</p>
            <h2 className="mt-5 text-3xl font-bold md:text-4xl">Silvester in Paris erleben</h2>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">Die Stadt der Lichter wird zum Schauplatz Ihres Jahreswechsels. Reisen Sie mit METROPOL TOURS nach Paris und begrüßen Sie 2027 mit einer ganz besonderen Perspektive.</p>
          </motion.div>
          <dl className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-7 border-y border-border py-8 text-center sm:grid-cols-3 sm:divide-x sm:divide-border">
            <div><dt className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" /> Reisezeitraum</dt><dd className="mt-3 text-lg font-semibold">30.12. – 01.01.</dd><p className="mt-1 text-sm text-muted-foreground">2026 / 2027</p></div>
            <div><dt className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> Reiseziel</dt><dd className="mt-3 text-lg font-semibold">Paris</dd><p className="mt-1 text-sm text-muted-foreground">Frankreich</p></div>
            <div><dt className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Sparkles className="h-4 w-4" /> Anlass</dt><dd className="mt-3 text-lg font-semibold">Silvester</dd><p className="mt-1 text-sm text-muted-foreground">Ein besonderer Jahreswechsel</p></div>
          </dl>
        </section>

        <TestimonialsSection />

        <section className="paris-scene relative isolate flex min-h-[520px] items-end overflow-hidden px-6 py-12 text-primary-foreground md:min-h-[650px] md:px-12 md:py-16">
          <img src={parisAvenue} alt="Winterliche Champs-Élysées mit Blick auf den beleuchteten Arc de Triomphe" width={1600} height={1024} loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover" />
          <div className="hero-overlay absolute inset-0 -z-10" />
          <motion.div {...reveal} className="mx-auto w-full max-w-6xl"><p className="mb-4 text-sm font-medium">BONJOUR, PARIS.</p><h2 className="max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">Die Lichter.<br />Die Stadt. Der Moment.</h2><p className="mt-5 max-w-lg text-base leading-relaxed text-secondary-foreground/85">Von der Seine bis zu den großen Boulevards: Paris ist eine Einladung, den Alltag für einen Moment hinter sich zu lassen.</p><p className="mt-6 text-xs text-secondary-foreground/70">Paris-Impressionen · KI-generierte Motive</p></motion.div>
        </section>

        <section className="bg-muted/50 px-5 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <motion.div {...reveal}><p className="text-sm font-semibold text-primary">DREI DATEN. EIN JAHRESWECHSEL.</p><h2 className="mt-4 text-3xl font-bold md:text-4xl">Ihr Termin für Paris</h2></motion.div>
            <ol className="mt-12 grid gap-9 md:grid-cols-3 md:gap-10">
              {[{ date: "30.12.", year: "2026", title: "Die Reise beginnt.", text: "Beginn Ihrer Paris-Reise. Die genaue Abfahrtszeit und Ihren Zustiegsort erhalten Sie mit den Reiseinformationen." }, { date: "31.12.", year: "2026", title: "Bonsoir, Silvester.", text: "Der letzte Tag des Jahres – und Ihr Jahreswechsel in Paris. Details zur Gestaltung des Aufenthalts erhalten Sie mit Ihrem Angebot." }, { date: "01.01.", year: "2027", title: "Bonjour, neues Jahr.", text: "Der letzte Tag des Reisezeitraums. Die genauen Rückreisezeiten teilen wir Ihnen mit den Reiseinformationen mit." }].map((day) => <motion.li {...reveal} key={day.date} className="border-t border-border pt-6"><p className="text-5xl font-semibold">{day.date}<span className="ml-2 text-sm font-medium text-muted-foreground">{day.year}</span></p><h3 className="mt-5 text-xl font-semibold">{day.title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{day.text}</p></motion.li>)}
            </ol>
          </div>
        </section>

        <section id="anfrage" className="scroll-mt-36 px-5 py-20 md:py-28">
          <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-primary">IHR JAHRESWECHSEL MIT METROPOL TOURS</p>
            <h2 className="mt-5 text-3xl font-bold md:text-4xl">Silvesterreise nach Paris anfragen</h2>
            <p className="mt-6 text-lg text-muted-foreground">{parisSpecial.dateLabel}</p>
            <p className="mx-auto mt-6 max-w-xl leading-relaxed text-muted-foreground">Fragen Sie jetzt Ihre Reise an. Wir informieren Sie persönlich über Preis, Zustiegsorte und die enthaltenen Leistungen.</p>
            <p className="mt-7 text-xl font-semibold">Preis auf Anfrage</p>
            <Button asChild size="lg" className="mt-6"><a href={parisInquiryUrl}>Reise per E-Mail anfragen <Mail /></a></Button>
            <p className="mt-4 text-xs text-muted-foreground">Unverbindliche Anfrage · keine Buchung oder Zahlung</p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 text-sm sm:flex-row"><a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-primary"><Phone className="h-4 w-4 text-primary" />{COMPANY.phone}</a><a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2 break-all hover:text-primary"><Mail className="h-4 w-4 text-primary" />{COMPANY.email}</a></div>
          </motion.div>
        </section>

        <section id="fragen" className="scroll-mt-36 border-t border-border px-5 py-16 md:py-24">
          <div className="mx-auto max-w-6xl"><h2 className="mb-8 text-3xl font-bold md:text-4xl">Häufige Fragen</h2><Accordion type="single" collapsible className="max-w-3xl">{faqs.map((faq, index) => <AccordionItem key={faq.q} value={`paris-${index}`}><AccordionTrigger className="text-left text-base">{faq.q}</AccordionTrigger><AccordionContent className="leading-relaxed text-muted-foreground">{faq.a}</AccordionContent></AccordionItem>)}</Accordion><Button asChild variant="link" className="mt-8 px-0"><Link to="/reisen">Alle Reisen entdecken <ArrowRight /></Link></Button></div>
        </section>
      </main>
      <Footer />
    </div>
  );
}