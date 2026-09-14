import { FileCheck, Info, ShieldCheck, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ExtendedPackageTour } from "@/hooks/useTourBuilder";

interface TourInfoSectionProps {
  tour: ExtendedPackageTour;
}

const TourInfoSection = ({ tour }: TourInfoSectionProps) => {
  const hasDescription = Boolean(tour.description);
  const hasHighlights = Boolean(tour.highlights?.length);
  const hasTags = Boolean(tour.tags?.length);
  const hasNotes = Boolean(tour.documents_required || tour.insurance_info);

  return (
    <section id="section-infos" className="space-y-6 scroll-mt-36">
      {(hasDescription || hasHighlights || hasTags) && (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <p className="text-xs font-semibold uppercase text-primary">Reisebeschreibung</p>
            <CardTitle className="text-2xl md:text-3xl">Das erwartet Sie in {tour.destination}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {tour.description && <p className="whitespace-pre-line text-base leading-relaxed text-foreground/90">{tour.description}</p>}
            {hasHighlights && (
              <>
                {hasDescription && <Separator />}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-foreground">Reise-Highlights</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {tour.highlights?.map((highlight, index) => (
                      <div key={`${highlight}-${index}`} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                        <Star className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="font-medium text-foreground">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            {hasTags && (
              <div className="flex flex-wrap gap-2">
                {tour.tags?.map((tag, index) => <Badge key={`${tag}-${index}`} variant="secondary">{tag}</Badge>)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {hasNotes && (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Info className="h-5 w-5 text-primary" />Wichtige Reisehinweise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {tour.documents_required && (
              <div className="flex items-start gap-3">
                <FileCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div><h3 className="font-semibold text-foreground">Reisedokumente</h3><p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{tour.documents_required}</p></div>
              </div>
            )}
            {tour.insurance_info && (
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div><h3 className="font-semibold text-foreground">Reiseschutz</h3><p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{tour.insurance_info}</p></div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
};

export default TourInfoSection;