import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ItineraryDay {
  day?: number | string;
  title?: string;
  description?: string;
}

interface TourItinerarySectionProps {
  itinerary: unknown[] | null;
}

const isItineraryDay = (value: unknown): value is ItineraryDay =>
  typeof value === "object" && value !== null;

const TourItinerarySection = ({ itinerary }: TourItinerarySectionProps) => {
  const days = (itinerary || []).filter(isItineraryDay);
  if (days.length === 0) return null;

  return (
    <section id="section-programm" className="scroll-mt-36">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <p className="text-xs font-semibold uppercase text-primary">Tag für Tag</p>
          <CardTitle className="text-2xl">Ihr Reiseprogramm</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-0">
            {days.map((item, index) => (
              <li key={`${item.day ?? index}-${item.title ?? "programmpunkt"}`} className="relative grid grid-cols-[3rem_1fr] gap-4 pb-7 last:pb-0">
                {index < days.length - 1 && (
                  <span className="absolute bottom-0 left-6 top-10 w-px bg-border" aria-hidden="true" />
                )}
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-bold text-primary">
                  {item.day ?? index + 1}
                </span>
                <div className="pt-1">
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Tag {item.day ?? index + 1}</p>
                  {item.title && <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>}
                  {item.description && <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">{item.description}</p>}
                  {!item.title && !item.description && <MapPin className="h-4 w-4 text-primary" />}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
};

export default TourItinerarySection;