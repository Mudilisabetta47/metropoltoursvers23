import { TourData, ValidationError } from "@/hooks/useTourBuilder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, Search, AlertCircle, Check, ExternalLink, Eye, 
  Loader2, CheckCircle, XCircle
} from "lucide-react";

interface TourSEOTabProps {
  tour: TourData | null;
  onChange: (field: keyof TourData, value: unknown) => void;
  validationErrors: ValidationError[];
  onPublish: () => void;
}

const TourSEOTab = ({ tour, onChange, validationErrors, onPublish }: TourSEOTabProps) => {
  const generateSlug = () => {
    if (!tour?.destination) return;
    const slug = tour.destination
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    onChange('slug', slug);
  };

  const generateMetaTitle = () => {
    if (!tour?.destination) return;
    const title = `${tour.destination} Busreise | METROPOL TOURS`;
    onChange('meta_title', title);
  };

  const generateMetaDescription = () => {
    if (!tour?.destination || !tour?.location) return;
    const description = `Entdecken Sie ${tour.destination} mit METROPOL TOURS. Komfortable Busreise nach ${tour.location} mit All-Inclusive Paket. ✓ WLAN ✓ Klimaanlage ✓ Bequeme Sitze. Jetzt buchen!`;
    onChange('meta_description', description);
  };

  const validationGroups = {
    required: validationErrors.filter(e => e.severity === 'error'),
    warnings: validationErrors.filter(e => e.severity === 'warning'),
  };

  const isPublishable = validationGroups.required.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">SEO & Veröffentlichung</h2>
        <p className="text-zinc-500">Suchmaschinenoptimierung und finale Prüfung</p>
      </div>

      {/* URL / Slug */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-blue-400" />
            URL-Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>URL-Slug *</Label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1 flex items-center">
                <span className="px-3 py-2 bg-zinc-800 border border-r-0 border-zinc-700 rounded-l-md text-zinc-500 text-sm">
                  /reisen/
                </span>
                <Input
                  value={tour?.slug || ''}
                  onChange={(e) => onChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="kroatien-dalmatien"
                  className="bg-zinc-800 border-zinc-700 rounded-l-none"
                />
              </div>
              <Button
                variant="outline"
                onClick={generateSlug}
                className="border-zinc-700"
                disabled={!tour?.destination}
              >
                Generieren
              </Button>
            </div>
            {tour?.slug && (
              <p className="text-xs text-zinc-500 mt-2">
                Vorschau: metropol-tours.de/reisen/{tour.slug}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Meta Tags */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="w-5 h-5 text-emerald-400" />
            Meta-Tags
          </CardTitle>
          <CardDescription>Optimierung für Suchmaschinen (Google, Bing, etc.)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Meta-Titel</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateMetaTitle}
                className="h-6 text-xs"
                disabled={!tour?.destination}
              >
                Auto-Generieren
              </Button>
            </div>
            <Input
              value={tour?.meta_title || ''}
              onChange={(e) => onChange('meta_title', e.target.value)}
              placeholder="z.B. Kroatien Busreise | METROPOL TOURS"
              className="bg-zinc-800 border-zinc-700"
              maxLength={60}
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={`${(tour?.meta_title?.length || 0) > 55 ? 'text-amber-400' : 'text-zinc-500'}`}>
                {tour?.meta_title?.length || 0}/60 Zeichen
              </span>
              {(tour?.meta_title?.length || 0) > 55 && (
                <span className="text-amber-400">Titel wird möglicherweise abgeschnitten</span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Meta-Beschreibung</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateMetaDescription}
                className="h-6 text-xs"
                disabled={!tour?.destination || !tour?.location}
              >
                Auto-Generieren
              </Button>
            </div>
            <Textarea
              value={tour?.meta_description || ''}
              onChange={(e) => onChange('meta_description', e.target.value)}
              placeholder="Kurze Beschreibung für Suchergebnisse..."
              className="bg-zinc-800 border-zinc-700"
              rows={3}
              maxLength={160}
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={`${(tour?.meta_description?.length || 0) > 150 ? 'text-amber-400' : 'text-zinc-500'}`}>
                {tour?.meta_description?.length || 0}/160 Zeichen
              </span>
              {(tour?.meta_description?.length || 0) > 150 && (
                <span className="text-amber-400">Beschreibung wird möglicherweise abgeschnitten</span>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 mb-3">Google-Vorschau:</p>
            <div className="p-4 bg-white rounded-lg">
              <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                {tour?.meta_title || `${tour?.destination || 'Reiseziel'} | METROPOL TOURS`}
              </div>
              <div className="text-green-700 text-sm">
                metropol-tours.de/reisen/{tour?.slug || 'reiseziel'}
              </div>
              <div className="text-gray-600 text-sm mt-1">
                {tour?.meta_description || tour?.short_description || 'Keine Beschreibung verfügbar...'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <Card className={`border ${isPublishable ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {isPublishable ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            Veröffentlichungs-Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validationErrors.length === 0 ? (
            <div className="flex items-center gap-3 text-emerald-400">
              <Check className="w-5 h-5" />
              <span>Alle Anforderungen erfüllt – bereit zur Veröffentlichung!</span>
            </div>
          ) : (
            <div className="space-y-4">
              {validationGroups.required.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-400 mb-2">
                    ❌ Fehler (müssen behoben werden):
                  </p>
                  <ul className="space-y-1">
                    {validationGroups.required.map((err, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-red-300">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{err.message}</span>
                        <Badge variant="outline" className="text-xs border-red-500/50 text-red-400">
                          {err.tab}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validationGroups.warnings.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-amber-400 mb-2">
                    ⚠️ Warnungen (optional):
                  </p>
                  <ul className="space-y-1">
                    {validationGroups.warnings.map((err, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-amber-300">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{err.message}</span>
                        <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                          {err.tab}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publish Status */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tour?.publish_status === 'published' ? (
                <>
                  <Badge className="bg-emerald-600 text-white px-4 py-1">
                    <Globe className="w-4 h-4 mr-2" />
                    Veröffentlicht
                  </Badge>
                  {tour?.published_at && (
                    <span className="text-sm text-zinc-500">
                      seit {new Date(tour.published_at).toLocaleDateString('de-DE')}
                    </span>
                  )}
                </>
              ) : (
                <Badge variant="outline" className="border-zinc-600 text-zinc-400 px-4 py-1">
                  Entwurf
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              {tour?.slug && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`/reisen/${tour.slug}`, '_blank')}
                  className="border-zinc-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Vorschau
                </Button>
              )}
              
              <Button
                onClick={onPublish}
                disabled={!isPublishable}
                className={isPublishable ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-zinc-700'}
              >
                <Globe className="w-4 h-4 mr-2" />
                {tour?.publish_status === 'published' ? 'Aktualisieren' : 'Veröffentlichen'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TourSEOTab;
