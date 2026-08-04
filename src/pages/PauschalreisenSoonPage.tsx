import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Sparkles, Users, MapPin, ArrowRight, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const TITLE = "Pauschalreisen – demnächst verfügbar | METROPOL TOURS";
const DESCRIPTION =
  "Unsere Pauschalreisen mit Bus, Hotel und Transfer starten in Kürze. Bis dahin planen wir Ihre Gruppenreise individuell – jetzt unverbindlich anfragen.";
const CANONICAL = "https://www.metours.de/reisen";


const highlights = [
  {
    icon: MapPin,
    title: "Kroatien, Spanien & mehr",
    text: "Sorgenfreie Komplettpakete mit Anreise im Fernreisebus, Hotel und Transfer vor Ort.",
  },
  {
    icon: Users,
    title: "Für Einzelreisende & Gruppen",
    text: "Ob allein, zu zweit oder als Verein – planbare Festpreise und feste Abfahrtsorte.",
  },
  {
    icon: Sparkles,
    title: "Geprüfte Qualität",
    text: "Sicherungsschein, moderne Reisebusse und persönliche Betreuung ab Hannover.",
  },
];

const PauschalreisenSoonPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Pauschalreisen – demnächst verfügbar | METROPOL TOURS</title>
        <meta
          name="description"
          content="Unsere Pauschalreisen mit Bus, Hotel und Transfer starten in Kürze. Bis dahin planen wir Ihre Gruppenreise individuell – jetzt unverbindlich anfragen."
        />
        <link rel="canonical" href="https://www.metours.de/reisen" />
      </Helmet>

      <Header />

      <main className="pt-24 lg:pt-28">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-background" />
          <div className="container relative mx-auto px-4 py-16 lg:py-24">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                <CalendarClock className="h-4 w-4" />
                Demnächst verfügbar
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-tight text-foreground lg:text-6xl">
                Pauschalreisen von METROPOL TOURS
              </h1>
              <p className="mt-5 text-lg text-muted-foreground lg:text-xl">
                Wir schnüren gerade unsere neuen Komplettpakete: Busanreise, Hotel und
                Transfer aus einer Hand. Die Buchung öffnet in Kürze – schon jetzt
                planen wir Ihre Reise auf Anfrage.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/business">
                    Jetzt Angebot anfragen
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <Link to="/wochenendtrips">
                    <BellRing className="h-4 w-4" />
                    Aktuelle Wochenendtrips ansehen
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="container mx-auto px-4 pb-20">
          <div className="grid gap-6 md:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground">Sie möchten früher reisen?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Wir stellen Ihnen Ihre Wunschreise auch individuell zusammen – mit festem
              Preis und persönlichem Ansprechpartner.
            </p>
            <Button asChild size="lg" className="mt-6 gap-2">
              <Link to="/business">
                Unverbindlich anfragen
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PauschalreisenSoonPage;
