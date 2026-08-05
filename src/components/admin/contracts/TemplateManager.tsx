import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Star, Loader2 } from "lucide-react";
import { PLACEHOLDERS } from "@/lib/contracts/placeholders";
import type { ContractTemplate } from "@/lib/contracts/types";

interface Props {
  templates: ContractTemplate[];
  onChanged: () => void;
}

const emptyTemplate = { name: "", description: "", body: "# ARBEITSVERTRAG\n\n", is_default: false, is_active: true };

export function TemplateManager({ templates, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<ContractTemplate>>(emptyTemplate);

  const startNew = () => { setEditing(emptyTemplate); setOpen(true); };
  const startEdit = (t: ContractTemplate) => { setEditing(t); setOpen(true); };

  const save = async () => {
    if (!editing.name?.trim() || !editing.body?.trim()) {
      toast.error("Name und Vertragstext sind Pflichtfelder");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: editing.name,
        description: editing.description ?? null,
        body: editing.body,
        is_default: !!editing.is_default,
        is_active: editing.is_active !== false,
      };
      if (editing.id) {
        const { error } = await supabase.from("contract_templates").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contract_templates").insert(payload);
        if (error) throw error;
      }
      if (payload.is_default) {
        await supabase.from("contract_templates").update({ is_default: false })
          .neq("id", editing.id ?? "00000000-0000-0000-0000-000000000000")
          .eq("is_default", true);
      }
      toast.success("Vorlage gespeichert");
      setOpen(false);
      onChanged();
    } catch (e) {
      console.error(e);
      toast.error("Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t: ContractTemplate) => {
    if (!confirm(`Vorlage „${t.name}" wirklich löschen?`)) return;
    const { error } = await supabase.from("contract_templates").delete().eq("id", t.id);
    if (error) { toast.error("Löschen fehlgeschlagen"); return; }
    toast.success("Vorlage gelöscht");
    onChanged();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{templates.length} Vorlage(n)</p>
        <Button size="sm" onClick={startNew}><Plus className="w-4 h-4 mr-1.5" />Neue Vorlage</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {templates.map((t) => (
          <div key={t.id} className="cockpit-glass rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-white text-sm">{t.name}</h3>
              {t.is_default && (
                <Badge variant="outline" className="bg-[#00CC36]/15 text-[#00CC36] border-[#00CC36]/30 shrink-0">
                  <Star className="w-3 h-3 mr-1" />Standard
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-500 line-clamp-2">{t.description || "Keine Beschreibung"}</p>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => startEdit(t)}>
                <Pencil className="w-3 h-3 mr-1.5" />Bearbeiten
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs text-red-400 hover:text-red-300" onClick={() => remove(t)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Vorlage bearbeiten" : "Neue Vorlage"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name *</Label>
                <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Beschreibung</Label>
                <Input value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Vertragstext (Markdown, Platzhalter in {"{{ }}"}) *</Label>
              <Textarea
                rows={16}
                className="font-mono text-xs"
                value={editing.body ?? ""}
                onChange={(e) => setEditing({ ...editing, body: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  title={p.label}
                  onClick={() => setEditing((prev) => ({ ...prev, body: `${prev.body ?? ""}{{${p.key}}}` }))}
                  className="rounded bg-muted px-1.5 py-0.5 text-[10px] hover:bg-muted/70"
                >
                  {`{{${p.key}}}`}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!editing.is_default}
                onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })}
              />
              Als Standardvorlage verwenden
            </label>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
