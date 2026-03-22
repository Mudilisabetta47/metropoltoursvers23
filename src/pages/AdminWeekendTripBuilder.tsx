import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, MapPin, Calendar, Check, Globe, Image, FileText,
  Loader2, Bus, Clock, Ruler, Star, Plus, Trash2, Upload, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWeekendTripBuilder, ViaStop } from "@/hooks/useWeekendTripBuilder";
import AdminLayout from "@/components/admin/AdminLayout";

const tabs = [
  { id: 'basics', label: 'Basis', icon: Bus, color: 'bg-sky-500/15 text-sky-400' },
  { id: 'description', label: 'Beschreibung', icon: FileText, color: 'bg-emerald-500/15 text-emerald-400' },
  { id: 'inclusions', label: 'Leistungen', icon: Check, color: 'bg-blue-500/15 text-blue-400' },
  { id: 'stops', label: 'Haltestellen', icon: MapPin, color: 'bg-amber-500/15 text-amber-400' },
  { id: 'images', label: 'Bilder', icon: Image, color: 'bg-rose-500/15 text-rose-400' },
  { id: 'seo', label: 'SEO & Publish', icon: Globe, color: 'bg-green-500/15 text-green-400' },
];

const AdminWeekendTripBuilder = () => {
  const { tripId } = useParams<{ tripId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const {
    trip, isLoading, isSaving,
    fetchTrip, saveTrip, updateField, uploadImage,
  } = useWeekendTripBuilder(tripId);

  const [activeTab, setActiveTab] = useState('basics');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => { if (tripId) fetchTrip(); }, [tripId, fetchTrip]);

  const handleCreate = async () => {
    setIsCreating(true);
    const result = await saveTrip();
    if (!result.error && result.data) {
      navigate(`/admin/weekend-trip-builder/${result.data.id}`, { replace: true });
    }
    setIsCreating(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'preview' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, type);
    if (!url) return;
    if (type === 'hero') updateField('hero_image_url', url);
    else if (type === 'preview') updateField('image_url', url);
    else updateField('gallery_images', [...(trip.gallery_images || []), url]);
  };

  const generateSlug = (dest: string) =>
    dest.toLowerCase().replace(/\s+/g, '-').replace(/[äöüß]/g, c => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] || c)).replace(/[^a-z0-9-]/g, '');

  if (authLoading || isLoading) {
    return (
      <AdminLayout title="Laden...">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={tripId ? `${trip.destination || 'Wochenendtrip'} bearbeiten` : 'Neuer Wochenendtrip'}
      subtitle="Wochenendtrip-Daten verwalten"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/cms')} className="border-[#2a3040] text-zinc-400 hover:text-white hover:bg-[#1e2430]">
            <ArrowLeft className="w-4 h-4 mr-1.5" />Zurück
          </Button>
          {tripId ? (
            <Button onClick={saveTrip} disabled={isSaving} className="bg-sky-600 hover:bg-sky-700">
              <Save className="w-4 h-4 mr-1.5" />{isSaving ? 'Speichern...' : 'Speichern'}
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isCreating || !trip.destination} className="bg-sky-600 hover:bg-sky-700">
              <Plus className="w-4 h-4 mr-1.5" />{isCreating ? 'Erstellen...' : 'Trip erstellen'}
            </Button>
          )}
        </div>
      }
    >
      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-56 shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#1e2430] text-white shadow-lg'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1e2430]/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tab.color}`}>
                <tab.icon className="w-4 h-4" />
              </div>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* ─── BASICS ─── */}
          {activeTab === 'basics' && (
            <Card className="bg-[#1a1f2a] border-[#2a3040]">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Bus className="w-5 h-5 text-sky-400" />Basisdaten</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white text-xs">Reiseziel *</Label>
                    <Input value={trip.destination} onChange={e => { updateField('destination', e.target.value); if (!tripId && !trip.slug) updateField('slug', generateSlug(e.target.value)); }}
                      className="bg-[#151920] border-[#2a3040] mt-1" placeholder="z.B. Kopenhagen" />
                  </div>
                  <div>
                    <Label className="text-white text-xs">Slug *</Label>
                    <Input value={trip.slug} onChange={e => updateField('slug', e.target.value)}
                      className="bg-[#151920] border-[#2a3040] mt-1 font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white text-xs">Land</Label>
                    <Input value={trip.country} onChange={e => updateField('country', e.target.value)}
                      className="bg-[#151920] border-[#2a3040] mt-1" />
                  </div>
                  <div>
                    <Label className="text-white text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Fahrzeit</Label>
                    <Input value={trip.duration || ''} onChange={e => updateField('duration', e.target.value)}
                      className="bg-[#151920] border-[#2a3040] mt-1" placeholder="z.B. 7,5 Std." />
                  </div>
                  <div>
                    <Label className="text-white text-xs flex items-center gap-1"><Ruler className="w-3 h-3" />Distanz</Label>
                    <Input value={trip.distance || ''} onChange={e => updateField('distance', e.target.value)}
                      className="bg-[#151920] border-[#2a3040] mt-1" placeholder="z.B. 586 km" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white text-xs">Basispreis (€) *</Label>
                    <Input type="number" value={trip.base_price} onChange={e => updateField('base_price', parseFloat(e.target.value) || 0)}
                      className="bg-[#151920] border-[#2a3040] mt-1" />
                  </div>
                  <div>
                    <Label className="text-white text-xs">Abfahrtsort</Label>
                    <Input value={trip.departure_city} onChange={e => updateField('departure_city', e.target.value)}
                      className="bg-[#151920] border-[#2a3040] mt-1" />
                  </div>
                  <div>
                    <Label className="text-white text-xs">Abfahrtspunkt</Label>
                    <Input value={trip.departure_point || ''} onChange={e => updateField('departure_point', e.target.value)}
                      className="bg-[#151920] border-[#2a3040] mt-1" placeholder="z.B. ZOB Hamburg" />
                  </div>
                </div>
                <Separator className="bg-[#2a3040]" />
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={trip.is_active} onCheckedChange={v => updateField('is_active', v)} />
                    <Label className="text-sm text-zinc-300">Aktiv</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={trip.is_featured} onCheckedChange={v => updateField('is_featured', v)} />
                    <Label className="text-sm text-zinc-300">Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-zinc-500">Reihenfolge:</Label>
                    <Input type="number" value={trip.sort_order} onChange={e => updateField('sort_order', parseInt(e.target.value) || 0)}
                      className="bg-[#151920] border-[#2a3040] w-20 h-8 text-sm" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── DESCRIPTION ─── */}
          {activeTab === 'description' && (
            <Card className="bg-[#1a1f2a] border-[#2a3040]">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-400" />Beschreibung</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-white text-xs">Kurzbeschreibung</Label>
                  <Textarea value={trip.short_description || ''} onChange={e => updateField('short_description', e.target.value)}
                    className="bg-[#151920] border-[#2a3040] mt-1" rows={2} placeholder="Wird in der Kartenansicht angezeigt..." />
                </div>
                <div>
                  <Label className="text-white text-xs">Ausführliche Beschreibung</Label>
                  <Textarea value={trip.full_description || ''} onChange={e => updateField('full_description', e.target.value)}
                    className="bg-[#151920] border-[#2a3040] mt-1" rows={8} placeholder="Detaillierte Reisebeschreibung..." />
                </div>
                <div>
                  <Label className="text-white text-xs">Highlights (kommagetrennt)</Label>
                  <Input value={trip.highlights.join(', ')} onChange={e => updateField('highlights', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    className="bg-[#151920] border-[#2a3040] mt-1" placeholder="Nyhavn, Tivoli, Meerjungfrau" />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {trip.highlights.map((h, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />{h}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-white text-xs">Tags (kommagetrennt)</Label>
                  <Input value={trip.tags.join(', ')} onChange={e => updateField('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    className="bg-[#151920] border-[#2a3040] mt-1" placeholder="Städtereise, Kurztrip, Skandinavien" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── INCLUSIONS ─── */}
          {activeTab === 'inclusions' && (
            <div className="space-y-6">
              <Card className="bg-[#1a1f2a] border-[#2a3040]">
                <CardHeader><CardTitle className="text-white flex items-center gap-2"><Check className="w-5 h-5 text-blue-400" />Inklusive Leistungen</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {trip.inclusions.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <Input value={item} onChange={e => {
                        const updated = [...trip.inclusions];
                        updated[i] = e.target.value;
                        updateField('inclusions', updated);
                      }} className="bg-[#151920] border-[#2a3040] flex-1" />
                      <Button variant="ghost" size="sm" onClick={() => updateField('inclusions', trip.inclusions.filter((_, idx) => idx !== i))}
                        className="text-red-400/60 hover:text-red-400 h-8 w-8 p-0 shrink-0"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => updateField('inclusions', [...trip.inclusions, ''])}
                    className="border-[#2a3040] text-zinc-400 hover:text-white mt-2">
                    <Plus className="w-3.5 h-3.5 mr-1" />Leistung hinzufügen
                  </Button>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1f2a] border-[#2a3040]">
                <CardHeader><CardTitle className="text-white flex items-center gap-2"><X className="w-5 h-5 text-red-400" />Nicht enthalten</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {trip.not_included.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-400 shrink-0" />
                      <Input value={item} onChange={e => {
                        const updated = [...trip.not_included];
                        updated[i] = e.target.value;
                        updateField('not_included', updated);
                      }} className="bg-[#151920] border-[#2a3040] flex-1" />
                      <Button variant="ghost" size="sm" onClick={() => updateField('not_included', trip.not_included.filter((_, idx) => idx !== i))}
                        className="text-red-400/60 hover:text-red-400 h-8 w-8 p-0 shrink-0"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => updateField('not_included', [...trip.not_included, ''])}
                    className="border-[#2a3040] text-zinc-400 hover:text-white mt-2">
                    <Plus className="w-3.5 h-3.5 mr-1" />Eintrag hinzufügen
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── STOPS ─── */}
          {activeTab === 'stops' && (
            <Card className="bg-[#1a1f2a] border-[#2a3040]">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-amber-400" />Zustiegshaltestellen</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-[#151920] rounded-lg p-4 border border-[#2a3040]">
                  <div className="flex items-center gap-2 text-sm text-zinc-300 mb-1">
                    <Bus className="w-4 h-4 text-sky-400" />
                    <strong>Startpunkt:</strong> {trip.departure_point || trip.departure_city}
                  </div>
                  <p className="text-xs text-zinc-500">Hauptabfahrtsort (in Basisdaten änderbar)</p>
                </div>
                <Separator className="bg-[#2a3040]" />
                <Label className="text-white text-xs">Zwischenhalte (Zustiegsmöglichkeiten)</Label>
                {(trip.via_stops || []).map((stop, i) => (
                  <div key={i} className="flex items-center gap-3 bg-[#151920] rounded-lg p-3 border border-[#2a3040]">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="grid grid-cols-3 gap-3 flex-1">
                      <Input value={stop.city} onChange={e => {
                        const updated = [...trip.via_stops];
                        updated[i] = { ...stop, city: e.target.value };
                        updateField('via_stops', updated);
                      }} className="bg-[#1a1f2a] border-[#2a3040]" placeholder="Stadt" />
                      <Input value={stop.name} onChange={e => {
                        const updated = [...trip.via_stops];
                        updated[i] = { ...stop, name: e.target.value };
                        updateField('via_stops', updated);
                      }} className="bg-[#1a1f2a] border-[#2a3040]" placeholder="Haltestelle" />
                      <div className="flex items-center gap-2">
                        <Input type="number" value={stop.surcharge} onChange={e => {
                          const updated = [...trip.via_stops];
                          updated[i] = { ...stop, surcharge: parseFloat(e.target.value) || 0 };
                          updateField('via_stops', updated);
                        }} className="bg-[#1a1f2a] border-[#2a3040]" placeholder="Aufpreis €" />
                        <Button variant="ghost" size="sm" onClick={() => updateField('via_stops', trip.via_stops.filter((_, idx) => idx !== i))}
                          className="text-red-400/60 hover:text-red-400 h-8 w-8 p-0 shrink-0"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => updateField('via_stops', [...(trip.via_stops || []), { city: '', name: '', surcharge: 0 }])}
                  className="border-[#2a3040] text-zinc-400 hover:text-white">
                  <Plus className="w-3.5 h-3.5 mr-1" />Haltestelle hinzufügen
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ─── IMAGES ─── */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              <Card className="bg-[#1a1f2a] border-[#2a3040]">
                <CardHeader><CardTitle className="text-white flex items-center gap-2"><Image className="w-5 h-5 text-rose-400" />Bilder</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  {/* Hero Image */}
                  <div>
                    <Label className="text-white text-xs mb-2 block">Hero-Bild (Detailseite)</Label>
                    {trip.hero_image_url ? (
                      <div className="relative rounded-lg overflow-hidden h-48">
                        <img src={trip.hero_image_url} alt="Hero" className="w-full h-full object-cover" />
                        <Button variant="ghost" size="sm" onClick={() => updateField('hero_image_url', null)}
                          className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 h-8 w-8 p-0">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-[#2a3040] rounded-lg cursor-pointer hover:border-sky-500/50 transition-colors">
                        <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                        <span className="text-sm text-zinc-500">Hero-Bild hochladen</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'hero')} />
                      </label>
                    )}
                    <div className="mt-2">
                      <Input value={trip.hero_image_url || ''} onChange={e => updateField('hero_image_url', e.target.value)}
                        className="bg-[#151920] border-[#2a3040] text-xs" placeholder="oder URL eingeben" />
                    </div>
                  </div>

                  {/* Preview Image */}
                  <div>
                    <Label className="text-white text-xs mb-2 block">Vorschau-Bild (Kartenansicht)</Label>
                    {trip.image_url ? (
                      <div className="relative rounded-lg overflow-hidden h-36 w-64">
                        <img src={trip.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <Button variant="ghost" size="sm" onClick={() => updateField('image_url', null)}
                          className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 h-8 w-8 p-0">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-36 w-64 border-2 border-dashed border-[#2a3040] rounded-lg cursor-pointer hover:border-sky-500/50 transition-colors">
                        <Upload className="w-6 h-6 text-zinc-500 mb-1" />
                        <span className="text-xs text-zinc-500">Vorschau-Bild hochladen</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'preview')} />
                      </label>
                    )}
                    <div className="mt-2">
                      <Input value={trip.image_url || ''} onChange={e => updateField('image_url', e.target.value)}
                        className="bg-[#151920] border-[#2a3040] text-xs" placeholder="oder URL eingeben" />
                    </div>
                  </div>

                  {/* Gallery */}
                  <div>
                    <Label className="text-white text-xs mb-2 block">Galerie</Label>
                    <div className="grid grid-cols-4 gap-3">
                      {(trip.gallery_images || []).map((url, i) => (
                        <div key={i} className="relative rounded-lg overflow-hidden h-24">
                          <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                          <Button variant="ghost" size="sm" onClick={() => updateField('gallery_images', trip.gallery_images.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 bg-black/50 text-white hover:bg-black/70 h-6 w-6 p-0">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-[#2a3040] rounded-lg cursor-pointer hover:border-sky-500/50 transition-colors">
                        <Plus className="w-5 h-5 text-zinc-500" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'gallery')} />
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── SEO ─── */}
          {activeTab === 'seo' && (
            <Card className="bg-[#1a1f2a] border-[#2a3040]">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Globe className="w-5 h-5 text-green-400" />SEO & Publishing</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-white text-xs">Meta-Titel</Label>
                  <Input value={trip.meta_title || ''} onChange={e => updateField('meta_title', e.target.value)}
                    className="bg-[#151920] border-[#2a3040] mt-1" placeholder={`Wochenendtrip nach ${trip.destination} | METROPOL TOURS`} />
                  <p className="text-xs text-zinc-500 mt-1">{(trip.meta_title || '').length}/60 Zeichen</p>
                </div>
                <div>
                  <Label className="text-white text-xs">Meta-Beschreibung</Label>
                  <Textarea value={trip.meta_description || ''} onChange={e => updateField('meta_description', e.target.value)}
                    className="bg-[#151920] border-[#2a3040] mt-1" rows={3} placeholder="Entdecken Sie..." />
                  <p className="text-xs text-zinc-500 mt-1">{(trip.meta_description || '').length}/160 Zeichen</p>
                </div>
                <Separator className="bg-[#2a3040]" />
                <div className="bg-[#151920] rounded-lg p-4 border border-[#2a3040]">
                  <p className="text-xs text-zinc-500 mb-2">Google-Vorschau</p>
                  <p className="text-blue-400 text-sm font-medium truncate">
                    {trip.meta_title || `Wochenendtrip nach ${trip.destination}`}
                  </p>
                  <p className="text-green-400 text-xs truncate mt-0.5">
                    metropoltours.de/wochenendtrips/{trip.slug}
                  </p>
                  <p className="text-zinc-400 text-xs mt-1 line-clamp-2">
                    {trip.meta_description || trip.short_description || 'Entdecken Sie...'}
                  </p>
                </div>
                <Separator className="bg-[#2a3040]" />
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={trip.is_active} onCheckedChange={v => updateField('is_active', v)} />
                    <Label className="text-sm text-zinc-300">Veröffentlicht</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={trip.is_featured} onCheckedChange={v => updateField('is_featured', v)} />
                    <Label className="text-sm text-zinc-300">Featured auf Startseite</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWeekendTripBuilder;
