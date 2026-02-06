import { useState } from "react";
import { TourTariff } from "@/hooks/useTourBuilder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Settings, Plus, Pencil, Trash2, Check, X, Briefcase, Star, Luggage, Armchair, RefreshCw } from "lucide-react";

interface TourTariffsTabProps {
  tourId?: string;
  tariffs: TourTariff[];
  onCreate: (data: Omit<TourTariff, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error: Error | null }>;
  onUpdate: (id: string, data: Partial<TourTariff>) => Promise<{ error: Error | null }>;
  onDelete: (id: string) => Promise<{ error: Error | null }>;
}

const defaultTariffs: Omit<TourTariff, 'id' | 'tour_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Basic',
    slug: 'basic',
    price_modifier: 0,
    hand_luggage_only: true,
    suitcase_included: false,
    suitcase_weight_kg: null,
    seat_reservation: false,
    is_refundable: false,
    cancellation_days: null,
    cancellation_fee_percent: 100,
    included_features: ['Handgepäck 8kg', 'Standard-Sitzplatz'],
    sort_order: 0,
    is_recommended: false,
    is_active: true,
  },
  {
    name: 'Smart',
    slug: 'smart',
    price_modifier: 15,
    hand_luggage_only: false,
    suitcase_included: true,
    suitcase_weight_kg: 20,
    seat_reservation: false,
    is_refundable: false,
    cancellation_days: null,
    cancellation_fee_percent: 80,
    included_features: ['Handgepäck 8kg', '1 Koffer bis 20kg', 'Standard-Sitzplatz'],
    sort_order: 1,
    is_recommended: false,
    is_active: true,
  },
  {
    name: 'Flex',
    slug: 'flex',
    price_modifier: 25,
    hand_luggage_only: false,
    suitcase_included: true,
    suitcase_weight_kg: 23,
    seat_reservation: false,
    is_refundable: true,
    cancellation_days: 3,
    cancellation_fee_percent: 50,
    included_features: ['Handgepäck 8kg', '1 Koffer bis 23kg', 'Standard-Sitzplatz', 'Umbuchung möglich'],
    sort_order: 2,
    is_recommended: true,
    is_active: true,
  },
  {
    name: 'Business',
    slug: 'business',
    price_modifier: 40,
    hand_luggage_only: false,
    suitcase_included: true,
    suitcase_weight_kg: 23,
    seat_reservation: true,
    is_refundable: true,
    cancellation_days: 1,
    cancellation_fee_percent: 0,
    included_features: ['Handgepäck 8kg', '1 Koffer bis 23kg', 'Sitzplatzreservierung', 'Kostenlose Stornierung bis 24h vorher', 'Priority Boarding'],
    sort_order: 3,
    is_recommended: false,
    is_active: true,
  },
];

