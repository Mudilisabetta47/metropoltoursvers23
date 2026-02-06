import { Clock, Euro, Luggage, Bus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TourRoute, TourLuggageAddon } from "@/hooks/useTourBuilder";

interface TourRoutesSectionProps {
  routes: TourRoute[];
  luggageAddons: TourLuggageAddon[];
}

const TourRoutesSection = ({ routes, luggageAddons }: TourRoutesSectionProps) => {
  return (
    <section id="section-route" className="space-y-6 scroll-mt-20">
      {/* Bus Routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Bus className="w-6 h-6 text-primary" />
            Unsere Busrouten & Zustiege
          </CardTitle>
          <CardDescription>
            Wählen Sie Ihren Zustiegsort. Aufpreise gelten pro Person für Hin- und Rückfahrt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Zustiegsorte werden noch bekannt gegeben.</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-3">
              {routes.map((route, index) => (
                <AccordionItem 
                  key={route.id} 
                  value={route.id}
                  className="border rounded-xl px-4 data-[state=open]:bg-slate-50"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {route.code || `R${index + 1}`}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{route.name}</h4>
                        {route.description && (
                          <p className="text-sm text-muted-foreground">{route.description}</p>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pb-4 pt-2">
                      {route.pickup_stops && route.pickup_stops.length > 0 ? (
                        <div className="space-y-3">
                          {route.pickup_stops
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((stop, stopIndex) => (
                              <div 
                                key={stop.id}
                                className="flex items-start gap-4 p-4 bg-white rounded-lg border"
                              >
                                {/* Timeline dot */}
                                <div className="flex flex-col items-center">
                                  <div className="w-3 h-3 rounded-full bg-primary" />
                                  {stopIndex < (route.pickup_stops?.length || 0) - 1 && (
                                    <div className="w-0.5 h-full bg-primary/20 min-h-[40px]" />
                                  )}
                                </div>

                                <div className="flex-1 grid sm:grid-cols-4 gap-4">
                                  {/* City & Location */}
                                  <div className="sm:col-span-2">
                                    <h5 className="font-semibold text-foreground">{stop.city}</h5>
                                    <p className="text-sm text-muted-foreground">{stop.location_name}</p>
                                    {stop.address && (
                                      <p className="text-xs text-muted-foreground mt-1">{stop.address}</p>
                                    )}
                                  </div>

                                  {/* Time */}
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">{stop.departure_time} Uhr</span>
                                  </div>

                                  {/* Surcharge */}
                                  <div className="flex items-center gap-2">
                                    {stop.surcharge > 0 ? (
                                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                        <Euro className="w-3 h-3 mr-1" />
                                        +{stop.surcharge.toFixed(0)} €
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                        Inkl.
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          Genaue Zustiegsorte werden nach der Buchung mitgeteilt.
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Luggage Add-ons */}
      {luggageAddons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Luggage className="w-6 h-6 text-primary" />
              Zusätzliches Gepäck
            </CardTitle>
            <CardDescription>
              Buchen Sie bei Bedarf zusätzliche Gepäckstücke hinzu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {luggageAddons.map((addon) => (
                <div 
                  key={addon.id}
                  className="p-4 rounded-xl border bg-slate-50 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Luggage className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{addon.name}</h4>
                      {addon.description && (
                        <p className="text-sm text-muted-foreground">{addon.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <Badge className="bg-primary text-white">
                          +{addon.price.toFixed(0)} €
                        </Badge>
                        {addon.weight_limit_kg && (
                          <span className="text-xs text-muted-foreground">
                            max. {addon.weight_limit_kg}kg
                          </span>
                        )}
                      </div>
                    </div>
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

export default TourRoutesSection;
