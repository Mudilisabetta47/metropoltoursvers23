import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Star, Loader2, Copy } from "lucide-react";
import { PLACEHOLDERS } from "@/lib/contracts/placeholders";
import { CONTRACT_TYPES, CONTRACT_LANGUAGES, CONTRACT_TYPE_LABEL, type ContractTemplate } from "@/lib/contracts/types";

interface Props {
  templates: ContractTemplate[];
  onChanged: () => void;
}

const emptyTemplate: Partial<ContractTemplate> = {
  name: "", description: "", body: "# Arbeitsvertrag\n\n", contract_type: "vollzeit",
  language: "de", is_default: false, is_active: true,
};

export function TemplateManager({ templates, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [editing, setEditing] = useState<Partial<ContractTemplate>>(emptyTemplate);

  const startNew = () => { setEditing(emptyTemplate); setOpen(true); };
  const startEdit = (t: ContractTemplate) => { setEditing(t); setOpen(true); };
  const duplicate = (t: ContractTemplate) => {
    const { id, created_at, updated_at, ...rest } = t;
    setEditing({ ...rest, name: `${t.name} (Kopie)`, is_default: false });
    setOpen(true);
  };

  const visible = templates.filter((t) => typeFilter === "all" || t.contract_type === typeFilter);

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
        contract_type: editing.contract_type ?? "vollzeit",
        language: editing.language ?? "de",
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
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-zinc-400">{visible.length} von {templates.length} Vorlage(n)</p>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[210px] bg-white text-zinc-900 border-zinc-300"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Vertragsarten</SelectItem>
            {CONTRACT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" className="ml-auto" onClick={startNew}><Plus className="w-4 h-4 mr-1.5" />Neue Vorlage</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {visible.map((t) => (
          <div key={t.id} className="cockpit-glass rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-white text-sm">{t.name}</h3>
              {t.is_default && (
                <Badge variant="outline" className="bg-[#00CC36]/15 text-[#00CC36] border-[#00CC36]/30 shrink-0">
                  <Star className="w-3 h-3 mr-1" />Standard
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-[10px] border-zinc-600 text-zinc-300">{CONTRACT_TYPE_LABEL(t.contract_type)}</Badge>
              <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400 uppercase">{t.language}</Badge>
            </div>
            <p className="text-xs text-zinc-500 line-clamp-2">{t.description || "Keine Beschreibung"}</p>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => startEdit(t)}>
                <Pencil className="w-3 h-3 mr-1.5" />Bearbeiten
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs text-zinc-300" onClick={() => duplicate(t)} aria-label={`Vorlage ${t.name} duplizieren`}>
                <Copy className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs text-red-400 hover:text-red-300" onClick={() => remove(t)} aria-label={`Vorlage ${t.name} löschen`}>
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
              <div className="space-y-1.5">
                <Label className="text-xs">Vertragsart</Label>
                <Select value={editing.contract_type ?? "vollzeit"} onValueChange={(v) => setEditing({ ...editing, contract_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sprache</Label>
                <Select value={editing.language ?? "de"} onValueChange={(v) => setEditing({ ...editing, language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTRACT_LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
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