const TourTariffsTab = ({ tourId, tariffs, onCreate, onUpdate, onDelete }: TourTariffsTabProps) => {
  const [dialog, setDialog] = useState<{ open: boolean; tariff: Partial<TourTariff> | null; isNew: boolean }>({
    open: false,
    tariff: null,
    isNew: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  const handleSave = async () => {
    if (!dialog.tariff || !tourId) return;
    setIsSaving(true);

    try {
      if (dialog.isNew) {
        await onCreate({
          ...dialog.tariff as Omit<TourTariff, 'id' | 'created_at' | 'updated_at'>,
          tour_id: tourId,
          sort_order: tariffs.length,
        });
      } else {
        const { id, ...updates } = dialog.tariff;
        await onUpdate(id!, updates);
      }
      setDialog({ open: false, tariff: null, isNew: false });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Diesen Tarif wirklich löschen?')) return;
    await onDelete(id);
  };

  const handleCreateDefaults = async () => {
    if (!tourId) return;
    if (tariffs.length > 0 && !confirm('Bestehende Tarife werden beibehalten. Standard-Tarife hinzufügen?')) return;
    
    setIsSaving(true);
    try {
      for (const tariff of defaultTariffs) {
        // Check if tariff with same slug exists
        if (!tariffs.some(t => t.slug === tariff.slug)) {
          await onCreate({
            ...tariff,
            tour_id: tourId,
          });
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && dialog.tariff) {
      const current = dialog.tariff.included_features || [];
      setDialog(prev => ({
        ...prev,
        tariff: {
          ...prev.tariff,
          included_features: [...current, newFeature.trim()]
        }
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    if (!dialog.tariff) return;
    const current = dialog.tariff.included_features || [];
    setDialog(prev => ({
      ...prev,
      tariff: {
        ...prev.tariff,
        included_features: current.filter((_, i) => i !== index)
      }
    }));
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
          <h2 className="text-2xl font-bold mb-2">Tarife</h2>
          <p className="text-zinc-500">Buchbare Tarifoptionen (Basic, Smart, Flex, Business)</p>
        </div>
        <div className="flex gap-2">
          {tariffs.length === 0 && (
            <Button
              variant="outline"
              onClick={handleCreateDefaults}
              disabled={isSaving}
              className="border-zinc-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Standard-Tarife erstellen
            </Button>
          )}
          <Button
            onClick={() => setDialog({ 
              open: true, 
              tariff: {
                name: '',
                slug: '',
                price_modifier: 0,
                hand_luggage_only: true,
                suitcase_included: false,
                seat_reservation: false,
                is_refundable: false,
                included_features: [],
                is_active: true,
                is_recommended: false,
              }, 
              isNew: true 
            })}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tarif hinzufügen
          </Button>
        </div>
      </div>

      {/* Tariff Cards */}
      {tariffs.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <Settings className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
            <p className="text-zinc-500 mb-4">Noch keine Tarife definiert</p>
            <Button onClick={handleCreateDefaults} disabled={isSaving}>
              Standard-Tarife erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tariffs.sort((a, b) => a.sort_order - b.sort_order).map((tariff) => (
            <Card 
              key={tariff.id} 
              className={`bg-zinc-900 border-zinc-800 relative overflow-hidden ${
                tariff.is_recommended ? 'ring-2 ring-emerald-500' : ''
              }`}
            >
              {tariff.is_recommended && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                  Empfohlen
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>{tariff.name}</span>
                  <Badge className={tariff.is_active ? 'bg-emerald-600' : 'bg-zinc-600'}>
                    {tariff.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {tariff.price_modifier > 0 ? `+${tariff.price_modifier}€` : 'Basispreis'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Luggage className="w-4 h-4 text-zinc-500" />
                    {tariff.hand_luggage_only ? (
                      <span className="text-zinc-400">Nur Handgepäck</span>
                    ) : (
                      <span className="text-emerald-400">
                        + Koffer bis {tariff.suitcase_weight_kg || 20}kg
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Armchair className="w-4 h-4 text-zinc-500" />
                    {tariff.seat_reservation ? (
                      <span className="text-emerald-400">Sitzplatzreservierung inkl.</span>
                    ) : (
                      <span className="text-zinc-400">Keine Sitzplatzreservierung</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <RefreshCw className="w-4 h-4 text-zinc-500" />
                    {tariff.is_refundable ? (
                      <span className="text-emerald-400">
                        Storno bis {tariff.cancellation_days || 1} Tag(e) vorher
                        {tariff.cancellation_fee_percent ? ` (${tariff.cancellation_fee_percent}% Gebühr)` : ' kostenlos'}
                      </span>
                    ) : (
                      <span className="text-red-400">Nicht erstattbar</span>
                    )}
                  </div>
                </div>

                {(tariff.included_features || []).length > 0 && (
                  <div className="pt-2 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-2">Enthaltene Leistungen:</p>
                    <ul className="space-y-1">
                      {(tariff.included_features || []).slice(0, 4).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                          <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {(tariff.included_features || []).length > 4 && (
                        <li className="text-xs text-zinc-500">
                          +{(tariff.included_features || []).length - 4} weitere
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialog({ open: true, tariff, isNew: false })}
                    className="flex-1 border-zinc-700"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tariff.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => !open && setDialog({ open: false, tariff: null, isNew: false })}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog.isNew ? 'Tarif hinzufügen' : 'Tarif bearbeiten'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={dialog.tariff?.name || ''}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    tariff: { 
                      ...prev.tariff, 
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-')
                    }
                  }))}
                  placeholder="z.B. Smart"
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label>Preis-Aufschlag (€)</Label>
                <Input
                  type="number"
                  value={dialog.tariff?.price_modifier || 0}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    tariff: { ...prev.tariff, price_modifier: parseFloat(e.target.value) || 0 }
                  }))}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                <div>
                  <Label>Nur Handgepäck</Label>
                  <p className="text-xs text-zinc-500">Kein Koffer inkludiert</p>
                </div>
                <Switch
                  checked={dialog.tariff?.hand_luggage_only ?? true}
                  onCheckedChange={(v) => setDialog(prev => ({
                    ...prev,
                    tariff: { 
                      ...prev.tariff, 
                      hand_luggage_only: v,
                      suitcase_included: !v
                    }
                  }))}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                <div>
                  <Label>Sitzplatzreservierung</Label>
                  <p className="text-xs text-zinc-500">Wunschplatz garantiert</p>
                </div>
                <Switch
                  checked={dialog.tariff?.seat_reservation ?? false}
                  onCheckedChange={(v) => setDialog(prev => ({
                    ...prev,
                    tariff: { ...prev.tariff, seat_reservation: v }
                  }))}
                />
              </div>
            </div>

            {!dialog.tariff?.hand_luggage_only && (
              <div>
                <Label>Koffer Gewichtslimit (kg)</Label>
                <Input
                  type="number"
                  value={dialog.tariff?.suitcase_weight_kg || 20}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    tariff: { ...prev.tariff, suitcase_weight_kg: parseInt(e.target.value) || 20 }
                  }))}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
            )}

            <div className="space-y-3 p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Erstattbar / Stornierbar</Label>
                  <p className="text-xs text-zinc-500">Kunde kann Buchung stornieren</p>
                </div>
                <Switch
                  checked={dialog.tariff?.is_refundable ?? false}
                  onCheckedChange={(v) => setDialog(prev => ({
                    ...prev,
                    tariff: { ...prev.tariff, is_refundable: v }
                  }))}
                />
              </div>

              {dialog.tariff?.is_refundable && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-700">
                  <div>
                    <Label>Storno möglich bis X Tage vorher</Label>
                    <Input
                      type="number"
                      value={dialog.tariff?.cancellation_days || 1}
                      onChange={(e) => setDialog(prev => ({
                        ...prev,
                        tariff: { ...prev.tariff, cancellation_days: parseInt(e.target.value) || 1 }
                      }))}
                      className="bg-zinc-800 border-zinc-700 mt-1"
                    />
                  </div>
                  <div>
                    <Label>Storno-Gebühr (%)</Label>
                    <Input
                      type="number"
                      value={dialog.tariff?.cancellation_fee_percent || 0}
                      onChange={(e) => setDialog(prev => ({
                        ...prev,
                        tariff: { ...prev.tariff, cancellation_fee_percent: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="0 = kostenlos"
                      className="bg-zinc-800 border-zinc-700 mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                <div>
                  <Label>Empfohlen</Label>
                  <p className="text-xs text-zinc-500">Als beste Option markieren</p>
                </div>
                <Switch
                  checked={dialog.tariff?.is_recommended ?? false}
                  onCheckedChange={(v) => setDialog(prev => ({
                    ...prev,
                    tariff: { ...prev.tariff, is_recommended: v }
                  }))}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                <div>
                  <Label>Aktiv</Label>
                  <p className="text-xs text-zinc-500">Buchbar anzeigen</p>
                </div>
                <Switch
                  checked={dialog.tariff?.is_active ?? true}
                  onCheckedChange={(v) => setDialog(prev => ({
                    ...prev,
                    tariff: { ...prev.tariff, is_active: v }
                  }))}
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <Label>Enthaltene Leistungen</Label>
              <div className="mt-2 space-y-2">
                {(dialog.tariff?.included_features || []).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-zinc-800 rounded-lg">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="flex-1 text-sm">{feature}</span>
                    <button
                      onClick={() => removeFeature(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="z.B. Handgepäck 8kg"
                  className="bg-zinc-800 border-zinc-700"
                  onKeyDown={(e) => e.key === 'Enter' && addFeature()}
                />
                <Button onClick={addFeature} variant="outline" className="border-zinc-700">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialog({ open: false, tariff: null, isNew: false })}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !dialog.tariff?.name}
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

export default TourTariffsTab;
