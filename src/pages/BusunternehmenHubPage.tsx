import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Bus, ChevronRight, MapPin, Phone, Mail } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import SEO from "@/components/seo/SEO";
import { breadcrumbJsonLd, COMPANY, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";
import { landingPages } from "@/content/landing";

const CITY_SLUGS = [
  { slug: "busunternehmen-hannover", city: "Hannover", note: "Unser Unternehmenssitz" },
  { slug: "busunternehmen-bremen", city: "Bremen" },
  { slug: "busunternehmen-hamburg", city: "Hamburg" },
  { slug: "busunternehmen-berlin", city: "Berlin" },
  { slug: "busunternehmen-muenchen", city: "München" },
  { slug: "busunternehmen-koeln", city: "Köln" },
  { slug: "busunternehmen-frankfurt", city: "Frankfurt am Main" },
  { slug: "busunternehmen-stuttgart", city: "Stuttgart" },
  { slug: "busunternehmen-duesseldorf", city: "Düsseldorf" },
  { slug: "busunternehmen-leipzig", city: "Leipzig" },
  { slug: "busunternehmen-dresden", city: "Dresden" },
  { slug: "busunternehmen-nuernberg", city: "Nürnberg" },
  { slug: "busunternehmen-dortmund", city: "Dortmund" },
  { slug: "busunternehmen-essen", city: "Essen" },
  { slug: "busunternehmen-braunschweig", city: "Braunschweig" },
];

const SERVICE_SLUGS = landingPages
  .filter((p) => !p.slug.startsWith("busunternehmen-") && !p.slug.endsWith("-hannover") && !p.slug.endsWith("-bremen") && !p.slug.endsWith("-hamburg"))
  .map((p) => ({ slug: p.slug, label: p.h1 }));

/** Übersichtsseite /busunternehmen – SEO-Hub für alle Stadt- und Leistungsseiten. */
export default function BusunternehmenHubPage() {
  const schemas: Record<string, unknown>[] = [
    breadcrumbJsonLd([
      { name: "Start", path: "/" },
      { name: "Busunternehmen in Deutschland", path: "/busunternehmen" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `Busunternehmen in Deutschland – ${SITE_NAME}`,
      url: absoluteUrl("/busunternehmen"),
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Busunternehmen in Deutschland – Standorte & Einsatzgebiete"
        description="Metropol Tours: Ihr Busunternehmen mit Sitz in Hannover – Reisebusse mit Fahrer für Gruppen in ganz Deutschland und Europa. Wählen Sie Ihre Stadt."
        path="/busunternehmen"
        jsonLd={schemas}
      />
      <Header />
      <main>
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Bus className="h-4 w-4" />
                Sitz in Hannover · Fahrten in ganz Deutschland & Europa
              </span>
              <h1 className="mt-6 text-4xl md:text-5xl font-bold tracking-tight">
                Ihr Busunternehmen in Deutschland
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Metropol Tours ist ein inhabergeführtes Busunternehmen aus Hannover. Wir stellen
                moderne Reisebusse mit Fahrer für Gruppen, Vereine, Schulen und Firmen – ab Ihrem
                Ort, mit Festpreis und persönlicher Disposition. Wählen Sie Ihre Stadt:
              </p>
            </motion.div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CITY_SLUGS.map((c, i) => (
                <motion.div
                  key={c.slug}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.4 }}
                >
                  <Link
                    to={`/${c.slug}`}
                    className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 hover:border-primary transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary shrink-0" />
                      <span>
                        <span className="block font-semibold">Busunternehmen {c.city}</span>
                        {c.note && <span className="text-sm text-muted-foreground">{c.note}</span>}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Unsere Leistungen</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICE_SLUGS.map((s) => (
                <Link
                  key={s.slug}
                  to={`/${s.slug}`}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 hover:border-primary transition-colors"
                >
                  <span className="font-semibold">{s.label}</span>
                  <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="rounded-3xl bg-primary/10 border border-primary/20 p-10 md:p-14 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Bus für Ihre Gruppe anfragen</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                Ihre Stadt ist nicht dabei? Kein Problem – wir fahren deutschlandweit und in ganz
                Europa. Senden Sie uns Datum, Strecke und Personenzahl.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link to="/business">
                    Jetzt anfragen <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}>
                    <Phone className="mr-2 h-4 w-4" /> {COMPANY.phone}
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href={`mailto:${COMPANY.email}`}>
                    <Mail className="mr-2 h-4 w-4" /> {COMPANY.email}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
