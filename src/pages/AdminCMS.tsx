import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Palmtree, Briefcase, FileText, Users, Settings, LogOut,
  Plus, Pencil, Trash2, RefreshCw, Shield, ChevronRight, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  useAdminTours, 
  useAdminServices, 
  useAdminContent,
  PackageTour,
  ServiceType
} from "@/hooks/useCMS";
import { format } from "date-fns";
import { de } from "date-fns/locale";

type TabType = 'overview' | 'tours' | 'services' | 'content' | 'inquiries' | 'legacy';

const AdminCMS = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // CMS Hooks
  const { tours, isLoading: toursLoading, createTour, updateTour, deleteTour, fetchAll: fetchTours } = useAdminTours();
  const { services, isLoading: servicesLoading, createService, updateService, deleteService, fetchAll: fetchServices } = useAdminServices();
  const { content, isLoading: contentLoading, fetchAll: fetchContent } = useAdminContent();
  
  // Dialog states
  const [tourDialog, setTourDialog] = useState<{ open: boolean; tour: Partial<PackageTour> | null; isNew: boolean }>({
    open: false, tour: null, isNew: false
  });
  const [serviceDialog, setServiceDialog] = useState<{ open: boolean; service: Partial<ServiceType> | null; isNew: boolean }>({
    open: false, service: null, isNew: false
  });
  const [isSaving, setIsSaving] = useState(false);

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
              Sie benötigen Admin-Rechte für das CMS.
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
    { id: 'overview' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tours' as TabType, label: 'Pauschalreisen', icon: Palmtree },
    { id: 'services' as TabType, label: 'Reisearten', icon: Briefcase },
    { id: 'content' as TabType, label: 'CMS Inhalte', icon: FileText },
    { id: 'inquiries' as TabType, label: 'Anfragen', icon: Users, external: true },
    { id: 'legacy' as TabType, label: 'System', icon: Settings, external: true },
  ];

  const handleSaveTour = async () => {
    if (!tourDialog.tour) return;
    setIsSaving(true);

    try {
      if (tourDialog.isNew) {
        const { error } = await createTour(tourDialog.tour as Omit<PackageTour, 'id' | 'created_at' | 'updated_at'>);
        if (error) throw error;
        toast({ title: "Reise erfolgreich erstellt" });
      } else {
        const { id, ...updates } = tourDialog.tour;
        const { error } = await updateTour(id!, updates);
        if (error) throw error;
        toast({ title: "Reise erfolgreich aktualisiert" });
      }
      setTourDialog({ open: false, tour: null, isNew: false });
    } catch (error) {
      console.error('Error saving tour:', error);
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTour = async (id: string) => {
    if (!confirm('Diese Reise wirklich löschen?')) return;
    
    const { error } = await deleteTour(id);
    if (error) {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
    } else {
      toast({ title: "Reise gelöscht" });
    }
  };

  const handleSaveService = async () => {
    if (!serviceDialog.service) return;
    setIsSaving(true);

    try {
      if (serviceDialog.isNew) {
        const { error } = await createService(serviceDialog.service as Omit<ServiceType, 'id' | 'created_at' | 'updated_at'>);
        if (error) throw error;
        toast({ title: "Service erfolgreich erstellt" });
      } else {
        const { id, ...updates } = serviceDialog.service;
        const { error } = await updateService(id!, updates);
        if (error) throw error;
        toast({ title: "Service erfolgreich aktualisiert" });
      }
      setServiceDialog({ open: false, service: null, isNew: false });
    } catch (error) {
      console.error('Error saving service:', error);
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Diesen Service wirklich löschen?')) return;
    
    const { error } = await deleteService(id);
    if (error) {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
    } else {
      toast({ title: "Service gelöscht" });
    }
  };

  const newTourTemplate: Partial<PackageTour> = {
    destination: '',
    location: '',
    country: 'Europa',
    duration_days: 7,
    price_from: 299,
    image_url: '',
    highlights: [],
    description: '',
    itinerary: [],
    included_services: [],
    departure_date: format(new Date(), 'yyyy-MM-dd'),
    return_date: format(new Date(), 'yyyy-MM-dd'),
    max_participants: 45,
    current_participants: 0,
    is_featured: false,
    is_active: true,
    discount_percent: 0
  };

  const newServiceTemplate: Partial<ServiceType> = {
    name: '',
    slug: '',
    description: '',
    icon: 'Users',
    highlight: '',
    features: [],
    is_active: true,
    sort_order: services.length + 1
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm">METROPOL CMS</h1>
              <p className="text-xs text-zinc-500">Content Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'inquiries') {
                  navigate('/admin/inquiries');
                } else if (item.id === 'legacy') {
                  navigate('/admin/dashboard');
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                activeTab === item.id 
                  ? 'bg-emerald-600/20 text-emerald-400' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.external && <ChevronRight className="w-4 h-4 ml-auto" />}
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
                <p className="text-zinc-500">Übersicht über alle CMS-Inhalte</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                      <Palmtree className="w-4 h-4" />
                      Pauschalreisen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-400">{tours.length}</div>
                    <p className="text-xs text-zinc-500">{tours.filter(t => t.is_active).length} aktiv</p>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Reisearten
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-400">{services.length}</div>
                    <p className="text-xs text-zinc-500">{services.filter(s => s.is_active).length} aktiv</p>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      CMS Blöcke
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-400">{content.length}</div>
                    <p className="text-xs text-zinc-500">Textinhalte</p>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Featured
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-400">{tours.filter(t => t.is_featured).length}</div>
                    <p className="text-xs text-zinc-500">Hervorgehobene Reisen</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Neueste Reisen
                      <Button size="sm" variant="outline" onClick={() => setActiveTab('tours')} className="border-zinc-700">
                        Alle anzeigen
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {tours.slice(0, 5).map(tour => (
                        <div key={tour.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                          <div>
                            <div className="font-medium text-white">{tour.destination}</div>
                            <div className="text-xs text-zinc-500">{tour.location}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={tour.is_active ? 'bg-emerald-600' : 'bg-zinc-600'}>
                              {tour.is_active ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                            <span className="text-emerald-400 font-medium">ab {tour.price_from}€</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Reisearten
                      <Button size="sm" variant="outline" onClick={() => setActiveTab('services')} className="border-zinc-700">
                        Alle anzeigen
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {services.map(service => (
                        <div key={service.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                          <div>
                            <div className="font-medium text-white">{service.name}</div>
                            <div className="text-xs text-zinc-500">{service.highlight}</div>
                          </div>
                          <Badge className={service.is_active ? 'bg-blue-600' : 'bg-zinc-600'}>
                            {service.is_active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Tours Tab */}
          {activeTab === 'tours' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Pauschalreisen</h2>
                  <p className="text-zinc-500">Verwalten Sie alle Reiseangebote</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fetchTours()}
                    className="border-zinc-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Aktualisieren
                  </Button>
                  <Button 
                    onClick={() => setTourDialog({ open: true, tour: newTourTemplate, isNew: true })}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Neue Reise
                  </Button>
                </div>
              </div>

              <Card className="bg-zinc-900 border-zinc-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Reiseziel</TableHead>
                      <TableHead className="text-zinc-400">Region</TableHead>
                      <TableHead className="text-zinc-400">Dauer</TableHead>
                      <TableHead className="text-zinc-400">Preis</TableHead>
                      <TableHead className="text-zinc-400">Datum</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                      <TableHead className="text-zinc-400 text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {toursLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                          Laden...
                        </TableCell>
                      </TableRow>
                    ) : tours.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                          Keine Reisen vorhanden
                        </TableCell>
                      </TableRow>
                    ) : (
                      tours.map((tour) => (
                        <TableRow key={tour.id} className="border-zinc-800">
                          <TableCell className="font-medium text-white">
                            <div className="flex items-center gap-2">
                              {tour.is_featured && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                              {tour.destination}
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-400">{tour.location}</TableCell>
                          <TableCell className="text-zinc-300">{tour.duration_days} Tage</TableCell>
                          <TableCell className="text-emerald-400 font-medium">ab {tour.price_from}€</TableCell>
                          <TableCell className="text-zinc-300">
                            {format(new Date(tour.departure_date), 'dd.MM.yyyy', { locale: de })}
                          </TableCell>
                          <TableCell>
                            <Badge className={tour.is_active ? 'bg-emerald-600' : 'bg-zinc-600'}>
                              {tour.is_active ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setTourDialog({ open: true, tour, isNew: false })}
                              className="text-zinc-400 hover:text-white"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteTour(tour.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Reisearten / Services</h2>
                  <p className="text-zinc-500">Verwalten Sie die Business-Services</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fetchServices()}
                    className="border-zinc-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Aktualisieren
                  </Button>
                  <Button 
                    onClick={() => setServiceDialog({ open: true, service: newServiceTemplate, isNew: true })}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Neuer Service
                  </Button>
                </div>
              </div>

              <Card className="bg-zinc-900 border-zinc-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Name</TableHead>
                      <TableHead className="text-zinc-400">Slug</TableHead>
                      <TableHead className="text-zinc-400">Icon</TableHead>
                      <TableHead className="text-zinc-400">Highlight</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                      <TableHead className="text-zinc-400 text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servicesLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                          Laden...
                        </TableCell>
                      </TableRow>
                    ) : services.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                          Keine Services vorhanden
                        </TableCell>
                      </TableRow>
                    ) : (
                      services.map((service) => (
                        <TableRow key={service.id} className="border-zinc-800">
                          <TableCell className="font-medium text-white">{service.name}</TableCell>
                          <TableCell className="text-zinc-400 font-mono text-sm">{service.slug}</TableCell>
                          <TableCell className="text-zinc-300">{service.icon}</TableCell>
                          <TableCell className="text-zinc-300">{service.highlight || '-'}</TableCell>
                          <TableCell>
                            <Badge className={service.is_active ? 'bg-blue-600' : 'bg-zinc-600'}>
                              {service.is_active ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setServiceDialog({ open: true, service, isNew: false })}
                              className="text-zinc-400 hover:text-white"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">CMS Inhalte</h2>
                  <p className="text-zinc-500">Bearbeiten Sie Texte und Überschriften</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fetchContent()}
                  className="border-zinc-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Aktualisieren
                </Button>
              </div>

              <div className="grid gap-4">
                {contentLoading ? (
                  <Card className="bg-zinc-900 border-zinc-800 p-8 text-center text-zinc-500">
                    Laden...
                  </Card>
                ) : content.length === 0 ? (
                  <Card className="bg-zinc-900 border-zinc-800 p-8 text-center text-zinc-500">
                    Keine Inhalte vorhanden
                  </Card>
                ) : (
                  content.map((item) => (
                    <Card key={item.id} className="bg-zinc-900 border-zinc-800">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span className="font-mono text-sm text-emerald-400">{item.section_key}</span>
                          <Badge className={item.is_active ? 'bg-emerald-600' : 'bg-zinc-600'}>
                            {item.is_active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-zinc-400 text-xs">Titel</Label>
                          <p className="text-white">{item.title || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-zinc-400 text-xs">Untertitel</Label>
                          <p className="text-zinc-300">{item.subtitle || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-zinc-400 text-xs">Inhalt</Label>
                          <p className="text-zinc-400 text-sm">{item.content || '-'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Tour Edit Dialog */}
      <Dialog open={tourDialog.open} onOpenChange={(open) => !open && setTourDialog({ open: false, tour: null, isNew: false })}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tourDialog.isNew ? 'Neue Reise erstellen' : 'Reise bearbeiten'}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Füllen Sie die Details für die Pauschalreise aus
            </DialogDescription>
          </DialogHeader>

          {tourDialog.tour && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reiseziel *</Label>
                  <Input
                    value={tourDialog.tour.destination || ''}
                    onChange={(e) => setTourDialog(prev => ({ ...prev, tour: { ...prev.tour!, destination: e.target.value } }))}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                    placeholder="z.B. Kroatien"
                  />
                </div>
                <div>
                  <Label>Region</Label>
                  <Input
                    value={tourDialog.tour.location || ''}
                    onChange={(e) => setTourDialog(prev => ({ ...prev, tour: { ...prev.tour!, location: e.target.value } }))}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                    placeholder="z.B. Dalmatinische Küste"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Dauer (Tage)</Label>
                  <Input
                    type="number"
                    value={tourDialog.tour.duration_days || 7}
                    onChange={(e) => setTourDialog(prev => ({ ...prev, tour: { ...prev.tour!, duration_days: parseInt(e.target.value) } }))}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                  />
                </div>
                <div>
                  <Label>Preis ab (€)</Label>
                  <Input
                    type="number"
                    value={tourDialog.tour.price_from || 0}
                    onChange={(e) => setTourDialog(prev => ({ ...prev, tour: { ...prev.tour!, price_from: parseFloat(e.target.value) } }))}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                  />
                </div>
                <div>
                  <Label>Rabatt (%)</Label>
                  <Input
                    type="number"
                    value={tourDialog.tour.discount_percent || 0}
                    onChange={(e) => setTourDialog(prev => ({ ...prev, tour: { ...prev.tour!, discount_percent: parseInt(e.target.value) } }))}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hinreise</Label>
                  <Input
                    type="date"
                    value={tourDialog.tour.departure_date || ''}
                    onChange={(e) => setTourDialog(prev => ({ ...prev, tour: { ...prev.tour!, departure_date: e.target.value } }))}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                  />
                </div>
                <div>
                  <Label>Rückreise</Label>
                  <Input
                    type="date"
                    value={tourDialog.tour.return_date || ''}
                    onChange={(e) => setTourDialog(prev => ({ ...prev, tour: { ...prev.tour!, return_date: e.target.value } }))}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Beschreibung</Label>
                <Textarea
                  value={tourDialog.tour.description || ''}
                  onChange={(e) => setTourDialog(prev => ({ ...prev, tour: { ...prev.tour!, description: e.target.value } }))}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label>Highlights (kommagetrennt)</Label>
                <Input
                  value={tourDialog.tour.highlights?.join(', ') || ''}
                  onChange={(e) => setTourDialog(prev => ({ ...prev, tour: { ...prev.tour!, highlights: e.target.value.split(',').map(h => h.trim()).filter(Boolean) } }))}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                  placeholder="Strand, Altstadt, Kulinarik"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={tourDialog.tour.is_active}
                    onCheckedChange={(checked) => setTourDialog(prev => ({ ...prev, tour: { ...prev.tour!, is_active: checked } }))}
                  />
                  <Label>Aktiv</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={tourDialog.tour.is_featured}
                    onCheckedChange={(checked) => setTourDialog(prev => ({ ...prev, tour: { ...prev.tour!, is_featured: checked } }))}
                  />
                  <Label>Hervorgehoben</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setTourDialog({ open: false, tour: null, isNew: false })} className="border-zinc-700">
              Abbrechen
            </Button>
            <Button onClick={handleSaveTour} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
              {isSaving ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Edit Dialog */}
      <Dialog open={serviceDialog.open} onOpenChange={(open) => !open && setServiceDialog({ open: false, service: null, isNew: false })}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{serviceDialog.isNew ? 'Neuen Service erstellen' : 'Service bearbeiten'}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Füllen Sie die Details für den Service aus
            </DialogDescription>
          </DialogHeader>

          {serviceDialog.service && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={serviceDialog.service.name || ''}
                  onChange={(e) => setServiceDialog(prev => ({ 
                    ...prev, 
                    service: { 
                      ...prev.service!, 
                      name: e.target.value,
                      slug: prev.service?.slug || e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[äöü]/g, c => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' }[c] || c))
                    } 
                  }))}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                  placeholder="z.B. Schulfahrten"
                />
              </div>

              <div>
                <Label>Slug</Label>
                <Input
                  value={serviceDialog.service.slug || ''}
                  onChange={(e) => setServiceDialog(prev => ({ ...prev, service: { ...prev.service!, slug: e.target.value } }))}
                  className="bg-zinc-800 border-zinc-700 mt-1 font-mono"
                  placeholder="schulfahrten"
                />
              </div>

              <div>
                <Label>Icon</Label>
                <Select 
                  value={serviceDialog.service.icon || 'Users'}
                  onValueChange={(value) => setServiceDialog(prev => ({ ...prev, service: { ...prev.service!, icon: value } }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="School">School</SelectItem>
                    <SelectItem value="Users">Users</SelectItem>
                    <SelectItem value="MapPin">MapPin</SelectItem>
                    <SelectItem value="Trophy">Trophy</SelectItem>
                    <SelectItem value="Plane">Plane</SelectItem>
                    <SelectItem value="PartyPopper">PartyPopper</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Beschreibung</Label>
                <Textarea
                  value={serviceDialog.service.description || ''}
                  onChange={(e) => setServiceDialog(prev => ({ ...prev, service: { ...prev.service!, description: e.target.value } }))}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label>Highlight</Label>
                <Input
                  value={serviceDialog.service.highlight || ''}
                  onChange={(e) => setServiceDialog(prev => ({ ...prev, service: { ...prev.service!, highlight: e.target.value } }))}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                  placeholder="z.B. Kinderfreundlich"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={serviceDialog.service.is_active}
                  onCheckedChange={(checked) => setServiceDialog(prev => ({ ...prev, service: { ...prev.service!, is_active: checked } }))}
                />
                <Label>Aktiv</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialog({ open: false, service: null, isNew: false })} className="border-zinc-700">
              Abbrechen
            </Button>
            <Button onClick={handleSaveService} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
              {isSaving ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Star icon component (was missing from imports)
const Star = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default AdminCMS;
