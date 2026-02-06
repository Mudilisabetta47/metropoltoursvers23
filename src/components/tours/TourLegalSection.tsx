import { Scale, Shield, FileText, AlertTriangle, Info } from "lucide-react";
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
  'cancellation': AlertTriangle,
  'insurance': Shield,
  'documents': FileText,
  'terms': Scale,
  'info': Info,
};

const TourLegalSection = ({ legalSections, tariffs }: TourLegalSectionProps) => {
  const getSectionIcon = (key: string) => sectionIcons[key] || Info;

  return (
    <section id="section-agb" className="space-y-6 scroll-mt-20">
      {/* Cancellation Overview by Tariff */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            Stornobedingungen nach Tarif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tariffs.map((tariff) => (
              <div 
                key={tariff.id}
                className={`p-4 rounded-xl border-2 ${
                  tariff.is_refundable 
                    ? 'border-emerald-200 bg-emerald-50' 
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <h4 className="font-bold text-foreground mb-3">{tariff.name}</h4>
                
                {tariff.is_refundable ? (
                  <div className="space-y-2 text-sm">
                    <Badge className="bg-emerald-600 text-white">Stornierbar</Badge>
                    <p className="text-muted-foreground">
                      Bis {tariff.cancellation_days} Tage vor Abreise:{' '}
                      <span className="font-semibold text-foreground">
                        {tariff.cancellation_fee_percent}% Gebühr
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Danach keine Erstattung
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <Badge variant="secondary" className="bg-slate-200">
                      Nicht stornierbar
                    </Badge>
                    <p className="text-muted-foreground">
                      Keine Stornierung möglich.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Keine Erstattung bei Absage
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legal Sections */}
      {legalSections.length > 0 && (
        <Card>
          <CardHeader>
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
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="font-semibold">{section.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pb-4 pt-2 prose prose-sm prose-slate max-w-none">
                        <div 
                          className="text-muted-foreground whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ 
                            __html: section.content
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n/g, '<br />') 
                          }}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Insurance Recommendation */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-blue-900 mb-2">
                Reiseversicherung empfohlen
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                Wir empfehlen den Abschluss einer Reiserücktritts- und Reiseabbruchversicherung. 
                Diese schützt Sie vor unvorhergesehenen Kosten bei Stornierung oder Abbruch der Reise.
              </p>
              <p className="text-sm text-blue-700">
                Gerne beraten wir Sie zu passenden Versicherungsoptionen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Terms Link */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Es gelten die{' '}
          <a href="/terms" className="text-primary hover:underline font-medium">
            Allgemeinen Reisebedingungen (ARB)
          </a>{' '}
          der METROPOL TOURS GmbH.
        </p>
      </div>
    </section>
  );
};

export default TourLegalSection;
