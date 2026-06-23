import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Building2, FileSignature, Receipt, Users2, FolderOpen, Search, Filter, Download,
  Eye, Pencil, Copy, FileDown, Archive, MoreHorizontal, Bus, MapPin, Euro, Calendar,
  Mail, Phone, CheckCircle2, XCircle, AlertCircle, Clock, History, Upload, ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("de-DE") : "—";
const eur = (n: number | null | undefined) =>
  n != null ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(n)) : "—";

const CONTRACT_TYPES = [
  { value: "framework", label: "Rahmenvertrag" },
  { value: "school_bus", label: "Schulbus" },
  { value: "company_shuttle", label: "Firmen-Shuttle" },
  { value: "group_tour", label: "Gruppenreise" },
  { value: "event_transfer", label: "Event-Transfer" },
  { value: "charter", label: "Charter" },
];
const VEHICLE_CLASSES = [
  { value: "minibus", label: "Kleinbus (bis 19 Sitze)" },
  { value: "coach", label: "Reisebus (45–55 Sitze)" },
  { value: "double_decker", label: "Doppeldecker" },
  { value: "vip", label: "VIP-Bus" },
];
const BILLING_MODES = [
  { value: "per_trip", label: "Pro Fahrt" },
  { value: "monthly", label: "Monatlich" },
  { value: "flat", label: "Pauschal" },
  { value: "per_km", label: "Nach Kilometer" },
];
const STATUS_OPTIONS = [
  { value: "draft", label: "Entwurf", cls: "bg-zinc-700/40 text-zinc-300 border-zinc-600" },
  { value: "review", label: "Prüfung", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { value: "active", label: "Aktiv", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { value: "expired", label: "Abgelaufen", cls: "bg-zinc-600/30 text-zinc-400 border-zinc-600" },
  { value: "terminated", label: "Gekündigt", cls: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
];

const StatusBadge = ({ value }: { value: string }) => {
  const s = STATUS_OPTIONS.find(x => x.value === value) ?? STATUS_OPTIONS[0];
  return <span className={`text-[11px] px-2 py-0.5 rounded-full border ${s.cls} font-medium`}>{s.label}</span>;
};

const PaymentBadge = ({ value }: { value?: string | null }) => {
  const map: Record<string, { l: string; c: string }> = {
    paid: { l: "Bezahlt", c: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    open: { l: "Offen", c: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    overdue: { l: "Überfällig", c: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
    none: { l: "—", c: "bg-zinc-700/40 text-zinc-400 border-zinc-700" },
  };
  const s = map[value || "none"] ?? map.none;
  return <span className={`text-[11px] px-2 py-0.5 rounded-full border ${s.c}`}>{s.l}</span>;
};

const Kpi = ({ icon: Icon, label, value, accent }: any) => (
  <div className="rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-zinc-800 p-4 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}><Icon className="w-5 h-5" /></div>
    <div>
      <div className="text-xs text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className="text-xl font-semibold text-white tabular-nums">{value}</div>
    </div>
  </div>
);

export default function AdminB2BCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"customers" | "contracts" | "invoices" | "contacts" | "documents">("contracts");

  // Filters
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState<string>("all");
  const [fType, setFType] = useState<string>("all");
  const [fValidity, setFValidity] = useState<string>("all");
  const [fCustomer, setFCustomer] = useState<string>("all");
  const [fPayment, setFPayment] = useState<string>("all");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"customer" | "contract">("contract");
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [audit, setAudit] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const [c, k] = await Promise.all([
      supabase.from("b2b_customers").select("*").order("company_name"),
      supabase.from("b2b_contracts").select("*, customer:b2b_customers(id, company_name, customer_number, email)").order("valid_from", { ascending: false }),
    ]);
    setCustomers(c.data || []);
    setContracts(k.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const loadAudit = async (contractId: string) => {
    const { data } = await supabase.from("b2b_contract_audit").select("*").eq("contract_id", contractId).order("created_at", { ascending: false }).limit(20);
    setAudit(data || []);
  };

  const openCreateContract = () => {
    setDrawerMode("contract"); setEditing(null); setAudit([]);
    setForm({
      contract_type: "framework",
      status: "draft",
      payment_terms_days: 14,
      discount_percent: 0,
      billing_mode: "per_trip",
      vehicle_class: "coach",
      pickup_locations: [],
      destination_locations: [],
    });
    setDrawerOpen(true);
  };
  const openEditContract = (row: any) => {
    setDrawerMode("contract"); setEditing(row);
    setForm({
      ...row,
      pickup_locations: Array.isArray(row.pickup_locations) ? row.pickup_locations : [],
      destination_locations: Array.isArray(row.destination_locations) ? row.destination_locations : [],
    });
    loadAudit(row.id);
    setDrawerOpen(true);
  };
  const openCreateCustomer = () => {
    setDrawerMode("customer"); setEditing(null);
    setForm({ country: "DE", payment_terms_days: 14, invoice_frequency: "per_booking", is_active: true });
    setDrawerOpen(true);
  };

  const saveContract = async () => {
    if (!form.b2b_customer_id || !form.title || !form.valid_from) return toast.error("Kunde, Titel & Beginn erforderlich");
    if (editing) {
      const changes: any[] = [];
      ["status", "valid_until", "discount_percent", "vehicle_class", "billing_mode"].forEach(f => {
        if ((editing[f] ?? "") !== (form[f] ?? "")) changes.push({ contract_id: editing.id, action: "update", field_name: f, old_value: String(editing[f] ?? ""), new_value: String(form[f] ?? "") });
      });
      const { error } = await supabase.from("b2b_contracts").update({ ...form, last_activity_at: new Date().toISOString() }).eq("id", editing.id);
      if (error) return toast.error(error.message);
      if (changes.length) await supabase.from("b2b_contract_audit").insert(changes);
      toast.success("Vertrag aktualisiert");
    } else {
      const contractNumber = `RV-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(4, "0")}`;
      const { data, error } = await supabase.from("b2b_contracts").insert({ ...form, contract_number: contractNumber }).select().single();
      if (error) return toast.error(error.message);
      if (data) await supabase.from("b2b_contract_audit").insert({ contract_id: data.id, action: "created", notes: `Vertrag ${contractNumber} angelegt` });
      toast.success("Vertrag angelegt");
    }
    setDrawerOpen(false); load();
  };

  const saveCustomer = async () => {
    if (!form.company_name) return toast.error("Firmenname erforderlich");
    if (editing) {
      const { error } = await supabase.from("b2b_customers").update(form).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Kunde aktualisiert");
    } else {
      const customerNumber = `B2B-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase.from("b2b_customers").insert({ ...form, customer_number: customerNumber });
      if (error) return toast.error(error.message);
      toast.success("B2B-Kunde angelegt");
    }
    setDrawerOpen(false); load();
  };

  const duplicateContract = async (row: any) => {
    const { id, contract_number, created_at, updated_at, customer, ...rest } = row;
    const newNumber = `RV-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(4, "0")}`;
    const { error } = await supabase.from("b2b_contracts").insert({ ...rest, contract_number: newNumber, status: "draft", signed_at: null });
    if (error) return toast.error(error.message);
    toast.success("Vertrag dupliziert"); load();
  };
  const archiveContract = async (row: any) => {
    const { error } = await supabase.from("b2b_contracts").update({ status: "terminated" }).eq("id", row.id);
    if (error) return toast.error(error.message);
    await supabase.from("b2b_contract_audit").insert({ contract_id: row.id, action: "archive", notes: "Vertrag archiviert/gekündigt" });
    toast.success("Vertrag archiviert"); load();
  };

  // Filtered contracts
  const filtered = useMemo(() => {
    return contracts.filter(c => {
      if (q) {
        const t = q.toLowerCase();
        const hay = `${c.title} ${c.contract_number} ${c.customer?.company_name || ""} ${c.contact_person || ""}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      if (fStatus !== "all" && c.status !== fStatus) return false;
      if (fType !== "all" && c.contract_type !== fType) return false;
      if (fCustomer !== "all" && c.b2b_customer_id !== fCustomer) return false;
      if (fPayment !== "all" && (c.payment_status || "open") !== fPayment) return false;
      if (fValidity !== "all") {
        const now = new Date();
        const until = c.valid_until ? new Date(c.valid_until) : null;
        if (fValidity === "active" && (!until || until < now)) return false;
        if (fValidity === "expiring" && (!until || (until.getTime() - now.getTime()) > 60 * 86400000 || until < now)) return false;
        if (fValidity === "expired" && (!until || until >= now)) return false;
      }
      return true;
    });
  }, [contracts, q, fStatus, fType, fValidity, fCustomer, fPayment]);

  // KPIs
  const kpis = useMemo(() => {
    const active = contracts.filter(c => c.status === "active").length;
    const review = contracts.filter(c => c.status === "review" || c.status === "draft").length;
    const revenue = contracts.reduce((s, c) => s + Number(c.revenue_ytd || 0), 0);
    const planned = contracts.reduce((s, c) => s + Number(c.planned_trips || 0), 0);
    return { active, review, revenue, planned, customers: customers.length };
  }, [contracts, customers]);

  // Derived: contacts list from customers
  const contactsList = useMemo(() => customers.filter(c => c.contact_person || c.email), [customers]);
  // Derived: documents from contracts
  const documentsList = useMemo(() => contracts.filter(c => c.document_url), [contracts]);

  return (
    <AdminLayout
      title="B2B-Kunden & Verträge"
      subtitle="Firmenkunden · Rahmenverträge · Sammelrechnungen · Ansprechpartner · Dokumente"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
          <Button onClick={tab === "customers" ? openCreateCustomer : openCreateContract} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black font-medium">
            <Plus className="w-4 h-4 mr-2" />{tab === "customers" ? "Neuer Kunde" : "Neuer Vertrag"}
          </Button>
        </div>
      }
    >
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <Kpi icon={Building2} label="Firmenkunden" value={kpis.customers} accent="bg-blue-500/15 text-blue-400" />
        <Kpi icon={CheckCircle2} label="Aktive Verträge" value={kpis.active} accent="bg-emerald-500/15 text-emerald-400" />
        <Kpi icon={Clock} label="In Prüfung" value={kpis.review} accent="bg-amber-500/15 text-amber-400" />
        <Kpi icon={Bus} label="Geplante Fahrten" value={kpis.planned} accent="bg-violet-500/15 text-violet-400" />
        <Kpi icon={Euro} label="Umsatz YTD" value={eur(kpis.revenue)} accent="bg-[#00CC36]/15 text-[#00CC36]" />
      </div>

      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-auto flex flex-wrap">
          <TabsTrigger value="customers" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 gap-2"><Building2 className="w-4 h-4" />Firmenkunden <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800">{customers.length}</span></TabsTrigger>
          <TabsTrigger value="contracts" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 gap-2"><FileSignature className="w-4 h-4" />Verträge <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800">{contracts.length}</span></TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 gap-2"><Receipt className="w-4 h-4" />Sammelrechnungen</TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 gap-2"><Users2 className="w-4 h-4" />Ansprechpartner <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800">{contactsList.length}</span></TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 gap-2"><FolderOpen className="w-4 h-4" />Dokumente <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800">{documentsList.length}</span></TabsTrigger>
        </TabsList>

        {/* CONTRACTS */}
        <TabsContent value="contracts" className="mt-4 space-y-3">
          {/* Filter bar */}
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <Input placeholder="Vertragsnr., Titel, Kunde, Ansprechpartner …" value={q} onChange={e => setQ(e.target.value)}
                className="bg-zinc-950 border-zinc-800 pl-9 text-white placeholder:text-zinc-600 focus-visible:ring-[#00CC36]/40" />
            </div>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger className="w-[150px] bg-zinc-950 border-zinc-800 text-zinc-200"><Filter className="w-3.5 h-3.5 mr-1.5 text-zinc-500" /><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Alle Status</SelectItem>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={fType} onValueChange={setFType}>
              <SelectTrigger className="w-[170px] bg-zinc-950 border-zinc-800 text-zinc-200"><SelectValue placeholder="Vertragsart" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Alle Arten</SelectItem>{CONTRACT_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={fValidity} onValueChange={setFValidity}>
              <SelectTrigger className="w-[150px] bg-zinc-950 border-zinc-800 text-zinc-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Gültigkeit: alle</SelectItem>
                <SelectItem value="active">Aktuell gültig</SelectItem>
                <SelectItem value="expiring">Läuft in 60 Tagen</SelectItem>
                <SelectItem value="expired">Abgelaufen</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fCustomer} onValueChange={setFCustomer}>
              <SelectTrigger className="w-[200px] bg-zinc-950 border-zinc-800 text-zinc-200"><SelectValue placeholder="Kunde" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Alle Kunden</SelectItem>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={fPayment} onValueChange={setFPayment}>
              <SelectTrigger className="w-[150px] bg-zinc-950 border-zinc-800 text-zinc-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Zahlung: alle</SelectItem>
                <SelectItem value="paid">Bezahlt</SelectItem>
                <SelectItem value="open">Offen</SelectItem>
                <SelectItem value="overdue">Überfällig</SelectItem>
              </SelectContent>
            </Select>
            {(q || fStatus !== "all" || fType !== "all" || fValidity !== "all" || fCustomer !== "all" || fPayment !== "all") && (
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={() => { setQ(""); setFStatus("all"); setFType("all"); setFValidity("all"); setFCustomer("all"); setFPayment("all"); }}>Zurücksetzen</Button>
            )}
            <div className="ml-auto text-xs text-zinc-500">{filtered.length} von {contracts.length}</div>
          </div>

          {/* Rich table */}
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Kunde / Vertrag</TableHead>
                  <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Art</TableHead>
                  <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Ansprechpartner</TableHead>
                  <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Gültigkeit</TableHead>
                  <TableHead className="text-zinc-500 text-xs uppercase tracking-wider text-right">Fahrten</TableHead>
                  <TableHead className="text-zinc-500 text-xs uppercase tracking-wider text-right">Umsatz YTD</TableHead>
                  <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Zahlung</TableHead>
                  <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Letzte Aktivität</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={10} className="text-center text-zinc-500 py-12">Lade Verträge …</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center text-zinc-500 py-12">
                    <FileSignature className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    Keine Verträge gefunden
                  </TableCell></TableRow>
                ) : filtered.map(c => (
                  <TableRow key={c.id} className="border-zinc-800 hover:bg-zinc-800/40 cursor-pointer group" onClick={() => openEditContract(c)}>
                    <TableCell>
                      <div className="font-medium text-white">{c.customer?.company_name || "—"}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-[#00CC36]">{c.contract_number}</span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-xs text-zinc-400 truncate max-w-[260px]">{c.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 inline-flex items-center gap-1.5">
                        <Bus className="w-3 h-3 text-zinc-500" />{CONTRACT_TYPES.find(t => t.value === (c.contract_type || "framework"))?.label}
                      </span>
                    </TableCell>
                    <TableCell><div className="text-sm text-zinc-300">{c.contact_person || c.customer?.company_name || "—"}</div>{c.customer?.email && <div className="text-xs text-zinc-500">{c.customer.email}</div>}</TableCell>
                    <TableCell><div className="text-sm text-zinc-300 tabular-nums">{fmtDate(c.valid_from)}</div><div className="text-xs text-zinc-500 tabular-nums">bis {fmtDate(c.valid_until)}</div></TableCell>
                    <TableCell className="text-right tabular-nums text-zinc-200">{c.planned_trips || 0}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-white">{eur(c.revenue_ytd)}</TableCell>
                    <TableCell><PaymentBadge value={c.payment_status} /></TableCell>
                    <TableCell><StatusBadge value={c.status || "draft"} /></TableCell>
                    <TableCell className="text-xs text-zinc-500 tabular-nums">{fmtDate(c.last_activity_at || c.updated_at)}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200">
                          <DropdownMenuItem onClick={() => openEditContract(c)}><Eye className="w-4 h-4 mr-2" />Anzeigen</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditContract(c)}><Pencil className="w-4 h-4 mr-2" />Bearbeiten</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateContract(c)}><Copy className="w-4 h-4 mr-2" />Duplizieren</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => c.document_url ? window.open(c.document_url, "_blank") : toast.info("Kein Dokument hinterlegt")}><FileDown className="w-4 h-4 mr-2" />PDF / Dokument</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-800" />
                          <DropdownMenuItem onClick={() => archiveContract(c)} className="text-rose-400 focus:text-rose-300"><Archive className="w-4 h-4 mr-2" />Archivieren</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* CUSTOMERS */}
        <TabsContent value="customers" className="mt-4">
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-500 text-xs uppercase">Firma</TableHead>
                  <TableHead className="text-zinc-500 text-xs uppercase">Kontakt</TableHead>
                  <TableHead className="text-zinc-500 text-xs uppercase">Ort</TableHead>
                  <TableHead className="text-zinc-500 text-xs uppercase">USt-ID</TableHead>
                  <TableHead className="text-zinc-500 text-xs uppercase text-right">Rabatt</TableHead>
                  <TableHead className="text-zinc-500 text-xs uppercase text-right">Kreditlimit</TableHead>
                  <TableHead className="text-zinc-500 text-xs uppercase">Zahlungsziel</TableHead>
                  <TableHead className="text-zinc-500 text-xs uppercase">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-zinc-500"><Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />Noch keine Firmenkunden</TableCell></TableRow>
                ) : customers.map(r => (
                  <TableRow key={r.id} className="border-zinc-800 hover:bg-zinc-800/40 cursor-pointer" onClick={() => { setDrawerMode("customer"); setEditing(r); setForm(r); setDrawerOpen(true); }}>
                    <TableCell>
                      <div className="font-medium text-white flex items-center gap-2"><Building2 className="w-4 h-4 text-zinc-500" />{r.company_name}</div>
                      <div className="text-xs text-zinc-500 ml-6 font-mono">{r.customer_number}</div>
                    </TableCell>
                    <TableCell>
                      {r.email && <div className="flex items-center gap-1 text-xs text-zinc-300"><Mail className="w-3 h-3" />{r.email}</div>}
                      {r.phone && <div className="flex items-center gap-1 text-xs text-zinc-500"><Phone className="w-3 h-3" />{r.phone}</div>}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-300">{`${r.postal_code || ""} ${r.city || "—"}`.trim()}</TableCell>
                    <TableCell className="font-mono text-xs text-zinc-400">{r.vat_id || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums text-zinc-200">{r.discount_percent ? `${r.discount_percent}%` : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums text-zinc-200">{eur(r.credit_limit)}</TableCell>
                    <TableCell className="text-sm text-zinc-300">{r.payment_terms_days || 14} Tage</TableCell>
                    <TableCell>{r.is_active ? <span className="text-[11px] px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">Aktiv</span> : <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-700/40 text-zinc-400">Inaktiv</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* INVOICES */}
        <TabsContent value="invoices" className="mt-4">
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-10 text-center">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
            <div className="text-white font-medium mb-1">Sammelrechnungen</div>
            <div className="text-sm text-zinc-500 mb-4 max-w-md mx-auto">Hier werden automatisch generierte Sammelrechnungen für B2B-Kunden mit monatlicher Abrechnung angezeigt.</div>
            <Button variant="outline" className="border-zinc-700 text-zinc-300"><Plus className="w-4 h-4 mr-2" />Sammelrechnung erzeugen</Button>
          </div>
        </TabsContent>

        {/* CONTACTS */}
        <TabsContent value="contacts" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contactsList.map(c => (
              <div key={c.id} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 hover:border-zinc-700 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-white">{c.contact_person || c.company_name}</div>
                    <div className="text-xs text-zinc-500">{c.company_name}</div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#00CC36]/15 text-[#00CC36] flex items-center justify-center text-sm font-semibold">{(c.contact_person || c.company_name || "?").charAt(0)}</div>
                </div>
                <div className="space-y-1.5 text-xs">
                  {c.email && <div className="flex items-center gap-2 text-zinc-300"><Mail className="w-3.5 h-3.5 text-zinc-500" />{c.email}</div>}
                  {c.phone && <div className="flex items-center gap-2 text-zinc-300"><Phone className="w-3.5 h-3.5 text-zinc-500" />{c.phone}</div>}
                  {c.city && <div className="flex items-center gap-2 text-zinc-400"><MapPin className="w-3.5 h-3.5 text-zinc-500" />{c.postal_code} {c.city}</div>}
                </div>
              </div>
            ))}
            {contactsList.length === 0 && <div className="col-span-full text-center py-12 text-zinc-500"><Users2 className="w-10 h-10 mx-auto mb-2 opacity-40" />Noch keine Ansprechpartner</div>}
          </div>
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents" className="mt-4">
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800">
            {documentsList.length === 0 ? (
              <div className="text-center py-12 text-zinc-500"><FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />Keine Dokumente hinterlegt</div>
            ) : documentsList.map(d => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40">
                <div className="w-10 h-10 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center"><FileDown className="w-5 h-5" /></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{d.title}</div>
                  <div className="text-xs text-zinc-500"><span className="font-mono text-[#00CC36]">{d.contract_number}</span> · {d.customer?.company_name}</div>
                </div>
                <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300" onClick={() => window.open(d.document_url, "_blank")}><Download className="w-3.5 h-3.5 mr-1.5" />Öffnen</Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Right-side Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-zinc-950 border-l border-zinc-800 text-white overflow-y-auto p-0">
          <SheetHeader className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-white flex items-center gap-2">
                  {drawerMode === "contract" ? <FileSignature className="w-5 h-5 text-[#00CC36]" /> : <Building2 className="w-5 h-5 text-[#00CC36]" />}
                  {drawerMode === "contract" ? (editing ? `Vertrag bearbeiten` : "Neuer Vertrag") : (editing ? "Kunde bearbeiten" : "Neuer B2B-Kunde")}
                </SheetTitle>
                <SheetDescription className="text-zinc-400 text-xs mt-1">
                  {drawerMode === "contract" && editing ? <><span className="font-mono text-[#00CC36]">{editing.contract_number}</span> · {editing.customer?.company_name}</> : "Alle Felder werden direkt gespeichert"}
                </SheetDescription>
              </div>
              {drawerMode === "contract" && editing && <StatusBadge value={editing.status || "draft"} />}
            </div>
          </SheetHeader>

          <div className="px-6 py-5 space-y-6">
            {drawerMode === "contract" ? (
              <>
                {/* Section: Vertragsdaten */}
                <section>
                  <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2"><FileSignature className="w-3.5 h-3.5" />Vertragsdaten</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-zinc-300 text-xs">Firmenkunde *</Label>
                      <Select value={form.b2b_customer_id} onValueChange={v => setForm({ ...form, b2b_customer_id: v })}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue placeholder="Kunde wählen …" /></SelectTrigger>
                        <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2"><Label className="text-zinc-300 text-xs">Vertragstitel *</Label><Input className="bg-zinc-900 border-zinc-800 text-white" placeholder="z. B. Schulbusvertrag Gymnasium Hannover 2026" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                    <div>
                      <Label className="text-zinc-300 text-xs">Vertragsart</Label>
                      <Select value={form.contract_type || "framework"} onValueChange={v => setForm({ ...form, contract_type: v })}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>{CONTRACT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-zinc-300 text-xs">Status</Label>
                      <Select value={form.status || "draft"} onValueChange={v => setForm({ ...form, status: v })}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                {/* Section: Laufzeit */}
                <section>
                  <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />Laufzeit & Unterzeichnung</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label className="text-zinc-300 text-xs">Gültig ab *</Label><Input type="date" className="bg-zinc-900 border-zinc-800 text-white" value={form.valid_from || ""} onChange={e => setForm({ ...form, valid_from: e.target.value })} /></div>
                    <div><Label className="text-zinc-300 text-xs">Gültig bis</Label><Input type="date" className="bg-zinc-900 border-zinc-800 text-white" value={form.valid_until || ""} onChange={e => setForm({ ...form, valid_until: e.target.value })} /></div>
                    <div><Label className="text-zinc-300 text-xs">Unterzeichnet am</Label><Input type="date" className="bg-zinc-900 border-zinc-800 text-white" value={form.signed_at || ""} onChange={e => setForm({ ...form, signed_at: e.target.value })} /></div>
                  </div>
                </section>

                {/* Section: Kontakt & Konditionen */}
                <section>
                  <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2"><Users2 className="w-3.5 h-3.5" />Ansprechpartner & Konditionen</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-zinc-300 text-xs">Ansprechpartner</Label><Input className="bg-zinc-900 border-zinc-800 text-white" value={form.contact_person || ""} onChange={e => setForm({ ...form, contact_person: e.target.value })} /></div>
                    <div><Label className="text-zinc-300 text-xs">Zahlungsziel (Tage)</Label><Input type="number" className="bg-zinc-900 border-zinc-800 text-white" value={form.payment_terms_days ?? 14} onChange={e => setForm({ ...form, payment_terms_days: Number(e.target.value) })} /></div>
                    <div><Label className="text-zinc-300 text-xs">Rabatt %</Label><Input type="number" step="0.5" className="bg-zinc-900 border-zinc-800 text-white" value={form.discount_percent ?? 0} onChange={e => setForm({ ...form, discount_percent: Number(e.target.value) })} /></div>
                    <div>
                      <Label className="text-zinc-300 text-xs">Abrechnungsart</Label>
                      <Select value={form.billing_mode || "per_trip"} onValueChange={v => setForm({ ...form, billing_mode: v })}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>{BILLING_MODES.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                {/* Section: Operatives */}
                <section>
                  <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2"><Bus className="w-3.5 h-3.5" />Fahrtbetrieb</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-zinc-300 text-xs">Fahrzeugklasse</Label>
                      <Select value={form.vehicle_class || "coach"} onValueChange={v => setForm({ ...form, vehicle_class: v })}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>{VEHICLE_CLASSES.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-zinc-300 text-xs">Leistungsumfang</Label><Input className="bg-zinc-900 border-zinc-800 text-white" placeholder="z. B. Hin- und Rückfahrt, Mo–Fr" value={form.services_scope || ""} onChange={e => setForm({ ...form, services_scope: e.target.value })} /></div>
                    <div className="col-span-2">
                      <Label className="text-zinc-300 text-xs flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#00CC36]" />Standard-Abholorte (Komma-getrennt)</Label>
                      <Input className="bg-zinc-900 border-zinc-800 text-white" placeholder="Hannover ZOB, Bremen Hbf, Hamburg Kirchenallee"
                        value={(form.pickup_locations || []).join(", ")}
                        onChange={e => setForm({ ...form, pickup_locations: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-zinc-300 text-xs flex items-center gap-1.5"><MapPin className="w-3 h-3 text-rose-400" />Standard-Zielorte (Komma-getrennt)</Label>
                      <Input className="bg-zinc-900 border-zinc-800 text-white" placeholder="Schwerin Hbf, Rostock Warnemünde"
                        value={(form.destination_locations || []).join(", ")}
                        onChange={e => setForm({ ...form, destination_locations: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} />
                    </div>
                  </div>
                </section>

                {/* Section: Rechnung */}
                <section>
                  <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2"><Receipt className="w-3.5 h-3.5" />Rechnungsstellung</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div><Label className="text-zinc-300 text-xs">Rechnungsadresse</Label><Textarea className="bg-zinc-900 border-zinc-800 text-white min-h-[70px]" value={form.invoice_address || ""} onChange={e => setForm({ ...form, invoice_address: e.target.value })} /></div>
                    <div>
                      <Label className="text-zinc-300 text-xs">Dokument (URL)</Label>
                      <div className="flex gap-2">
                        <Input className="bg-zinc-900 border-zinc-800 text-white flex-1" placeholder="https://… oder Storage-URL" value={form.document_url || ""} onChange={e => setForm({ ...form, document_url: e.target.value })} />
                        <Button variant="outline" className="border-zinc-700 text-zinc-300"><Upload className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section: Notizen */}
                <section>
                  <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 mb-3">Interne Notizen</h3>
                  <Textarea className="bg-zinc-900 border-zinc-800 text-white min-h-[80px]" value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </section>

                {/* Section: Audit */}
                {editing && (
                  <section>
                    <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2"><History className="w-3.5 h-3.5" />Änderungsverlauf</h3>
                    <div className="rounded-lg border border-zinc-800 divide-y divide-zinc-800">
                      {audit.length === 0 ? (
                        <div className="p-4 text-xs text-zinc-500 text-center">Noch keine Änderungen protokolliert</div>
                      ) : audit.map(a => (
                        <div key={a.id} className="px-3 py-2 text-xs flex items-center gap-2">
                          <ChevronRight className="w-3 h-3 text-zinc-600" />
                          <span className="text-zinc-300">{a.notes || `${a.field_name}: ${a.old_value || "—"} → ${a.new_value || "—"}`}</span>
                          <span className="ml-auto text-zinc-600 tabular-nums">{new Date(a.created_at).toLocaleString("de-DE")}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : (
              // Customer drawer
              <>
                <section>
                  <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 mb-3">Stammdaten</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Label className="text-zinc-300 text-xs">Firmenname *</Label><Input className="bg-zinc-900 border-zinc-800 text-white" value={form.company_name || ""} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
                    <div><Label className="text-zinc-300 text-xs">USt-ID</Label><Input className="bg-zinc-900 border-zinc-800 text-white" placeholder="DE123456789" value={form.vat_id || ""} onChange={e => setForm({ ...form, vat_id: e.target.value })} /></div>
                    <div><Label className="text-zinc-300 text-xs">Ansprechpartner</Label><Input className="bg-zinc-900 border-zinc-800 text-white" value={form.contact_person || ""} onChange={e => setForm({ ...form, contact_person: e.target.value })} /></div>
                    <div><Label className="text-zinc-300 text-xs">E-Mail</Label><Input type="email" className="bg-zinc-900 border-zinc-800 text-white" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                    <div><Label className="text-zinc-300 text-xs">Telefon</Label><Input className="bg-zinc-900 border-zinc-800 text-white" value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  </div>
                </section>
                <section>
                  <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 mb-3">Anschrift</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-3"><Label className="text-zinc-300 text-xs">Adresse</Label><Input className="bg-zinc-900 border-zinc-800 text-white" value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                    <div><Label className="text-zinc-300 text-xs">PLZ</Label><Input className="bg-zinc-900 border-zinc-800 text-white" value={form.postal_code || ""} onChange={e => setForm({ ...form, postal_code: e.target.value })} /></div>
                    <div className="col-span-2"><Label className="text-zinc-300 text-xs">Stadt</Label><Input className="bg-zinc-900 border-zinc-800 text-white" value={form.city || ""} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                  </div>
                </section>
                <section>
                  <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 mb-3">Konditionen</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-zinc-300 text-xs">Rabatt %</Label><Input type="number" step="0.5" className="bg-zinc-900 border-zinc-800 text-white" value={form.discount_percent ?? ""} onChange={e => setForm({ ...form, discount_percent: Number(e.target.value) })} /></div>
                    <div><Label className="text-zinc-300 text-xs">Zahlungsziel (Tage)</Label><Input type="number" className="bg-zinc-900 border-zinc-800 text-white" value={form.payment_terms_days ?? 14} onChange={e => setForm({ ...form, payment_terms_days: Number(e.target.value) })} /></div>
                    <div><Label className="text-zinc-300 text-xs">Kreditlimit (€)</Label><Input type="number" step="0.01" className="bg-zinc-900 border-zinc-800 text-white" value={form.credit_limit ?? ""} onChange={e => setForm({ ...form, credit_limit: Number(e.target.value) })} /></div>
                    <div>
                      <Label className="text-zinc-300 text-xs">Rechnungsfrequenz</Label>
                      <Select value={form.invoice_frequency || "per_booking"} onValueChange={v => setForm({ ...form, invoice_frequency: v })}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_booking">Pro Buchung</SelectItem>
                          <SelectItem value="weekly">Wöchentlich</SelectItem>
                          <SelectItem value="monthly">Monatlich (Sammelrechnung)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>
                <section>
                  <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 mb-3">Notizen</h3>
                  <Textarea className="bg-zinc-900 border-zinc-800 text-white" value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </section>
              </>
            )}
          </div>

          <SheetFooter className="sticky bottom-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 px-6 py-3 flex-row gap-2">
            <Button variant="outline" onClick={() => setDrawerOpen(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Abbrechen</Button>
            <div className="flex-1" />
            <Button onClick={drawerMode === "contract" ? saveContract : saveCustomer} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black font-medium">
              {editing ? "Änderungen speichern" : "Anlegen"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
