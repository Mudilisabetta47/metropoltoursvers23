import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Save, Printer, FileDown, FileText, History, Loader2, AlertCircle,
} from "lucide-react";
import { SignaturePad } from "./SignaturePad";
import { CONTRACT_STATUS, EMPTY_COMPANY, type CompanyData, type ContractRecord, type ContractTemplate } from "@/lib/contracts/types";
import { buildPlaceholderValues, renderTemplate, PLACEHOLDERS, formatDateDE } from "@/lib/contracts/placeholders";
import { contractToHtml, printContract, exportContractDocx } from "@/lib/contracts/export";

interface Props {
  contract: ContractRecord;
  templates: ContractTemplate[];
  onBack: () => void;
  onSaved: (c: ContractRecord) => void;
}

const inputCls = "bg-white text-zinc-900 border-zinc-300 placeholder:text-zinc-400";

interface VersionRow { id: string; version: number; created_at: string; note: string | null }

export function ContractEditor({ contract, templates, onBack, onSaved }: Props) {
  const [form, setForm] = useState<ContractRecord>(contract);
  const [company, setCompany] = useState<CompanyData>({ ...EMPTY_COMPANY, ...(contract.company as CompanyData) });
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<VersionRow[]>([]);

  useEffect(() => {
    setForm(contract);
    setCompany({ ...EMPTY_COMPANY, ...(contract.company as CompanyData) });
    supabase
      .from("contract_versions")
      .select("id, version, created_at, note")
      .eq("contract_id", contract.id)
      .order("version", { ascending: false })
      .then(({ data }) => setVersions((data as VersionRow[]) ?? []));
  }, [contract]);

  const set = <K extends keyof ContractRecord>(key: K, value: ContractRecord[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const template = useMemo(
    () => templates.find((t) => t.id === form.template_id) ?? templates.find((t) => t.is_default) ?? templates[0],
    [templates, form.template_id],
  );

  const rendered = useMemo(() => {
    if (!template) return "";
    return renderTemplate(template.body, buildPlaceholderValues(form, company));
  }, [template, form, company]);

  const employeeName = `${form.first_name} ${form.last_name}`.trim() || "Unbenannt";

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!form.first_name.trim()) e.push("Vorname");
    if (!form.last_name.trim()) e.push("Nachname");
    if (!form.birth_date) e.push("Geburtsdatum");
    if (!form.address?.trim()) e.push("Anschrift");
    if (!form.position?.trim()) e.push("Position");
    if (!form.start_date) e.push("Arbeitsbeginn");
    if (form.is_temporary && !form.end_date) e.push("Vertragsende");
    if (form.weekly_hours == null) e.push("Wochenarbeitszeit");
    if (form.salary == null) e.push("Gehalt");
    if (!company.name.trim()) e.push("Firmenname");
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.push("gültige E-Mail");
    if (form.iban && form.iban.replace(/\s/g, "").length < 15) e.push("gültige IBAN");
    return e;
  }, [form, company]);

  const exportPayload = {
    body: rendered,
    company,
    contractNumber: form.contract_number,
    employeeName,
    signatureEmployee: form.signature_employee,
    signatureEmployer: form.signature_employer,
  };

  const save = async (nextStatus?: string) => {
    if (nextStatus && nextStatus !== "draft" && errors.length > 0) {
      toast.error(`Pflichtfelder fehlen: ${errors.join(", ")}`);
      return;
    }
    setSaving(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? null;
      const payload = {
        template_id: form.template_id,
        status: nextStatus ?? form.status,
        employee_user_id: form.employee_user_id,
        first_name: form.first_name,
        last_name: form.last_name,
        birth_date: form.birth_date,
        address: form.address,
        email: form.email,
        phone: form.phone,
        tax_id: form.tax_id,
        social_security_number: form.social_security_number,
        nationality: form.nationality,
        iban: form.iban,
        bic: form.bic,
        position: form.position,
        department: form.department,
        start_date: form.start_date,
        is_temporary: form.is_temporary,
        end_date: form.is_temporary ? form.end_date : null,
        probation_months: form.probation_months,
        weekly_hours: form.weekly_hours,
        work_location: form.work_location,
        salary: form.salary,
        bonus: form.bonus,
        vacation_days: form.vacation_days,
        notice_period: form.notice_period,
        working_hours: form.working_hours,
        other_agreements: form.other_agreements,
        company: company as unknown as never,
        signature_employee: form.signature_employee,
        signature_employer: form.signature_employer,
        signed_employee_at: form.signed_employee_at,
        signed_employer_at: form.signed_employer_at,
        rendered_body: rendered,
        version: form.version + 1,
      };

      const { data, error } = await supabase
        .from("employment_contracts")
        .update(payload)
        .eq("id", form.id)
        .select()
        .single();
      if (error) throw error;

      await supabase.from("contract_versions").insert({
        contract_id: form.id,
        version: payload.version,
        snapshot: payload as unknown as never,
        note: nextStatus ? `Status: ${CONTRACT_STATUS[nextStatus]?.label ?? nextStatus}` : "Bearbeitet",
        created_by: uid,
      });

      const saved = data as unknown as ContractRecord;
      setForm(saved);
      onSaved(saved);
      setVersions((v) => [{ id: crypto.randomUUID(), version: payload.version, created_at: new Date().toISOString(), note: "Bearbeitet" }, ...v]);
      // Firmendaten als Vorgabe merken
      await supabase.from("app_settings").upsert(
        { section_key: "contract_company", settings: company as unknown as never },
        { onConflict: "section_key" },
      );
      toast.success("Vertrag gespeichert");
    } catch (err) {
      console.error(err);
      toast.error("Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const doPrint = () => {
    try { printContract(exportPayload); } catch (e: any) { toast.error(e.message); }
  };

  const doDocx = async () => {
    try {
      await exportContractDocx(exportPayload);
      toast.success("Word-Datei erstellt");
    } catch (e) {
      console.error(e);
      toast.error("Word-Export fehlgeschlagen");
    }
  };

  const status = CONTRACT_STATUS[form.status] ?? CONTRACT_STATUS.draft;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-zinc-300">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Zurück
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">{employeeName}</h2>
            <Badge variant="outline" className={status.className}>{status.label}</Badge>
          </div>
          <p className="text-xs text-zinc-500">{form.contract_number} · Version {form.version}</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={doPrint}><Printer className="w-4 h-4 mr-1.5" />Drucken / PDF</Button>
          <Button variant="secondary" size="sm" onClick={doDocx}><FileDown className="w-4 h-4 mr-1.5" />Word (.docx)</Button>
          <Button size="sm" onClick={() => save()} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            Speichern
          </Button>
          <Select value={form.status} onValueChange={(v) => save(v)}>
            <SelectTrigger className="h-9 w-[170px] bg-white text-zinc-900 border-zinc-300"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CONTRACT_STATUS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Noch offen: {errors.join(", ")}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Formular */}
        <div className="cockpit-glass rounded-xl p-4">
          <Tabs defaultValue="employee">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="employee">Mitarbeiter</TabsTrigger>
              <TabsTrigger value="contract">Vertrag</TabsTrigger>
              <TabsTrigger value="company">Unternehmen</TabsTrigger>
              <TabsTrigger value="sign">Unterschrift</TabsTrigger>
            </TabsList>

            <TabsContent value="employee" className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Vorname *"><Input className={inputCls} value={form.first_name} onChange={(e) => set("first_name", e.target.value)} /></Field>
              <Field label="Nachname *"><Input className={inputCls} value={form.last_name} onChange={(e) => set("last_name", e.target.value)} /></Field>
              <Field label="Geburtsdatum *"><Input type="date" className={inputCls} value={form.birth_date ?? ""} onChange={(e) => set("birth_date", e.target.value || null)} /></Field>
              <Field label="Staatsangehörigkeit"><Input className={inputCls} value={form.nationality ?? ""} onChange={(e) => set("nationality", e.target.value)} /></Field>
              <Field label="Anschrift *" full><Textarea rows={2} className={inputCls} value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="Straße Hausnr., PLZ Ort" /></Field>
              <Field label="E-Mail"><Input type="email" className={inputCls} value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
              <Field label="Telefon"><Input className={inputCls} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field label="Steuer-ID"><Input className={inputCls} value={form.tax_id ?? ""} onChange={(e) => set("tax_id", e.target.value)} /></Field>
              <Field label="Sozialversicherungsnummer"><Input className={inputCls} value={form.social_security_number ?? ""} onChange={(e) => set("social_security_number", e.target.value)} /></Field>
              <Field label="IBAN"><Input className={inputCls} value={form.iban ?? ""} onChange={(e) => set("iban", e.target.value)} /></Field>
              <Field label="BIC"><Input className={inputCls} value={form.bic ?? ""} onChange={(e) => set("bic", e.target.value)} /></Field>
            </TabsContent>

            <TabsContent value="contract" className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Vorlage" full>
                <Select value={form.template_id ?? ""} onValueChange={(v) => set("template_id", v)}>
                  <SelectTrigger className="bg-white text-zinc-900 border-zinc-300"><SelectValue placeholder="Vorlage wählen" /></SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Position / Tätigkeit *"><Input className={inputCls} value={form.position ?? ""} onChange={(e) => set("position", e.target.value)} /></Field>
              <Field label="Abteilung"><Input className={inputCls} value={form.department ?? ""} onChange={(e) => set("department", e.target.value)} /></Field>
              <Field label="Arbeitsbeginn *"><Input type="date" className={inputCls} value={form.start_date ?? ""} onChange={(e) => set("start_date", e.target.value || null)} /></Field>
              <Field label="Probezeit (Monate)"><Input type="number" min={0} max={6} className={inputCls} value={form.probation_months ?? ""} onChange={(e) => set("probation_months", e.target.value === "" ? null : Number(e.target.value))} /></Field>
              <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-zinc-700 px-3 py-2">
                <span className="text-sm text-zinc-200">Befristeter Vertrag</span>
                <Switch checked={form.is_temporary} onCheckedChange={(v) => set("is_temporary", v)} />
              </div>
              {form.is_temporary && (
                <Field label="Vertragsende *"><Input type="date" className={inputCls} value={form.end_date ?? ""} onChange={(e) => set("end_date", e.target.value || null)} /></Field>
              )}
              <Field label="Wochenarbeitszeit (Std.) *"><Input type="number" step="0.5" className={inputCls} value={form.weekly_hours ?? ""} onChange={(e) => set("weekly_hours", e.target.value === "" ? null : Number(e.target.value))} /></Field>
              <Field label="Arbeitsort"><Input className={inputCls} value={form.work_location ?? ""} onChange={(e) => set("work_location", e.target.value)} /></Field>
              <Field label="Monatsgehalt (brutto, €) *"><Input type="number" step="0.01" className={inputCls} value={form.salary ?? ""} onChange={(e) => set("salary", e.target.value === "" ? null : Number(e.target.value))} /></Field>
              <Field label="Urlaubstage"><Input type="number" className={inputCls} value={form.vacation_days ?? ""} onChange={(e) => set("vacation_days", e.target.value === "" ? null : Number(e.target.value))} /></Field>
              <Field label="Kündigungsfrist"><Input className={inputCls} value={form.notice_period ?? ""} onChange={(e) => set("notice_period", e.target.value)} placeholder="4 Wochen zum Monatsende" /></Field>
              <Field label="Bonus / Sonderzahlungen"><Input className={inputCls} value={form.bonus ?? ""} onChange={(e) => set("bonus", e.target.value)} /></Field>
              <Field label="Arbeitszeiten" full><Textarea rows={2} className={inputCls} value={form.working_hours ?? ""} onChange={(e) => set("working_hours", e.target.value)} placeholder="Mo–Fr 08:00–17:00 Uhr" /></Field>
              <Field label="Sonstige Vereinbarungen" full><Textarea rows={4} className={inputCls} value={form.other_agreements ?? ""} onChange={(e) => set("other_agreements", e.target.value)} /></Field>
            </TabsContent>

            <TabsContent value="company" className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Firmenname *"><Input className={inputCls} value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} /></Field>
              <Field label="Geschäftsführer"><Input className={inputCls} value={company.managing_director} onChange={(e) => setCompany({ ...company, managing_director: e.target.value })} /></Field>
              <Field label="Anschrift" full><Textarea rows={2} className={inputCls} value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} /></Field>
              <Field label="Handelsregister"><Input className={inputCls} value={company.commercial_register} onChange={(e) => setCompany({ ...company, commercial_register: e.target.value })} placeholder="HRB 12345, AG Hannover" /></Field>
              <Field label="Steuernummer"><Input className={inputCls} value={company.tax_number} onChange={(e) => setCompany({ ...company, tax_number: e.target.value })} /></Field>
              <Field label="Ort (für Unterschriftszeile)"><Input className={inputCls} value={company.city} onChange={(e) => setCompany({ ...company, city: e.target.value })} /></Field>
              <Field label="Logo-URL"><Input className={inputCls} value={company.logo_url} onChange={(e) => setCompany({ ...company, logo_url: e.target.value })} placeholder="https://…" /></Field>
              <Field label="Firmen-Unterschrift (Bild-URL)"><Input className={inputCls} value={company.signature_url} onChange={(e) => setCompany({ ...company, signature_url: e.target.value })} placeholder="https://…" /></Field>
            </TabsContent>

            <TabsContent value="sign" className="mt-4 space-y-5">
              <SignaturePad
                label="Unterschrift Arbeitgeber"
                value={form.signature_employer}
                onChange={(v) => setForm((f) => ({ ...f, signature_employer: v, signed_employer_at: v ? new Date().toISOString() : null }))}
              />
              <SignaturePad
                label="Unterschrift Arbeitnehmer"
                value={form.signature_employee}
                onChange={(v) => setForm((f) => ({ ...f, signature_employee: v, signed_employee_at: v ? new Date().toISOString() : null }))}
              />
              <div className="rounded-lg border border-zinc-700 p-3">
                <p className="flex items-center gap-2 text-xs font-medium text-zinc-300 mb-2"><History className="w-3.5 h-3.5" />Versionen</p>
                {versions.length === 0 ? (
                  <p className="text-xs text-zinc-500">Noch keine gespeicherten Versionen.</p>
                ) : (
                  <ul className="space-y-1 text-xs text-zinc-400 max-h-40 overflow-y-auto">
                    {versions.map((v) => (
                      <li key={v.id} className="flex justify-between">
                        <span>v{v.version} · {v.note ?? "—"}</span>
                        <span>{formatDateDE(v.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-lg border border-zinc-700 p-3">
                <p className="text-xs font-medium text-zinc-300 mb-2">Verfügbare Platzhalter</p>
                <div className="flex flex-wrap gap-1">
                  {PLACEHOLDERS.map((p) => (
                    <code key={p.key} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-400">{`{{${p.key}}}`}</code>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live-Vorschau */}
        <div className="cockpit-glass rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 border-b cockpit-border px-4 py-2.5 text-xs text-zinc-400">
            <FileText className="w-3.5 h-3.5" /> Live-Vorschau
          </div>
          <ScrollArea className="h-[70vh]">
            {template ? (
              <iframe
                title="Vertragsvorschau"
                sandbox=""
                srcDoc={contractToHtml(exportPayload)}
                className="w-full h-[70vh] bg-white"
              />
            ) : (
              <p className="p-6 text-sm text-zinc-500">Bitte zuerst eine Vorlage auswählen.</p>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
      <Label className="text-xs text-zinc-400">{label}</Label>
      {children}
    </div>
  );
}
