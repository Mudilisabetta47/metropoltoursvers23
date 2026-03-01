import { Check, X, Plus, Luggage, Armchair, RefreshCcw, Hotel, Coffee, Bus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TourInclusion, TourTariff } from "@/hooks/useTourBuilder";

interface TourInclusionsSectionProps {
  inclusions: TourInclusion[];
  tariffs: TourTariff[];
  selectedTariff: TourTariff | null;
  onSelectTariff: (tariff: TourTariff) => void;
}

const iconMap: Record<string, React.ElementType> = {
  'Check': Check, 'X': X, 'Plus': Plus, 'Luggage': Luggage,
  'Hotel': Hotel, 'Coffee': Coffee, 'Bus': Bus, 'default': Check,
};

const TourInclusionsSection = ({ inclusions, tariffs, selectedTariff, onSelectTariff }: TourInclusionsSectionProps) => {
  const includedItems = inclusions.filter(i => i.category === 'included');
  const optionalItems = inclusions.filter(i => i.category === 'optional');
  const notIncludedItems = inclusions.filter(i => i.category === 'not_included');

  return (
    <section id="section-leistungen" className="space-y-6 scroll-mt-36">
      {/* Options Table (Booking-style "Zimmer") */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Wählen Sie Ihre Option</CardTitle>
          <CardDescription>
            Alle Optionen beinhalten Bus + Hotel + Frühstück
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-y text-sm font-medium text-muted-foreground">
            <div className="col-span-3">Option</div>
            <div className="col-span-2">Gepäck</div>
            <div className="col-span-2">Storno</div>
            <div className="col-span-2">Sitzplatz</div>
            <div className="col-span-1">Aufpreis</div>
            <div className="col-span-2 text-right">Auswahl</div>
          </div>

          <div className="divide-y">
            {tariffs.map((tariff) => {
              const isSelected = selectedTariff?.id === tariff.id;
              return (
                <div
                  key={tariff.id}
                  onClick={() => onSelectTariff(tariff)}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 items-center cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-muted/30'
                  }`}
                >
                  {/* Name */}
                  <div className="md:col-span-3 flex items-center gap-2">
                    <span className="font-bold text-foreground">{tariff.name}</span>
                    {tariff.is_recommended && (
                      <Badge className="bg-primary text-primary-foreground text-[10px]">Empfohlen</Badge>
                    )}
                  </div>

                  {/* Luggage */}
                  <div className="md:col-span-2 flex items-center gap-2 text-sm">
                    <Luggage className={`w-4 h-4 ${tariff.suitcase_included ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={tariff.suitcase_included ? 'text-foreground' : 'text-muted-foreground'}>
                      {tariff.suitcase_included ? `${tariff.suitcase_weight_kg || 20}kg Koffer` : 'Handgepäck'}
                    </span>
                  </div>

                  {/* Cancellation */}
                  <div className="md:col-span-2 flex items-center gap-2 text-sm">
                    <RefreshCcw className={`w-4 h-4 ${tariff.is_refundable ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={tariff.is_refundable ? 'text-foreground' : 'text-muted-foreground'}>
                      {tariff.is_refundable ? `Bis ${tariff.cancellation_days}T vorher` : 'Nicht möglich'}
                    </span>
                  </div>

                  {/* Seat */}
                  <div className="md:col-span-2 flex items-center gap-2 text-sm">
                    <Armchair className={`w-4 h-4 ${tariff.seat_reservation ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={tariff.seat_reservation ? 'text-foreground' : 'text-muted-foreground'}>
                      {tariff.seat_reservation ? 'Reserviert' : 'Freie Wahl'}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="md:col-span-1">
                    <span className="font-semibold text-primary">
                      {tariff.price_modifier > 0 ? `+${tariff.price_modifier.toFixed(0)}€` : 'inkl.'}
                    </span>
                  </div>

                  {/* Select */}
                  <div className="md:col-span-2 flex justify-end">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  </div>
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
            <Check className="w-6 h-6 text-primary" />
            Das ist inklusive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: Hotel, title: "Übernachtung", desc: "Im Hotel oder Apartment inkl." },
              { icon: Coffee, title: "Frühstück", desc: "Täglich im Hotel inkl." },
              { icon: Bus, title: "Busreise", desc: "Hin- und Rückfahrt im Komfortbus" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
            {includedItems.map((item) => {
              const Icon = iconMap[item.icon] || iconMap.default;
              return (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Optional */}
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
                    {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Not included */}
      {notIncludedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-muted-foreground">
              <X className="w-6 h-6" /> Nicht enthalten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {notIncludedItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <X className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-muted-foreground">{item.title}</p>
                    {item.description && <p className="text-sm text-muted-foreground/70">{item.description}</p>}
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
