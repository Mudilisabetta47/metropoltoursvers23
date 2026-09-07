import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import DispoLayout from "../DispoLayout";
import OrderDialog from "../components/OrderDialog";
import { StatusChip, EmptyState } from "../components/ui";
import { useDispoData, busName, driverName, DispoOrder } from "../hooks/useDispoData";
import { STATUS_ORDER, STATUS_CONFIG } from "../lib/status";
import { dateDE, eur, timeDE } from "../lib/format";

export default function DispoOrders() {
  const { orders, buses, drivers, loading, reload } = useDispoData();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [selected, setSelected] = useState<DispoOrder | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = params.get("id");
    if (!id || !orders.length) return;
    const found = orders.find((o) => o.id === id);
    if (found) {
      setSelected(found);
      setOpen(true);
      params.delete("id");
      setParams(params, { replace: true });
    }
  }, [params, orders, setParams]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (status && o.status !== status) return false;
      if (!term) return true;
      return [o.order_number, o.customer_name, o.company, o.email, o.phone, o.origin, o.destination]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [orders, q, status]);

  return (
    <DispoLayout
      title="Aufträge"
      subtitle={`${filtered.length} von ${orders.length} Aufträgen`}
      actions={
        <button className="dispo-btn dispo-btn-primary" onClick={() => { setSelected(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Neuer Auftrag
        </button>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
          <input className="dispo-input pl-9" placeholder="Suche nach Auftrag, Kunde, Strecke…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="dispo-input max-w-[220px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Alle Status</option>
          {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
      </div>

      {loading ? (
        <EmptyState text="Lade Aufträge…" />
      ) : filtered.length === 0 ? (
        <EmptyState text="Keine Aufträge gefunden." />
      ) : (
        <div className="dispo-card overflow-x-auto">
          <table className="dispo-table">
            <thead>
              <tr>
                <th>Auftrag</th><th>Kunde</th><th>Strecke</th><th>Hinfahrt</th><th>Rückfahrt</th>
                <th>Pers.</th><th>Bus</th><th>Fahrer</th><th>Quelle</th><th>Status</th><th>Brutto</th><th>DB</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="cursor-pointer" onClick={() => { setSelected(o); setOpen(true); }}>
                  <td className="font-medium dispo-strong">{o.order_number}</td>
                  <td>{o.customer_name}{o.company ? <span className="block text-xs dispo-muted">{o.company}</span> : null}</td>
                  <td>{o.origin ?? "?"} → {o.destination ?? "?"}</td>
                  <td>{dateDE(o.departure_date)} {timeDE(o.departure_time)}</td>
                  <td>{o.return_date ? `${dateDE(o.return_date)} ${timeDE(o.return_time)}` : "–"}</td>
                  <td>{o.passengers}</td>
                  <td>{busName(buses, o.bus_id) ?? "–"}</td>
                  <td>{driverName(drivers, o.driver_user_id) ?? "–"}</td>
                  <td className="text-xs dispo-muted">{o.source}</td>
                  <td><StatusChip status={o.status} /></td>
                  <td>{eur(o.price_gross)}</td>
                  <td>{eur(o.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <OrderDialog open={open} onOpenChange={setOpen} order={selected} orders={orders} buses={buses} drivers={drivers} onSaved={reload} />
    </DispoLayout>
  );
}
