import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Plus, Printer, Save, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Field } from "../components/ui";
import { LOGO_URL } from "@/components/brand/Logo";
import { dateDE, eur, isoDate } from "../lib/format";
import { INVOICE_STATUS } from "./DispoInvoices";
import "../dispo.css";

const db = supabase as any;

type Item = {
  id?: string;
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
};

export default function DispoInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inv, setInv] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await db.from("dispo_invoices").select("*").eq("id", id).maybeSingle();
    const { data: its } = await db
      .from("dispo_invoice_items")
      .select("*")
      .eq("invoice_id", id)
      .order("position", { ascending: true });
    setInv(data ?? null);
    setItems(
      (its ?? []).map((i: any) => ({
        id: i.id,
        position: i.position,
        description: i.description,
        quantity: Number(i.quantity),
        unit: i.unit,
        unit_price: Number(i.unit_price),
      })),
    );
    setLoading(false);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totals = useMemo(() => {
    const net = items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0);
    const rate = Number(inv?.vat_rate ?? 19);
    const vat = net * (rate / 100);
    return { net, vat, gross: net + vat };
  }, [items, inv?.vat_rate]);

  if (loading) return <div className="p-10 text-center">Lade Rechnung…</div>;
  if (!inv) return <div className="p-10 text-center">Rechnung nicht gefunden.</div>;

  const setField = (k: string, v: any) => setInv({ ...inv, [k]: v });
  const setItem = (idx: number, patch: Partial<Item>) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const addItem = () =>
    setItems([...items, { position: items.length + 1, description: "", quantity: 1, unit: "Stk.", unit_price: 0 }]);

  const removeItem = async (idx: number) => {
    const it = items[idx];
    if (it.id) await db.from("dispo_invoice_items").delete().eq("id", it.id);
    setItems(items.filter((_, i) => i !== idx));
  };

  const save = async (extra: Record<string, any> = {}) => {
    setSaving(true);
    const payload = {
      invoice_date: inv.invoice_date,
      due_date: inv.due_date || null,
      customer_name: inv.customer_name ?? "",
      company: inv.company,
      address: inv.address,
      email: inv.email,
      subject: inv.subject,
      intro_text: inv.intro_text,
      outro_text: inv.outro_text,
      vat_rate: Number(inv.vat_rate) || 0,
      net_amount: Number(totals.net.toFixed(2)),
      vat_amount: Number(totals.vat.toFixed(2)),
      gross_amount: Number(totals.gross.toFixed(2)),
      status: inv.status,
      paid_at: inv.paid_at || null,
      payment_method: inv.payment_method,
      notes: inv.notes,
      ...extra,
    };
    const { error } = await db.from("dispo_invoices").update(payload).eq("id", inv.id);
    if (error) {
      setSaving(false);
      toast.error(error.message);
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const row = {
        invoice_id: inv.id,
        position: i + 1,
        description: it.description,
        quantity: Number(it.quantity) || 0,
        unit: it.unit || "Stk.",
        unit_price: Number(it.unit_price) || 0,
        line_total: Number(((Number(it.quantity) || 0) * (Number(it.unit_price) || 0)).toFixed(2)),
      };
      if (it.id) await db.from("dispo_invoice_items").update(row).eq("id", it.id);
      else {
        const { data } = await db.from("dispo_invoice_items").insert(row).select().single();
        if (data) items[i].id = data.id;
      }
    }
    setSaving(false);
    toast.success("Rechnung gespeichert");
    load();
    return true;
  };

  const markSent = async () => {
    setInv({ ...inv, status: "versendet" });
    await save({ status: "versendet" });
  };
  const markPaid = async () => {
    const today = isoDate(new Date());
    setInv({ ...inv, status: "bezahlt", paid_at: today });
    await save({ status: "bezahlt", paid_at: today });
  };

  return (
    <div className="dispo-root min-h-screen bg-[hsl(var(--dispo-bg))] p-4">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex flex-wrap gap-2 print:hidden">
          <button className="dispo-btn dispo-btn-ghost" onClick={() => navigate("/dispo/rechnungen")}>
            <ArrowLeft className="h-4 w-4" /> Zurück
          </button>
          <button className="dispo-btn dispo-btn-ghost" disabled={saving} onClick={() => save()}>
            <Save className="h-4 w-4" /> Speichern
          </button>
          <button className="dispo-btn dispo-btn-ghost" onClick={markSent}>
            <Send className="h-4 w-4" /> Als versendet markieren
          </button>
          <button className="dispo-btn dispo-btn-ghost" onClick={markPaid}>
            <CheckCircle2 className="h-4 w-4" /> Als bezahlt markieren
          </button>
          <button className="dispo-btn dispo-btn-primary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Als PDF speichern / drucken
          </button>
        </div>

        <div className="dispo-card grid gap-3 p-4 md:grid-cols-4 print:hidden">
          <Field label="Rechnungsdatum">
            <input
              className="dispo-input"
              type="date"
              value={inv.invoice_date ?? ""}
              onChange={(e) => setField("invoice_date", e.target.value)}
            />
          </Field>
          <Field label="Fällig am">
            <input
              className="dispo-input"
              type="date"
              value={inv.due_date ?? ""}
              onChange={(e) => setField("due_date", e.target.value)}
            />
          </Field>
          <Field label="MwSt. (%)">
            <input
              className="dispo-input"
              type="number"
              value={inv.vat_rate ?? 19}
              onChange={(e) => setField("vat_rate", e.target.value)}
            />
          </Field>
          <Field label="Status">
            <select className="dispo-input" value={inv.status} onChange={(e) => setField("status", e.target.value)}>
              {Object.entries(INVOICE_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Kunde / Ansprechpartner">
            <input
              className="dispo-input"
              value={inv.customer_name ?? ""}
              onChange={(e) => setField("customer_name", e.target.value)}
            />
          </Field>
          <Field label="Firma">
            <input className="dispo-input" value={inv.company ?? ""} onChange={(e) => setField("company", e.target.value)} />
          </Field>
          <Field label="E-Mail">
            <input className="dispo-input" value={inv.email ?? ""} onChange={(e) => setField("email", e.target.value)} />
          </Field>
          <Field label="Zahlungsart">
            <input
              className="dispo-input"
              placeholder="Überweisung"
              value={inv.payment_method ?? ""}
              onChange={(e) => setField("payment_method", e.target.value)}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Anschrift">
              <textarea className="dispo-input" value={inv.address ?? ""} onChange={(e) => setField("address", e.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Betreff">
              <input className="dispo-input" value={inv.subject ?? ""} onChange={(e) => setField("subject", e.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Einleitungstext">
              <textarea className="dispo-input" value={inv.intro_text ?? ""} onChange={(e) => setField("intro_text", e.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Schlusstext">
              <textarea className="dispo-input" value={inv.outro_text ?? ""} onChange={(e) => setField("outro_text", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="dispo-card p-4 print:hidden">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold dispo-strong">Positionen</h2>
            <button className="dispo-btn dispo-btn-ghost" onClick={addItem}>
              <Plus className="h-4 w-4" /> Position
            </button>
          </div>
          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={it.id ?? idx} className="grid gap-2 md:grid-cols-12">
                <input
                  className="dispo-input md:col-span-5"
                  placeholder="Bezeichnung"
                  value={it.description}
                  onChange={(e) => setItem(idx, { description: e.target.value })}
                />
                <input
                  className="dispo-input md:col-span-2"
                  type="number"
                  step="0.01"
                  value={it.quantity}
                  onChange={(e) => setItem(idx, { quantity: Number(e.target.value) })}
                />
                <input
                  className="dispo-input md:col-span-1"
                  value={it.unit}
                  onChange={(e) => setItem(idx, { unit: e.target.value })}
                />
                <input
                  className="dispo-input md:col-span-2"
                  type="number"
                  step="0.01"
                  value={it.unit_price}
                  onChange={(e) => setItem(idx, { unit_price: Number(e.target.value) })}
                />
                <div className="flex items-center gap-2 md:col-span-2">
                  <span className="text-sm">{eur(Number(it.quantity || 0) * Number(it.unit_price || 0))}</span>
                  <button className="dispo-btn dispo-btn-ghost" onClick={() => removeItem(idx)} aria-label="Position löschen">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm dispo-muted">Noch keine Positionen.</p>}
          </div>
          <div className="mt-3 text-right text-sm">
            <div>Netto: {eur(totals.net)}</div>
            <div>
              MwSt. {inv.vat_rate} %: {eur(totals.vat)}
            </div>
            <div className="text-base font-bold">Brutto: {eur(totals.gross)}</div>
          </div>
        </div>

        <div className="dispo-print-sheet rounded-xl bg-white p-8 text-gray-900 shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b pb-4">
            <img src={LOGO_URL} alt="METROPOL TOURS GmbH" className="h-12 w-auto object-contain" />
            <div className="text-right text-xs leading-5">
              <div className="font-bold">METROPOL TOURS GmbH</div>
              <div>Hannover</div>
              <div>Telefon +49 511 80781106</div>
              <div>kundenservice@metours.de</div>
              <div>www.metours.de</div>
            </div>
          </div>

          <div className="mt-6 whitespace-pre-wrap text-sm">
            {inv.company && <div className="font-semibold">{inv.company}</div>}
            <div>{inv.customer_name}</div>
            <div>{inv.address}</div>
          </div>

          <h1 className="mt-6 text-xl font-bold">Rechnung {inv.invoice_number}</h1>
          <p className="text-sm text-gray-600">
            Rechnungsdatum {dateDE(inv.invoice_date)}
            {inv.due_date ? ` · zahlbar bis ${dateDE(inv.due_date)}` : ""}
          </p>
          {inv.subject && <p className="mt-2 text-sm font-semibold">{inv.subject}</p>}
          {inv.intro_text && <p className="mt-4 whitespace-pre-wrap text-sm">{inv.intro_text}</p>}

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Pos.</th>
                <th className="py-2">Bezeichnung</th>
                <th className="py-2 text-right">Menge</th>
                <th className="py-2 text-right">Einzelpreis</th>
                <th className="py-2 text-right">Betrag</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id ?? i} className="border-b align-top">
                  <td className="py-2">{i + 1}</td>
                  <td className="py-2">{it.description}</td>
                  <td className="py-2 text-right">
                    {it.quantity} {it.unit}
                  </td>
                  <td className="py-2 text-right">{eur(it.unit_price)}</td>
                  <td className="py-2 text-right">{eur(Number(it.quantity || 0) * Number(it.unit_price || 0))}</td>
                </tr>
              ))}
              <tr className="border-b">
                <td className="py-2" colSpan={4}>
                  Summe netto
                </td>
                <td className="py-2 text-right">{eur(totals.net)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2" colSpan={4}>
                  MwSt. {inv.vat_rate} %
                </td>
                <td className="py-2 text-right">{eur(totals.vat)}</td>
              </tr>
              <tr>
                <td className="py-2 text-base font-bold" colSpan={4}>
                  Rechnungsbetrag brutto
                </td>
                <td className="py-2 text-right text-base font-bold">{eur(totals.gross)}</td>
              </tr>
            </tbody>
          </table>

          {inv.outro_text && <p className="mt-6 whitespace-pre-wrap text-sm">{inv.outro_text}</p>}
          {inv.notes && <p className="mt-3 whitespace-pre-wrap text-sm">{inv.notes}</p>}

          <p className="mt-8 text-xs text-gray-500">
            METROPOL TOURS GmbH · Hannover · kundenservice@metours.de · +49 511 80781106. Bitte geben Sie bei der Zahlung die
            Rechnungsnummer {inv.invoice_number} an.
          </p>
        </div>
      </div>
    </div>
  );
}
