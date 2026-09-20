import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import {
  ArrowRight,
  Bus,
  CheckCircle2,
  Handshake,
  Loader2,
  Mail,
  Phone,
  Send,
  Users,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ConsentCheckbox from "@/components/common/ConsentCheckbox";
import { useToast } from "@/hooks/use-toast";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { supabase } from "@/integrations/supabase/client";
import { breadcrumbJsonLd, COMPANY, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";
import partnerBusImage from "@/assets/metropol-night-highway-slider.png.asset.json";

const partnerSchema = z.object({
  company: z.string().trim().min(2, "Bitte Firmenname angeben").max(120),
  contact: z.string().trim().min(2, "Bitte Ansprechpartner angeben").max(120),
  email: z.string().trim().email("Bitte gültige E-Mail-Adresse angeben").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  partnerType: z.string().trim().min(1, "Bitte Art der Zusammenarbeit wählen"),
  message: z.string().trim().min(10, "Bitte kurz beschreiben, was Sie suchen").max(2000),
});

const PARTNER_TYPES = [
  { value: "busunternehmen", label: "Busunternehmen (Subunternehmer / Kapazitäten)" },
  { value: "reisebuero", label: "Reisebüro / Reiseveranstalter" },
  { value: "incoming", label: "Incoming-Agentur im Zielgebiet" },
  { value: "hotel", label: "Hotel / Leistungsträger" },
  { value: "sonstiges", label: "Sonstige Kooperation" },
];

const BENEFITS = [
  {
    icon: Bus,
    title: "Kapazitäten tauschen",
    text: "Wenn unsere Busse ausgelastet sind, geben wir Fahrten an geprüfte Partner weiter – und übernehmen umgekehrt Ihre Aufträge in Norddeutschland.",
  },
  {
    icon: Users,
    title: "Gruppen vermitteln",
    text: "Reisebüros und Veranstalter buchen bei uns Busse mit Fahrer, Pauschalreisen und Transfers zu festen Nettopreisen.",
  },
  {
    icon: Handshake,
    title: "Feste Ansprechpartner",
    text: "Eine Disposition, eine Telefonnummer, klare Absprachen zu Preisen, Fahrerwechsel, Lenkzeiten und Dokumenten.",
  },
];

const STEPS = [
  "Sie senden uns das Formular mit Ihrem Profil.",
  "Wir melden uns innerhalb von zwei Werktagen zurück.",
  "Austausch von Unterlagen (Lizenz, Versicherung, Referenzen).",
  "Start der Zusammenarbeit mit konkreten Anfragen.",
];

export default function PartnerPage() {
  const { toast } = useToast();
  const { protect } = useRecaptcha();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    company: "",
    contact: "",
    email: "",
    phone: "",
    country: "",
    website: "",
    partnerType: "",
    message: "",
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = partnerSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const key = String(i.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    if (!consent) {
      toast({
        title: "Zustimmung erforderlich",
        description: "Bitte AGB und Datenschutzerklärung akzeptieren.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const human = await protect("partner_inquiry");
      if (!human) {
        toast({
          title: "Sicherheitsprüfung fehlgeschlagen",
          description: "Bitte erneut versuchen.",
          variant: "destructive",
        });
        return;
      }

      const data = parsed.data;
      const typeLabel =
        PARTNER_TYPES.find((t) => t.value === data.partnerType)?.label ?? data.partnerType;

      const mailBody = [
        `Art der Zusammenarbeit: ${typeLabel}`,
        `Unternehmen: ${data.company}`,
        `Ansprechpartner: ${data.contact}`,
        `E-Mail: ${data.email}`,
        data.phone && `Telefon: ${data.phone}`,
        data.country && `Land / Region: ${data.country}`,
        data.website && `Website: ${data.website}`,
        `\nNachricht:\n${data.message}`,
      ]
        .filter(Boolean)
        .join("\n");

      const { error: inboxError } = await (supabase as any).from("admin_mailbox").insert({
        subject: `Partneranfrage – ${data.company}`,
        body: mailBody,
        sender_name: `${data.contact} (${data.company})`,
        sender_email: data.email,
        source_type: "partner_inquiry",
        folder: "inbox",
        tags: ["partneranfrage", data.partnerType],
      });
      if (inboxError) throw inboxError;

      const { error } = await supabase.functions.invoke("notify-inbox", {
        body: {
          type: "partner_inquiry",
          subject: `Partneranfrage – ${data.company}`,
          body: [
            `Art der Zusammenarbeit: ${typeLabel}`,
            `Unternehmen: ${data.company}`,
            `Ansprechpartner: ${data.contact}`,
            `E-Mail: ${data.email}`,
            data.phone && `Telefon: ${data.phone}`,
            data.country && `Land / Region: ${data.country}`,
            data.website && `Website: ${data.website}`,
            `\nNachricht:\n${data.message}`,
          ]
            .filter(Boolean)
            .join("\n"),
          from_email: data.email,
          from_name: `${data.contact} (${data.company})`,
        },
      });
      if (error) console.warn("partner inquiry mail forward failed", error);

      setSent(true);
      toast({
        title: "Anfrage gesendet",
        description: "Wir melden uns innerhalb von zwei Werktagen bei Ihnen.",
      });
    } catch (err) {
      console.error("partner inquiry failed", err);
      toast({
        title: "Fehler",
        description: "Anfrage konnte nicht gesendet werden. Bitte später erneut versuchen.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const schemas: Record<string, unknown>[] = [
    breadcrumbJsonLd([
      { name: "Start", path: "/" },
      { name: "Partner werden", path: "/partner" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `Partner werden – ${SITE_NAME}`,
      url: absoluteUrl("/partner"),
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Partner werden – Kooperation für Busunternehmen & Reisebüros"
        description="Busunternehmen, Reisebüros und Agenturen: Arbeiten Sie mit Metropol Tours aus Hannover zusammen – Kapazitäten tauschen, Gruppen vermitteln, feste Ansprechpartner."
        path="/partner"
        jsonLd={schemas}
      />
      <Header />
      <main>
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                  <Handshake className="h-4 w-4" />
                  Kooperation für Busunternehmen & Reisebüros
                </span>
                <h1 className="mt-6 text-4xl md:text-5xl font-bold tracking-tight">
                  Partner von Metropol Tours werden
                </h1>
                <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                  Wir sind ein inhabergeführtes Busunternehmen aus Hannover und arbeiten mit
                  Busunternehmen, Reisebüros und Agenturen in Deutschland und Europa zusammen.
                  Senden Sie uns Ihr Profil – wir melden uns persönlich zurück.
                </p>
              </motion.div>

              <motion.figure
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="relative overflow-hidden rounded-3xl border border-border shadow-lg"
              >
                <img
                  src={partnerBusImage.url}
                  alt="Grüner METROPOL TOURS Reisebus – unsere moderne Flotte"
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 pt-10 text-white">
                  <p className="text-sm font-semibold">Unsere Flotte</p>
                  <p className="mt-1 text-xs text-white/85">
                    Moderne Reisebusse von 8 bis 59 Sitzplätzen – komfortabel und sicher unterwegs
                    in ganz Europa.
                  </p>
                </figcaption>
              </motion.figure>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {BENEFITS.map((b) => (
                <div key={b.title} className="rounded-2xl border border-border bg-card p-6">
                  <b.icon className="h-6 w-6 text-primary" />
                  <h2 className="mt-4 text-lg font-semibold">{b.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-6xl grid gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">So läuft die Zusammenarbeit</h2>
              <ol className="mt-6 space-y-4">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground leading-relaxed">{s}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-8 rounded-2xl border border-border bg-card p-6">
                <p className="font-semibold">Lieber direkt sprechen?</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild variant="outline">
                    <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}>
                      <Phone className="mr-2 h-4 w-4" /> {COMPANY.phone}
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={`mailto:${COMPANY.email}`}>
                      <Mail className="mr-2 h-4 w-4" /> {COMPANY.email}
                    </a>
                  </Button>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Sie suchen einen Bus für Ihre eigene Gruppe?{" "}
                  <Link to="/business" className="underline hover:text-primary">
                    Zur Gruppenanfrage
                  </Link>
                </p>
              </div>
            </div>

            <div id="partner-formular" className="rounded-3xl border border-border bg-card p-6 md:p-8">
              {sent ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
                  <h2 className="mt-4 text-2xl font-bold">Vielen Dank für Ihre Anfrage</h2>
                  <p className="mt-3 text-muted-foreground">
                    Wir haben Ihre Angaben erhalten und melden uns innerhalb von zwei Werktagen bei
                    Ihnen.
                  </p>
                  <Button asChild className="mt-6">
                    <Link to="/busunternehmen">
                      Unsere Standorte ansehen <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div>
                    <h2 className="text-2xl font-bold">Partneranfrage senden</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Felder mit * sind Pflichtangaben.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company">Unternehmen *</Label>
                      <Input
                        id="company"
                        value={form.company}
                        maxLength={120}
                        onChange={(e) => update("company", e.target.value)}
                      />
                      {errors.company && (
                        <p className="text-xs text-destructive">{errors.company}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact">Ansprechpartner *</Label>
                      <Input
                        id="contact"
                        value={form.contact}
                        maxLength={120}
                        onChange={(e) => update("contact", e.target.value)}
                      />
                      {errors.contact && (
                        <p className="text-xs text-destructive">{errors.contact}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        maxLength={255}
                        onChange={(e) => update("email", e.target.value)}
                      />
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        maxLength={40}
                        onChange={(e) => update("phone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Land / Region</Label>
                      <Input
                        id="country"
                        value={form.country}
                        maxLength={80}
                        onChange={(e) => update("country", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={form.website}
                        maxLength={200}
                        placeholder="www.beispiel.de"
                        onChange={(e) => update("website", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partnerType">Art der Zusammenarbeit *</Label>
                    <Select
                      value={form.partnerType}
                      onValueChange={(v) => update("partnerType", v)}
                    >
                      <SelectTrigger id="partnerType">
                        <SelectValue placeholder="Bitte wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {PARTNER_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.partnerType && (
                      <p className="text-xs text-destructive">{errors.partnerType}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Ihre Nachricht *</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      maxLength={2000}
                      value={form.message}
                      placeholder="Flottengröße, Einsatzgebiete, gewünschte Zusammenarbeit …"
                      onChange={(e) => update("message", e.target.value)}
                    />
                    {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                  </div>

                  <ConsentCheckbox
                    checked={consent}
                    onChange={setConsent}
                    id="partner-consent"
                    purpose="Partneranfrage"
                  />

                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Wird gesendet …
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Partneranfrage senden
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
