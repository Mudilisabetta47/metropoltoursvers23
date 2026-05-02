import { Info, Star, Wifi, Wind, Plug, Coffee, ShieldCheck, Bus, Award, Headphones, MapPin, Clock, Users, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExtendedPackageTour } from "@/hooks/useTourBuilder";

interface TourInfoSectionProps {
  tour: ExtendedPackageTour;
}

const busAmenities = [
  { icon: Wifi, label: "Kostenloses WLAN", desc: "Auf der gesamten Strecke" },
  { icon: Wind, label: "Klimaanlage", desc: "Individuell regelbar" },
  { icon: Plug, label: "USB & Steckdosen", desc: "An jedem Sitzplatz" },
  { icon: Coffee, label: "Bordservice", desc: "Getränke & Snacks" },
];

const trustPoints = [
  { icon: Award, title: "Geprüfter Reiseveranstalter", desc: "Eingetragen im deutschen Handelsregister, mit Reisesicherungsschein nach §651r BGB." },
  { icon: ShieldCheck, title: "100 % Insolvenzschutz", desc: "Ihr Reisepreis ist über die Deutsche Reisesicherung (DRS) abgesichert." },
  { icon: Headphones, title: "Persönliche Betreuung", desc: "Deutschsprachige Reisebegleitung & 24/7 Notfall-Hotline während der Reise." },
  { icon: FileCheck, title: "Transparente Bedingungen", desc: "Klare Tarife, faire Stornoregeln, keine versteckten Gebühren." },
];

const TourInfoSection = ({ tour }: TourInfoSectionProps) => {
  return (
    <section id="section-infos" className="space-y-6 scroll-mt-36">
      {/* Tour Description */}
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold mb-2">Reisebeschreibung</p>
          <CardTitle className="font-serif text-2xl md:text-3xl font-semibold leading-tight">
            Das erwartet Sie in {tour.destination}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-slate max-w-none">
            <p className="text-foreground/90 leading-[1.8] text-[15px] md:text-base first-letter:text-4xl first-letter:font-serif first-letter:font-semibold first-letter:text-primary first-letter:mr-1 first-letter:float-left first-letter:leading-[0.9] first-letter:mt-1">
              {tour.description || `Erleben Sie ${tour.destination} auf eine Art, die Sie so noch nicht kennen. ${tour.location ? `${tour.location} ` : ""}verzaubert mit authentischen Eindrücken, kulinarischen Höhepunkten und Momenten, die lange in Erinnerung bleiben. Wir kümmern uns um die Organisation – Sie genießen ab dem ersten Augenblick.`}
            </p>
          </div>

          {/* Quick Facts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="rounded-xl bg-muted/40 border border-border/60 p-3">
              <MapPin className="w-4 h-4 text-primary mb-1.5" />
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Reiseziel</p>
              <p className="text-sm font-semibold text-foreground truncate">{tour.location || tour.destination}</p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/60 p-3">
              <Clock className="w-4 h-4 text-primary mb-1.5" />
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Dauer</p>
              <p className="text-sm font-semibold text-foreground">{tour.duration_days || "—"} Tage</p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/60 p-3">
              <Bus className="w-4 h-4 text-primary mb-1.5" />
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Anreise</p>
              <p className="text-sm font-semibold text-foreground">Komfortbus</p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/60 p-3">
              <Users className="w-4 h-4 text-primary mb-1.5" />
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Reisegruppe</p>
              <p className="text-sm font-semibold text-foreground">ab {tour.min_participants || 25} Personen</p>
            </div>
          </div>

          {/* Highlights */}
          {tour.highlights && tour.highlights.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-serif text-lg font-semibold text-foreground mb-4">Reise-Highlights</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {tour.highlights.map((highlight, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                      </div>
                      <span className="font-medium text-foreground leading-snug">{highlight}</span>
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
                    className="bg-primary/10 text-primary border-0 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Trust / Why book with us */}
      <Card className="rounded-2xl border-border/60 shadow-sm bg-gradient-to-br from-card to-primary/5">
        <CardHeader className="pb-4">
          <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold mb-2">Warum METROPOL TOURS</p>
          <CardTitle className="font-serif text-2xl font-semibold">Sicher reisen mit gutem Gefühl</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {trustPoints.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/60">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-0.5">{p.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bus Amenities */}
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold mb-2">Ihr Reisebus</p>
          <CardTitle className="font-serif text-2xl font-semibold">Komfort auf höchstem Niveau</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {busAmenities.map((amenity, index) => {
              const Icon = amenity.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 p-4 bg-muted/40 border border-border/60 rounded-xl text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{amenity.label}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{amenity.desc}</span>
                </div>
              );
            })}
          </div>

          <Separator className="my-6" />

          <div className="rounded-xl bg-muted/40 border border-border/60 p-5">
            <h4 className="font-serif text-lg font-semibold text-foreground mb-3">Ausstattung im Detail</h4>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-foreground/80">
              {[
                "Moderne, klimatisierte Reisebusse (4–5 Sterne)",
                "Bequeme Sitze mit verstellbaren Lehnen",
                "Großzügiger Sitzabstand (bis 90 cm)",
                "Bord-WC und Bordküche",
                "USB-Anschluss an jedem Sitz",
                "Erfahrene, deutschsprachige Fahrer",
                "Unterhaltungssystem mit Filmen",
                "Großes Gepäckabteil",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="rounded-2xl border-amber-200 bg-amber-50/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-amber-900">
            <Info className="w-5 h-5" />
            Wichtige Hinweise vor Ihrer Reise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-amber-950">
          {tour.documents_required && (
            <div>
              <h5 className="font-semibold mb-1.5 flex items-center gap-2">
                <FileCheck className="w-4 h-4" /> Reisedokumente
              </h5>
              <p className="text-sm leading-relaxed">{tour.documents_required}</p>
            </div>
          )}

          <div>
            <h5 className="font-semibold mb-1.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Einreisebestimmungen
            </h5>
            <p className="text-sm leading-relaxed">
              Bitte informieren Sie sich rechtzeitig über die aktuellen Einreisebestimmungen
              für {tour.country || tour.destination}. Deutsche Staatsbürger benötigen in der Regel
              einen gültigen Personalausweis oder Reisepass (mind. 6 Monate über das Reiseende hinaus gültig).
            </p>
          </div>

          <div>
            <h5 className="font-semibold mb-1.5 flex items-center gap-2">
              <Users className="w-4 h-4" /> Buchungshinweis
            </h5>
            <p className="text-sm leading-relaxed">
              Die Mindestteilnehmerzahl beträgt {tour.min_participants || 25} Personen.
              Bei Nichterreichen behalten wir uns vor, die Reise bis 14 Tage vor Abreise
              abzusagen – Sie erhalten in diesem Fall selbstverständlich den vollen Reisepreis zurück.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default TourInfoSection;
