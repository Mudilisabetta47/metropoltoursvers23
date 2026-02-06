import { Check, X, Plus, Luggage, Armchair, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TourInclusion, TourTariff } from "@/hooks/useTourBuilder";

interface TourInclusionsSectionProps {
  inclusions: TourInclusion[];
  tariffs: TourTariff[];
  selectedTariff: TourTariff | null;
  onSelectTariff: (tariff: TourTariff) => void;
}

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  'Check': Check,
  'X': X,
  'Plus': Plus,
  'Luggage': Luggage,
  'default': Check,
};

const TourInclusionsSection = ({ 
  inclusions, 
  tariffs, 
  selectedTariff, 
  onSelectTariff 
}: TourInclusionsSectionProps) => {
  const includedItems = inclusions.filter(i => i.category === 'included');
  const optionalItems = inclusions.filter(i => i.category === 'optional');
  const notIncludedItems = inclusions.filter(i => i.category === 'not_included');

  return (
    <section id="section-leistungen" className="space-y-6 scroll-mt-20">
      {/* Tariff Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Wählen Sie Ihren Tarif</CardTitle>
          <CardDescription>
            Alle Tarife beinhalten die Busreise. Unterschiede in Storno & Gepäck.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tariffs.map((tariff) => {
              const isSelected = selectedTariff?.id === tariff.id;
              return (
                <div
                  key={tariff.id}
                  onClick={() => onSelectTariff(tariff)}
                  className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-lg' 
                      : 'border-slate-200 hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  {tariff.is_recommended && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground">
                      Empfohlen
                    </Badge>
                  )}
                  
                  <h4 className="text-lg font-bold text-foreground mb-3">{tariff.name}</h4>
                  
                  <div className="space-y-2 text-sm">
                    {/* Luggage */}
                    <div className="flex items-center gap-2">
                      <Luggage className={`w-4 h-4 ${tariff.suitcase_included ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className={tariff.suitcase_included ? 'text-foreground' : 'text-muted-foreground'}>
                        {tariff.suitcase_included 
                          ? `Koffer bis ${tariff.suitcase_weight_kg || 20}kg`
                          : 'Nur Handgepäck'}
                      </span>
                    </div>

                    {/* Seat Reservation */}
                    <div className="flex items-center gap-2">
                      <Armchair className={`w-4 h-4 ${tariff.seat_reservation ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className={tariff.seat_reservation ? 'text-foreground' : 'text-muted-foreground'}>
                        {tariff.seat_reservation ? 'Sitzplatzreservierung' : 'Freie Platzwahl'}
                      </span>
                    </div>

                    {/* Refund */}
                    <div className="flex items-center gap-2">
                      <RefreshCcw className={`w-4 h-4 ${tariff.is_refundable ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className={tariff.is_refundable ? 'text-foreground' : 'text-muted-foreground'}>
                        {tariff.is_refundable 
                          ? `Stornierung bis ${tariff.cancellation_days}T vorher`
                          : 'Keine Stornierung'}
                      </span>
                    </div>
                  </div>

                  {tariff.price_modifier > 0 && (
                    <p className="mt-3 text-sm font-medium text-primary">
                      +{tariff.price_modifier.toFixed(0)} € p.P.
                    </p>
                  )}

                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Included Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Check className="w-6 h-6 text-emerald-600" />
            Im Preis enthalten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {includedItems.map((item) => {
              const Icon = iconMap[item.icon] || iconMap.default;
              return (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Optional Services */}
      {optionalItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Plus className="w-6 h-6 text-blue-600" />
              Optional buchbar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {optionalItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Not Included */}
      {notIncludedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-muted-foreground">
              <X className="w-6 h-6" />
              Nicht im Preis enthalten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {notIncludedItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <X className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-muted-foreground">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground/70">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
};

export default TourInclusionsSection;
