import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Save, Eye, Globe, Settings, Palmtree, MapPin, Calendar,
  Luggage, Scale, Check, ChevronRight, Loader2, AlertCircle, Shield, Star, Sparkles
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
import TourExtrasTab from "@/components/admin/tour-builder/TourExtrasTab";
import TourSEOTab from "@/components/admin/tour-builder/TourSEOTab";

const tabs = [
  { id: 'basics', label: 'Basis', icon: Palmtree, color: 'emerald' },
  { id: 'inclusions', label: 'Leistungen', icon: Check, color: 'blue' },
  { id: 'tariffs', label: 'Tarife', icon: Settings, color: 'violet' },
  { id: 'dates', label: 'Termine', icon: Calendar, color: 'amber' },
  { id: 'routes', label: 'Routen', icon: MapPin, color: 'rose' },
  { id: 'luggage', label: 'Gepäck', icon: Luggage, color: 'cyan' },
  { id: 'extras', label: 'Extras', icon: Star, color: 'orange' },
  { id: 'legal', label: 'Rechtliches', icon: Scale, color: 'slate' },
  { id: 'seo', label: 'SEO & Publish', icon: Globe, color: 'green' },
];

const colorMap: Record<string, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-400',
  blue: 'bg-blue-500/15 text-blue-400',
  violet: 'bg-violet-500/15 text-violet-400',
  amber: 'bg-amber-500/15 text-amber-400',
  rose: 'bg-rose-500/15 text-rose-400',
  cyan: 'bg-cyan-500/15 text-cyan-400',
  orange: 'bg-orange-500/15 text-orange-400',
  slate: 'bg-slate-500/15 text-slate-400',
  green: 'bg-green-500/15 text-green-400',
};

