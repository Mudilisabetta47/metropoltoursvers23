import { useState } from "react";
import { Plus, Trash2, Edit2, Save, X, Star, Bed, UtensilsCrossed, Binoculars, Waves, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface TourExtra {
  id: string;
  tour_id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string;
  price: number;
  price_type: string;
  max_per_booking: number;
  is_active: boolean;
  sort_order: number;
}

interface TourExtrasTabProps {
  tourId?: string;
  extras: TourExtra[];
  onCreate: (data: Omit<TourExtra, 'id' | 'created_at'>) => Promise<{ error: unknown }>;
  onUpdate: (id: string, data: Partial<TourExtra>) => Promise<{ error: unknown }>;
  onDelete: (id: string) => Promise<{ error: unknown }>;
}

const CATEGORIES = [
  { value: 'accommodation', label: 'Unterkunft', icon: Bed },
  { value: 'meals', label: 'Verpflegung', icon: UtensilsCrossed },
  { value: 'excursion', label: 'Ausflug/Aktivität', icon: Binoculars },
  { value: 'comfort', label: 'Komfort/Upgrade', icon: Star },
  { value: 'beach', label: 'Strand/Pool', icon: Waves },
  { value: 'other', label: 'Sonstiges', icon: Package },
];

const PRICE_TYPES = [
  { value: 'per_person', label: 'pro Person' },
  { value: 'per_booking', label: 'pro Buchung' },
  { value: 'per_night', label: 'pro Nacht' },
  { value: 'per_person_night', label: 'pro Person/Nacht' },
];

const PRESET_EXTRAS = [
  { name: 'Einzelzimmerzuschlag', category: 'accommodation', icon: 'Bed', price: 120, price_type: 'per_person', description: 'Einzelzimmer statt Doppelzimmer', max_per_booking: 5 },
  { name: 'Meerblick-Zimmer', category: 'accommodation', icon: 'Waves', price: 80, price_type: 'per_person', description: 'Upgrade auf Zimmer mit Meerblick', max_per_booking: 5 },
  { name: 'Halbpension', category: 'meals', icon: 'UtensilsCrossed', price: 25, price_type: 'per_person_night', description: 'Abendessen zusätzlich zum Frühstück', max_per_booking: 10 },
  { name: 'All-Inclusive', category: 'meals', icon: 'UtensilsCrossed', price: 45, price_type: 'per_person_night', description: 'Alle Mahlzeiten und Getränke inklusive', max_per_booking: 10 },
  { name: 'Ausflugspaket', category: 'excursion', icon: 'Binoculars', price: 89, price_type: 'per_person', description: 'Geführte Tagesausflüge mit Eintrittskarten', max_per_booking: 10 },
  { name: 'Stadtrundfahrt', category: 'excursion', icon: 'Binoculars', price: 35, price_type: 'per_person', description: 'Geführte Stadtrundfahrt am Ankunftstag', max_per_booking: 10 },
  { name: 'Reiserücktrittsversicherung', category: 'other', icon: 'Star', price: 39, price_type: 'per_person', description: 'Schutz bei Stornierung bis 1 Tag vor Abreise', max_per_booking: 10 },
];

const getCategoryIcon = (category: string) => {
  const cat = CATEGORIES.find(c => c.value === category);
  if (!cat) return Star;
  return cat.icon;
};

const TourExtrasTab = ({ tourId, extras, onCreate, onUpdate, onDelete }: TourExtrasTabProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'accommodation',
    icon: 'Star',
    price: 0,
    price_type: 'per_person',
    max_per_booking: 1,
  });

  if (!tourId) {
    return (
      <div className="text-center py-12 text-zinc-500">
        Bitte speichern Sie die Reise zuerst, bevor Sie Zusatzleistungen hinzufügen.
      </div>
    );
  }

  const resetForm = () => {
    setForm({ name: '', description: '', category: 'accommodation', icon: 'Star', price: 0, price_type: 'per_person', max_per_booking: 1 });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name || form.price <= 0) {
      toast.error('Name und Preis sind Pflichtfelder');
      return;
    }

    const data = {
      tour_id: tourId,
      name: form.name,
      description: form.description || null,
      category: form.category,
      icon: form.icon,
      price: form.price,
      price_type: form.price_type,
      max_per_booking: form.max_per_booking,
      is_active: true,
      sort_order: extras.length,
    };

    const result = editingId
      ? await onUpdate(editingId, data)
      : await onCreate(data);

    if (result.error) {
      toast.error('Fehler beim Speichern');
    } else {
      toast.success(editingId ? 'Aktualisiert' : 'Hinzugefügt');
      resetForm();
    }
  };

  const handleEdit = (extra: TourExtra) => {
    setForm({
      name: extra.name,
      description: extra.description || '',
      category: extra.category,
      icon: extra.icon,
      price: extra.price,
      price_type: extra.price_type,
      max_per_booking: extra.max_per_booking,
    });
    setEditingId(extra.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    const result = await onDelete(id);
    if (result.error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Gelöscht');
    }
  };

  const handleAddPreset = async (preset: typeof PRESET_EXTRAS[0]) => {
    const result = await onCreate({
      tour_id: tourId,
      name: preset.name,
      description: preset.description,
      category: preset.category,
      icon: preset.icon,
      price: preset.price,
      price_type: preset.price_type,
      max_per_booking: preset.max_per_booking,
      is_active: true,
      sort_order: extras.length,
    });
    if (!result.error) toast.success(`${preset.name} hinzugefügt`);
  };

  const priceTypeLabel = (type: string) => PRICE_TYPES.find(t => t.value === type)?.label || type;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Zusatzleistungen / Upsells</h2>
        <p className="text-zinc-400 text-sm">Einzelzimmer, Meerblick, Ausflüge, Versicherungen etc.</p>
      </div>

      {/* Preset Quick-Add */}
      {extras.length === 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-300">Schnell hinzufügen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PRESET_EXTRAS.map((preset) => {
                const exists = extras.some(e => e.name === preset.name);
                return (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    disabled={exists}
                    onClick={() => handleAddPreset(preset)}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {preset.name} ({preset.price}€)
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Extras */}
      <div className="space-y-3">
        {extras.map((extra) => {
          const Icon = getCategoryIcon(extra.category);
          return (
            <Card key={extra.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{extra.name}</h4>
                      <p className="text-sm text-zinc-500">{extra.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-lg font-bold text-emerald-400">{extra.price}€</span>
                      <p className="text-xs text-zinc-500">{priceTypeLabel(extra.price_type)}</p>
                    </div>
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                      max {extra.max_per_booking}x
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400" onClick={() => handleEdit(extra)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => handleDelete(extra.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Form */}
      {isAdding ? (
        <Card className="bg-zinc-900 border-emerald-600/50">
          <CardContent className="p-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300">Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="z.B. Einzelzimmerzuschlag" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-300">Kategorie</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300">Preis (€) *</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-300">Preistyp</Label>
                <Select value={form.price_type} onValueChange={(v) => setForm({ ...form, price_type: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300">Max. pro Buchung</Label>
                <Input type="number" value={form.max_per_booking} onChange={(e) => setForm({ ...form, max_per_booking: parseInt(e.target.value) || 1 })} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-zinc-300">Beschreibung</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Kurze Beschreibung..." className="bg-zinc-800 border-zinc-700 text-white mt-1" rows={2} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Aktualisieren' : 'Hinzufügen'}
              </Button>
              <Button variant="outline" onClick={resetForm} className="border-zinc-700">
                <X className="w-4 h-4 mr-2" />
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setIsAdding(true)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
          <Plus className="w-4 h-4 mr-2" />
          Zusatzleistung hinzufügen
        </Button>
      )}
    </div>
  );
};

export default TourExtrasTab;
