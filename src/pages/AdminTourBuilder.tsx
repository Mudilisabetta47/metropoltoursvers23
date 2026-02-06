import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Save, Eye, Globe, Settings, Palmtree, MapPin, Calendar,
  Luggage, Scale, Check, ChevronRight, Loader2, AlertCircle, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTourBuilder, TourData } from "@/hooks/useTourBuilder";

// Tab Components
import TourBasicsTab from "@/components/admin/tour-builder/TourBasicsTab";
import TourInclusionsTab from "@/components/admin/tour-builder/TourInclusionsTab";
import TourTariffsTab from "@/components/admin/tour-builder/TourTariffsTab";
import TourDatesTab from "@/components/admin/tour-builder/TourDatesTab";
import TourRoutesTab from "@/components/admin/tour-builder/TourRoutesTab";
import TourLuggageTab from "@/components/admin/tour-builder/TourLuggageTab";
import TourLegalTab from "@/components/admin/tour-builder/TourLegalTab";
import TourSEOTab from "@/components/admin/tour-builder/TourSEOTab";

const tabs = [
  { id: 'basics', label: 'Basis', icon: Palmtree },
  { id: 'inclusions', label: 'Leistungen', icon: Check },
  { id: 'tariffs', label: 'Tarife', icon: Settings },
  { id: 'dates', label: 'Termine', icon: Calendar },
  { id: 'routes', label: 'Routen', icon: MapPin },
  { id: 'luggage', label: 'Gepäck', icon: Luggage },
  { id: 'legal', label: 'Rechtliches', icon: Scale },
  { id: 'seo', label: 'SEO & Publish', icon: Globe },
];

