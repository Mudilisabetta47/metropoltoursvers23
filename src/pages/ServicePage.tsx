import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wifi, Snowflake, Armchair, Plug, Coffee, Shield, Briefcase, HelpCircle,
  ChevronDown, Dog, Baby, Bike, Phone, Mail, Sparkles
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

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
    { question: "Wie kann ich meine Buchung stornieren?", answer: "Sie können Ihre Buchung bis zu 15 Minuten vor Abfahrt kostenlos stornieren. Gehen Sie dazu in 'Meine Buchungen' und klicken Sie auf 'Stornieren'. Bei Premium-Tickets ist eine kostenlose Stornierung bis 24 Stunden vor Abfahrt möglich." },
    { question: "Kann ich mein Ticket auf eine andere Person übertragen?", answer: "Ja, Sie können Ihr Ticket bis zu 15 Minuten vor Abfahrt kostenlos auf eine andere Person übertragen. Ändern Sie einfach den Namen in Ihrer Buchungsübersicht." },
    { question: "Was passiert, wenn mein Bus Verspätung hat?", answer: "Bei Verspätungen von mehr als 60 Minuten haben Sie Anspruch auf eine Teilerstattung. Ab 120 Minuten können Sie die vollständige Erstattung verlangen oder kostenlos umbuchen." },
    { question: "Gibt es eine Altersbeschränkung für alleinreisende Kinder?", answer: "Kinder unter 10 Jahren müssen von einem Erwachsenen begleitet werden. Kinder zwischen 10 und 15 Jahren können alleine reisen, benötigen aber eine schriftliche Einverständniserklärung der Eltern." },
    { question: "Kann ich zusätzliches Gepäck mitnehmen?", answer: "Ja, Sie können bei der Buchung oder nachträglich zusätzliches Gepäck hinzubuchen. Ein weiteres Gepäckstück kostet €9,99. Sondergepäck muss vorher angemeldet werden." },
    { question: "Sind die Busse barrierefrei?", answer: "Ja, alle unsere Busse sind mit Rollstuhlrampen ausgestattet. Bitte informieren Sie uns bei der Buchung, wenn Sie einen Rollstuhlplatz benötigen, damit wir alles vorbereiten können." },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Header />

      <main className="flex-1 pt-16 lg:pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 lg:py-28 bg-secondary">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_70%)]" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge className="mb-5 bg-primary/20 text-primary border-0 text-sm px-4 py-1.5">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Ihr Reiseerlebnis
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-secondary-foreground mb-5">
                Service & <span className="gradient-text">Informationen</span>
              </h1>
              <p className="text-lg text-secondary-foreground/70 max-w-2xl mx-auto">
                Alles was Sie für Ihre Reise mit METROPOL TOURS wissen müssen – von Komfort über Gepäck bis hin zu häufigen Fragen.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Comfort Features */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-0">
                Ausstattung
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Komfort an Bord
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                Reisen Sie entspannt mit unserer Premium-Ausstattung.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comfortFeatures.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="group card-elevated p-8 hover:border-primary/30 border border-transparent transition-all"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Luggage Rules */}
        <section className="py-20 lg:py-28 bg-muted/30" id="luggage">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-0">
                <Briefcase className="w-3 h-3 mr-1" />
                Gepäck
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Gepäckregeln
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                Informieren Sie sich über die erlaubten Gepäckstücke und deren Maße.
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto">
              <div className="grid gap-4 mb-10">
                {luggageRules.map((rule, i) => (
                  <motion.div
                    key={rule.type}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all flex flex-col sm:flex-row sm:items-center gap-4"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                      <rule.icon className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1 grid sm:grid-cols-4 gap-2 sm:gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Art</div>
                        <div className="font-bold text-foreground">{rule.type}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Anzahl</div>
                        <div className="text-foreground">{rule.allowance}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Größe</div>
                        <div className="text-foreground">{rule.size}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Gewicht</div>
                        <div className="text-foreground">{rule.weight}</div>
                      </div>
                    </div>
                    <Badge className={cn(
                      "shrink-0 text-sm px-4 py-1.5",
                      rule.included ? "bg-primary/10 text-primary border-0" : "bg-accent/10 text-accent border-0"
                    )}>
                      {rule.included ? "✓ Inklusive" : "Aufpreis"}
                    </Badge>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h3 className="font-bold text-foreground text-xl mb-5">Sondergepäck & Mitnahmebedingungen</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {additionalItems.map((item, i) => (
                    <motion.div
                      key={item.item}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      className="bg-card rounded-2xl p-5 border border-border hover:border-primary/30 transition-all flex items-center gap-4"
                      style={{ boxShadow: "var(--shadow-card)" }}
                    >
                      <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center shrink-0">
                        <item.icon className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{item.item}</div>
                        <div className="text-sm text-muted-foreground">{item.info}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-0">
                <HelpCircle className="w-3 h-3 mr-1" />
                FAQ
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Häufige Fragen
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                Finden Sie schnell Antworten auf die wichtigsten Fragen.
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  custom={index}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 transition-all"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                  >
                    <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                    <div className={cn(
                      "w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 transition-all",
                      openFaq === index && "bg-primary/10"
                    )}>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform duration-300",
                        openFaq === index && "rotate-180 text-primary"
                      )} />
                    </div>
                  </button>
                  <div className={cn(
                    "overflow-hidden transition-all duration-300",
                    openFaq === index ? "max-h-48" : "max-h-0"
                  )}>
                    <div className="px-6 pb-5 text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-16"
            >
              <div className="bg-card rounded-2xl border border-border p-10 max-w-2xl mx-auto" style={{ boxShadow: "var(--shadow-elevated)" }}>
                <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Ihre Frage nicht gefunden?</h3>
                <p className="text-muted-foreground mb-6">Unser Support-Team hilft Ihnen gerne weiter.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" className="gap-2">
                    <Mail className="w-4 h-4" />
                    E-Mail schreiben
                  </Button>
                  <Button className="gap-2">
                    <Phone className="w-4 h-4" />
                    Anrufen
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ServicePage;
