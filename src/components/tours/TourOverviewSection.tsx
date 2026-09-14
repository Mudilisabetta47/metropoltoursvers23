import { Bus, CalendarDays, Clock, Euro, Hotel, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ExtendedPackageTour, TourDate, TourRoute } from "@/hooks/useTourBuilder";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

interface TourOverviewSectionProps {
  tour: ExtendedPackageTour;
  selectedDate: TourDate | null;
  routes: TourRoute[];
  lowestPrice: number;
}

const formatDate = (value: string) => {
  try { return format(parseISO(value), "dd.MM.yyyy", { locale: de }); }
  catch { return value; }
};

const formatPrice = (value: number) => new Intl.NumberFormat("de-DE", {
  style: "currency", currency: "EUR", minimumFractionDigits: 2,
}).format(value);

const TourOverviewSection = ({ tour, selectedDate, routes, lowestPrice }: TourOverviewSectionProps) => {
  const firstStop = routes
    .flatMap((route) => route.pickup_stops || [])
    .sort((a, b) => a.sort_order - b.sort_order)[0];

  const facts = [
    selectedDate ? {
      label: "Reisedatum",
      value: `${formatDate(selectedDate.departure_date)} – ${formatDate(selectedDate.return_date)}`,
      icon: CalendarDays,
    } : tour.departure_date ? {
      label: "Reisedatum",
      value: `${formatDate(tour.departure_date)}${tour.return_date ? ` – ${formatDate(tour.return_date)}` : ""}`,
      icon: CalendarDays,
    } : null,
    tour.duration_days ? {
      label: "Reisedauer",
      value: `${tour.duration_days} Tage${tour.duration_days > 1 ? ` · ${tour.duration_days - 1} Nächte` : ""}`,
      icon: Clock,
    } : null,
    firstStop ? {
      label: "Erster Zustieg",
      value: `${firstStop.city}${firstStop.location_name ? ` · ${firstStop.location_name}` : ""}`,
      icon: MapPin,
    } : null,
    routes.length > 0 ? { label: "Anreise", value: "Reisebus", icon: Bus } : null,
    tour.hotel_name ? { label: "Unterkunft", value: tour.hotel_name, icon: Hotel } : null,
    Number.isFinite(lowestPrice) && lowestPrice > 0 ? { label: "Preis", value: `ab ${formatPrice(lowestPrice)} p. P.`, icon: Euro } : null,
  ].filter((fact): fact is NonNullable<typeof fact> => Boolean(fact));

  if (facts.length === 0) return null;

  return (
    <section aria-labelledby="reise-auf-einen-blick">
      <h2 id="reise-auf-einen-blick" className="mb-4 text-xl font-bold text-foreground">Reise auf einen Blick</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {facts.map((fact) => (
          <Card key={fact.label} className="border-border/70 shadow-sm">
            <CardContent className="p-4">
              <fact.icon className="mb-3 h-5 w-5 text-primary" />
              <p className="text-xs font-medium uppercase text-muted-foreground">{fact.label}</p>
              <p className="mt-1 text-sm font-semibold leading-snug text-foreground">{fact.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default TourOverviewSection;