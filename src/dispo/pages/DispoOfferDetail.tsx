import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, Save, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Field } from "../components/ui";
import { LOGO_URL } from "@/components/brand/Logo";
import { dateDE, eur, timeDE } from "../lib/format";
import "../dispo.css";

const db = supabase as any;

export default function DispoOfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: of } = await db.from("dispo_offers").select("*").eq("id", id).maybeSingle();
    if (!of) { setLoading(false); return; }
    const { data: ord } = await db.from("dispo_orders").select("*").eq("id", of.order_id).maybeSingle();
    setOffer(of);
    setOrder(ord);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) return <div className="p-10 text-center">Lade Angebot…</div>;
  if (!offer || !order) return <div className="p-10 text-center">Angebot nicht gefunden.</div>;

  const discount = Number(offer.discount_percent) || 0;
  const net = Number(offer.price_net) * (1 - discount / 100);
  const vat = net * (Number(offer.vat_rate) / 100);
  const gross = net + vat;

  const save = async () => {
    const { error } = await db
      .from("dispo_offers")
      .update({
        price_net: Number(offer.price_net),
        vat_rate: Number(offer.vat_rate),
        price_gross: Number(gross.toFixed(2)),
        discount_percent: discount,
        inclusions: offer.inclusions,
        notes: offer.notes,
        valid_until: offer.valid_until,
        status: offer.status,
      })
      .eq("id", offer.id);
    if (error) return toast.error(error.message);
    toast.success("Angebot gespeichert");
    load();
  };

  const markSent = async () => {
    await db.from("dispo_offers").update({ status: "versendet", sent_at: new Date().toISOString() }).eq("id", offer.id);
    await db.from("dispo_orders").update({ status: "angebot_versendet" }).eq("id", order.id);
    toast.success("Als versendet markiert");
    load();
  };

  return (
    <div className="dispo-root min-h-screen bg-[hsl(var(--dispo-bg))] p-4">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex flex-wrap gap-2 print:hidden">
          <button className="dispo-btn dispo-btn-ghost" onClick={() => navigate("/dispo/angebote")}>
            <ArrowLeft className="h-4 w-4" /> Zurück
          </button>
          <button className="dispo-btn dispo-btn-ghost" onClick={save}><Save className="h-4 w-4" /> Speichern</button>
          <button className="dispo-btn dispo-btn-ghost" onClick={markSent}><Send className="h-4 w-4" /> Als versendet markieren</button>
          <button className="dispo-btn dispo-btn-primary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Als PDF speichern / drucken
          </button>
        </div>

        <div className="dispo-card grid gap-3 p-4 md:grid-cols-4 print:hidden">
          <Field label="Preis netto (€)">
            <input className="dispo-input" type="number" value={offer.price_net} onChange={(e) => setOffer({ ...offer, price_net: e.target.value })} />
          </Field>
          <Field label="MwSt. (%)">
            <input className="dispo-input" type="number" value={offer.vat_rate} onChange={(e) => setOffer({ ...offer, vat_rate: e.target.value })} />
          </Field>
          <Field label="Neukundenrabatt (%)">
            <input className="dispo-input" type="number" value={offer.discount_percent ?? 0} onChange={(e) => setOffer({ ...offer, discount_percent: e.target.value })} />
          </Field>
          <Field label="Gültig bis">
            <input className="dispo-input" type="date" value={offer.valid_until ?? ""} onChange={(e) => setOffer({ ...offer, valid_until: e.target.value })} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Enthaltene Leistungen">
              <textarea className="dispo-input" value={offer.inclusions ?? ""} onChange={(e) => setOffer({ ...offer, inclusions: e.target.value })} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Hinweise">
              <textarea className="dispo-input" value={offer.notes ?? ""} onChange={(e) => setOffer({ ...offer, notes: e.target.value })} />
            </Field>
          </div>
        </div>

        <div className="dispo-print-sheet rounded-xl bg-white p-8 shadow-sm">
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

          <h1 className="mt-6 text-xl font-bold">Angebot {offer.offer_number}</h1>
          <p className="text-sm text-gray-600">
            Auftrag {order.order_number} · Datum {dateDE(String(offer.created_at).slice(0, 10))}
            {offer.valid_until ? ` · gültig bis ${dateDE(offer.valid_until)}` : ""}
          </p>

          <div className="mt-6 grid gap-6 text-sm md:grid-cols-2">
            <div>
              <div className="mb-1 font-semibold">Kunde</div>
              <div>{order.company ?? ""}</div>
              <div>{order.customer_name}</div>
              <div>{order.email ?? ""}</div>
              <div>{order.phone ?? ""}</div>
            </div>
            <div>
              <div className="mb-1 font-semibold">Fahrtbeschreibung</div>
              <div>{order.origin ?? "?"} → {order.destination ?? "?"}</div>
              <div>Hinfahrt: {dateDE(order.departure_date)} {timeDE(order.departure_time)}</div>
              <div>Rückfahrt: {order.return_date ? `${dateDE(order.return_date)} ${timeDE(order.return_time)}` : "–"}</div>
              <div>Personen: {order.passengers}</div>
              <div>Kilometer: {order.distance_km ?? "–"}</div>
              {Array.isArray(order.waypoints) && order.waypoints.length > 0 && (
                <div>Zwischenstopps: {order.waypoints.map((w: any) => w.name).join(", ")}</div>
              )}
            </div>
          </div>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Position</th>
                <th className="py-2 text-right">Betrag</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">
                  Busreise {order.origin ?? ""} – {order.destination ?? ""} inkl. Fahrzeuggestellung und Fahrer
                </td>
                <td className="py-2 text-right">{eur(Number(offer.price_net))}</td>
              </tr>
              {discount > 0 && (
                <tr className="border-b">
                  <td className="py-2">Neukundenrabatt {discount} %</td>
                  <td className="py-2 text-right">−{eur(Number(offer.price_net) * (discount / 100))}</td>
                </tr>
              )}
              <tr className="border-b">
                <td className="py-2">Summe netto</td>
                <td className="py-2 text-right">{eur(net)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">MwSt. {offer.vat_rate} %</td>
                <td className="py-2 text-right">{eur(vat)}</td>
              </tr>
              <tr>
                <td className="py-2 text-base font-bold">Gesamtpreis brutto</td>
                <td className="py-2 text-right text-base font-bold">{eur(gross)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 text-sm">
            <div className="font-semibold">Enthaltene Leistungen</div>
            <p className="whitespace-pre-wrap">{offer.inclusions ?? "Fahrzeuggestellung, Fahrerkosten, Kraftstoff, Maut, Versicherung"}</p>
          </div>

          {offer.notes && (
            <div className="mt-4 text-sm">
              <div className="font-semibold">Hinweise</div>
              <p className="whitespace-pre-wrap">{offer.notes}</p>
            </div>
          )}

          <p className="mt-8 text-xs text-gray-500">
            Es gelten unsere Allgemeinen Geschäftsbedingungen. Angebot freibleibend. Lenk- und Ruhezeiten werden nach den gesetzlichen Vorgaben eingehalten.
          </p>
        </div>
      </div>
    </div>
  );
}
