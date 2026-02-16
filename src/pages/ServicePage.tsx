import { useState } from "react";
import { Link } from "react-router-dom";
import { Wifi, Snowflake, Armchair, Plug, Coffee, Shield, Briefcase, HelpCircle, ChevronDown, Clock, Ban, CreditCard, Dog, Baby, Bike } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

const ServicePage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const comfortFeatures = [
    { icon: Wifi, title: "Kostenloses WLAN", description: "Surfen Sie während der gesamten Fahrt im Internet – schnell und zuverlässig." },
    { icon: Snowflake, title: "Klimaanlage", description: "Angenehme Temperatur in allen Bussen, das ganze Jahr über." },
    { icon: Armchair, title: "Bequeme Sitze", description: "Ergonomische Sitze mit extra Beinfreiheit für entspanntes Reisen." },
    { icon: Plug, title: "Steckdosen", description: "USB- und 230V-Steckdosen an jedem Sitzplatz." },
    { icon: Coffee, title: "Bordservice", description: "Snacks und Getränke für Ihre Erfrischung während der Reise." },
    { icon: Shield, title: "Sicherheit", description: "Modernste Sicherheitstechnik und erfahrene Fahrer." },
  ];

  const luggageRules = [
    { type: "Handgepäck", allowance: "1 Stück", size: "max. 42x30x18 cm", weight: "max. 7 kg", icon: Briefcase, included: true },
    { type: "Reisegepäck", allowance: "1 Stück", size: "max. 80x50x30 cm", weight: "max. 20 kg", icon: Briefcase, included: true },
    { type: "Sondergepäck", allowance: "Auf Anfrage", size: "variabel", weight: "variabel", icon: Bike, included: false },
  ];

  const additionalItems = [
    { item: "Haustiere", icon: Dog, info: "Kleine Haustiere in Transportbox erlaubt (Aufpreis €14,99)", allowed: true },
    { item: "Kinderwagen", icon: Baby, info: "Zusammenklappbare Kinderwagen kostenlos", allowed: true },
    { item: "Fahrräder", icon: Bike, info: "Nur zusammenklappbar oder in spezieller Tasche", allowed: true },
    { item: "Sperrgepäck", icon: Briefcase, info: "Surfbretter, Skier etc. auf Anfrage", allowed: true },
  ];

  const faqs = [
    {
      question: "Wie kann ich meine Buchung stornieren?",
      answer: "Sie können Ihre Buchung bis zu 15 Minuten vor Abfahrt kostenlos stornieren. Gehen Sie dazu in 'Meine Buchungen' und klicken Sie auf 'Stornieren'. Bei Premium-Tickets ist eine kostenlose Stornierung bis 24 Stunden vor Abfahrt möglich."
    },
    {
      question: "Kann ich mein Ticket auf eine andere Person übertragen?",
      answer: "Ja, Sie können Ihr Ticket bis zu 15 Minuten vor Abfahrt kostenlos auf eine andere Person übertragen. Ändern Sie einfach den Namen in Ihrer Buchungsübersicht."
    },
    {
      question: "Was passiert, wenn mein Bus Verspätung hat?",
      answer: "Bei Verspätungen von mehr als 60 Minuten haben Sie Anspruch auf eine Teilerstattung. Ab 120 Minuten können Sie die vollständige Erstattung verlangen oder kostenlos umbuchen."
    },
    {
      question: "Gibt es eine Altersbeschränkung für alleinreisende Kinder?",
      answer: "Kinder unter 10 Jahren müssen von einem Erwachsenen begleitet werden. Kinder zwischen 10 und 15 Jahren können alleine reisen, benötigen aber eine schriftliche Einverständniserklärung der Eltern."
    },
    {
      question: "Kann ich zusätzliches Gepäck mitnehmen?",
      answer: "Ja, Sie können bei der Buchung oder nachträglich zusätzliches Gepäck hinzubuchen. Ein weiteres Gepäckstück kostet €9,99. Sondergepäck muss vorher angemeldet werden."
    },
    {
      question: "Sind die Busse barrierefrei?",
      answer: "Ja, alle unsere Busse sind mit Rollstuhlrampen ausgestattet. Bitte informieren Sie uns bei der Buchung, wenn Sie einen Rollstuhlplatz benötigen, damit wir alles vorbereiten können."
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Header />
      
      <main className="flex-1 pt-20 lg:pt-24">
        {/* Hero */}
        <section className="bg-primary py-16 lg:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl lg:text-5xl font-bold text-primary-foreground mb-4">
              Service & Informationen
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Alles was Sie für Ihre Reise mit METROPOL TOURS wissen müssen – von Komfort über Gepäck bis hin zu häufigen Fragen.
            </p>
          </div>
        </section>

        {/* Comfort Features */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground text-center mb-12">
              Komfort an Bord
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comfortFeatures.map((feature) => (
                <div key={feature.title} className="card-elevated p-6 flex gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Luggage Rules */}
        <section className="py-16 lg:py-24 bg-muted/50" id="luggage">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground text-center mb-4">
              Gepäckregeln
            </h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              Informieren Sie sich über die erlaubten Gepäckstücke und deren Maße.
            </p>

            <div className="max-w-4xl mx-auto">
              <div className="grid gap-4 mb-8">
                {luggageRules.map((rule) => (
                  <div key={rule.type} className="bg-card rounded-xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <rule.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 grid sm:grid-cols-4 gap-2 sm:gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">Art</div>
                        <div className="font-semibold text-foreground">{rule.type}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">Anzahl</div>
                        <div className="text-foreground">{rule.allowance}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">Größe</div>
                        <div className="text-foreground">{rule.size}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase">Gewicht</div>
                        <div className="text-foreground">{rule.weight}</div>
                      </div>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium shrink-0",
                      rule.included ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                    )}>
                      {rule.included ? "Inklusive" : "Aufpreis"}
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="font-semibold text-foreground mb-4">Sondergepäck & Mitnahmebedingungen</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {additionalItems.map((item) => (
                  <div key={item.item} className="bg-card rounded-xl p-4 shadow-card flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{item.item}</div>
                      <div className="text-sm text-muted-foreground">{item.info}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground text-center mb-4">
              Häufige Fragen
            </h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              Finden Sie schnell Antworten auf die wichtigsten Fragen.
            </p>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-card rounded-xl shadow-card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <span className="font-medium text-foreground pr-4">{faq.question}</span>
                    <ChevronDown className={cn(
                      "w-5 h-5 text-muted-foreground shrink-0 transition-transform",
                      openFaq === index && "rotate-180"
                    )} />
                  </button>
                  <div className={cn(
                    "overflow-hidden transition-all duration-300",
                    openFaq === index ? "max-h-48" : "max-h-0"
                  )}>
                    <div className="px-6 pb-4 text-muted-foreground">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">Ihre Frage nicht gefunden?</p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
              >
                <HelpCircle className="w-5 h-5" />
                Kontaktieren Sie unseren Support
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ServicePage;
