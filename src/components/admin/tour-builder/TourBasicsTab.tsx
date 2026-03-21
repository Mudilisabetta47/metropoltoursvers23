import { ExtendedPackageTour } from "@/hooks/useTourBuilder";

type TourData = ExtendedPackageTour;
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palmtree, Image, Tag, Star, X, Plus, Sparkles, Loader2, Wand2, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TourBasicsTabProps {
  tour: TourData | null;
  onChange: (field: keyof TourData, value: unknown) => void;
}

const categories = [
  'Strandurlaub', 'Städtereise', 'Rundreise', 'Aktivurlaub',
  'Kulturreise', 'Wellness', 'Familienurlaub'
];

const defaultCountries = [
  'Kroatien', 'Slowenien', 'Montenegro', 'Bosnien-Herzegowina',
  'Serbien', 'Albanien', 'Nordmazedonien', 'Kosovo',
  'Griechenland', 'Italien', 'Österreich', 'Deutschland',
  'Spanien', 'Portugal', 'Frankreich', 'Niederlande', 'Belgien',
  'Schweiz', 'Ungarn', 'Tschechien', 'Polen', 'Türkei'
];

const sanitizePath = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'new';

const TourBasicsTab = ({ tour, onChange }: TourBasicsTabProps) => {
  const [newHighlight, setNewHighlight] = useState('');
  const [newTag, setNewTag] = useState('');
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const { toast } = useToast();
  const heroInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File, type: 'hero' | 'preview') => {
    setUploading(type);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${type}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const path = `tours/${tour?.destination || 'new'}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tour-images')
        .upload(path, file, { contentType: file.type, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('tour-images').getPublicUrl(path);
      const field = type === 'hero' ? 'hero_image_url' : 'image_url';
      onChange(field, urlData.publicUrl);
      toast({ title: 'Bild hochgeladen!' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload fehlgeschlagen', variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  const addHighlight = () => {
    if (newHighlight.trim()) {
      const current = tour?.highlights || [];
      onChange('highlights', [...current, newHighlight.trim()]);
      setNewHighlight('');
    }
  };

  const removeHighlight = (index: number) => {
    const current = tour?.highlights || [];
    onChange('highlights', current.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim()) {
      const current = tour?.tags || [];
      onChange('tags', [...current, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    const current = tour?.tags || [];
    onChange('tags', current.filter((_, i) => i !== index));
  };

  const generateWithAI = async (type: 'short' | 'full' | 'meta_description') => {
    if (!tour?.destination) {
      toast({ title: "Bitte zuerst ein Reiseziel eingeben", variant: "destructive" });
      return;
    }
    setAiLoading(type);
    try {
      const { data, error } = await supabase.functions.invoke('generate-tour-description', {
        body: {
          destination: tour.destination,
          location: tour.location || '',
          country: tour.country || '',
          category: tour.category || '',
          highlights: tour.highlights || [],
          duration_days: tour.duration_days || 7,
          type,
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const text = data.text;
      if (type === 'short') onChange('short_description', text);
      else if (type === 'meta_description') onChange('meta_description', text);
      else onChange('description', text);

      toast({ title: "✨ KI-Text generiert!" });
    } catch (e) {
      console.error(e);
      toast({ title: "Fehler bei KI-Generierung", description: (e as Error).message, variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1 text-white">
          Basis-Informationen
        </h2>
        <p className="text-zinc-400">Grundlegende Daten zur Reise</p>
      </div>

      {/* Main Info */}
      <Card className="bg-zinc-900/80 border-zinc-700/50 backdrop-blur-sm shadow-lg shadow-black/20">
        <CardHeader className="border-b border-zinc-800/50 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Palmtree className="w-4 h-4 text-emerald-400" />
            </div>
            Reiseziel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="destination" className="text-zinc-300 text-sm font-medium">Reiseziel / Titel *</Label>
              <Input
                id="destination"
                value={tour?.destination || ''}
                onChange={(e) => onChange('destination', e.target.value)}
                placeholder="z.B. Kroatien"
                className="bg-zinc-800/60 border-zinc-600/50 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-zinc-300 text-sm font-medium">Region / Ort *</Label>
              <Input
                id="location"
                value={tour?.location || ''}
                onChange={(e) => onChange('location', e.target.value)}
                placeholder="z.B. Dalmatien, Split"
                className="bg-zinc-800/60 border-zinc-600/50 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-zinc-300 text-sm font-medium">Land</Label>
              <Input
                id="country"
                list="country-suggestions"
                value={tour?.country || ''}
                onChange={(e) => onChange('country', e.target.value)}
                placeholder="Land eingeben oder auswählen..."
                className="bg-zinc-800/60 border-zinc-600/50 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-white placeholder:text-zinc-500"
              />
              <datalist id="country-suggestions">
                {defaultCountries.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-zinc-300 text-sm font-medium">Kategorie</Label>
              <Select value={tour?.category || ''} onValueChange={(v) => onChange('category', v)}>
                <SelectTrigger className="bg-zinc-800/60 border-zinc-600/50 text-white">
                  <SelectValue placeholder="Kategorie auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="short_description" className="text-zinc-300 text-sm font-medium">Kurzbeschreibung</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateWithAI('short')}
                disabled={aiLoading === 'short'}
                className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1.5"
              >
                {aiLoading === 'short' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                KI generieren
              </Button>
            </div>
            <Textarea
              id="short_description"
              value={tour?.short_description || ''}
              onChange={(e) => onChange('short_description', e.target.value)}
              placeholder="Kurze Beschreibung für Übersichten (max. 200 Zeichen)"
              className="bg-zinc-800/60 border-zinc-600/50 focus:border-emerald-500/50 text-white placeholder:text-zinc-500"
              rows={2}
              maxLength={200}
            />
            <p className="text-xs text-zinc-500">
              {(tour?.short_description || '').length}/200 Zeichen
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-zinc-300 text-sm font-medium">Ausführliche Beschreibung</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateWithAI('full')}
                disabled={aiLoading === 'full'}
                className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1.5"
              >
                {aiLoading === 'full' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3" />
                )}
                KI-Beschreibung
              </Button>
            </div>
            <Textarea
              id="description"
              value={tour?.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Detaillierte Beschreibung der Reise..."
              className="bg-zinc-800/60 border-zinc-600/50 focus:border-emerald-500/50 text-white placeholder:text-zinc-500"
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      {/* Highlights */}
      <Card className="bg-zinc-900/80 border-zinc-700/50 backdrop-blur-sm shadow-lg shadow-black/20">
        <CardHeader className="border-b border-zinc-800/50 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-400" />
            </div>
            Highlights
          </CardTitle>
          <CardDescription className="text-zinc-500">3-6 Bulletpoints für die Übersicht</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-wrap gap-2">
            {(tour?.highlights || []).map((highlight, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-amber-500/20 text-amber-100 px-3 py-1.5 flex items-center gap-2 border border-amber-500/30"
              >
                {highlight}
                <button onClick={() => removeHighlight(index)} className="hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newHighlight}
              onChange={(e) => setNewHighlight(e.target.value)}
              placeholder="z.B. Kristallklares Wasser"
              className="bg-zinc-800/60 border-zinc-600/50 text-white placeholder:text-zinc-500"
              onKeyDown={(e) => e.key === 'Enter' && addHighlight()}
            />
            <Button onClick={addHighlight} variant="outline" className="border-zinc-600/50 hover:bg-zinc-800 text-zinc-300">
              <Plus className="w-4 h-4 mr-2" />
              Hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card className="bg-zinc-900/80 border-zinc-700/50 backdrop-blur-sm shadow-lg shadow-black/20">
        <CardHeader className="border-b border-zinc-800/50 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Image className="w-4 h-4 text-blue-400" />
            </div>
            Bilder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {/* Hidden file inputs */}
          <input type="file" ref={heroInputRef} accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'hero')} />
          <input type="file" ref={previewInputRef} accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'preview')} />

          <div className="grid grid-cols-2 gap-4">
            {/* Hero Image */}
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm font-medium">Hero-Bild</Label>
              {tour?.hero_image_url ? (
                <div className="relative group">
                  <div className="aspect-video bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700/50">
                    <img src={tour.hero_image_url} alt="Hero" className="w-full h-full object-cover"
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => heroInputRef.current?.click()}
                      disabled={uploading === 'hero'}>
                      {uploading === 'hero' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Ändern
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onChange('hero_image_url', null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button onClick={() => heroInputRef.current?.click()}
                  disabled={uploading === 'hero'}
                  className="w-full aspect-video bg-zinc-800/60 border-2 border-dashed border-zinc-600/50 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-500/50 hover:bg-zinc-800 transition-colors cursor-pointer">
                  {uploading === 'hero' ? (
                    <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-zinc-500" />
                      <span className="text-xs text-zinc-500">Hero-Bild hochladen</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Preview Image */}
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm font-medium">Vorschaubild</Label>
              {tour?.image_url ? (
                <div className="relative group">
                  <div className="aspect-video bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700/50">
                    <img src={tour.image_url} alt="Preview" className="w-full h-full object-cover"
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => previewInputRef.current?.click()}
                      disabled={uploading === 'preview'}>
                      {uploading === 'preview' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Ändern
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onChange('image_url', null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button onClick={() => previewInputRef.current?.click()}
                  disabled={uploading === 'preview'}
                  className="w-full aspect-video bg-zinc-800/60 border-2 border-dashed border-zinc-600/50 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-500/50 hover:bg-zinc-800 transition-colors cursor-pointer">
                  {uploading === 'preview' ? (
                    <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-zinc-500" />
                      <span className="text-xs text-zinc-500">Vorschaubild hochladen</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* URL fallback inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">oder URL eingeben</Label>
              <Input value={tour?.hero_image_url || ''} onChange={(e) => onChange('hero_image_url', e.target.value)}
                placeholder="https://..." className="bg-zinc-800/60 border-zinc-600/50 text-white placeholder:text-zinc-500 text-xs h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">oder URL eingeben</Label>
              <Input value={tour?.image_url || ''} onChange={(e) => onChange('image_url', e.target.value)}
                placeholder="https://..." className="bg-zinc-800/60 border-zinc-600/50 text-white placeholder:text-zinc-500 text-xs h-8" />
            </div>
          </div>

          {/* Gallery Images */}
          <div className="space-y-3 pt-4 border-t border-zinc-800/50">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300 text-sm font-medium">Galerie-Bilder</Label>
              <span className="text-xs text-zinc-500">{(tour?.gallery_images || []).length} Bilder</span>
            </div>
            <input type="file" ref={galleryInputRef} accept="image/*" multiple className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (files.length === 0) return;
                setUploading('gallery');
                try {
                  const currentGallery = tour?.gallery_images || [];
                  const newUrls: string[] = [];
                  for (const file of files) {
                    const ext = file.name.split('.').pop() || 'jpg';
                    const fileName = `gallery-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
                    const path = `tours/${tour?.destination || 'new'}/${fileName}`;
                    const { error: uploadError } = await supabase.storage
                      .from('tour-images')
                      .upload(path, file, { contentType: file.type, cacheControl: '3600' });
                    if (uploadError) throw uploadError;
                    const { data: urlData } = supabase.storage.from('tour-images').getPublicUrl(path);
                    newUrls.push(urlData.publicUrl);
                  }
                  onChange('gallery_images', [...currentGallery, ...newUrls]);
                  toast({ title: `${newUrls.length} Bild(er) hochgeladen!` });
                } catch (error) {
                  console.error('Gallery upload error:', error);
                  toast({ title: 'Upload fehlgeschlagen', variant: 'destructive' });
                } finally {
                  setUploading(null);
                  if (galleryInputRef.current) galleryInputRef.current.value = '';
                }
              }} />
            
            <div className="grid grid-cols-4 gap-3">
              {(tour?.gallery_images || []).map((url, index) => (
                <div key={index} className="relative group aspect-video bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700/50">
                  <img src={url} alt={`Galerie ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="destructive" className="h-7 w-7 p-0"
                      onClick={() => {
                        const current = tour?.gallery_images || [];
                        onChange('gallery_images', current.filter((_, i) => i !== index));
                      }}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Add button */}
              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploading === 'gallery'}
                className="aspect-video bg-zinc-800/60 border-2 border-dashed border-zinc-600/50 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-blue-500/50 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {uploading === 'gallery' ? (
                  <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-zinc-500" />
                    <span className="text-[10px] text-zinc-500">Bilder hinzufügen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card className="bg-zinc-900/80 border-zinc-700/50 backdrop-blur-sm shadow-lg shadow-black/20">
        <CardHeader className="border-b border-zinc-800/50 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Tag className="w-4 h-4 text-purple-400" />
            </div>
            Tags
          </CardTitle>
          <CardDescription className="text-zinc-500">Schlagwörter für Filter und Suche</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-wrap gap-2">
            {(tour?.tags || []).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="border-purple-500/40 text-purple-200 px-3 py-1.5 flex items-center gap-2 bg-purple-500/10"
              >
                {tag}
                <button onClick={() => removeTag(index)} className="hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="z.B. Strand, Familie, Sommer"
              className="bg-zinc-800/60 border-zinc-600/50 text-white placeholder:text-zinc-500"
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
            />
            <Button onClick={addTag} variant="outline" className="border-zinc-600/50 hover:bg-zinc-800 text-zinc-300">
              <Plus className="w-4 h-4 mr-2" />
              Hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="bg-zinc-900/80 border-zinc-700/50 backdrop-blur-sm shadow-lg shadow-black/20">
        <CardHeader className="border-b border-zinc-800/50 pb-4">
          <CardTitle className="text-lg">Einstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
            <div>
              <Label className="text-zinc-200">Aktiv</Label>
              <p className="text-xs text-zinc-500 mt-0.5">Reise wird in Listen angezeigt</p>
            </div>
            <Switch
              checked={tour?.is_active ?? true}
              onCheckedChange={(v) => onChange('is_active', v)}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
            <div>
              <Label className="text-zinc-200">Featured</Label>
              <p className="text-xs text-zinc-500 mt-0.5">Wird auf der Startseite hervorgehoben</p>
            </div>
            <Switch
              checked={tour?.is_featured ?? false}
              onCheckedChange={(v) => onChange('is_featured', v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TourBasicsTab;
