import { useState, useMemo } from "react";
import { Calendar, Users, ChevronDown, ChevronUp, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { de } from "date-fns/locale";
import { TourDate, TourTariff } from "@/hooks/useTourBuilder";

interface TourDatesSectionProps {
  dates: TourDate[];
  tariffs: TourTariff[];
  selectedDate: TourDate | null;
  onSelectDate: (date: TourDate) => void;
}

const TourDatesSection = ({ dates, selectedDate, onSelectDate }: TourDatesSectionProps) => {
  const [showAll, setShowAll] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    if (dates.length > 0) return startOfMonth(parseISO(dates[0].departure_date));
    return startOfMonth(new Date());
  });

  const formatDateStr = (dateStr: string) => {
    try { return format(parseISO(dateStr), 'EEE, dd.MM.yyyy', { locale: de }); }
    catch { return dateStr; }
  };

  const getStatusInfo = (date: TourDate) => {
    const available = date.total_seats - date.booked_seats;
    if (date.status === 'soldout' || available <= 0)
      return { label: 'Ausgebucht', color: 'bg-destructive/10 text-destructive', available: 0 };
    if (date.status === 'limited' || available <= 5)
      return { label: `Nur ${available} Plätze`, color: 'bg-amber-100 text-amber-700', available };
    return { label: 'Verfügbar', color: 'bg-primary/10 text-primary', available };
  };

  // Calendar
  const departureDates = useMemo(() => dates.map(d => parseISO(d.departure_date)), [dates]);
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1; // Monday start

  const isDepartureDay = (day: Date) => departureDates.some(d => isSameDay(d, day));
  const getTourDateForDay = (day: Date) => dates.find(d => isSameDay(parseISO(d.departure_date), day));

  const sortedDates = [...dates].sort((a, b) =>
    new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime()
  );
  const visibleDates = showAll ? sortedDates : sortedDates.slice(0, 5);

  return (
    <section id="section-termine" className="space-y-6 scroll-mt-36">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Verfügbarkeit prüfen</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h4 className="font-semibold text-foreground">
              {format(calendarMonth, 'MMMM yyyy', { locale: de })}
            </h4>
            <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {daysInMonth.map((day) => {
              const isDep = isDepartureDay(day);
              const tourDate = isDep ? getTourDateForDay(day) : null;
              const isSelected = tourDate && selectedDate?.id === tourDate.id;

              return (
                <button
                  key={day.toISOString()}
                  disabled={!isDep}
                  onClick={() => tourDate && onSelectDate(tourDate)}
                  className={`aspect-square rounded-lg text-sm flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold ring-2 ring-primary ring-offset-2'
                      : isDep
                        ? 'bg-primary/10 text-primary font-semibold hover:bg-primary/20 cursor-pointer'
                        : 'text-muted-foreground/40'
                  }`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary/10" /> Verfügbar
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary" /> Ausgewählt
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Date List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">Alle Termine</CardTitle>
          <Badge variant="secondary">{dates.length} Termine</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {/* Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-y text-sm font-medium text-muted-foreground">
            <div className="col-span-3">Reisezeitraum</div>
            <div className="col-span-2">Dauer</div>
            <div className="col-span-2">ab Preis p.P.</div>
            <div className="col-span-2">Verfügbarkeit</div>
            <div className="col-span-3 text-right">Aktion</div>
          </div>

          <div className="divide-y">
            {visibleDates.map((date) => {
              const status = getStatusInfo(date);
              const isSelected = selectedDate?.id === date.id;

              return (
                <div key={date.id}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 items-center transition-colors ${
                    isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{formatDateStr(date.departure_date)}</p>
                        <p className="text-sm text-muted-foreground">bis {formatDateStr(date.return_date)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-foreground">{date.duration_days} Tage</span>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-lg font-bold text-primary">ab {date.price_basic.toFixed(0)} €</p>
                    {date.early_bird_discount_percent && date.early_bird_discount_percent > 0 && (
                      <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 mt-1">
                        -{date.early_bird_discount_percent}% Frühbucher
                      </Badge>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Badge className={`${status.color} font-medium`}>
                      <Users className="w-3 h-3 mr-1" />{status.label}
                    </Badge>
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <Button onClick={() => onSelectDate(date)} disabled={status.available === 0}
                      variant={isSelected ? "default" : "outline"}
                      className={`min-w-[140px] ${!isSelected ? 'border-primary text-primary hover:bg-primary hover:text-primary-foreground' : ''}`}>
                      {isSelected ? <><Check className="w-4 h-4 mr-2" />Ausgewählt</> :
                        status.available === 0 ? 'Ausgebucht' : 'Auswählen'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {dates.length > 5 && (
            <div className="px-6 py-4 border-t bg-muted/30">
              <Button variant="ghost" onClick={() => setShowAll(!showAll)} className="w-full text-primary">
                {showAll ? <><ChevronUp className="w-4 h-4 mr-2" />Weniger anzeigen</> :
                  <><ChevronDown className="w-4 h-4 mr-2" />Alle {dates.length} Termine anzeigen</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default TourDatesSection;
