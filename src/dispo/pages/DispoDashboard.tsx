import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Plus } from "lucide-react";
import DispoLayout from "../DispoLayout";
import { StatCard, Section, StatusChip, EmptyState } from "../components/ui";
import OrderDialog from "../components/OrderDialog";
import { useDispoData, busName, driverName } from "../hooks/useDispoData";
import { detectConflicts } from "../lib/conflicts";
import { eur, dateDE, isoDate, timeDE } from "../lib/format";
import { ACTIVE_STATUSES } from "../lib/status";

export default function DispoDashboard() {
  const { orders, buses, drivers, emails, loading, reload } = useDispoData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const today = isoDate(new Date());
    const now = new Date();
    const weekEnd = isoDate(new Date(now.getTime() + 7 * 86400000));
    const monthKey = today.slice(0, 7);

    const active = orders.filter((o) => o.status !== "storniert");
    const todayOrders = active.filter((o) => o.departure_date === today);
    const weekOrders = active.filter((o) => o.departure_date && o.departure_date >= today && o.departure_date <= weekEnd);
    const confirmed = active.filter((o) => ACTIVE_STATUSES.includes(o.status as any));
    const busyBusIds = new Set(todayOrders.map((o) => o.bus_id).filter(Boolean));
    const driversToday = new Set(
      todayOrders.flatMap((o) => [o.driver_user_id, o.second_driver_user_id]).filter(Boolean) as string[],
    );

    const expected = active
      .filter((o) => ["bestaetigt", "fahrer_zugeteilt"].includes(o.status))
      .reduce((s, o) => s + Number(o.price_gross ?? 0), 0);
    const revenueMonth = active
      .filter((o) => (o.departure_date ?? "").startsWith(monthKey))
      .reduce((s, o) => s + Number(o.price_gross ?? 0), 0);

    return {
      today: todayOrders.length,
      week: weekOrders.length,
      open: active.filter((o) => o.status === "anfrage").length,
      offers: active.filter((o) => ["angebot_erstellt", "angebot_versendet", "wartet_kunde"].includes(o.status)).length,
      confirmed: confirmed.length,
      busyBuses: busyBusIds.size,
      freeBuses: Math.max(0, buses.filter((b) => b.is_active !== false).length - busyBusIds.size),
      driversToday: driversToday.size,
      expected,
      revenueMonth,
      aiInbox: emails.filter((m) => m.is_inquiry && !m.order_id).length,
    };
  }, [orders, buses, emails]);

  const conflicts = useMemo(() => detectConflicts(orders, buses), [orders, buses]);
  const byType = (t: string) => conflicts.filter((c) => c.type === t).length;

  const upcoming = useMemo(
    () =>
      orders
        .filter((o) => o.departure_date && o.departure_date >= isoDate(new Date()) && o.status !== "storniert")
        .slice(0, 8),
    [orders],
  );

  return (
    <DispoLayout
      title="Dashboard"
      subtitle="Metropol Tours GmbH · Disposition"
      actions={
        <button className="dispo-btn dispo-btn-primary" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Neuer Auftrag
        </button>
      }
    >
      {loading ? (
        <EmptyState text="Daten werden geladen…" />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            <StatCard label="Aufträge heute" value={stats.today} onClick={() => navigate("/dispo/kalender")} />
            <StatCard label="Aufträge diese Woche" value={stats.week} onClick={() => navigate("/dispo/kalender")} />
            <StatCard label="Offene Anfragen" value={stats.open} tone={stats.open > 0 ? "warn" : "default"} onClick={() => navigate("/dispo/auftraege?status=anfrage")} />
            <StatCard label="Angebote in Bearbeitung" value={stats.offers} onClick={() => navigate("/dispo/angebote")} />
            <StatCard label="Bestätigte Fahrten" value={stats.confirmed} tone="good" onClick={() => navigate("/dispo/auftraege?status=bestaetigt")} />
            <StatCard label="KI-Anfragen im Postfach" value={stats.aiInbox} tone={stats.aiInbox > 0 ? "warn" : "default"} onClick={() => navigate("/dispo/postfach")} />
            <StatCard label="Fahrzeuge im Einsatz" value={stats.busyBuses} onClick={() => navigate("/dispo/busse")} />
            <StatCard label="Freie Fahrzeuge" value={stats.freeBuses} tone="good" onClick={() => navigate("/dispo/busse")} />
            <StatCard label="Eingesetzte Fahrer" value={stats.driversToday} onClick={() => navigate("/dispo/fahrer")} />
            <StatCard label="Erwarteter Umsatz" value={eur(stats.expected)} hint="bestätigte Fahrten" />
            <StatCard label="Umsatz laufender Monat" value={eur(stats.revenueMonth)} />
            <StatCard label="Warnungen gesamt" value={conflicts.length} tone={conflicts.length ? "warn" : "good"} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Section title="Nächste Fahrten">
                {upcoming.length === 0 ? (
                  <EmptyState text="Keine geplanten Fahrten." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="dispo-table">
                      <thead>
                        <tr>
                          <th>Datum</th><th>Auftrag</th><th>Kunde</th><th>Strecke</th>
                          <th>Pers.</th><th>Bus</th><th>Fahrer</th><th>Status</th><th>Preis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcoming.map((o) => (
                          <tr key={o.id} className="cursor-pointer" onClick={() => navigate(`/dispo/auftraege?id=${o.id}`)}>
                            <td>{dateDE(o.departure_date)} {timeDE(o.departure_time)}</td>
                            <td className="font-medium">{o.order_number}</td>
                            <td>{o.customer_name}</td>
                            <td>{o.origin ?? "?"} → {o.destination ?? "?"}</td>
                            <td>{o.passengers}</td>
                            <td>{busName(buses, o.bus_id) ?? "–"}</td>
                            <td>{driverName(drivers, o.driver_user_id) ?? "–"}</td>
                            <td><StatusChip status={o.status} /></td>
                            <td>{eur(o.price_gross)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            </div>

            <Section title="Warnungen">
              <div className="grid grid-cols-3 gap-2 p-3 text-center text-xs">
                <div className="rounded-lg bg-[hsl(var(--dispo-bg))] p-2">
                  <div className="text-lg font-bold">{byType("bus_doppelt")}</div>Terminüberschneidung Bus
                </div>
                <div className="rounded-lg bg-[hsl(var(--dispo-bg))] p-2">
                  <div className="text-lg font-bold">{byType("fahrer_doppelt")}</div>Fahrerüberschneidung
                </div>
                <div className="rounded-lg bg-[hsl(var(--dispo-bg))] p-2">
                  <div className="text-lg font-bold">{byType("ruhezeit")}</div>Fehlende Ruhezeit
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto px-3 pb-3">
                {conflicts.length === 0 ? (
                  <p className="p-3 text-sm dispo-muted">Keine Konflikte erkannt.</p>
                ) : (
                  conflicts.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(`/dispo/auftraege?id=${c.orderId}`)}
                      className="mb-2 flex w-full items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-left text-xs text-amber-900"
                    >
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {c.message}
                    </button>
                  ))
                )}
              </div>
            </Section>
          </div>
        </div>
      )}

      <OrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={null}
        orders={orders}
        buses={buses}
        drivers={drivers}
        onSaved={reload}
      />
    </DispoLayout>
  );
}
