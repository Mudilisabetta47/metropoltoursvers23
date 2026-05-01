import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataTable, DataTableColumn } from "@/components/admin/core/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Building2, FileSignature, CheckCircle2, XCircle, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("de-DE") : "—";
const eur = (n: number | null) => n != null ? `${Number(n).toFixed(2)} €` : "—";

export default function AdminB2BCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"customers" | "contracts">("customers");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ country: "DE", payment_terms_days: 14, invoice_frequency: "per_booking", is_active: true });

  const load = async () => {
    setLoading(true);
    const [c, k] = await Promise.all([
      supabase.from("b2b_customers").select("*").order("company_name"),
      supabase.from("b2b_contracts").select("*, customer:b2b_customers(company_name)").order("valid_from", { ascending: false }),
    ]);
    setCustomers(c.data || []); setContracts(k.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveCustomer = async () => {
    if (!form.company_name) return toast.error("Firmenname erforderlich");
    const customerNumber = `B2B-${Date.now().toString().slice(-6)}`;
    const { error } = await supabase.from("b2b_customers").insert({ ...form, customer_number: customerNumber });
    if (error) return toast.error(error.message);
    toast.success("B2B-Kunde angelegt");
    setOpen(false); setForm({ country: "DE", payment_terms_days: 14, invoice_frequency: "per_booking", is_active: true }); load();
  };

  const saveContract = async () => {
    if (!form.b2b_customer_id || !form.title || !form.valid_from) return toast.error("Kunde, Titel & Beginn erforderlich");
    const contractNumber = `RV-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(4, "0")}`;
    const { error } = await supabase.from("b2b_contracts").insert({ ...form, contract_number: contractNumber });
    if (error) return toast.error(error.message);
    toast.success("Vertrag angelegt");
    setOpen(false); setForm({}); load();
  };

  const custCols: DataTableColumn<any>[] = [
    { key: "company", header: "Firma", accessor: r => (
      <div><div className="font-semibold text-white flex items-center gap-2"><Building2 className="w-4 h-4 text-zinc-500" />{r.company_name}</div><div className="text-xs text-zinc-500 ml-6">{r.customer_number} · {r.contact_person || "—"}</div></div>
    ), sortValue: r => r.company_name },
    { key: "contact", header: "Kontakt", accessor: r => (
      <div className="text-xs space-y-0.5">
        {r.email && <div className="flex items-center gap-1 text-zinc-300"><Mail className="w-3 h-3" />{r.email}</div>}
        {r.phone && <div className="flex items-center gap-1 text-zinc-400"><Phone className="w-3 h-3" />{r.phone}</div>}
      </div>
    ) },
    { key: "city", header: "Stadt", accessor: r => `${r.postal_code || ""} ${r.city || "—"}`.trim() },
    { key: "vat", header: "USt-ID", accessor: r => <span className="font-mono text-xs">{r.vat_id || "—"}</span> },
    { key: "discount", header: "Rabatt", accessor: r => r.discount_percent ? `${r.discount_percent}%` : "—", sortValue: r => Number(r.discount_percent || 0) },
    { key: "terms", header: "Zahlungsziel", accessor: r => `${r.payment_terms_days || 14} Tage` },
    { key: "credit", header: "Kreditlimit", accessor: r => eur(r.credit_limit), sortValue: r => Number(r.credit_limit || 0) },
    { key: "active", header: "Status", accessor: r => r.is_active ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Aktiv</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">Inaktiv</span> },
  ];

  const contCols: DataTableColumn<any>[] = [
    { key: "num", header: "Vertrag", accessor: r => <span className="font-mono text-xs text-emerald-400">{r.contract_number}</span>, sortValue: r => r.contract_number },
    { key: "customer", header: "Kunde", accessor: r => r.customer?.company_name || "—" },
    { key: "title", header: "Titel", accessor: r => <span className="text-white">{r.title}</span> },
    { key: "from", header: "Gültig ab", accessor: r => fmtDate(r.valid_from), sortValue: r => r.valid_from },
    { key: "until", header: "Gültig bis", accessor: r => fmtDate(r.valid_until), sortValue: r => r.valid_until || "" },
    { key: "signed", header: "Unterzeichnet", accessor: r => r.signed_at ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-zinc-600" /> },
    { key: "status", header: "Status", accessor: r => <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">{r.status}</span> },
  ];

  return (
    <AdminLayout title="B2B-Kunden & Verträge" subtitle="Firmenkunden, Rahmenverträge, Sammelrechnungen"
      actions={<Button onClick={() => { setForm(tab === "customers" ? { country: "DE", payment_terms_days: 14, invoice_frequency: "per_booking", is_active: true } : {}); setOpen(true); }} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black"><Plus className="w-4 h-4 mr-2" />{tab === "customers" ? "Neuer Kunde" : "Neuer Vertrag"}</Button>}>
      <Tabs value={tab} onValueChange={v => setTab(v as any)}>
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="customers" className="data-[state=active]:bg-zinc-800"><Building2 className="w-4 h-4 mr-2" />Firmenkunden ({customers.length})</TabsTrigger>
          <TabsTrigger value="contracts" className="data-[state=active]:bg-zinc-800"><FileSignature className="w-4 h-4 mr-2" />Verträge ({contracts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="customers" className="mt-4">
          <DataTable data={customers} columns={custCols} rowKey={r => r.id} isLoading={loading} exportFilename="b2b-kunden" emptyMessage="Noch keine Firmenkunden" />
        </TabsContent>
        <TabsContent value="contracts" className="mt-4">
          <DataTable data={contracts} columns={contCols} rowKey={r => r.id} isLoading={loading} exportFilename="b2b-vertraege" emptyMessage="Noch keine Verträge" />
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{tab === "customers" ? "B2B-Kunde anlegen" : "Vertrag anlegen"}</DialogTitle></DialogHeader>
          {tab === "customers" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Firmenname *</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
              <div><Label>USt-ID</Label><Input className="bg-white text-black" placeholder="DE123456789" onChange={e => setForm({ ...form, vat_id: e.target.value })} /></div>
              <div><Label>Ansprechpartner</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, contact_person: e.target.value })} /></div>
              <div><Label>E-Mail</Label><Input type="email" className="bg-white text-black" onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Telefon</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="col-span-2"><Label>Adresse</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>PLZ</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, postal_code: e.target.value })} /></div>
              <div><Label>Stadt</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>Rabatt %</Label><Input type="number" step="0.5" className="bg-white text-black" onChange={e => setForm({ ...form, discount_percent: Number(e.target.value) })} /></div>
              <div><Label>Zahlungsziel (Tage)</Label><Input type="number" className="bg-white text-black" value={form.payment_terms_days} onChange={e => setForm({ ...form, payment_terms_days: Number(e.target.value) })} /></div>
              <div><Label>Kreditlimit (€)</Label><Input type="number" step="0.01" className="bg-white text-black" onChange={e => setForm({ ...form, credit_limit: Number(e.target.value) })} /></div>
              <div>
                <Label>Rechnungsfrequenz</Label>
                <Select value={form.invoice_frequency} onValueChange={v => setForm({ ...form, invoice_frequency: v })}>
                  <SelectTrigger className="bg-white text-black"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_booking">Pro Buchung</SelectItem>
                    <SelectItem value="weekly">Wöchentlich</SelectItem>
                    <SelectItem value="monthly">Monatlich (Sammelrechnung)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Notizen</Label><Textarea className="bg-white text-black" onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Kunde *</Label>
                <Select value={form.b2b_customer_id} onValueChange={v => setForm({ ...form, b2b_customer_id: v })}>
                  <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Kunde wählen" /></SelectTrigger>
                  <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Titel *</Label><Input className="bg-white text-black" placeholder="Rahmenvertrag 2026" onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Gültig ab *</Label><Input type="date" className="bg-white text-black" onChange={e => setForm({ ...form, valid_from: e.target.value })} /></div>
              <div><Label>Gültig bis</Label><Input type="date" className="bg-white text-black" onChange={e => setForm({ ...form, valid_until: e.target.value })} /></div>
              <div><Label>Unterzeichnet am</Label><Input type="date" className="bg-white text-black" onChange={e => setForm({ ...form, signed_at: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status || "draft"} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-white text-black"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Entwurf</SelectItem>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="expired">Abgelaufen</SelectItem>
                    <SelectItem value="terminated">Gekündigt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Notizen</Label><Textarea className="bg-white text-black" onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button onClick={tab === "customers" ? saveCustomer : saveContract} className="bg-[#00CC36] text-black">Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
