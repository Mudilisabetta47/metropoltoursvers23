import { Tag, Sparkles, Zap, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { TourDate, TourTariff } from "@/hooks/useTourBuilder";

interface TourRecommendationsProps {
  dates: TourDate[];
  tariffs: TourTariff[];
  onSelectDate: (date: TourDate) => void;
}

const TourRecommendations = ({ dates, tariffs, onSelectDate }: TourRecommendationsProps) => {
  if (dates.length === 0) return null;

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: de });
    } catch {
      return dateStr;
    }
  };

  // Find best price date
  const bestPriceDate = dates.reduce((best, current) => 
    current.price_basic < best.price_basic ? current : best
  , dates[0]);

  // Find comfort date (highest price = most comfort)
  const comfortDate = dates.reduce((best, current) => 
    (current.price_business || current.price_basic) > (best.price_business || best.price_basic) ? current : best
  , dates[0]);

  // Find flex date (with flex tariff available)
  const flexTariff = tariffs.find(t => t.slug === 'flex' || t.is_refundable);
  const flexDate = dates.find(d => d.price_flex) || dates[0];

  const recommendations = [
    {
      id: 'best-price',
      title: 'BESTER PREIS',
      icon: Tag,
      iconColor: 'text-emerald-600',
      date: bestPriceDate,
      highlight: 'Günstigster Termin',
      price: bestPriceDate.price_basic,
    },
    {
      id: 'comfort',
      title: 'KOMFORT',
      icon: Sparkles,
      iconColor: 'text-blue-600',
      date: comfortDate,
      highlight: 'Inkl. Sitzplatzreservierung',
      price: comfortDate.price_smart || comfortDate.price_basic,
    },
    {
      id: 'flex',
      title: 'MAX. FLEXIBEL',
      icon: Zap,
      iconColor: 'text-purple-600',
      date: flexDate,
      highlight: flexTariff?.is_refundable ? 'Kostenlose Stornierung' : 'Umbuchbar',
      price: flexDate.price_flex || flexDate.price_basic,
    },
  ];

  return (
    <section className="bg-slate-100 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-foreground">Unsere Empfehlungen</h2>
        <button className="text-muted-foreground hover:text-foreground">
          <Info className="w-5 h-5" />
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {recommendations.map((rec) => {
          const Icon = rec.icon;
          return (
            <Card 
              key={rec.id}
              className="bg-white border-2 border-transparent hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => onSelectDate(rec.date)}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Icon className={`w-5 h-5 ${rec.iconColor}`} />
                  <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    {rec.title}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    <span className="font-semibold">{rec.date.duration_days} Tage</span> ab {formatDate(rec.date.departure_date)}
                  </p>
                  <Badge variant="secondary" className="text-xs bg-slate-100">
                    {rec.highlight}
                  </Badge>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-white group-hover:bg-primary group-hover:text-white transition-colors"
                >
                  pro Person ab {rec.price.toFixed(0)} €
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default TourRecommendations;