const AdminTourBuilder = () => {
  const { tourId } = useParams<{ tourId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  
  const {
    tour: currentTour, isLoading, isSaving, fetchTour, saveTour, createTour, publishTour,
    updateTourField, tariffs, createTariff, updateTariff, deleteTariff,
    dates, createDate, updateDate, deleteDate,
    routes, createRoute, updateRoute, deleteRoute,
    createPickupStop, updatePickupStop, deletePickupStop,
    luggageAddons, createLuggageAddon, updateLuggageAddon, deleteLuggageAddon,
    inclusions, createInclusion, updateInclusion, deleteInclusion,
    legalSections, createLegalSection, updateLegalSection, deleteLegalSection,
    extras, createExtra, updateExtra, deleteExtra,
    validationErrors, validateForPublish
  } = useTourBuilder(tourId);

  const [activeTab, setActiveTab] = useState('basics');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => { if (tourId) fetchTour(); }, [tourId, fetchTour]);

  const handleCreateNewTour = async () => {
    if (tourId || !currentTour) return;
    setIsCreating(true);
    try {
      const result = await createTour(currentTour);
      if (result.error) {
        toast({ title: "Fehler beim Erstellen", description: (result.error as Error).message, variant: "destructive" });
      } else if (result.data) {
        toast({ title: "Reise erstellt!" });
        setHasUnsavedChanges(false);
        navigate(`/admin/tour-builder/${result.data.id}`, { replace: true });
      }
    } finally { setIsCreating(false); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-zinc-500 text-sm">Laden...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 bg-zinc-900/80 border-zinc-700/50 backdrop-blur">
          <CardContent className="pt-6 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
            <h1 className="text-2xl font-bold mb-2 text-white">Admin-Zugang erforderlich</h1>
            <p className="text-zinc-400 mb-6">Sie benötigen Admin-Rechte für den Tour-Builder.</p>
            <Button onClick={() => navigate("/auth")} className="bg-emerald-600 hover:bg-emerald-700">Anmelden</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    if (!tourId) { await handleCreateNewTour(); return; }
    const result = await saveTour({});
    if (result.error) {
      toast({ title: "Fehler beim Speichern", description: (result.error as Error).message, variant: "destructive" });
    } else {
      toast({ title: "Reise gespeichert" });
      setHasUnsavedChanges(false);
    }
  };

  const handlePublish = async () => {
    const errors = validateForPublish();
    if (errors.length > 0) {
      toast({ title: "Validierungsfehler", description: errors.join(", "), variant: "destructive" });
      return;
    }
    const result = await publishTour();
    if (result.error) {
      toast({ title: "Fehler beim Veröffentlichen", description: (result.error as Error).message, variant: "destructive" });
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
      case 'basics': return currentTour?.destination && currentTour?.location ? 'complete' : 'incomplete';
      case 'tariffs': return tariffs.length > 0 ? 'complete' : 'incomplete';
      case 'dates': return dates.length > 0 ? 'complete' : 'incomplete';
      case 'routes': return routes.length > 0 ? 'complete' : 'incomplete';
      default: return 'incomplete';
    }
  };

  if (tourId && isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-zinc-500 text-sm">Reise wird geladen...</p>
        </div>
      </div>
    );
  }

  if (tourId && !currentTour) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <Card className="max-w-md w-full bg-zinc-900/80 border-zinc-700/50 backdrop-blur">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400" />
            <h2 className="text-xl font-semibold text-white">Reise konnte nicht geladen werden</h2>
            <p className="text-zinc-400 text-sm">Bitte öffnen Sie die Reise erneut aus dem Admin-Bereich.</p>
            <Button onClick={() => navigate('/admin/cms')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Zurück zur Übersicht
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/cms')}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
            <div className="h-5 w-px bg-zinc-800" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold">
                  {tourId ? 'Reise bearbeiten' : 'Neue Reise erstellen'}
                </h1>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> KI-unterstützt
                </Badge>
              </div>
              {currentTour?.destination && (
                <p className="text-xs text-zinc-500">{currentTour.destination}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-xs animate-pulse">
                Ungespeichert
              </Badge>
            )}
            {currentTour?.publish_status === 'published' && (
              <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs">
                Live
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/reisen/${currentTour?.slug || 'preview'}`, '_blank')}
              className="text-zinc-400 hover:text-white"
              disabled={!currentTour?.slug}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isCreating}
              className="border-zinc-700/50 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-200"
            >
              {(isSaving || isCreating) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
              {!tourId ? 'Erstellen' : 'Speichern'}
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isSaving}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
            >
              <Globe className="w-4 h-4 mr-1.5" />
              Veröffentlichen
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-60 bg-zinc-950 border-r border-zinc-800/50 min-h-[calc(100vh-57px)]">
          <div className="p-3 pt-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold px-3 mb-2">Schritte</p>
            <nav className="space-y-0.5">
              {tabs.map((tab, index) => {
                const status = getTabStatus(tab.id);
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                      isActive
                        ? 'bg-zinc-800/80 text-white shadow-sm'
                        : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                    }`}
                  >
                    <span className={`flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold transition-all ${
                      isActive
                        ? colorMap[tab.color]
                        : status === 'complete'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : status === 'error'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-zinc-800/60 text-zinc-600'
                    }`}>
                      {status === 'complete' && !isActive ? (
                        <Check className="w-3 h-3" />
                      ) : status === 'error' && !isActive ? (
                        <AlertCircle className="w-3 h-3" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="flex-1 text-left text-[13px]">{tab.label}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Validation Summary */}
          {validationErrors.length > 0 && (
            <div className="mx-3 mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 text-xs font-medium mb-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {validationErrors.length} Fehler
              </div>
              <ul className="text-[11px] text-red-300/80 space-y-1">
                {validationErrors.slice(0, 3).map((err, i) => (
                  <li key={i}>• {err.message}</li>
                ))}
                {validationErrors.length > 3 && (
                  <li className="text-zinc-600">+{validationErrors.length - 3} weitere</li>
                )}
              </ul>
            </div>
          )}
        </aside>

        {/* Tab Content */}
        <main className="flex-1 p-6 overflow-auto bg-zinc-950">
          {/* Tab Header */}
          {activeTabData && (
            <div className="max-w-4xl mb-1">
              <div className="flex items-center gap-2 text-[11px] text-zinc-600 mb-4">
                <span>Tour Builder</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-zinc-400">{activeTabData.label}</span>
              </div>
            </div>
          )}

          <div className="max-w-4xl">
            {activeTab === 'basics' && <TourBasicsTab tour={currentTour} onChange={handleFieldChange} />}
            {activeTab === 'inclusions' && (
              <TourInclusionsTab tourId={currentTour?.id} inclusions={inclusions}
                onCreate={createInclusion} onUpdate={updateInclusion} onDelete={deleteInclusion} />
            )}
            {activeTab === 'tariffs' && (
              <TourTariffsTab tourId={currentTour?.id} tariffs={tariffs}
                onCreate={createTariff} onUpdate={updateTariff} onDelete={deleteTariff} />
            )}
            {activeTab === 'dates' && (
              <TourDatesTab tourId={currentTour?.id} dates={dates} tariffs={tariffs}
                onCreate={createDate} onUpdate={updateDate} onDelete={deleteDate} />
            )}
            {activeTab === 'routes' && (
              <TourRoutesTab tourId={currentTour?.id} routes={routes}
                onCreateRoute={createRoute} onUpdateRoute={updateRoute} onDeleteRoute={deleteRoute}
                onCreateStop={createPickupStop} onUpdateStop={updatePickupStop} onDeleteStop={deletePickupStop} />
            )}
            {activeTab === 'luggage' && (
              <TourLuggageTab tourId={currentTour?.id} tariffs={tariffs} addons={luggageAddons}
                onCreate={createLuggageAddon} onUpdate={updateLuggageAddon} onDelete={deleteLuggageAddon} />
            )}
            {activeTab === 'extras' && (
              <TourExtrasTab tourId={currentTour?.id} extras={extras}
                onCreate={createExtra} onUpdate={updateExtra} onDelete={deleteExtra} />
            )}
            {activeTab === 'legal' && (
              <TourLegalTab tourId={currentTour?.id} sections={legalSections}
                onCreate={createLegalSection} onUpdate={updateLegalSection} onDelete={deleteLegalSection} />
            )}
            {activeTab === 'seo' && (
              <TourSEOTab tour={currentTour} onChange={handleFieldChange}
                validationErrors={validationErrors} onPublish={handlePublish} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminTourBuilder;
