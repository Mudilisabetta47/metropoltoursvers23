import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DispoLayout from "../DispoLayout";
import { EmptyState, Field } from "../components/ui";
import { useDispoData } from "../hooks/useDispoData";
import { dateDE, eur } from "../lib/format";

const db = supabase as any;

const OFFER_STATUS: Record<string, string> = {
  entwurf: "Entwurf",
  versendet: "Versendet",
  angenommen: "Angenommen",
  abgelehnt: "Abgelehnt",
};

const DEFAULT_INCLUSIONS = "Fahrzeuggestellung, Fahrerkosten, Kraftstoff, Maut, Versicherung";

const inDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

export default function DispoOffers() {
  const { offers, orders, loading, reload } = useDispoData();
  const navigate = useNavigate();
  const orderMap = useMemo(() => new Map(orders.map((o) => [o.id, o])), [orders]);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [net, setNet] = useState("0");
  const [vat, setVat] = useState("19");
  const [discount, setDiscount] = useState("0");
  const [validUntil, setValidUntil] = useState(inDays(14));
  const [inclusions, setInclusions] = useState(DEFAULT_INCLUSIONS);
  const [notes, setNotes] = useState("");

  const selectedOrder = orderMap.get(orderId);

  useEffect(() => {
    if (selectedOrder) {
      setNet(String(Number(selectedOrder.price_net) || 0));
      setVat(String(Number(selectedOrder.vat_rate) || 19));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const netAfterDiscount = (Number(net) || 0) * (1 - (Number(discount) || 0) / 100);
  const gross = netAfterDiscount * (1 + (Number(vat) || 0) / 100);

  const openDialog = () => {
    setOrderId("");
    setNet("0");
    setVat("19");
    setDiscount("0");
    setValidUntil(inDays(14));
    setInclusions(DEFAULT_INCLUSIONS);
    setNotes("");
    setOpen(true);
  };

  const create = async () => {
    if (!orderId) return toast.error("Bitte einen Auftrag auswählen.");
    setSaving(true);
    const { data, error } = await db
      .from("dispo_offers")
      .insert({
        order_id: orderId,
        price_net: Number(net) || 0,
        vat_rate: Number(vat) || 19,
        discount_percent: Number(discount) || 0,
        price_gross: Number(gross.toFixed(2)),
        valid_until: validUntil || null,
        inclusions: inclusions || null,
        notes: notes || null,
        status: "entwurf",
      })
      .select("id")
      .maybeSingle();
    setSaving(false);
    if (error || !data) return toast.error(error?.message ?? "Angebot konnte nicht erstellt werden.");
    await db.from("dispo_orders").update({ status: "angebot_erstellt" }).eq("id", orderId);
    toast.success("Angebot erstellt");
    setOpen(false);
    reload();
    navigate(`/dispo/angebot/${data.id}`);
  };

  return (
    <DispoLayout
      title="Angebote"
      subtitle={`${offers.length} Angebote`}
      actions={
        <button className="dispo-btn dispo-btn-primary" onClick={openDialog}>
          <Plus className="h-4 w-4" /> Neues Angebot
        </button>
      }
    >
      {loading ? (
        <EmptyState text="Lade Angebote…" />
      ) : offers.length === 0 ? (
        <EmptyState text="Noch keine Angebote. Mit „Neues Angebot“ erstellen Sie ein Angebot zu einem Auftrag." />
      ) : (
        <div className="dispo-card overflow-x-auto">
          <table className="dispo-table">
            <thead>
              <tr>
                <th>Angebot</th><th>Auftrag</th><th>Kunde</th><th>Netto</th><th>Brutto</th>
                <th>Gültig bis</th><th>Status</th><th>Erstellt</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((of: any) => {
                const o = orderMap.get(of.order_id);
                return (
                  <tr key={of.id} className="cursor-pointer" onClick={() => navigate(`/dispo/angebot/${of.id}`)}>
                    <td className="font-medium dispo-strong">{of.offer_number}</td>
                    <td>{o?.order_number ?? "–"}</td>
                    <td>{o?.customer_name ?? "–"}</td>
                    <td>{eur(of.price_net)}</td>
                    <td>{eur(of.price_gross)}</td>
                    <td>{dateDE(of.valid_until)}</td>
                    <td>{OFFER_STATUS[of.status] ?? of.status}</td>
                    <td>{dateDE(of.created_at?.slice(0, 10))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="dispo-card mt-6 w-full max-w-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold dispo-strong">Neues Angebot</h2>
              <button className="dispo-btn dispo-btn-ghost" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Auftrag">
                  <select className="dispo-input" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                    <option value="">Auftrag auswählen…</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.order_number} · {o.customer_name}
                        {o.origin || o.destination ? ` · ${[o.origin, o.destination].filter(Boolean).join(" → ")}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Netto (€)">
                <input className="dispo-input" type="number" step="0.01" value={net} onChange={(e) => setNet(e.target.value)} />
              </Field>
              <Field label="MwSt. (%)">
                <input className="dispo-input" type="number" step="0.1" value={vat} onChange={(e) => setVat(e.target.value)} />
              </Field>
              <Field label="Rabatt (%)">
                <input className="dispo-input" type="number" step="0.1" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </Field>
              <Field label="Gültig bis">
                <input className="dispo-input" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Leistungen">
                  <textarea className="dispo-input min-h-[70px]" value={inclusions} onChange={(e) => setInclusions(e.target.value)} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Hinweise">
                  <textarea className="dispo-input min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Field>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: "hsl(var(--dispo-border))" }}>
              <div className="text-sm dispo-muted">
                Netto nach Rabatt <strong className="dispo-strong">{eur(netAfterDiscount)}</strong> · Brutto{" "}
                <strong className="dispo-strong">{eur(gross)}</strong>
              </div>
              <div className="flex gap-2">
                <button className="dispo-btn dispo-btn-ghost" onClick={() => setOpen(false)}>Abbrechen</button>
                <button className="dispo-btn dispo-btn-primary" onClick={create} disabled={saving || !orderId}>
                  {saving ? "Wird erstellt…" : "Angebot erstellen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DispoLayout>
  );
}
