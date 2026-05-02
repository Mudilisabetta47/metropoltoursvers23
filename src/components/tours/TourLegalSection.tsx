import ReactMarkdown from "react-markdown";
import { Scale, Shield, FileText, AlertTriangle, Info, CheckCircle2, XCircle, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TourLegal, TourTariff } from "@/hooks/useTourBuilder";

interface TourLegalSectionProps {
  legalSections: TourLegal[];
  tariffs: TourTariff[];
}

const sectionIcons: Record<string, React.ElementType> = {
  cancellation: AlertTriangle,
  insurance: Shield,
  documents: FileText,
  terms: Scale,
  info: Info,
};

const TourLegalSection = ({ legalSections, tariffs }: TourLegalSectionProps) => {
  const getSectionIcon = (key: string) => sectionIcons[key] || Info;

  return (
    <section id="section-agb" className="space-y-6 scroll-mt-36">
      {/* Header card with promise */}
      <Card className="rounded-2xl border-border/60 shadow-sm bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-6 md:p-7">
          <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold mb-2">Storno & Reiseschutz</p>
          <h3 className="text-2xl md:text-3xl font-semibold mb-2">Faire Bedingungen für Ihre Reise – klar geregelt</h3>
          <p className="text-foreground/80 leading-relaxed max-w-3xl">
            Wir wissen, dass Pläne sich ändern können. Deshalb bieten wir für jede Busreise
            transparente Stornoregeln, einen 100 %igen Insolvenzschutz nach deutschem Reiserecht
            (§651r BGB) und auf Wunsch eine Reiseversicherung unserer Partner ERGO und HanseMerkur.
          </p>
        </CardContent>
      </Card>

      {/* Cancellation Overview by Tariff */}
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            Stornobedingungen nach Tarif
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Wählen Sie den Tarif, der zu Ihrer Lebenssituation passt.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tariffs.map((tariff) => (
              <div
                key={tariff.id}
                className={`p-5 rounded-2xl border-2 transition-shadow hover:shadow-md ${
                  tariff.is_refundable
                    ? "border-emerald-200 bg-emerald-50/70"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-bold text-foreground">{tariff.name}</h4>
                  {tariff.is_refundable ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </div>

                {tariff.is_refundable ? (
                  <div className="space-y-2 text-sm">
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Stornierbar</Badge>
                    <p className="text-foreground/80 leading-relaxed">
                      Bis <span className="font-semibold text-foreground">{tariff.cancellation_days} Tage</span> vor Abreise stornierbar.
                    </p>
                    <p className="text-foreground/80">
                      Stornogebühr: <span className="font-semibold text-foreground">{tariff.cancellation_fee_percent}%</span>
                    </p>
                    <p className="text-xs text-muted-foreground pt-1 border-t border-emerald-200/60 mt-2">
                      Danach 100 % Stornogebühr
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                      Nicht stornierbar
                    </Badge>
                    <p className="text-foreground/70 leading-relaxed">
                      Dieser Spar-Tarif kann nicht storniert werden.
                    </p>
                    <p className="text-xs text-muted-foreground pt-1 border-t border-slate-200/60 mt-2">
                      Reiseversicherung empfohlen
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insurance Recommendation */}
      <Card className="rounded-2xl border-blue-200 bg-blue-50/60 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
              <Shield className="w-7 h-7 text-blue-700" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.18em] text-blue-700 font-semibold mb-1">Empfehlung</p>
              <h4 className="text-xl font-semibold text-blue-950 mb-2">
                Reiserücktritts­versicherung – für ein gutes Gefühl
              </h4>
              <p className="text-sm text-blue-900/90 mb-3 leading-relaxed">
                Krankheit, beruflicher Notfall oder familiäre Ereignisse: Eine Reiseversicherung schützt Sie
                vor unvorhergesehenen Kosten bei Stornierung oder Abbruch. Bereits ab wenigen Euro pro Person
                buchbar – direkt im nächsten Schritt der Buchung.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline" className="bg-white border-blue-300 text-blue-900">ERGO Reiseversicherung</Badge>
                <Badge variant="outline" className="bg-white border-blue-300 text-blue-900">HanseMerkur</Badge>
              </div>
              <p className="text-xs text-blue-800/80">
                Gerne beraten wir Sie persönlich – telefonisch oder per E-Mail.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Sections */}
      {legalSections.length > 0 && (
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Scale className="w-6 h-6 text-primary" />
              Rechtliche Hinweise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              {legalSections.map((section) => {
                const Icon = getSectionIcon(section.section_key);
                return (
                  <AccordionItem
                    key={section.id}
                    value={section.id}
                    className="border border-border/60 rounded-xl px-4 bg-muted/20"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold text-left">{section.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pb-4 pt-2 prose prose-sm prose-slate max-w-none">
                        <div className="text-foreground/80 leading-relaxed">
                          <ReactMarkdown>{section.content}</ReactMarkdown>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Help / Contact */}
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-foreground">Noch Fragen zu den Bedingungen?</h4>
              <p className="text-sm text-muted-foreground">Unser Reiseteam berät Sie gerne persönlich – Mo–Fr 9–18 Uhr.</p>
            </div>
          </div>
          <a
            href="mailto:kundenservice@metours.de"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            kundenservice@metours.de
          </a>
        </CardContent>
      </Card>

      {/* General Terms Link */}
      <div className="text-center text-sm text-muted-foreground pt-2">
        <p>
          Es gelten die{" "}
          <a href="/terms" className="text-primary hover:underline font-medium">
            Allgemeinen Reisebedingungen (ARB)
          </a>{" "}
          sowie die{" "}
          <a href="/datenschutz" className="text-primary hover:underline font-medium">
            Datenschutzerklärung
          </a>{" "}
          der METROPOL TOURS GmbH.
        </p>
      </div>
    </section>
  );
};

export default TourLegalSection;
