import { useState } from "react";
import { TourRoute, TourPickupStop } from "@/hooks/useTourBuilder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MapPin, Plus, Pencil, Trash2, Clock, Euro, GripVertical, Bus } from "lucide-react";

interface TourRoutesTabProps {
  tourId?: string;
  routes: TourRoute[];
  onCreateRoute: (data: Omit<TourRoute, 'id' | 'created_at'>) => Promise<{ error: Error | null }>;
  onUpdateRoute: (id: string, data: Partial<TourRoute>) => Promise<{ error: Error | null }>;
  onDeleteRoute: (id: string) => Promise<{ error: Error | null }>;
  onCreateStop: (data: Omit<TourPickupStop, 'id' | 'created_at'>) => Promise<{ error: Error | null }>;
  onUpdateStop: (id: string, data: Partial<TourPickupStop>) => Promise<{ error: Error | null }>;
  onDeleteStop: (id: string) => Promise<{ error: Error | null }>;
}

const emptyRoute: Partial<TourRoute> = {
  name: '',
  code: '',
  description: '',
  sort_order: 0,
  is_active: true,
  pickup_stops: [],
};

const emptyStop: Omit<TourPickupStop, 'id' | 'route_id' | 'created_at'> = {
  city: '',
  location_name: '',
  address: '',
  meeting_point: '',
  departure_time: '06:00',
  arrival_offset_minutes: 0,
  surcharge: 0,
  max_passengers: null,
  sort_order: 0,
  is_active: true,
};

