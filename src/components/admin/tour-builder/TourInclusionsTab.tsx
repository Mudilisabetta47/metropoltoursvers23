import { useState } from "react";
import { TourInclusion } from "@/hooks/useTourBuilder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, X, Plus, Pencil, Trash2, GripVertical, Bus, Hotel, Utensils, Camera, Headphones, Shield, Heart, Plane } from "lucide-react";

interface TourInclusionsTabProps {
  tourId?: string;
  inclusions: TourInclusion[];
  onCreate: (data: Omit<TourInclusion, 'id' | 'created_at'>) => Promise<{ error: Error | null }>;
  onUpdate: (id: string, data: Partial<TourInclusion>) => Promise<{ error: Error | null }>;
  onDelete: (id: string) => Promise<{ error: Error | null }>;
}

const iconOptions = [
  { value: 'Check', label: 'Häkchen', icon: Check },
  { value: 'Bus', label: 'Bus', icon: Bus },
  { value: 'Hotel', label: 'Hotel', icon: Hotel },
  { value: 'Utensils', label: 'Verpflegung', icon: Utensils },
  { value: 'Camera', label: 'Ausflug', icon: Camera },
  { value: 'Headphones', label: 'Reiseleitung', icon: Headphones },
  { value: 'Shield', label: 'Versicherung', icon: Shield },
  { value: 'Heart', label: 'Wellness', icon: Heart },
  { value: 'Plane', label: 'Transfer', icon: Plane },
  { value: 'X', label: 'Nicht enthalten', icon: X },
];

const categoryOptions: { value: TourInclusion['category']; label: string; color: string }[] = [
  { value: 'included', label: 'Inklusive', color: 'bg-emerald-600' },
  { value: 'optional', label: 'Optional', color: 'bg-blue-600' },
  { value: 'not_included', label: 'Nicht enthalten', color: 'bg-zinc-600' },
];

const emptyInclusion: Partial<TourInclusion> = {
  tour_id: '',
  icon: 'Check',
  title: '',
  description: '',
  category: 'included' as const,
  sort_order: 0,
};

const TourInclusionsTab = ({ tourId, inclusions, onCreate, onUpdate, onDelete }: TourInclusionsTabProps) => {
  const [dialog, setDialog] = useState<{ open: boolean; inclusion: Partial<TourInclusion> | null; isNew: boolean }>({
    open: false,
    inclusion: null,
    isNew: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!dialog.inclusion || !tourId) return;
    setIsSaving(true);

    try {
      if (dialog.isNew) {
        await onCreate({
          ...emptyInclusion,
          ...dialog.inclusion,
          tour_id: tourId,
          sort_order: inclusions.length,
        });
      } else {
        const { id, ...updates } = dialog.inclusion;
        await onUpdate(id!, updates);
      }
      setDialog({ open: false, inclusion: null, isNew: false });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Diese Leistung wirklich löschen?')) return;
    await onDelete(id);
  };

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find(o => o.value === iconName);
    return option?.icon || Check;
  };

  const groupedInclusions = {
    included: inclusions.filter(i => i.category === 'included'),
    optional: inclusions.filter(i => (i.category as string) === 'optional'),
    not_included: inclusions.filter(i => (i.category as string) === 'not_included'),
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
          <h2 className="text-2xl font-bold mb-2">Leistungen</h2>
          <p className="text-zinc-500">Was ist in der Reise enthalten?</p>
        </div>
        <Button
          onClick={() => setDialog({ open: true, inclusion: emptyInclusion, isNew: true })}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Leistung hinzufügen
        </Button>
      </div>

      {/* Included */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Check className="w-5 h-5 text-emerald-400" />
            Inklusive Leistungen
          </CardTitle>
          <CardDescription>Diese Leistungen sind im Preis enthalten</CardDescription>
        </CardHeader>
        <CardContent>
          {groupedInclusions.included.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4 text-center">
              Noch keine inklusiven Leistungen hinzugefügt
            </p>
          ) : (
            <div className="space-y-2">
              {groupedInclusions.included.map((inclusion) => {
                const Icon = getIconComponent(inclusion.icon);
                return (
                  <div
                    key={inclusion.id}
                    className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg group"
                  >
                    <GripVertical className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 cursor-grab" />
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{inclusion.title}</div>
                      {inclusion.description && (
                        <div className="text-xs text-zinc-500">{inclusion.description}</div>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDialog({ open: true, inclusion, isNew: false })}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(inclusion.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optional */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="w-5 h-5 text-blue-400" />
            Optionale Leistungen
          </CardTitle>
          <CardDescription>Zusätzlich buchbare Leistungen</CardDescription>
        </CardHeader>
        <CardContent>
          {groupedInclusions.optional.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4 text-center">
              Keine optionalen Leistungen
            </p>
          ) : (
            <div className="space-y-2">
              {groupedInclusions.optional.map((inclusion) => {
                const Icon = getIconComponent(inclusion.icon);
                return (
                  <div
                    key={inclusion.id}
                    className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg group"
                  >
                    <GripVertical className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 cursor-grab" />
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{inclusion.title}</div>
                      {inclusion.description && (
                        <div className="text-xs text-zinc-500">{inclusion.description}</div>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDialog({ open: true, inclusion, isNew: false })}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(inclusion.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Not Included */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <X className="w-5 h-5 text-zinc-400" />
            Nicht enthalten
          </CardTitle>
          <CardDescription>Wichtige Hinweise zu nicht inkludierten Leistungen</CardDescription>
        </CardHeader>
        <CardContent>
          {groupedInclusions.not_included.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4 text-center">
              Keine Einträge
            </p>
          ) : (
            <div className="space-y-2">
              {groupedInclusions.not_included.map((inclusion) => {
                const Icon = getIconComponent(inclusion.icon);
                return (
                  <div
                    key={inclusion.id}
                    className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg group"
                  >
                    <GripVertical className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 cursor-grab" />
                    <div className="w-8 h-8 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{inclusion.title}</div>
                      {inclusion.description && (
                        <div className="text-xs text-zinc-500">{inclusion.description}</div>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDialog({ open: true, inclusion, isNew: false })}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(inclusion.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => !open && setDialog({ open: false, inclusion: null, isNew: false })}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {dialog.isNew ? 'Leistung hinzufügen' : 'Leistung bearbeiten'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Kategorie</Label>
              <Select
                value={dialog.inclusion?.category || 'included'}
                onValueChange={(v: string) => setDialog(prev => ({
                  ...prev,
                  inclusion: { ...prev.inclusion, category: v as TourInclusion['category'] }
                }))}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Icon</Label>
              <Select
                value={dialog.inclusion?.icon || 'Check'}
                onValueChange={(v) => setDialog(prev => ({
                  ...prev,
                  inclusion: { ...prev.inclusion, icon: v }
                }))}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Titel *</Label>
              <Input
                value={dialog.inclusion?.title || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  inclusion: { ...prev.inclusion, title: e.target.value }
                }))}
                placeholder="z.B. Klimatisierter Reisebus"
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>

            <div>
              <Label>Beschreibung</Label>
              <Textarea
                value={dialog.inclusion?.description || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  inclusion: { ...prev.inclusion, description: e.target.value }
                }))}
                placeholder="Zusätzliche Details..."
                className="bg-zinc-800 border-zinc-700 mt-1"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialog({ open: false, inclusion: null, isNew: false })}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !dialog.inclusion?.title}
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

export default TourInclusionsTab;
