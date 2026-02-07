import { useState } from "react";
import { Clock, Euro, Luggage, Bus, MapPin, Route as RouteIcon, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TourRoute, TourLuggageAddon } from "@/hooks/useTourBuilder";
import RouteMap from "./RouteMap";

interface TourRoutesSectionProps {
  routes: TourRoute[];
  luggageAddons: TourLuggageAddon[];
  onSelectStop?: (stopId: string, surcharge: number) => void;
}

const TourRoutesSection = ({ routes, luggageAddons, onSelectStop }: TourRoutesSectionProps) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '');
  
  // Get all stops for map display
  const allStops = routes.flatMap(r => r.pickup_stops || []);
  const currentRoute = routes.find(r => r.id === selectedRouteId);
  const currentStops = currentRoute?.pickup_stops || [];
  
  return (
    <section id="section-route" className="space-y-6 scroll-mt-20">
      {/* Interactive Map */}
      {allStops.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <MapPin className="w-6 h-6 text-primary" />
              Routenübersicht
            </CardTitle>
            <CardDescription>
              Interaktive Karte aller Zustiegsorte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RouteMap stops={currentStops.length > 0 ? currentStops : allStops} />
          </CardContent>
        </Card>
      )}

      {/* Bus Routes with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Bus className="w-6 h-6 text-primary" />
            Unsere Busrouten & Zustiege
          </CardTitle>
          <CardDescription>
            Wählen Sie Ihre Route und Ihren Zustiegsort. Aufpreise gelten pro Person für Hin- und Rückfahrt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Zustiegsorte werden noch bekannt gegeben.</p>
            </div>
          ) : routes.length === 1 ? (
            // Single route - show directly without tabs
            <RouteContent 
              route={routes[0]} 
              onSelectStop={onSelectStop}
            />
          ) : (
            // Multiple routes - show as tabs
            <Tabs value={selectedRouteId} onValueChange={setSelectedRouteId}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(routes.length, 4)}, 1fr)` }}>
                {routes.map((route) => (
                  <TabsTrigger key={route.id} value={route.id} className="text-xs sm:text-sm">
                    {route.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {routes.map((route) => (
                <TabsContent key={route.id} value={route.id} className="mt-4">
                  <RouteContent 
                    route={route} 
                    onSelectStop={onSelectStop}
                  />
                </TabsContent>
              ))}
            </Tabs>
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
                  className="p-4 rounded-xl border bg-muted/50 hover:border-primary/50 transition-colors"
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
                        <Badge className="bg-primary text-primary-foreground">
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

// Separate component for route content
interface RouteContentProps {
  route: TourRoute & { distance_km?: number; duration_hours?: number };
  onSelectStop?: (stopId: string, surcharge: number) => void;
}

const RouteContent = ({ route, onSelectStop }: RouteContentProps) => {
  const stops = route.pickup_stops || [];
  const sortedStops = [...stops].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-4">
      {/* Route Info Badges */}
      <div className="flex flex-wrap gap-3 mb-4">
        {route.description && (
          <p className="text-sm text-muted-foreground w-full mb-2">{route.description}</p>
        )}
        
        {route.distance_km && (
          <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
            <RouteIcon className="w-4 h-4" />
            Entfernung: {route.distance_km} km
          </Badge>
        )}
        
        {route.duration_hours && (
          <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
            <Timer className="w-4 h-4" />
            Fahrzeit: ca. {route.duration_hours} Std.
          </Badge>
        )}
      </div>

      {/* Stops Timeline */}
      {sortedStops.length > 0 ? (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-primary/20" />
          
          <div className="space-y-0">
            {sortedStops.map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === sortedStops.length - 1;
              
              return (
                <div 
                  key={stop.id}
                  className="relative flex items-start gap-4 py-3 group"
                  onClick={() => onSelectStop?.(stop.id, stop.surcharge)}
                >
                  {/* Timeline Dot */}
                  <div className="relative z-10 flex items-center justify-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border-2 ${
                      isFirst || isLast 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-background text-foreground border-primary/50'
                    }`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Stop Content */}
                  <div className={`flex-1 p-4 rounded-xl border transition-all ${
                    onSelectStop 
                      ? 'cursor-pointer hover:border-primary hover:bg-primary/5' 
                      : ''
                  } ${isFirst || isLast ? 'bg-muted/50' : 'bg-background'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-semibold text-foreground">{stop.city}</h5>
                          {isFirst && (
                            <Badge variant="outline" className="text-xs">Start</Badge>
                          )}
                          {isLast && (
                            <Badge variant="outline" className="text-xs">Ziel</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{stop.location_name}</p>
                        {stop.address && (
                          <p className="text-xs text-muted-foreground mt-0.5">{stop.address}</p>
                        )}
                        {stop.meeting_point && (
                          <p className="text-xs text-primary mt-0.5">Treffpunkt: {stop.meeting_point}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Time */}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {stop.departure_time ? (
                            <span className="font-medium text-sm">{stop.departure_time} Uhr</span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Uhrzeit folgt</span>
                          )}
                        </div>

                        {/* Surcharge */}
                        {stop.surcharge > 0 ? (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            <Euro className="w-3 h-3 mr-1" />
                            +{stop.surcharge.toFixed(0)} €
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Inkl.
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-xl">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Genaue Zustiegsorte werden nach der Buchung mitgeteilt.</p>
        </div>
      )}
    </div>
  );
};

export default TourRoutesSection;
