import { useState } from "react";
import { TourLegal } from "@/hooks/useTourBuilder";
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
import { Scale, Plus, Pencil, Trash2, GripVertical, FileText, Shield, AlertTriangle, Info } from "lucide-react";

interface TourLegalTabProps {
  tourId?: string;
  sections: TourLegal[];
  onCreate: (data: Omit<TourLegal, 'id' | 'created_at'>) => Promise<{ error: Error | null }>;
  onUpdate: (id: string, data: Partial<TourLegal>) => Promise<{ error: Error | null }>;
  onDelete: (id: string) => Promise<{ error: Error | null }>;
}

const sectionTypes = [
  { value: 'cancellation', label: 'Stornobedingungen', icon: AlertTriangle },
  { value: 'insurance', label: 'Reiseversicherung', icon: Shield },
  { value: 'documents', label: 'Reisedokumente', icon: FileText },
  { value: 'terms', label: 'Allgemeine Bedingungen', icon: Scale },
  { value: 'info', label: 'Wichtige Hinweise', icon: Info },
];

const emptySection: Omit<TourLegal, 'id' | 'tour_id' | 'created_at'> = {
  section_key: 'info',
  title: '',
  content: '',
  sort_order: 0,
  is_active: true,
};

const TourLegalTab = ({ tourId, sections, onCreate, onUpdate, onDelete }: TourLegalTabProps) => {
  const [dialog, setDialog] = useState<{ open: boolean; section: Partial<TourLegal> | null; isNew: boolean }>({
    open: false,
    section: null,
    isNew: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!dialog.section || !tourId) return;
    setIsSaving(true);

    try {
      if (dialog.isNew) {
        await onCreate({
          ...emptySection,
          ...dialog.section,
          tour_id: tourId,
          sort_order: sections.length,
        });
      } else {
        const { id, ...updates } = dialog.section;
        await onUpdate(id!, updates);
      }
      setDialog({ open: false, section: null, isNew: false });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Diesen Abschnitt löschen?')) return;
    await onDelete(id);
  };

  const createDefaultSections = async () => {
    if (!tourId) return;
    setIsSaving(true);

    try {
      const defaults = [
        { 
          section_key: 'cancellation', 
          title: 'Stornobedingungen', 
          content: `**Basic Tarif:**\n- Keine Stornierung möglich\n- Keine Erstattung\n\n**Smart Tarif:**\n- Keine Stornierung möglich\n- Keine Erstattung\n\n**Flex Tarif:**\n- Bis 3 Tage vor Reiseantritt: 50% Stornogebühr\n- Weniger als 3 Tage: Keine Erstattung\n\n**Business Tarif:**\n- Bis 24 Stunden vor Reiseantritt: Kostenlose Stornierung\n- Weniger als 24 Stunden: Keine Erstattung`
        },
        { 
          section_key: 'insurance', 
          title: 'Reiseversicherung', 
          content: `Wir empfehlen den Abschluss einer Reiserücktritts- und Reiseabbruchversicherung.\n\nDie Reiseversicherung ist **nicht** im Reisepreis enthalten. Gerne beraten wir Sie zu passenden Versicherungsoptionen unserer Partner.`
        },
        { 
          section_key: 'documents', 
          title: 'Reisedokumente', 
          content: `Für diese Reise benötigen Sie:\n\n- Gültiger Reisepass oder Personalausweis\n- Das Dokument muss noch mindestens 6 Monate nach Reiseende gültig sein\n- Für Nicht-EU-Bürger können zusätzliche Visa-Anforderungen gelten\n\nBitte informieren Sie sich rechtzeitig bei der zuständigen Botschaft.`
        },
        { 
          section_key: 'terms', 
          title: 'Allgemeine Reisebedingungen', 
          content: `Es gelten die Allgemeinen Reisebedingungen (ARB) der METROPOL TOURS GmbH.\n\nDie vollständigen Bedingungen finden Sie unter [metropol-tours.de/agb](/terms).\n\nVeranstalter: METROPOL TOURS GmbH, Hamburg`
        },
      ];

      for (let i = 0; i < defaults.length; i++) {
        if (!sections.some(s => s.section_key === defaults[i].section_key)) {
          await onCreate({
            ...emptySection,
            ...defaults[i],
            tour_id: tourId,
            sort_order: i,
          });
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getSectionIcon = (key: string) => {
    const type = sectionTypes.find(t => t.value === key);
    return type?.icon || Info;
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
          <h2 className="text-2xl font-bold mb-2">Rechtliches</h2>
          <p className="text-zinc-500">AGB, Storno, Versicherung und wichtige Hinweise</p>
        </div>
        <div className="flex gap-2">
          {sections.length === 0 && (
            <Button
              variant="outline"
              onClick={createDefaultSections}
              disabled={isSaving}
              className="border-zinc-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Standard-Texte erstellen
            </Button>
          )}
          <Button
            onClick={() => setDialog({ open: true, section: emptySection, isNew: true })}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Abschnitt hinzufügen
          </Button>
        </div>
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <Scale className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
            <p className="text-zinc-500 mb-4">Noch keine rechtlichen Hinweise angelegt</p>
            <Button onClick={createDefaultSections} disabled={isSaving}>
              Standard-Texte erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.sort((a, b) => a.sort_order - b.sort_order).map((section) => {
            const Icon = getSectionIcon(section.section_key);
            const typeLabel = sectionTypes.find(t => t.value === section.section_key)?.label || section.section_key;
            
            return (
              <Card key={section.id} className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <GripVertical className="w-4 h-4 text-zinc-600 cursor-grab" />
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div>
                        <span className="text-white">{section.title}</span>
                        <Badge variant="outline" className="ml-2 text-xs border-zinc-700">
                          {typeLabel}
                        </Badge>
                      </div>
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDialog({ open: true, section, isNew: false })}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(section.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-zinc-400 whitespace-pre-wrap bg-zinc-800/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {section.content}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <Card className="bg-amber-500/10 border-amber-500/30">
        <CardContent className="py-4">
          <p className="text-amber-400 text-sm">
            ⚖️ <strong>Rechtlicher Hinweis:</strong> Stellen Sie sicher, dass alle Stornobedingungen 
            und AGB mit Ihren tatsächlichen Geschäftsbedingungen übereinstimmen. Bei Unsicherheit 
            konsultieren Sie bitte einen Rechtsberater.
          </p>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => !open && setDialog({ open: false, section: null, isNew: false })}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog.isNew ? 'Abschnitt hinzufügen' : 'Abschnitt bearbeiten'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Typ</Label>
                <Select
                  value={dialog.section?.section_key || 'info'}
                  onValueChange={(v) => setDialog(prev => ({
                    ...prev,
                    section: { ...prev.section, section_key: v }
                  }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {type.label}
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
                  value={dialog.section?.title || ''}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    section: { ...prev.section, title: e.target.value }
                  }))}
                  placeholder="z.B. Stornobedingungen"
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Inhalt *</Label>
              <Textarea
                value={dialog.section?.content || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  section: { ...prev.section, content: e.target.value }
                }))}
                placeholder="Markdown wird unterstützt..."
                className="bg-zinc-800 border-zinc-700 mt-1 font-mono text-sm"
                rows={12}
              />
              <p className="text-xs text-zinc-500 mt-1">
                Tipp: Verwenden Sie **fett** für Hervorhebungen und - für Aufzählungen
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialog({ open: false, section: null, isNew: false })}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !dialog.section?.title || !dialog.section?.content}
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

export default TourLegalTab;
