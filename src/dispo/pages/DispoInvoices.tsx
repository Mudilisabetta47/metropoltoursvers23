import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DispoLayout from "../DispoLayout";
import { EmptyState, StatCard } from "../components/ui";
import { dateDE, eur, isoDate } from "../lib/format";

const db = supabase as any;

export const INVOICE_STATUS: Record<string, string> = {
  entwurf: "Entwurf",
  versendet: "Versendet",
  bezahlt: "Bezahlt",
  ueberfaellig: "Überfällig",
  storniert: "Storniert",
};

export default function DispoInvoices() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("alle");
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await db
      .from("dispo_invoices")
      .select("*")
      .order("invoice_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "alle" && r.status !== filter) return false;
      if (!t) return true;
      return [r.invoice_number, r.customer_name, r.company, r.subject].some((v: string) =>
        (v ?? "").toLowerCase().includes(t),
      );
    });
  }, [rows, filter, q]);

  const openSum = rows
    .filter((r) => r.status === "versendet" || r.status === "ueberfaellig")
    .reduce((s, r) => s + Number(r.gross_amount ?? 0), 0);
  const paidSum = rows.filter((r) => r.status === "bezahlt").reduce((s, r) => s + Number(r.gross_amount ?? 0), 0);
  const overdue = rows.filter(
    (r) => r.status !== "bezahlt" && r.status !== "storniert" && r.due_date && r.due_date < isoDate(new Date()),
  ).length;

  const createInvoice = async () => {
    const today = new Date();
    const due = new Date(today.getTime() + 14 * 86400000);
    const { data, error } = await db
      .from("dispo_invoices")
      .insert({
        invoice_date: isoDate(today),
        due_date: isoDate(due),
        customer_name: "",
        vat_rate: 19,
        status: "entwurf",
        intro_text: "vielen Dank für Ihren Auftrag. Wir erlauben uns, folgende Leistungen in Rechnung zu stellen:",
        outro_text:
          "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen ohne Abzug auf das unten genannte Konto.",
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    navigate(`/dispo/rechnung/${data.id}`);
  };

  return (
    <DispoLayout
      title="Rechnungen"
      subtitle={`${rows.length} Rechnungen`}
      actions={
        <button className="dispo-btn dispo-btn-primary" onClick={createInvoice}>
          <Plus className="h-4 w-4" /> Neue Rechnung
        </button>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Offen" value={eur(openSum)} hint="versendet / überfällig" tone="warn" />
          <StatCard label="Bezahlt" value={eur(paidSum)} tone="good" />
          <StatCard label="Überfällig" value={overdue} hint="Fälligkeit überschritten" tone={overdue ? "warn" : "default"} />
        </div>

        <div className="dispo-card flex flex-wrap items-end gap-3 p-3">
          <label className="block">
            <span className="dispo-label">Suche</span>
            <input
              className="dispo-input"
              placeholder="Nummer, Kunde, Betreff…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="dispo-label">Status</span>
            <select className="dispo-input" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="alle">Alle</option>
              {Object.entries(INVOICE_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <EmptyState text="Lade Rechnungen…" />
        ) : visible.length === 0 ? (
          <EmptyState text="Keine Rechnungen gefunden. Erstelle mit „Neue Rechnung“ eine freie Rechnung." />
        ) : (
          <div className="dispo-card overflow-x-auto">
            <table className="dispo-table">
              <thead>
                <tr>
                  <th>Rechnung</th>
                  <th>Datum</th>
                  <th>Kunde</th>
                  <th>Betreff</th>
                  <th>Netto</th>
                  <th>Brutto</th>
                  <th>Fällig</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className="cursor-pointer" onClick={() => navigate(`/dispo/rechnung/${r.id}`)}>
                    <td className="font-medium dispo-strong">{r.invoice_number}</td>
                    <td>{dateDE(r.invoice_date)}</td>
                    <td>{r.company || r.customer_name || "–"}</td>
                    <td className="max-w-[16rem] truncate">{r.subject || "–"}</td>
                    <td>{eur(r.net_amount)}</td>
                    <td>{eur(r.gross_amount)}</td>
                    <td>{dateDE(r.due_date)}</td>
                    <td>{INVOICE_STATUS[r.status] ?? r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DispoLayout>
  );
}
