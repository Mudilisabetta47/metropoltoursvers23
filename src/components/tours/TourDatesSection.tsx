import { useState } from "react";
import { Calendar, Users, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { TourDate, TourTariff } from "@/hooks/useTourBuilder";

interface TourDatesSectionProps {
  dates: TourDate[];
  tariffs: TourTariff[];
  selectedDate: TourDate | null;
  onSelectDate: (date: TourDate) => void;
}

type SortOption = 'date' | 'price' | 'availability';

const TourDatesSection = ({ dates, selectedDate, onSelectDate }: TourDatesSectionProps) => {
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [showAll, setShowAll] = useState(false);

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEE, dd.MM.yyyy', { locale: de });
    } catch {
      return dateStr;
    }
  };

  const getStatusInfo = (date: TourDate) => {
    const available = date.total_seats - date.booked_seats;
    if (date.status === 'soldout' || available <= 0) {
      return { label: 'Ausgebucht', color: 'bg-red-100 text-red-700', available: 0 };
    }
    if (date.status === 'limited' || available <= 5) {
      return { label: `Nur ${available} Plätze`, color: 'bg-amber-100 text-amber-700', available };
    }
    return { label: 'Verfügbar', color: 'bg-emerald-100 text-emerald-700', available };
  };

  const sortedDates = [...dates].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price_basic - b.price_basic;
      case 'availability':
        return (b.total_seats - b.booked_seats) - (a.total_seats - a.booked_seats);
      default:
        return new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime();
    }
  });

  const visibleDates = showAll ? sortedDates : sortedDates.slice(0, 5);

  return (
    <section id="section-termine" className="scroll-mt-20">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">Termine & Preise</CardTitle>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sortieren nach:" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Datum</SelectItem>
              <SelectItem value="price">Preis (günstigste)</SelectItem>
              <SelectItem value="availability">Verfügbarkeit</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          {/* Header Row */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-y text-sm font-medium text-muted-foreground">
            <div className="col-span-3">Reisezeitraum</div>
            <div className="col-span-2">Dauer</div>
            <div className="col-span-2">Preis p.P.</div>
            <div className="col-span-2">Verfügbarkeit</div>
            <div className="col-span-3 text-right">Aktion</div>
          </div>

          {/* Date Rows */}
          <div className="divide-y">
            {visibleDates.map((date) => {
              const status = getStatusInfo(date);
              const isSelected = selectedDate?.id === date.id;
              
              return (
                <div 
                  key={date.id}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 items-center transition-colors ${
                    isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Date */}
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {formatDate(date.departure_date)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          bis {formatDate(date.return_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="md:col-span-2">
                    <span className="text-foreground font-medium">{date.duration_days} Tage</span>
                  </div>

                  {/* Prices */}
                  <div className="md:col-span-2">
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-primary">
                        ab {date.price_basic.toFixed(0)} €
                      </p>
                      {date.early_bird_discount_percent && date.early_bird_discount_percent > 0 && (
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                          -{date.early_bird_discount_percent}% Frühbucher
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="md:col-span-2">
                    <Badge className={`${status.color} font-medium`}>
                      <Users className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  {/* Action */}
                  <div className="md:col-span-3 flex justify-end">
                    <Button
                      onClick={() => onSelectDate(date)}
                      disabled={status.available === 0}
                      className={`min-w-[140px] ${
                        isSelected 
                          ? 'bg-primary text-white' 
                          : 'bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Ausgewählt
                        </>
                      ) : status.available === 0 ? (
                        'Ausgebucht'
                      ) : (
                        'Auswählen'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show More */}
          {dates.length > 5 && (
            <div className="px-6 py-4 border-t bg-slate-50">
              <Button
                variant="ghost"
                onClick={() => setShowAll(!showAll)}
                className="w-full text-primary"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Weniger anzeigen
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Alle {dates.length} Termine anzeigen
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default TourDatesSection;
