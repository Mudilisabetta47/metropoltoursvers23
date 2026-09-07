import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DispoLayout from "../DispoLayout";
import { EmptyState } from "../components/ui";
import { useDispoData } from "../hooks/useDispoData";
import { dateDE, eur } from "../lib/format";

const OFFER_STATUS: Record<string, string> = {
  entwurf: "Entwurf",
  versendet: "Versendet",
  angenommen: "Angenommen",
  abgelehnt: "Abgelehnt",
};

export default function DispoOffers() {
  const { offers, orders, loading } = useDispoData();
  const navigate = useNavigate();
  const orderMap = useMemo(() => new Map(orders.map((o) => [o.id, o])), [orders]);

  return (
    <DispoLayout title="Angebote" subtitle={`${offers.length} Angebote`}>
      {loading ? (
        <EmptyState text="Lade Angebote…" />
      ) : offers.length === 0 ? (
        <EmptyState text="Noch keine Angebote. Angebote werden direkt aus einem Auftrag erstellt." />
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
    </DispoLayout>
  );
}
