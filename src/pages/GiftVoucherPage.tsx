import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Mail, ShieldCheck, Clock, CheckCircle2, ArrowRight } from "lucide-react";

const AMOUNTS = [25, 50, 75, 100];

const steps = [
  { title: "Betrag wählen", text: "Gutschein im Shop in den Warenkorb legen – Betrag 25, 50, 75 oder 100 €." },
  { title: "Bezahlen", text: "Bequem über die im Shop verfügbaren Zahlungsarten." },
  { title: "Code per E-Mail", text: "Nach Zahlungseingang erhalten Sie den persönlichen Gutscheincode per E-Mail." },
  { title: "Einlösen & reisen", text: "Im Buchungsprozess einfach unter „Gutscheincode“ eingeben – der Betrag wird abgezogen." },
];

const GiftVoucherPage = () => {
  useEffect(() => {
    document.title = "Geschenkgutschein für Busreisen | Metropol Tours";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "METROPOL TOURS Geschenkgutschein: einlösbar auf alle Busreisen, Wochenendtrips und Pauschalreisen. Per E-Mail geliefert, 3 Jahre gültig.");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
              <Gift className="w-4 h-4" />
              Geschenkgutschein
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Das perfekte Geschenk: <span className="text-primary">Reise</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Ob Wochenendtrip nach Kopenhagen, Städtereise nach Paris oder die nächste Pauschalreise –
              mit dem METROPOL TOURS Geschenkgutschein schenken Sie Erlebnisse statt Dinge.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {AMOUNTS.map((a) => (
                <Link
                  key={a}
                  to="/shop/produkt/geschenkgutschein"
                  className="px-6 py-3 rounded-xl bg-card border border-border shadow-sm hover:border-primary hover:shadow-lg hover:-translate-y-0.5 transition-all font-semibold text-foreground"
                >
                  {a} € Gutschein
                </Link>
              ))}
            </div>
            <Link
              to="/shop/produkt/geschenkgutschein"
              className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
            >
              Jetzt Geschenkgutschein kaufen <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Vorteile */}
      <section className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { icon: Mail, title: "Per E-Mail geliefert", text: "Der Gutscheincode kommt bequem in Ihr Postfach – ideal als Last-Minute-Geschenk." },
            { icon: Clock, text: "3 Jahre gültig", text: "Der Beschenkte kann in Ruhe entscheiden, wohin die Reise gehen soll." },
            { icon: ShieldCheck, text: "Überall einlösbar", text: "Auf alle Busreisen, Wochenendtrips und Pauschalreisen auf metours.de." },
          ].map((b) => (
            <div key={b.title} className="rounded-2xl bg-card border border-border/60 p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <b.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ablauf */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-foreground text-center mb-10">So funktioniert es</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl bg-card border border-border/60 p-6"
            >
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mb-4">
                {i + 1}
              </div>
              <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Einlösen */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto rounded-3xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 p-8 lg:p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">Gutschein erhalten? So lösen Sie ihn ein.</h2>
          <p className="text-muted-foreground mb-6">
            Wählen Sie Ihre Reise, gehen durch den normalen Buchungsprozess und geben den Code im Schritt
            „Gutscheincode“ ein. Der Betrag wird sofort vom Reisepreis abgezogen.
          </p>
          <Link to="/wochenendtrips" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90">
            Reisen entdecken <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default GiftVoucherPage;