const AdminTourBuilder = () => {
  const { tourId } = useParams<{ tourId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  
  const {
    tour: currentTour,
    isLoading,
    isSaving,
    fetchTour,
    saveTour,
    createTour,
    publishTour,
    updateTourField,
    // Tariffs
    tariffs,
    createTariff,
    updateTariff,
    deleteTariff,
    // Dates
    dates,
    createDate,
    updateDate,
    deleteDate,
    // Routes
    routes,
    createRoute,
    updateRoute,
    deleteRoute,
    // Pickup Stops
    createPickupStop,
    updatePickupStop,
    deletePickupStop,
    // Luggage
    luggageAddons,
    createLuggageAddon,
    updateLuggageAddon,
    deleteLuggageAddon,
    // Inclusions
    inclusions,
    createInclusion,
    updateInclusion,
    deleteInclusion,
    // Legal
    legalSections,
    createLegalSection,
    updateLegalSection,
    deleteLegalSection,
    // Validation
    validationErrors,
    validateForPublish
  } = useTourBuilder(tourId);

  const [activeTab, setActiveTab] = useState('basics');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Load tour if editing
  useEffect(() => {
    if (tourId) {
      fetchTour();
    }
  }, [tourId, fetchTour]);

  // Create new tour on first save if no tourId
  const handleCreateNewTour = async () => {
    if (tourId || !currentTour) return;
    
    setIsCreating(true);
    try {
      const result = await createTour({
        destination: currentTour.destination || 'Neue Reise',
        location: currentTour.location || '',
        country: currentTour.country || 'Europa',
        duration_days: currentTour.duration_days || 7,
        price_from: currentTour.price_from || 299,
        departure_date: currentTour.departure_date || new Date().toISOString().split('T')[0],
        return_date: currentTour.return_date || new Date().toISOString().split('T')[0],
      });
      
      if (result.error) {
        toast({ 
          title: "Fehler beim Erstellen", 
          description: (result.error as Error).message,
          variant: "destructive" 
        });
      } else if (result.data) {
        toast({ title: "Reise erstellt!" });
        navigate(`/admin/tour-builder/${result.data.id}`, { replace: true });
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Access control
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
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
              Sie benötigen Admin-Rechte für den Tour-Builder.
            </p>
            <Button onClick={() => navigate("/auth")} className="bg-emerald-600 hover:bg-emerald-700">
              Anmelden
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    // If no tourId, create a new tour first
    if (!tourId) {
      await handleCreateNewTour();
      return;
    }
    
    const result = await saveTour({});
    if (result.error) {
      toast({ 
        title: "Fehler beim Speichern", 
        description: (result.error as Error).message,
        variant: "destructive" 
      });
    } else {
      toast({ title: "Reise gespeichert" });
      setHasUnsavedChanges(false);
    }
  };

  const handlePublish = async () => {
    const errors = validateForPublish();
    if (errors.length > 0) {
      toast({
        title: "Validierungsfehler",
        description: errors.join(", "),
        variant: "destructive"
      });
      return;
    }

    const result = await publishTour();
    if (result.error) {
      toast({ 
        title: "Fehler beim Veröffentlichen", 
        description: (result.error as Error).message,
        variant: "destructive" 
      });
    } else {
      toast({ title: "Reise veröffentlicht!" });
      navigate('/admin/cms');
    }
  };

  const handleFieldChange = (field: keyof TourData, value: unknown) => {
    updateTourField(field, value);
    setHasUnsavedChanges(true);
  };

  const getTabStatus = (tabId: string): 'complete' | 'incomplete' | 'error' => {
    const errors = validationErrors.filter(e => e.tab === tabId);
    if (errors.length > 0) return 'error';
    
    switch (tabId) {
      case 'basics':
        return currentTour?.destination && currentTour?.location ? 'complete' : 'incomplete';
      case 'tariffs':
        return tariffs.length > 0 ? 'complete' : 'incomplete';
      case 'dates':
        return dates.length > 0 ? 'complete' : 'incomplete';
      case 'routes':
        return routes.length > 0 ? 'complete' : 'incomplete';
      default:
        return 'incomplete';
    }
  };

  if (isLoading && tourId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/cms')}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
            <div className="h-6 w-px bg-zinc-700" />
            <div>
              <h1 className="text-lg font-bold">
                {tourId ? 'Reise bearbeiten' : 'Neue Reise erstellen'}
              </h1>
              {currentTour?.destination && (
                <p className="text-sm text-zinc-500">{currentTour.destination}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-amber-400 border-amber-400/50">
                Ungespeicherte Änderungen
              </Badge>
            )}
            
            {currentTour?.publish_status === 'published' && (
              <Badge className="bg-emerald-600">Veröffentlicht</Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/reisen/${currentTour?.slug || 'preview'}`, '_blank')}
              className="border-zinc-700"
              disabled={!currentTour?.slug}
            >
              <Eye className="w-4 h-4 mr-2" />
              Vorschau
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isCreating}
              className="border-zinc-700"
            >
              {(isSaving || isCreating) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {!tourId ? 'Reise erstellen' : 'Speichern'}
            </Button>
            
            <Button
              onClick={handlePublish}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Globe className="w-4 h-4 mr-2" />
              Veröffentlichen
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-zinc-900/50 border-r border-zinc-800 min-h-[calc(100vh-73px)] p-4">
          <nav className="space-y-1">
            {tabs.map((tab, index) => {
              const status = getTabStatus(tab.id);
              const Icon = tab.icon;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-600/20 text-emerald-400'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-xs">
                    {index + 1}
                  </span>
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {status === 'complete' && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                  {status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              );
            })}
          </nav>

          {/* Validation Summary */}
          {validationErrors.length > 0 && (
            <div className="mt-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.length} Fehler
              </div>
              <ul className="text-xs text-red-300 space-y-1">
                {validationErrors.slice(0, 3).map((err, i) => (
                  <li key={i}>• {err.message}</li>
                ))}
                {validationErrors.length > 3 && (
                  <li className="text-zinc-500">...und {validationErrors.length - 3} weitere</li>
                )}
              </ul>
            </div>
          )}
        </aside>

        {/* Tab Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl">
            {activeTab === 'basics' && (
              <TourBasicsTab
                tour={currentTour}
                onChange={handleFieldChange}
              />
            )}
            
            {activeTab === 'inclusions' && (
              <TourInclusionsTab
                tourId={currentTour?.id}
                inclusions={inclusions}
                onCreate={createInclusion}
                onUpdate={updateInclusion}
                onDelete={deleteInclusion}
              />
            )}
            
            {activeTab === 'tariffs' && (
              <TourTariffsTab
                tourId={currentTour?.id}
                tariffs={tariffs}
                onCreate={createTariff}
                onUpdate={updateTariff}
                onDelete={deleteTariff}
              />
            )}
            
            {activeTab === 'dates' && (
              <TourDatesTab
                tourId={currentTour?.id}
                dates={dates}
                tariffs={tariffs}
                onCreate={createDate}
                onUpdate={updateDate}
                onDelete={deleteDate}
              />
            )}
            
            {activeTab === 'routes' && (
              <TourRoutesTab
                tourId={currentTour?.id}
                routes={routes}
                onCreateRoute={createRoute}
                onUpdateRoute={updateRoute}
                onDeleteRoute={deleteRoute}
                onCreateStop={createPickupStop}
                onUpdateStop={updatePickupStop}
                onDeleteStop={deletePickupStop}
              />
            )}
            
            {activeTab === 'luggage' && (
              <TourLuggageTab
                tourId={currentTour?.id}
                tariffs={tariffs}
                addons={luggageAddons}
                onCreate={createLuggageAddon}
                onUpdate={updateLuggageAddon}
                onDelete={deleteLuggageAddon}
              />
            )}
            
            {activeTab === 'legal' && (
              <TourLegalTab
                tourId={currentTour?.id}
                sections={legalSections}
                onCreate={createLegalSection}
                onUpdate={updateLegalSection}
                onDelete={deleteLegalSection}
              />
            )}
            
            {activeTab === 'seo' && (
              <TourSEOTab
                tour={currentTour}
                onChange={handleFieldChange}
                validationErrors={validationErrors}
                onPublish={handlePublish}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminTourBuilder;
