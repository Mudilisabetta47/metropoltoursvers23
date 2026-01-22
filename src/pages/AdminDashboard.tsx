import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Route, MapPin, Bus, Calendar, Users, Settings, LogOut,
  Plus, Pencil, Trash2, Save, X, ChevronRight, Shield,
  LayoutDashboard, FileText, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { de } from "date-fns/locale";

type TabType = 'overview' | 'routes' | 'stops' | 'buses' | 'trips' | 'inquiries';

interface RouteData {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  is_active: boolean;
  created_at: string;
}

interface StopData {
  id: string;
  route_id: string;
  name: string;
  city: string;
  stop_order: number;
  price_from_start: number;
}

interface BusData {
  id: string;
  name: string;
  license_plate: string;
  total_seats: number;
  is_active: boolean;
  amenities: string[] | null;
}

interface TripData {
  id: string;
  route_id: string;
  bus_id: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  base_price: number;
  is_active: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DialogData = any;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [stops, setStops] = useState<StopData[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [bookingsCount, setBookingsCount] = useState(0);
  
  // Dialog states
  const [editDialog, setEditDialog] = useState<{
    type: 'route' | 'stop' | 'bus' | 'trip' | null;
    data: DialogData | null;
    isNew: boolean;
  }>({ type: null, data: null, isNew: false });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchAllData();
    }
  }, [user, isAdmin, authLoading]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [routesRes, stopsRes, busesRes, tripsRes, , bookingsRes] = await Promise.all([
        supabase.from('routes').select('*').order('name'),
        supabase.from('stops').select('*').order('route_id, stop_order'),
        supabase.from('buses').select('*').order('name'),
        supabase.from('trips').select('*').order('departure_date', { ascending: false }),
        supabase.from('package_tour_inquiries' as never).select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true })
      ]);

      if (routesRes.data) setRoutes(routesRes.data);
      if (stopsRes.data) setStops(stopsRes.data);
      if (busesRes.data) setBuses(busesRes.data);
      if (tripsRes.data) setTrips(tripsRes.data);
      setBookingsCount(bookingsRes.count || 0);
      setBookingsCount(bookingsRes.count || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: "Fehler beim Laden", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD Operations
  const handleSave = async () => {
    if (!editDialog.type || !editDialog.data) return;
    setIsSaving(true);

    try {
      const table = editDialog.type === 'route' ? 'routes' 
        : editDialog.type === 'stop' ? 'stops'
        : editDialog.type === 'bus' ? 'buses' : 'trips';

      if (editDialog.isNew) {
        const { id: _id, ...dataWithoutId } = editDialog.data as Record<string, unknown>;
        const { error } = await supabase.from(table).insert(dataWithoutId as never);
        if (error) throw error;
        toast({ title: "Erfolgreich erstellt" });
      } else {
        const { id, ...updateData } = editDialog.data;
        const { error } = await supabase.from(table).update(updateData as never).eq('id', id as string);
        if (error) throw error;
        toast({ title: "Erfolgreich aktualisiert" });
      }

      setEditDialog({ type: null, data: null, isNew: false });
      fetchAllData();
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (type: 'route' | 'stop' | 'bus' | 'trip', id: string) => {
    if (!confirm('Wirklich löschen?')) return;

    try {
      const table = type === 'route' ? 'routes' 
        : type === 'stop' ? 'stops'
        : type === 'bus' ? 'buses' : 'trips';

      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      
      toast({ title: "Erfolgreich gelöscht" });
      fetchAllData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
    }
  };

  // Access control
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
            <h1 className="text-2xl font-bold mb-2 text-white">Admin-Zugang erforderlich</h1>
            <p className="text-zinc-400 mb-6">
              Sie benötigen Admin-Rechte für diesen Bereich.
            </p>
            <Button onClick={() => navigate("/auth")} className="bg-emerald-600 hover:bg-emerald-700">
              Anmelden
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const menuItems = [
    { id: 'overview' as TabType, label: 'Übersicht', icon: LayoutDashboard },
    { id: 'routes' as TabType, label: 'Routen', icon: Route },
    { id: 'stops' as TabType, label: 'Haltestellen', icon: MapPin },
    { id: 'buses' as TabType, label: 'Busse', icon: Bus },
    { id: 'trips' as TabType, label: 'Fahrten', icon: Calendar },
    { id: 'inquiries' as TabType, label: 'Anfragen', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm">METROPOL TOURS</h1>
              <p className="text-xs text-zinc-500">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => item.id === 'inquiries' ? navigate('/admin/inquiries') : setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                activeTab === item.id 
                  ? 'bg-emerald-600/20 text-emerald-400' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.id === 'inquiries' && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 mb-2">{user?.email}</div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Abmelden
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                {menuItems.find(m => m.id === activeTab)?.label}
              </h2>
              <p className="text-zinc-500 text-sm">
                {activeTab === 'overview' && 'System-Übersicht und Statistiken'}
                {activeTab === 'routes' && 'Busrouten verwalten'}
                {activeTab === 'stops' && 'Haltestellen konfigurieren'}
                {activeTab === 'buses' && 'Busflotte verwalten'}
                {activeTab === 'trips' && 'Fahrten planen und bearbeiten'}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchAllData}
              disabled={isLoading}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                    <Route className="w-4 h-4" />
                    Routen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{routes.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                    <Bus className="w-4 h-4" />
                    Busse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{buses.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fahrten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{trips.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Buchungen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-400">{bookingsCount}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Routes Tab */}
          {activeTab === 'routes' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button 
                  onClick={() => setEditDialog({ 
                    type: 'route', 
                    data: { name: '', description: '', base_price: 0, is_active: true }, 
                    isNew: true 
                  })}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Neue Route
                </Button>
              </div>
              <Card className="bg-zinc-900 border-zinc-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Name</TableHead>
                      <TableHead className="text-zinc-400">Beschreibung</TableHead>
                      <TableHead className="text-zinc-400">Basispreis</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                      <TableHead className="text-zinc-400 text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes.map((route) => (
                      <TableRow key={route.id} className="border-zinc-800">
                        <TableCell className="font-medium text-white">{route.name}</TableCell>
                        <TableCell className="text-zinc-400">{route.description || '-'}</TableCell>
                        <TableCell className="text-zinc-300">{route.base_price}€</TableCell>
                        <TableCell>
                          <Badge className={route.is_active ? 'bg-emerald-600' : 'bg-zinc-600'}>
                            {route.is_active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditDialog({ type: 'route', data: route, isNew: false })}
                            className="text-zinc-400 hover:text-white"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete('route', route.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* Stops Tab */}
          {activeTab === 'stops' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button 
                  onClick={() => setEditDialog({ 
                    type: 'stop', 
                    data: { route_id: routes[0]?.id || '', name: '', city: '', stop_order: 1, price_from_start: 0 }, 
                    isNew: true 
                  })}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Neue Haltestelle
                </Button>
              </div>
              <Card className="bg-zinc-900 border-zinc-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Route</TableHead>
                      <TableHead className="text-zinc-400">Reihenfolge</TableHead>
                      <TableHead className="text-zinc-400">Stadt</TableHead>
                      <TableHead className="text-zinc-400">Haltestelle</TableHead>
                      <TableHead className="text-zinc-400">Preis ab Start</TableHead>
                      <TableHead className="text-zinc-400 text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stops.map((stop) => (
                      <TableRow key={stop.id} className="border-zinc-800">
                        <TableCell className="text-zinc-400">
                          {routes.find(r => r.id === stop.route_id)?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                            #{stop.stop_order}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-white">{stop.city}</TableCell>
                        <TableCell className="text-zinc-300">{stop.name}</TableCell>
                        <TableCell className="text-zinc-300">{stop.price_from_start}€</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditDialog({ type: 'stop', data: stop, isNew: false })}
                            className="text-zinc-400 hover:text-white"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete('stop', stop.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* Buses Tab */}
          {activeTab === 'buses' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button 
                  onClick={() => setEditDialog({ 
                    type: 'bus', 
                    data: { name: '', license_plate: '', total_seats: 50, is_active: true, amenities: ['wifi', 'power', 'wc'] }, 
                    isNew: true 
                  })}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Neuer Bus
                </Button>
              </div>
              <Card className="bg-zinc-900 border-zinc-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Name</TableHead>
                      <TableHead className="text-zinc-400">Kennzeichen</TableHead>
                      <TableHead className="text-zinc-400">Sitzplätze</TableHead>
                      <TableHead className="text-zinc-400">Ausstattung</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                      <TableHead className="text-zinc-400 text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buses.map((bus) => (
                      <TableRow key={bus.id} className="border-zinc-800">
                        <TableCell className="font-medium text-white">{bus.name}</TableCell>
                        <TableCell className="text-zinc-300 font-mono">{bus.license_plate}</TableCell>
                        <TableCell className="text-zinc-300">{bus.total_seats}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {bus.amenities?.map((a) => (
                              <Badge key={a} variant="outline" className="border-zinc-600 text-zinc-400 text-xs">
                                {a}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={bus.is_active ? 'bg-emerald-600' : 'bg-zinc-600'}>
                            {bus.is_active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditDialog({ type: 'bus', data: bus, isNew: false })}
                            className="text-zinc-400 hover:text-white"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete('bus', bus.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* Trips Tab */}
          {activeTab === 'trips' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button 
                  onClick={() => setEditDialog({ 
                    type: 'trip', 
                    data: { 
                      route_id: routes[0]?.id || '', 
                      bus_id: buses[0]?.id || '', 
                      departure_date: format(new Date(), 'yyyy-MM-dd'),
                      departure_time: '08:00',
                      arrival_time: '18:00',
                      base_price: 50,
                      is_active: true 
                    }, 
                    isNew: true 
                  })}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Neue Fahrt
                </Button>
              </div>
              <Card className="bg-zinc-900 border-zinc-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Route</TableHead>
                      <TableHead className="text-zinc-400">Bus</TableHead>
                      <TableHead className="text-zinc-400">Datum</TableHead>
                      <TableHead className="text-zinc-400">Abfahrt</TableHead>
                      <TableHead className="text-zinc-400">Ankunft</TableHead>
                      <TableHead className="text-zinc-400">Preis</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                      <TableHead className="text-zinc-400 text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.slice(0, 20).map((trip) => (
                      <TableRow key={trip.id} className="border-zinc-800">
                        <TableCell className="font-medium text-white">
                          {routes.find(r => r.id === trip.route_id)?.name || '-'}
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          {buses.find(b => b.id === trip.bus_id)?.name || '-'}
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          {format(new Date(trip.departure_date), 'dd.MM.yyyy', { locale: de })}
                        </TableCell>
                        <TableCell className="text-zinc-300 font-mono">{trip.departure_time}</TableCell>
                        <TableCell className="text-zinc-300 font-mono">{trip.arrival_time}</TableCell>
                        <TableCell className="text-zinc-300">{trip.base_price}€</TableCell>
                        <TableCell>
                          <Badge className={trip.is_active ? 'bg-emerald-600' : 'bg-zinc-600'}>
                            {trip.is_active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditDialog({ type: 'trip', data: trip, isNew: false })}
                            className="text-zinc-400 hover:text-white"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete('trip', trip.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog.type} onOpenChange={() => setEditDialog({ type: null, data: null, isNew: false })}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {editDialog.isNew ? 'Neu erstellen' : 'Bearbeiten'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {editDialog.type === 'route' && 'Route konfigurieren'}
              {editDialog.type === 'stop' && 'Haltestelle konfigurieren'}
              {editDialog.type === 'bus' && 'Bus konfigurieren'}
              {editDialog.type === 'trip' && 'Fahrt planen'}
            </DialogDescription>
          </DialogHeader>

          {editDialog.data && (
            <div className="space-y-4 py-4">
              {/* Route Form */}
              {editDialog.type === 'route' && (
                <>
                  <div>
                    <Label className="text-zinc-300">Name</Label>
                    <Input 
                      value={(editDialog.data as RouteData).name || ''}
                      onChange={(e) => setEditDialog(prev => ({ 
                        ...prev, 
                        data: { ...prev.data, name: e.target.value } 
                      }))}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-300">Beschreibung</Label>
                    <Input 
                      value={(editDialog.data as RouteData).description || ''}
                      onChange={(e) => setEditDialog(prev => ({ 
                        ...prev, 
                        data: { ...prev.data, description: e.target.value } 
                      }))}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-300">Basispreis (€)</Label>
                    <Input 
                      type="number"
                      value={(editDialog.data as RouteData).base_price || 0}
                      onChange={(e) => setEditDialog(prev => ({ 
                        ...prev, 
                        data: { ...prev.data, base_price: parseFloat(e.target.value) } 
                      }))}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={(editDialog.data as RouteData).is_active}
                      onCheckedChange={(checked) => setEditDialog(prev => ({ 
                        ...prev, 
                        data: { ...prev.data, is_active: checked } 
                      }))}
                    />
                    <Label className="text-zinc-300">Aktiv</Label>
                  </div>
                </>
              )}

              {/* Stop Form */}
              {editDialog.type === 'stop' && (
                <>
                  <div>
                    <Label className="text-zinc-300">Route</Label>
                    <Select 
                      value={(editDialog.data as StopData).route_id}
                      onValueChange={(value) => setEditDialog(prev => ({ 
                        ...prev, 
                        data: { ...prev.data, route_id: value } 
                      }))}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {routes.map(r => (
                          <SelectItem key={r.id} value={r.id} className="text-white">{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-zinc-300">Stadt</Label>
                      <Input 
                        value={(editDialog.data as StopData).city || ''}
                        onChange={(e) => setEditDialog(prev => ({ 
                          ...prev, 
                          data: { ...prev.data, city: e.target.value } 
                        }))}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Haltestellenname</Label>
                      <Input 
                        value={(editDialog.data as StopData).name || ''}
                        onChange={(e) => setEditDialog(prev => ({ 
                          ...prev, 
                          data: { ...prev.data, name: e.target.value } 
                        }))}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-zinc-300">Reihenfolge</Label>
                      <Input 
                        type="number"
                        value={(editDialog.data as StopData).stop_order || 1}
                        onChange={(e) => setEditDialog(prev => ({ 
                          ...prev, 
                          data: { ...prev.data, stop_order: parseInt(e.target.value) } 
                        }))}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Preis ab Start (€)</Label>
                      <Input 
                        type="number"
                        value={(editDialog.data as StopData).price_from_start || 0}
                        onChange={(e) => setEditDialog(prev => ({ 
                          ...prev, 
                          data: { ...prev.data, price_from_start: parseFloat(e.target.value) } 
                        }))}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Bus Form */}
              {editDialog.type === 'bus' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-zinc-300">Name</Label>
                      <Input 
                        value={(editDialog.data as BusData).name || ''}
                        onChange={(e) => setEditDialog(prev => ({ 
                          ...prev, 
                          data: { ...prev.data, name: e.target.value } 
                        }))}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Kennzeichen</Label>
                      <Input 
                        value={(editDialog.data as BusData).license_plate || ''}
                        onChange={(e) => setEditDialog(prev => ({ 
                          ...prev, 
                          data: { ...prev.data, license_plate: e.target.value } 
                        }))}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-zinc-300">Sitzplätze</Label>
                    <Input 
                      type="number"
                      value={(editDialog.data as BusData).total_seats || 50}
                      onChange={(e) => setEditDialog(prev => ({ 
                        ...prev, 
                        data: { ...prev.data, total_seats: parseInt(e.target.value) } 
                      }))}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={(editDialog.data as BusData).is_active}
                      onCheckedChange={(checked) => setEditDialog(prev => ({ 
                        ...prev, 
                        data: { ...prev.data, is_active: checked } 
                      }))}
                    />
                    <Label className="text-zinc-300">Aktiv</Label>
                  </div>
                </>
              )}

              {/* Trip Form */}
              {editDialog.type === 'trip' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-zinc-300">Route</Label>
                      <Select 
                        value={(editDialog.data as TripData).route_id}
                        onValueChange={(value) => setEditDialog(prev => ({ 
                          ...prev, 
                          data: { ...prev.data, route_id: value } 
                        }))}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          {routes.map(r => (
                            <SelectItem key={r.id} value={r.id} className="text-white">{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-zinc-300">Bus</Label>
                      <Select 
                        value={(editDialog.data as TripData).bus_id}
                        onValueChange={(value) => setEditDialog(prev => ({ 
                          ...prev, 
                          data: { ...prev.data, bus_id: value } 
                        }))}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          {buses.filter(b => b.is_active).map(b => (
                            <SelectItem key={b.id} value={b.id} className="text-white">{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-zinc-300">Datum</Label>
                    <Input 
                      type="date"
                      value={(editDialog.data as TripData).departure_date || ''}
                      onChange={(e) => setEditDialog(prev => ({ 
                        ...prev, 
                        data: { ...prev.data, departure_date: e.target.value } 
                      }))}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-zinc-300">Abfahrt</Label>
                      <Input 
                        type="time"
                        value={(editDialog.data as TripData).departure_time || '08:00'}
                        onChange={(e) => setEditDialog(prev => ({ 
                          ...prev, 
                          data: { ...prev.data, departure_time: e.target.value } 
                        }))}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Ankunft</Label>
                      <Input 
                        type="time"
                        value={(editDialog.data as TripData).arrival_time || '18:00'}
                        onChange={(e) => setEditDialog(prev => ({ 
                          ...prev, 
                          data: { ...prev.data, arrival_time: e.target.value } 
                        }))}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Preis (€)</Label>
                      <Input 
                        type="number"
                        value={(editDialog.data as TripData).base_price || 0}
                        onChange={(e) => setEditDialog(prev => ({ 
                          ...prev, 
                          data: { ...prev.data, base_price: parseFloat(e.target.value) } 
                        }))}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={(editDialog.data as TripData).is_active}
                      onCheckedChange={(checked) => setEditDialog(prev => ({ 
                        ...prev, 
                        data: { ...prev.data, is_active: checked } 
                      }))}
                    />
                    <Label className="text-zinc-300">Aktiv</Label>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialog({ type: null, data: null, isNew: false })}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <X className="w-4 h-4 mr-2" />
              Abbrechen
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
