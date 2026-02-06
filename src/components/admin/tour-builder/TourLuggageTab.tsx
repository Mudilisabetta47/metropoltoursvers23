import { useState } from "react";
import { TourTariff, TourLuggageAddon } from "@/hooks/useTourBuilder";
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
import { Luggage, Plus, Pencil, Trash2, Check, X, Scale, AlertTriangle } from "lucide-react";

interface TourLuggageTabProps {
  tourId?: string;
  tariffs: TourTariff[];
  addons: TourLuggageAddon[];
  onCreate: (data: Omit<TourLuggageAddon, 'id' | 'created_at'>) => Promise<{ error: Error | null }>;
  onUpdate: (id: string, data: Partial<TourLuggageAddon>) => Promise<{ error: Error | null }>;
  onDelete: (id: string) => Promise<{ error: Error | null }>;
}

const emptyAddon: Omit<TourLuggageAddon, 'id' | 'tour_id' | 'created_at'> = {
  name: '',
  description: '',
  price: 0,
  max_per_booking: 2,
  weight_limit_kg: 23,
  is_active: true,
};

const TourLuggageTab = ({ tourId, tariffs, addons, onCreate, onUpdate, onDelete }: TourLuggageTabProps) => {
  const [dialog, setDialog] = useState<{ open: boolean; addon: Partial<TourLuggageAddon> | null; isNew: boolean }>({
    open: false,
    addon: null,
    isNew: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!dialog.addon || !tourId) return;
    setIsSaving(true);

    try {
      if (dialog.isNew) {
        await onCreate({
          ...emptyAddon,
          ...dialog.addon,
          tour_id: tourId,
        });
      } else {
        const { id, ...updates } = dialog.addon;
        await onUpdate(id!, updates);
      }
      setDialog({ open: false, addon: null, isNew: false });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Dieses Gepäck-Add-on löschen?')) return;
    await onDelete(id);
  };

  const createDefaultAddons = async () => {
    if (!tourId) return;
    setIsSaving(true);

    try {
      const defaults = [
        { name: 'Zusätzlicher Koffer', description: 'Ein weiterer Koffer bis 23kg', price: 25, weight_limit_kg: 23, max_per_booking: 2 },
        { name: 'Übergepäck', description: 'Koffer bis 32kg (statt 23kg)', price: 15, weight_limit_kg: 32, max_per_booking: 1 },
        { name: 'Sperrgepäck', description: 'Fahrrad, Ski oder ähnliches', price: 35, weight_limit_kg: null, max_per_booking: 1 },
      ];

      for (const addon of defaults) {
        if (!addons.some(a => a.name === addon.name)) {
          await onCreate({
            ...emptyAddon,
            ...addon,
            tour_id: tourId,
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
          <h2 className="text-2xl font-bold mb-2">Gepäck</h2>
          <p className="text-zinc-500">Inklusives Gepäck je Tarif und buchbare Add-ons</p>
        </div>
        <Button
          onClick={() => setDialog({ open: true, addon: emptyAddon, isNew: true })}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add-on hinzufügen
        </Button>
      </div>

      {/* Included Luggage by Tariff */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Luggage className="w-5 h-5 text-emerald-400" />
            Inklusives Gepäck je Tarif
          </CardTitle>
          <CardDescription>Diese Gepäckregeln werden aus den Tarif-Einstellungen übernommen</CardDescription>
        </CardHeader>
        <CardContent>
          {tariffs.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <p className="text-amber-400 text-sm">
                Bitte erstellen Sie zuerst Tarife, um die Gepäckregeln zu definieren.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tariffs.sort((a, b) => a.sort_order - b.sort_order).map((tariff) => (
                <div
                  key={tariff.id}
                  className="p-4 bg-zinc-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={tariff.is_recommended ? 'bg-emerald-600' : 'bg-zinc-700'}>
                      {tariff.name}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-zinc-300">Handgepäck 8kg</span>
                    </div>
                    
                    {tariff.suitcase_included ? (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-zinc-300">
                          1 Koffer bis {tariff.suitcase_weight_kg || 20}kg
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-red-400" />
                        <span className="text-zinc-500">Kein Koffer inkl.</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Luggage Add-ons */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="w-5 h-5 text-blue-400" />
            Zusätzliches Gepäck (Add-ons)
          </CardTitle>
          <CardDescription>Gegen Aufpreis buchbare Gepäckoptionen</CardDescription>
        </CardHeader>
        <CardContent>
          {addons.length === 0 ? (
            <div className="text-center py-8">
              <Luggage className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-500 mb-4">Keine Gepäck-Add-ons definiert</p>
              <Button onClick={createDefaultAddons} disabled={isSaving} variant="outline" className="border-zinc-700">
                Standard-Add-ons erstellen
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg group"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Luggage className="w-6 h-6 text-blue-400" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{addon.name}</span>
                      <Badge className="bg-blue-600">+{addon.price}€</Badge>
                    </div>
                    {addon.description && (
                      <p className="text-sm text-zinc-500 mt-1">{addon.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                      {addon.weight_limit_kg && (
                        <div className="flex items-center gap-1">
                          <Scale className="w-3 h-3" />
                          max. {addon.weight_limit_kg}kg
                        </div>
                      )}
                      <div>
                        max. {addon.max_per_booking}x pro Buchung
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDialog({ open: true, addon, isNew: false })}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(addon.id)}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="py-4">
          <p className="text-blue-400 text-sm">
            💡 <strong>Hinweis:</strong> Die Gepäckkapazität im Bus ist begrenzt. 
            Kommunizieren Sie klare Limits, um Überladung zu vermeiden.
          </p>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => !open && setDialog({ open: false, addon: null, isNew: false })}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {dialog.isNew ? 'Gepäck-Add-on hinzufügen' : 'Gepäck-Add-on bearbeiten'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={dialog.addon?.name || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  addon: { ...prev.addon, name: e.target.value }
                }))}
                placeholder="z.B. Zusätzlicher Koffer"
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>

            <div>
              <Label>Beschreibung</Label>
              <Textarea
                value={dialog.addon?.description || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  addon: { ...prev.addon, description: e.target.value }
                }))}
                placeholder="z.B. Ein weiterer Koffer bis 23kg"
                className="bg-zinc-800 border-zinc-700 mt-1"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Preis (€) *</Label>
                <Input
                  type="number"
                  value={dialog.addon?.price || 0}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    addon: { ...prev.addon, price: parseFloat(e.target.value) || 0 }
                  }))}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label>Max. Gewicht (kg)</Label>
                <Input
                  type="number"
                  value={dialog.addon?.weight_limit_kg || ''}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    addon: { ...prev.addon, weight_limit_kg: parseInt(e.target.value) || null }
                  }))}
                  placeholder="Leer = kein Limit"
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label>Max. pro Buchung</Label>
                <Input
                  type="number"
                  value={dialog.addon?.max_per_booking || 2}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    addon: { ...prev.addon, max_per_booking: parseInt(e.target.value) || 2 }
                  }))}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialog({ open: false, addon: null, isNew: false })}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !dialog.addon?.name}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {dialog.isNew ? 'Hinzufügen' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TourLuggageTab;
