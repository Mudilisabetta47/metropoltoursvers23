import { Tag, Sparkles, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      return format(parseISO(dateStr), 'dd. MMM', { locale: de });
    } catch {
      return dateStr;
    }
  };

  // Find best price date
  const bestPriceDate = dates.reduce((best, current) => 
    current.price_basic < best.price_basic ? current : best
  , dates[0]);

  // Find comfort date (smart tariff)
  const comfortDate = dates.find(d => d.price_smart) || dates[0];

  // Find flex date (with flex tariff available)
  const flexTariff = tariffs.find(t => t.slug === 'flex' || t.is_refundable);
  const flexDate = dates.find(d => d.price_flex) || dates[0];

  const recommendations = [
    {
      id: 'best-price',
      title: 'Sparpreis',
      icon: Tag,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      date: bestPriceDate,
      highlight: 'Günstigster Termin',
      price: bestPriceDate.price_basic,
      subtitle: 'Nur Handgepäck',
    },
    {
      id: 'comfort',
      title: 'Komfort',
      icon: Sparkles,
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      date: comfortDate,
      highlight: 'Koffer inkl.',
      price: comfortDate.price_smart || comfortDate.price_basic,
      subtitle: 'Inkl. 20kg Koffer',
      isRecommended: true,
    },
    {
      id: 'flex',
      title: 'Flexpreis',
      icon: Zap,
      gradient: 'from-violet-500 to-purple-600',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      date: flexDate,
      highlight: flexTariff?.is_refundable ? 'Stornierbar' : 'Umbuchbar',
      price: flexDate.price_flex || flexDate.price_basic,
      subtitle: 'Kostenlos stornieren',
    },
  ];

  return (
    <section className="mb-2">
      <div className="flex items-center gap-3 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Schnellauswahl</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {recommendations.map((rec) => {
          const Icon = rec.icon;
          return (
            <Card 
              key={rec.id}
              className={`relative overflow-hidden bg-white border-2 transition-all cursor-pointer group hover:shadow-lg ${
                rec.isRecommended ? 'border-primary shadow-md' : 'border-transparent hover:border-primary/40'
              }`}
              onClick={() => onSelectDate(rec.date)}
            >
              {rec.isRecommended && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center text-xs font-medium py-1">
                  Unsere Empfehlung
                </div>
              )}
              
              <CardContent className={`p-5 ${rec.isRecommended ? 'pt-8' : ''}`}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${rec.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${rec.iconColor}`} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{rec.title}</p>
                    <p className="text-xs text-muted-foreground">{rec.subtitle}</p>
                  </div>
                </div>

                {/* Date Info */}
                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Reisezeitraum</span>
                    <span className="font-medium text-foreground">
                      {formatDate(rec.date.departure_date)} – {formatDate(rec.date.return_date)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Dauer</span>
                    <span className="font-medium text-foreground">{rec.date.duration_days} Tage</span>
                  </div>
                </div>

                {/* Highlight */}
                <Badge variant="secondary" className={`mb-4 ${rec.iconBg} ${rec.iconColor} border-0`}>
                  {rec.highlight}
                </Badge>

                {/* Price */}
                <div className="flex items-end justify-between border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">ab</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">{rec.price.toFixed(0)}€</span>
                    <span className="text-sm text-muted-foreground ml-1">p.P.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default TourRecommendations;
