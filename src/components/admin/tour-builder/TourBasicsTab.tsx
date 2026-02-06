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
import { Palmtree, MapPin, Image, Tag, Star, X, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TourBasicsTabProps {
  tour: TourData | null;
  onChange: (field: keyof TourData, value: unknown) => void;
}

const categories = [
  'Strandurlaub',
  'Städtereise',
  'Rundreise',
  'Aktivurlaub',
  'Kulturreise',
  'Wellness',
  'Familienurlaub'
];

const countries = [
  'Kroatien',
  'Slowenien',
  'Montenegro',
  'Bosnien-Herzegowina',
  'Serbien',
  'Albanien',
  'Nordmazedonien',
  'Kosovo',
  'Griechenland',
  'Italien',
  'Österreich'
];

const TourBasicsTab = ({ tour, onChange }: TourBasicsTabProps) => {
  const [newHighlight, setNewHighlight] = useState('');
  const [newTag, setNewTag] = useState('');

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Basis-Informationen</h2>
        <p className="text-zinc-500">Grundlegende Daten zur Reise</p>
      </div>

      {/* Main Info */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palmtree className="w-5 h-5 text-emerald-400" />
            Reiseziel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="destination">Reiseziel / Titel *</Label>
              <Input
                id="destination"
                value={tour?.destination || ''}
                onChange={(e) => onChange('destination', e.target.value)}
                placeholder="z.B. Kroatien"
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="location">Region / Ort *</Label>
              <Input
                id="location"
                value={tour?.location || ''}
                onChange={(e) => onChange('location', e.target.value)}
                placeholder="z.B. Dalmatien, Split"
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Land</Label>
              <Select 
                value={tour?.country || ''} 
                onValueChange={(v) => onChange('country', v)}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                  <SelectValue placeholder="Land auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Kategorie</Label>
              <Select 
                value={tour?.category || ''} 
                onValueChange={(v) => onChange('category', v)}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
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

          <div>
            <Label htmlFor="short_description">Kurzbeschreibung</Label>
            <Textarea
              id="short_description"
              value={tour?.short_description || ''}
              onChange={(e) => onChange('short_description', e.target.value)}
              placeholder="Kurze Beschreibung für Übersichten (max. 200 Zeichen)"
              className="bg-zinc-800 border-zinc-700 mt-1"
              rows={2}
              maxLength={200}
            />
            <p className="text-xs text-zinc-500 mt-1">
              {(tour?.short_description || '').length}/200 Zeichen
            </p>
          </div>

          <div>
            <Label htmlFor="description">Ausführliche Beschreibung</Label>
            <Textarea
              id="description"
              value={tour?.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Detaillierte Beschreibung der Reise..."
              className="bg-zinc-800 border-zinc-700 mt-1"
              rows={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Highlights */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="w-5 h-5 text-amber-400" />
            Highlights
          </CardTitle>
          <CardDescription>3-6 Bulletpoints für die Übersicht</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(tour?.highlights || []).map((highlight, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="bg-zinc-800 text-zinc-200 px-3 py-1.5 flex items-center gap-2"
              >
                {highlight}
                <button
                  onClick={() => removeHighlight(index)}
                  className="hover:text-red-400 transition-colors"
                >
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
              className="bg-zinc-800 border-zinc-700"
              onKeyDown={(e) => e.key === 'Enter' && addHighlight()}
            />
            <Button onClick={addHighlight} variant="outline" className="border-zinc-700">
              <Plus className="w-4 h-4 mr-2" />
              Hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Image className="w-5 h-5 text-blue-400" />
            Bilder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="hero_image">Hero-Bild URL</Label>
            <Input
              id="hero_image"
              value={tour?.hero_image_url || ''}
              onChange={(e) => onChange('hero_image_url', e.target.value)}
              placeholder="https://..."
              className="bg-zinc-800 border-zinc-700 mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="image_url">Vorschaubild URL</Label>
            <Input
              id="image_url"
              value={tour?.image_url || ''}
              onChange={(e) => onChange('image_url', e.target.value)}
              placeholder="https://..."
              className="bg-zinc-800 border-zinc-700 mt-1"
            />
          </div>

          {(tour?.hero_image_url || tour?.image_url) && (
            <div className="grid grid-cols-2 gap-4">
              {tour?.hero_image_url && (
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Hero-Vorschau</p>
                  <div className="aspect-video bg-zinc-800 rounded-lg overflow-hidden">
                    <img 
                      src={tour.hero_image_url} 
                      alt="Hero" 
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                  </div>
                </div>
              )}
              {tour?.image_url && (
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Vorschaubild</p>
                  <div className="aspect-video bg-zinc-800 rounded-lg overflow-hidden">
                    <img 
                      src={tour.image_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="w-5 h-5 text-purple-400" />
            Tags
          </CardTitle>
          <CardDescription>Schlagwörter für Filter und Suche</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(tour?.tags || []).map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline"
                className="border-zinc-700 text-zinc-300 px-3 py-1.5 flex items-center gap-2"
              >
                {tag}
                <button
                  onClick={() => removeTag(index)}
                  className="hover:text-red-400 transition-colors"
                >
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
              className="bg-zinc-800 border-zinc-700"
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
            />
            <Button onClick={addTag} variant="outline" className="border-zinc-700">
              <Plus className="w-4 h-4 mr-2" />
              Hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg">Einstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Aktiv</Label>
              <p className="text-xs text-zinc-500">Reise wird in Listen angezeigt</p>
            </div>
            <Switch
              checked={tour?.is_active ?? true}
              onCheckedChange={(v) => onChange('is_active', v)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Featured</Label>
              <p className="text-xs text-zinc-500">Wird auf der Startseite hervorgehoben</p>
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
