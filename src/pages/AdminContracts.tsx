import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, FileSignature, Loader2, Trash2, Archive } from "lucide-react";
import { ContractEditor } from "@/components/admin/contracts/ContractEditor";
import { TemplateManager } from "@/components/admin/contracts/TemplateManager";
import {
  CONTRACT_STATUS, CONTRACT_TYPES, CONTRACT_LANGUAGES, CONTRACT_TYPE_LABEL, EMPTY_COMPANY,
  type CompanyData, type ContractRecord, type ContractTemplate,
} from "@/lib/contracts/types";
import { formatDateDE, formatEUR } from "@/lib/contracts/placeholders";

export default function AdminContracts() {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [companyDefaults, setCompanyDefaults] = useState<CompanyData>(EMPTY_COMPANY);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newType, setNewType] = useState("vollzeit");
  const [newLanguage, setNewLanguage] = useState("de");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [active, setActive] = useState<ContractRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, t, s] = await Promise.all([
      supabase.from("employment_contracts").select("*").order("created_at", { ascending: false }),
      supabase.from("contract_templates").select("*").eq("is_active", true).order("name"),
      supabase.from("app_settings").select("settings").eq("section_key", "contract_company").maybeSingle(),
    ]);
    if (c.error) toast.error("Verträge konnten nicht geladen werden");
    setContracts((c.data as unknown as ContractRecord[]) ?? []);
    setTemplates((t.data as unknown as ContractTemplate[]) ?? []);
    if (s.data?.settings) setCompanyDefaults({ ...EMPTY_COMPANY, ...(s.data.settings as unknown as CompanyData) });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createContract = async () => {
    setCreating(true);
    try {
      const [{ data: numData, error: numErr }, { data: pnData }] = await Promise.all([
        supabase.rpc("generate_contract_number"),
        supabase.rpc("generate_personnel_number"),
      ]);
      if (numErr) throw numErr;
      const { data: userRes } = await supabase.auth.getUser();
      const tpl = templates.find((t) => t.contract_type === newType && t.language === newLanguage)
        ?? templates.find((t) => t.contract_type === newType)
        ?? templates.find((t) => t.is_default)
        ?? templates[0];
      const { data, error } = await supabase
        .from("employment_contracts")
        .insert({
          contract_number: numData as unknown as string,
          personnel_number: (pnData as unknown as string) ?? null,
          contract_type: newType,
          language: newLanguage,
          template_id: tpl?.id ?? null,
          company: companyDefaults as unknown as never,
          created_by: userRes.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      const rec = data as unknown as ContractRecord;
      setContracts((prev) => [rec, ...prev]);
      setCreateOpen(false);
      setActive(rec);
    } catch (e) {
      console.error(e);
      toast.error("Vertrag konnte nicht angelegt werden");
    } finally {
      setCreating(false);
    }
  };

  const archiveContract = async (c: ContractRecord) => {
    const { error } = await supabase.from("employment_contracts").update({ status: "archived" }).eq("id", c.id);
    if (error) { toast.error("Archivieren fehlgeschlagen"); return; }
    setContracts((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: "archived" } : x)));
    toast.success("Vertrag archiviert");
  };

  const removeContract = async (c: ContractRecord) => {
    if (!confirm(`Vertrag ${c.contract_number} wirklich löschen?`)) return;
    const { error } = await supabase.from("employment_contracts").delete().eq("id", c.id);
    if (error) { toast.error("Löschen fehlgeschlagen"); return; }
    setContracts((prev) => prev.filter((x) => x.id !== c.id));
    toast.success("Vertrag gelöscht");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contracts.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (typeFilter !== "all" && c.contract_type !== typeFilter) return false;
      if (!q) return true;
      return [c.contract_number, c.personnel_number, c.first_name, c.last_name, c.position, c.department, c.email]
        .some((v) => v && String(v).toLowerCase().includes(q));
    });
  }, [contracts, query, statusFilter, typeFilter]);

  if (active) {
    return (
      <AdminLayout title="Arbeitsvertrag-Generator" subtitle={`Vertrag ${active.contract_number}`}>
        <ContractEditor
          contract={active}
          templates={templates}
          onBack={() => setActive(null)}
          onSaved={(saved) => {
            setActive(saved);
            setContracts((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
          }}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Arbeitsvertrag-Generator"
      subtitle="Verträge erstellen, verwalten, unterschreiben und als PDF oder Word exportieren"
      actions={
        <Button onClick={() => setCreateOpen(true)} disabled={templates.length === 0}>
          <Plus className="w-4 h-4 mr-1.5" />Neuer Vertrag
        </Button>
      }
    >
      <Tabs defaultValue="contracts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contracts">Verträge</TabsTrigger>
          <TabsTrigger value="templates">Vorlagen</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suche nach Name, Vertrags-/Personalnummer, Position…"
                className="pl-8 bg-white text-zinc-900 border-zinc-300"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[210px] bg-white text-zinc-900 border-zinc-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Vertragsarten</SelectItem>
                {CONTRACT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[190px] bg-white text-zinc-900 border-zinc-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                {Object.entries(CONTRACT_STATUS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="cockpit-glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.02] border-b cockpit-border text-zinc-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">Vertragsnr.</th>
                    <th className="px-3 py-3 text-left font-medium">Personalnr.</th>
                    <th className="px-3 py-3 text-left font-medium">Mitarbeiter</th>
                    <th className="px-3 py-3 text-left font-medium">Vertragsart</th>
                    <th className="px-3 py-3 text-left font-medium">Beginn</th>
                    <th className="px-3 py-3 text-left font-medium">Gehalt</th>
                    <th className="px-3 py-3 text-left font-medium">Status</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-12 text-zinc-500">Lade Verträge…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-14 text-zinc-500">
                        <FileSignature className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        Keine Verträge gefunden.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => {
                      const st = CONTRACT_STATUS[c.status] ?? CONTRACT_STATUS.draft;
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setActive(c)}
                          className="border-b border-zinc-800/50 hover:bg-white/[0.02] cursor-pointer transition-colors"
                        >
                          <td className="px-3 py-3 font-mono text-xs text-zinc-300">{c.contract_number}</td>
                          <td className="px-3 py-3 font-mono text-xs text-zinc-400">{c.personnel_number || "—"}</td>
                          <td className="px-3 py-3 text-zinc-100">{`${c.first_name} ${c.last_name}`.trim() || "—"}</td>
                          <td className="px-3 py-3 text-zinc-300">{CONTRACT_TYPE_LABEL(c.contract_type)}</td>
                          <td className="px-3 py-3 text-zinc-300">{formatDateDE(c.start_date)}</td>
                          <td className="px-3 py-3 text-zinc-300">{c.salary != null ? formatEUR(c.salary) : formatEUR(c.hourly_wage)}</td>
                          <td className="px-3 py-3">
                            <Badge variant="outline" className={st.className}>{st.label}</Badge>
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {c.status !== "archived" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-amber-400 hover:text-amber-300"
                                onClick={() => archiveContract(c)}
                                aria-label={`Vertrag ${c.contract_number} archivieren`}
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-red-400 hover:text-red-300"
                              onClick={() => removeContract(c)}
                              aria-label={`Vertrag ${c.contract_number} löschen`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 border-t cockpit-border text-[11px] text-zinc-500">
              {filtered.length} {filtered.length === 1 ? "Vertrag" : "Verträge"}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <TemplateManager templates={templates} onChanged={load} />
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Neuen Arbeitsvertrag anlegen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Vertragsart</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTRACT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sprache</Label>
              <Select value={newLanguage} onValueChange={setNewLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTRACT_LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Vertragsnummer (AV-JJJJ-XXXXX) und Personalnummer (MT-P-XXXXX) werden automatisch vergeben.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Abbrechen</Button>
            <Button onClick={createContract} disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}Vertrag anlegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