const TourRoutesTab = ({ 
  tourId, 
  routes, 
  onCreateRoute, 
  onUpdateRoute, 
  onDeleteRoute,
  onCreateStop,
  onUpdateStop,
  onDeleteStop
}: TourRoutesTabProps) => {
  const [routeDialog, setRouteDialog] = useState<{ open: boolean; route: Partial<TourRoute> | null; isNew: boolean }>({
    open: false,
    route: null,
    isNew: false,
  });
  const [stopDialog, setStopDialog] = useState<{ open: boolean; stop: Partial<TourPickupStop> | null; isNew: boolean; routeId: string | null }>({
    open: false,
    stop: null,
    isNew: false,
    routeId: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveRoute = async () => {
    if (!routeDialog.route || !tourId) return;
    setIsSaving(true);

    try {
      if (routeDialog.isNew) {
        await onCreateRoute({
          ...emptyRoute,
          ...routeDialog.route,
          tour_id: tourId,
          sort_order: routes.length,
        });
      } else {
        const { id, pickupStops, ...updates } = routeDialog.route;
        await onUpdateRoute(id!, updates);
      }
      setRouteDialog({ open: false, route: null, isNew: false });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('Diese Route und alle Zustiege löschen?')) return;
    await onDeleteRoute(id);
  };

  const handleSaveStop = async () => {
    if (!stopDialog.stop || !stopDialog.routeId) return;
    setIsSaving(true);

    try {
      const route = routes.find(r => r.id === stopDialog.routeId);
      const stopsCount = route?.pickup_stops?.length || 0;

      if (stopDialog.isNew) {
        await onCreateStop({
          ...emptyStop,
          ...stopDialog.stop,
          route_id: stopDialog.routeId,
          sort_order: stopsCount,
        });
      } else {
        const { id, ...updates } = stopDialog.stop;
        await onUpdateStop(id!, updates);
      }
      setStopDialog({ open: false, stop: null, isNew: false, routeId: null });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStop = async (id: string) => {
    if (!confirm('Diesen Zustieg löschen?')) return;
    await onDeleteStop(id);
  };

  const createDefaultRoutes = async () => {
    if (!tourId) return;
    setIsSaving(true);

    try {
      const defaultRoutes = [
        { name: 'Route Nord', code: 'NORD', description: 'Hamburg, Bremen, Hannover' },
        { name: 'Route Mitte', code: 'MITTE', description: 'Dortmund, Köln, Frankfurt' },
        { name: 'Route Süd', code: 'SUED', description: 'Stuttgart, München, Nürnberg' },
      ];

      for (let i = 0; i < defaultRoutes.length; i++) {
        if (!routes.some(r => r.code === defaultRoutes[i].code)) {
          await onCreateRoute({
            ...emptyRoute,
            ...defaultRoutes[i],
            tour_id: tourId,
            sort_order: i,
          });
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!tourId) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p>Bitte speichern Sie zuerst die Basis-Informationen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Routen & Zustiege</h2>
          <p className="text-zinc-500">Abfahrtsorte mit Zeiten und optionalen Aufpreisen</p>
        </div>
        <div className="flex gap-2">
          {routes.length === 0 && (
            <Button
              variant="outline"
              onClick={createDefaultRoutes}
              disabled={isSaving}
              className="border-zinc-700"
            >
              <Bus className="w-4 h-4 mr-2" />
              Standard-Routen erstellen
            </Button>
          )}
          <Button
            onClick={() => setRouteDialog({ open: true, route: emptyRoute, isNew: true })}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Route hinzufügen
          </Button>
        </div>
      </div>

      {/* Routes */}
      {routes.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
            <p className="text-zinc-500 mb-4">Noch keine Routen angelegt</p>
            <Button onClick={createDefaultRoutes} disabled={isSaving}>
              Standard-Routen erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {routes.sort((a, b) => a.sort_order - b.sort_order).map((route) => (
            <AccordionItem
              key={route.id}
              value={route.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Bus className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{route.name}</span>
                      <Badge variant="outline" className="text-xs border-zinc-700">
                        {route.code}
                      </Badge>
                    </div>
                    {route.description && (
                      <p className="text-sm text-zinc-500">{route.description}</p>
                    )}
                  </div>
                  <Badge className="ml-auto mr-4 bg-zinc-800 text-zinc-400">
                    {route.pickup_stops?.length || 0} Zustiege
                  </Badge>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 pb-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRouteDialog({ open: true, route, isNew: false })}
                      className="border-zinc-700"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Route bearbeiten
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRoute(route.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Löschen
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setStopDialog({ open: true, stop: emptyStop, isNew: true, routeId: route.id })}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Zustieg hinzufügen
                  </Button>
                </div>

                {/* Pickup Stops */}
                {(route.pickup_stops || []).length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-4">Keine Zustiege definiert</p>
                ) : (
                  <div className="space-y-2">
                    {(route.pickup_stops || []).sort((a, b) => a.sort_order - b.sort_order).map((stop, index) => (
                      <div
                        key={stop.id}
                        className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg group"
                      >
                        <GripVertical className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 cursor-grab" />
                        
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium text-zinc-300">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{stop.city}</span>
                            <span className="text-zinc-500">—</span>
                            <span className="text-zinc-400">{stop.location_name}</span>
                          </div>
                          {stop.address && (
                            <p className="text-xs text-zinc-500 truncate">{stop.address}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-zinc-400">
                            <Clock className="w-4 h-4" />
                            {stop.departure_time}
                          </div>
                          {stop.surcharge > 0 && (
                            <Badge className="bg-amber-500/20 text-amber-400">
                              +{stop.surcharge}€
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setStopDialog({ open: true, stop, isNew: false, routeId: route.id })}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStop(stop.id)}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Route Dialog */}
      <Dialog open={routeDialog.open} onOpenChange={(open) => !open && setRouteDialog({ open: false, route: null, isNew: false })}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {routeDialog.isNew ? 'Route hinzufügen' : 'Route bearbeiten'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={routeDialog.route?.name || ''}
                  onChange={(e) => setRouteDialog(prev => ({
                    ...prev,
                    route: { ...prev.route, name: e.target.value }
                  }))}
                  placeholder="z.B. Route Nord"
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label>Code *</Label>
                <Input
                  value={routeDialog.route?.code || ''}
                  onChange={(e) => setRouteDialog(prev => ({
                    ...prev,
                    route: { ...prev.route, code: e.target.value.toUpperCase() }
                  }))}
                  placeholder="z.B. NORD"
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Beschreibung</Label>
              <Textarea
                value={routeDialog.route?.description || ''}
                onChange={(e) => setRouteDialog(prev => ({
                  ...prev,
                  route: { ...prev.route, description: e.target.value }
                }))}
                placeholder="z.B. Hamburg, Bremen, Hannover"
                className="bg-zinc-800 border-zinc-700 mt-1"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRouteDialog({ open: false, route: null, isNew: false })}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveRoute}
              disabled={isSaving || !routeDialog.route?.name || !routeDialog.route?.code}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {routeDialog.isNew ? 'Hinzufügen' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stop Dialog */}
      <Dialog open={stopDialog.open} onOpenChange={(open) => !open && setStopDialog({ open: false, stop: null, isNew: false, routeId: null })}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {stopDialog.isNew ? 'Zustieg hinzufügen' : 'Zustieg bearbeiten'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stadt *</Label>
                <Input
                  value={stopDialog.stop?.city || ''}
                  onChange={(e) => setStopDialog(prev => ({
                    ...prev,
                    stop: { ...prev.stop, city: e.target.value }
                  }))}
                  placeholder="z.B. Hamburg"
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label>Abfahrtszeit *</Label>
                <Input
                  type="time"
                  value={stopDialog.stop?.departure_time || '06:00'}
                  onChange={(e) => setStopDialog(prev => ({
                    ...prev,
                    stop: { ...prev.stop, departure_time: e.target.value }
                  }))}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Haltestelle / Ort *</Label>
              <Input
                value={stopDialog.stop?.location_name || ''}
                onChange={(e) => setStopDialog(prev => ({
                  ...prev,
                  stop: { ...prev.stop, location_name: e.target.value }
                }))}
                placeholder="z.B. ZOB Hamburg"
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>

            <div>
              <Label>Adresse</Label>
              <Input
                value={stopDialog.stop?.address || ''}
                onChange={(e) => setStopDialog(prev => ({
                  ...prev,
                  stop: { ...prev.stop, address: e.target.value }
                }))}
                placeholder="z.B. Adenauerallee 78, 20097 Hamburg"
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>

            <div>
              <Label>Treffpunkt</Label>
              <Input
                value={stopDialog.stop?.meeting_point || ''}
                onChange={(e) => setStopDialog(prev => ({
                  ...prev,
                  stop: { ...prev.stop, meeting_point: e.target.value }
                }))}
                placeholder="z.B. Steig 12, vor dem Haupteingang"
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Aufpreis (€)</Label>
                <Input
                  type="number"
                  value={stopDialog.stop?.surcharge || 0}
                  onChange={(e) => setStopDialog(prev => ({
                    ...prev,
                    stop: { ...prev.stop, surcharge: parseFloat(e.target.value) || 0 }
                  }))}
                  placeholder="z.B. 50 für Hamburg"
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
                <p className="text-xs text-zinc-500 mt-1">z.B. +50€ für Hamburg</p>
              </div>
              <div>
                <Label>Max. Passagiere</Label>
                <Input
                  type="number"
                  value={stopDialog.stop?.max_passengers || ''}
                  onChange={(e) => setStopDialog(prev => ({
                    ...prev,
                    stop: { ...prev.stop, max_passengers: parseInt(e.target.value) || null }
                  }))}
                  placeholder="Leer = unbegrenzt"
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setStopDialog({ open: false, stop: null, isNew: false, routeId: null })}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveStop}
              disabled={isSaving || !stopDialog.stop?.city || !stopDialog.stop?.location_name}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {stopDialog.isNew ? 'Hinzufügen' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TourRoutesTab;
