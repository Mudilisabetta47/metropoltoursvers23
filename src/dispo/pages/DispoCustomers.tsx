import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DispoLayout from "../DispoLayout";
import { EmptyState, Field } from "../components/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDispoData } from "../hooks/useDispoData";
import { dateDE, eur } from "../lib/format";

const db = supabase as any;

export default function DispoCustomers() {
  const { customers, orders, offers, loading, reload } = useDispoData();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const rows = useMemo(() => {
    const byName = new Map<string, any>();
    customers.forEach((c: any) => byName.set((c.email ?? c.name).toLowerCase(), { ...c, orders: [], revenue: 0 }));
    orders.forEach((o) => {
      const key = (o.email ?? o.customer_name).toLowerCase();
      const entry = byName.get(key) ?? {
        id: `virtual-${key}`,
        name: o.customer_name,
        company: o.company,
        email: o.email,
        phone: o.phone,
        notes: null,
        orders: [],
        revenue: 0,
        virtual: true,
      };
      entry.orders.push(o);
      entry.revenue += Number(o.price_gross ?? 0);
      entry.last_contact_at = entry.last_contact_at ?? o.created_at;
      byName.set(key, entry);
    });
    const term = q.trim().toLowerCase();
    return [...byName.values()]
      .filter((c) => !term || [c.name, c.company, c.email, c.phone].filter(Boolean).some((v: string) => String(v).toLowerCase().includes(term)))
      .sort((a, b) => b.revenue - a.revenue);
  }, [customers, orders, q]);

  const openOffersFor = (c: any) =>
    offers.filter((of: any) => c.orders.some((o: any) => o.id === of.order_id) && of.status !== "angenommen").length;

  const save = async () => {
    if (!form.name?.trim()) return toast.error("Name erforderlich");
    const { error } = await db.from("dispo_customers").insert({
      name: form.name, company: form.company || null, contact_person: form.contact_person || null,
      email: form.email || null, phone: form.phone || null, address: form.address || null,
      city: form.city || null, postal_code: form.postal_code || null, notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Kunde angelegt");
    setOpen(false);
    setForm({});
    reload();
  };

  return (
    <DispoLayout
      title="Kunden"
      subtitle={`${rows.length} Kunden`}
      actions={<button className="dispo-btn dispo-btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Kunde</button>}
    >
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
        <input className="dispo-input pl-9" placeholder="Kunden suchen…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? <EmptyState text="Lade Kunden…" /> : rows.length === 0 ? <EmptyState text="Keine Kunden vorhanden." /> : (
        <div className="dispo-card overflow-x-auto">
          <table className="dispo-table">
            <thead>
              <tr><th>Kunde</th><th>Firma / Verein</th><th>E-Mail</th><th>Telefon</th><th>Aufträge</th><th>Gesamtumsatz</th><th>Offene Angebote</th><th>Letzter Kontakt</th><th>Notizen</th></tr>
            </thead>
            <tbody>
              {rows.map((c: any) => (
                <tr key={c.id}>
                  <td className="font-medium dispo-strong">{c.name}</td>
                  <td>{c.company ?? "–"}</td>
                  <td>{c.email ?? "–"}</td>
                  <td>{c.phone ?? "–"}</td>
                  <td>{c.orders.length}</td>
                  <td>{eur(c.revenue)}</td>
                  <td>{openOffersFor(c)}</td>
                  <td>{c.last_contact_at ? dateDE(String(c.last_contact_at).slice(0, 10)) : "–"}</td>
                  <td className="max-w-[220px] truncate text-xs dispo-muted">{c.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="dispo-root bg-white">
          <DialogHeader><DialogTitle>Neuer Kunde</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Name *"><input className="dispo-input" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Firma / Verein"><input className="dispo-input" value={form.company ?? ""} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
            <Field label="Ansprechpartner"><input className="dispo-input" value={form.contact_person ?? ""} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></Field>
            <Field label="E-Mail"><input className="dispo-input" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Telefon"><input className="dispo-input" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Ort"><input className="dispo-input" value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          </div>
          <Field label="Notizen"><textarea className="dispo-input" value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <button className="dispo-btn dispo-btn-primary" onClick={save}>Speichern</button>
        </DialogContent>
      </Dialog>
    </DispoLayout>
  );
}
