import { Info, Star, Wifi, Wind, Plug, Coffee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExtendedPackageTour } from "@/hooks/useTourBuilder";

interface TourInfoSectionProps {
  tour: ExtendedPackageTour;
}

const busAmenities = [
  { icon: Wifi, label: 'Kostenloses WLAN' },
  { icon: Wind, label: 'Klimaanlage' },
  { icon: Plug, label: 'Steckdosen' },
  { icon: Coffee, label: 'Bordküche' },
];

const TourInfoSection = ({ tour }: TourInfoSectionProps) => {
  return (
    <section id="section-infos" className="space-y-6 scroll-mt-20">
      {/* Tour Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Info className="w-6 h-6 text-primary" />
            Das erwartet Sie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-slate max-w-none">
            <p className="text-foreground leading-relaxed">
              {tour.description || `Erleben Sie ${tour.destination} auf dieser einzigartigen Reise. ${tour.location} bietet Ihnen unvergessliche Momente und einzigartige Erlebnisse.`}
            </p>
          </div>

          {/* Highlights */}
          {tour.highlights && tour.highlights.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold text-foreground mb-4">Highlights</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {tour.highlights.map((highlight, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg"
                    >
                      <Star className="w-5 h-5 text-amber-500 shrink-0" />
                      <span className="font-medium text-foreground">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          {tour.tags && tour.tags.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {tour.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="bg-primary/10 text-primary border-0 px-3 py-1"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bus Amenities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Unser Reisebus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {busAmenities.map((amenity, index) => {
              const Icon = amenity.icon;
              return (
                <div 
                  key={index}
                  className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-xl text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{amenity.label}</span>
                </div>
              );
            })}
          </div>

          <Separator className="my-6" />

          <div className="bg-slate-50 rounded-xl p-5">
            <h4 className="font-semibold text-foreground mb-3">Das bietet Ihr Bus</h4>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <li>• Moderne, klimatisierte Reisebusse</li>
              <li>• Bequeme Sitze mit verstellbaren Lehnen</li>
              <li>• WC an Bord</li>
              <li>• Großer Sitzabstand für Komfort</li>
              <li>• USB-Ladeanschlüsse</li>
              <li>• Erfahrene, freundliche Fahrer</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-amber-800">
            <Info className="w-5 h-5" />
            Wichtige Hinweise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-amber-900">
          {tour.documents_required && (
            <div>
              <h5 className="font-semibold mb-2">Reisedokumente</h5>
              <p className="text-sm">{tour.documents_required}</p>
            </div>
          )}
          
          <div>
            <h5 className="font-semibold mb-2">Einreisebestimmungen</h5>
            <p className="text-sm">
              Bitte informieren Sie sich rechtzeitig über die aktuellen Einreisebestimmungen 
              für {tour.country || tour.destination}. Deutsche Staatsbürger benötigen in der Regel 
              einen gültigen Personalausweis oder Reisepass.
            </p>
          </div>

          <div>
            <h5 className="font-semibold mb-2">Buchungshinweis</h5>
            <p className="text-sm">
              Die Mindestteilnehmerzahl beträgt {tour.min_participants || 25} Personen. 
              Bei Nichterreichen behalten wir uns vor, die Reise bis 14 Tage vor Abreise abzusagen.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default TourInfoSection;
