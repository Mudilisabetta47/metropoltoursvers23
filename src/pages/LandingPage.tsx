import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bus,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Users,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SEO from "@/components/seo/SEO";
import NotFound from "@/pages/NotFound";
import { breadcrumbJsonLd, faqJsonLd, COMPANY, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";
import { landingBySlug, type LandingContent } from "@/content/landing";
import type { LandingImageKey } from "@/content/landing/types";

import busReal from "@/assets/metropol-bus-real.jpg";
import premiumBus from "@/assets/hero-premium-bus.jpg";
import businessImg from "@/assets/business-hero.jpg";
import groupImg from "@/assets/hero-group-travel.jpg";
import heroBus from "@/assets/hero-bus.jpg";
import metropolHero from "@/assets/metropol-bus-hero.jpg";
import journey from "@/assets/journey-hero.jpg";

const IMAGES: Record<LandingImageKey, string> = {
  busReal,
  premiumBus,
  business: businessImg,
  group: groupImg,
  heroBus,
  metropolHero,
  journey,
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i, 6) * 0.06, duration: 0.5 },
  }),
};

const Section = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={`py-16 md:py-24 ${className}`}>
    <div className="container mx-auto px-4 max-w-6xl">{children}</div>
  </section>
);

export function LandingView({ content }: { content: LandingContent }) {
  const path = `/${content.slug}`;
  const hero = IMAGES[content.heroImage] ?? metropolHero;

  const schemas: Record<string, unknown>[] = [
    breadcrumbJsonLd([
      { name: "Start", path: "/" },
      { name: content.h1, path },
    ]),
    faqJsonLd(content.faqs),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: content.h1,
      serviceType: "Busvermietung",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: content.area.cities.map((c) => ({ "@type": "Place", name: c })),
      url: absoluteUrl(path),
    },
  ];

  if (content.locality) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}${path}#localbusiness`,
      name: `${SITE_NAME} – ${content.locality}`,
      url: absoluteUrl(path),
      telephone: COMPANY.phone,
      email: COMPANY.email,
      address: {
        "@type": "PostalAddress",
        addressLocality: content.locality,
        addressCountry: COMPANY.country,
      },
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={content.seoTitle}
        description={content.seoDescription}
        path={path}
        jsonLd={schemas}
      />
      <Header />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={hero}
              alt={content.heroAlt}
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
          </div>
          <div className="relative container mx-auto px-4 max-w-6xl py-24 md:py-32">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
              className="max-w-2xl"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Bus className="h-4 w-4" />
                {content.heroKicker}
              </span>
              <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                {content.h1}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                {content.heroText}
              </p>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                {content.heroFacts.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/business">
                    Angebot anfragen <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}>
                    <Phone className="mr-2 h-4 w-4" /> {COMPANY.phone}
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Warum wir */}
        <Section>
          <h2 className="text-3xl md:text-4xl font-bold mb-10">Warum Metropol Tours?</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {content.why.map((c, i) => (
              <motion.div
                key={c.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <h3 className="text-lg font-semibold mb-2">{c.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{c.text}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Redaktionelle Sektionen */}
        <Section className="bg-muted/30">
          <div className="space-y-14">
            {content.sections.map((s) => (
              <article key={s.h2} className="max-w-3xl">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">{s.h2}</h2>
                {s.body.map((p, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed mb-4">
                    {p}
                  </p>
                ))}
                {s.blocks?.map((b) => (
                  <div key={b.h3} className="mt-6 rounded-xl border-l-2 border-primary pl-5">
                    <h3 className="font-semibold mb-1">{b.h3}</h3>
                    <p className="text-muted-foreground leading-relaxed">{b.text}</p>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </Section>

        {/* Flotte */}
        <Section>
          <h2 className="text-3xl md:text-4xl font-bold mb-10">Unsere Fahrzeuge</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {content.fleet.map((f, i) => (
              <motion.div
                key={f.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl bg-card border border-border p-6"
              >
                <Bus className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold">{f.name}</h3>
                <p className="text-sm text-primary font-medium mb-2">{f.seats}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Anlässe */}
        <Section className="bg-muted/30">
          <h2 className="text-3xl md:text-4xl font-bold mb-10">Für welche Anlässe?</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {content.occasions.map((o) => (
              <div key={o.title} className="rounded-2xl bg-card border border-border p-6">
                <Users className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{o.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{o.text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Ablauf */}
        <Section>
          <h2 className="text-3xl md:text-4xl font-bold mb-10">So läuft Ihre Anfrage</h2>
          <div className="grid gap-6 md:grid-cols-4">
            {content.process.map((p) => (
              <div key={p.title} className="relative pl-5 border-l-2 border-primary/40">
                <h3 className="font-semibold mb-1">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Einsatzgebiet + Vorteile */}
        <Section className="bg-muted/30">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Einsatzgebiet</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">{content.area.intro}</p>
              <div className="flex flex-wrap gap-2">
                {content.area.cities.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1.5 text-sm"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Ihre Vorteile</h2>
              <ul className="space-y-3">
                {content.advantages.map((a) => (
                  <li key={a} className="flex gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* FAQ */}
        <Section>
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Häufige Fragen</h2>
          <Accordion type="single" collapsible className="max-w-3xl">
            {content.faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>

        {/* Interne Links */}
        <Section className="bg-muted/30">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Passende Seiten</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.links.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className="group rounded-2xl border border-border bg-card p-5 hover:border-primary transition-colors"
              >
                <span className="flex items-center justify-between font-semibold">
                  {l.label}
                  <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                </span>
                <p className="mt-1 text-sm text-muted-foreground">{l.text}</p>
              </Link>
            ))}
          </div>
        </Section>

        {/* CTA */}
        <Section>
          <div className="rounded-3xl bg-primary/10 border border-primary/20 p-10 md:p-14 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{content.ctaTitle}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              {content.ctaText}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/business">
                  Jetzt anfragen <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={`mailto:${COMPANY.email}`}>
                  <Mail className="mr-2 h-4 w-4" /> {COMPANY.email}
                </a>
              </Button>
            </div>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  );
}

/** Route-Wrapper: /:landingSlug */
export default function LandingPage() {
  const { landingSlug } = useParams();
  const content = landingSlug ? landingBySlug[landingSlug] : undefined;
  if (!content) return <NotFound />;
  return <LandingView content={content} />;
}
