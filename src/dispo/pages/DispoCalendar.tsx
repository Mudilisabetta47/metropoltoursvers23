import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import DispoLayout from "../DispoLayout";
import OrderDialog from "../components/OrderDialog";
import { StatusChip, EmptyState } from "../components/ui";
import { useDispoData, busName, driverName, DispoOrder } from "../hooks/useDispoData";
import { statusOf } from "../lib/status";
import { dateDE, eur, isoDate, timeDE } from "../lib/format";

type View = "monat" | "woche" | "tag" | "liste";
const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const startOfWeek = (d: Date) => {
  const c = new Date(d);
  const day = (c.getDay() + 6) % 7;
  c.setDate(c.getDate() - day);
  c.setHours(0, 0, 0, 0);
  return c;
};

export default function DispoCalendar() {
  const { orders, buses, drivers, reload } = useDispoData();
  const [view, setView] = useState<View>("monat");
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<DispoOrder | null>(null);
  const [open, setOpen] = useState(false);

  const byDate = useMemo(() => {
    const m = new Map<string, DispoOrder[]>();
    orders.forEach((o) => {
      if (!o.departure_date) return;
      const list = m.get(o.departure_date) ?? [];
      list.push(o);
      m.set(o.departure_date, list);
    });
    return m;
  }, [orders]);

  const openOrder = (o: DispoOrder | null) => {
    setSelected(o);
    setOpen(true);
  };

  const shift = (dir: number) => {
    const c = new Date(cursor);
    if (view === "monat") c.setMonth(c.getMonth() + dir);
    else if (view === "woche") c.setDate(c.getDate() + dir * 7);
    else c.setDate(c.getDate() + dir);
    setCursor(c);
  };

  const eventCard = (o: DispoOrder) => {
    const s = statusOf(o.status);
    return (
      <button
        key={o.id}
        className="dispo-cal-event"
        style={{ color: s.color, background: s.bg }}
        onClick={() => openOrder(o)}
        title={`${o.order_number} · ${o.customer_name}`}
      >
        {timeDE(o.departure_time)} {o.customer_name} · {o.passengers}P
      </button>
    );
  };

  const renderMonth = () => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(first);
    const cells = Array.from({ length: 42 }, (_, i) => new Date(start.getTime() + i * 86400000));
    return (
      <div>
        <div className="grid grid-cols-7 text-xs font-semibold dispo-muted">
          {WEEKDAYS.map((d) => <div key={d} className="px-2 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d) => {
            const key = isoDate(d);
            const list = byDate.get(key) ?? [];
            return (
              <div key={key} className="dispo-cal-cell p-1" data-outside={d.getMonth() !== cursor.getMonth()}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className={key === isoDate(new Date()) ? "rounded bg-[hsl(var(--dispo-green-800))] px-1.5 text-white" : "dispo-muted"}>
                    {d.getDate()}
                  </span>
                  <button className="opacity-40 hover:opacity-100" onClick={() => openOrder({ departure_date: key } as any)}>
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                {list.map(eventCard)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeek = () => {
    const start = startOfWeek(cursor);
    const days = Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * 86400000));
    return (
      <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
        {days.map((d) => {
          const key = isoDate(d);
          const list = byDate.get(key) ?? [];
          return (
            <div key={key} className="dispo-card p-2">
              <div className="mb-2 text-xs font-semibold dispo-strong">
                {WEEKDAYS[(d.getDay() + 6) % 7]} {d.getDate()}.{d.getMonth() + 1}.
              </div>
              {list.length === 0 ? <p className="text-xs dispo-muted">–</p> : list.map(eventCard)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDay = () => {
    const key = isoDate(cursor);
    const list = byDate.get(key) ?? [];
    if (!list.length) return <EmptyState text="Keine Aufträge an diesem Tag." />;
    return (
      <div className="space-y-2">
        {list.map((o) => (
          <button key={o.id} className="dispo-card block w-full p-3 text-left" onClick={() => openOrder(o)}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold dispo-strong">{o.order_number}</span>
              <StatusChip status={o.status} />
              <span className="ml-auto text-sm font-semibold">{eur(o.price_gross)}</span>
            </div>
            <div className="mt-1 grid gap-1 text-sm md:grid-cols-4">
              <div>{o.customer_name}{o.company ? ` (${o.company})` : ""}</div>
              <div>{o.origin ?? "?"} → {o.destination ?? "?"}</div>
              <div>Ab {timeDE(o.departure_time)} · Rück {o.return_date ? `${dateDE(o.return_date)} ${timeDE(o.return_time)}` : "–"}</div>
              <div>{o.passengers} Pers. · {busName(buses, o.bus_id) ?? "kein Bus"} · {driverName(drivers, o.driver_user_id) ?? "kein Fahrer"}</div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderList = () => (
    <div className="dispo-card overflow-x-auto">
      <table className="dispo-table">
        <thead>
          <tr>
            <th>Datum</th><th>Auftrag</th><th>Kunde</th><th>Strecke</th><th>Ab</th><th>Rück</th>
            <th>Pers.</th><th>Bus</th><th>Fahrer</th><th>Status</th><th>Preis</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="cursor-pointer" onClick={() => openOrder(o)}>
              <td>{dateDE(o.departure_date)}</td>
              <td className="font-medium">{o.order_number}</td>
              <td>{o.customer_name}</td>
              <td>{o.origin ?? "?"} → {o.destination ?? "?"}</td>
              <td>{timeDE(o.departure_time)}</td>
              <td>{o.return_date ? `${dateDE(o.return_date)} ${timeDE(o.return_time)}` : "–"}</td>
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
  );

  const label =
    view === "monat"
      ? cursor.toLocaleDateString("de-DE", { month: "long", year: "numeric" })
      : view === "woche"
        ? `KW ab ${dateDE(isoDate(startOfWeek(cursor)))}`
        : dateDE(isoDate(cursor));

  return (
    <DispoLayout
      title="Dispo-Kalender"
      subtitle={label}
      actions={
        <button className="dispo-btn dispo-btn-primary" onClick={() => openOrder(null)}>
          <Plus className="h-4 w-4" /> Auftrag
        </button>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <button className="dispo-btn dispo-btn-ghost" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></button>
          <button className="dispo-btn dispo-btn-ghost" onClick={() => setCursor(new Date())}>Heute</button>
          <button className="dispo-btn dispo-btn-ghost" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="ml-auto flex gap-1">
          {(["monat", "woche", "tag", "liste"] as View[]).map((v) => (
            <button
              key={v}
              className={`dispo-btn ${view === v ? "dispo-btn-primary" : "dispo-btn-ghost"}`}
              onClick={() => setView(v)}
            >
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {view === "monat" && renderMonth()}
      {view === "woche" && renderWeek()}
      {view === "tag" && renderDay()}
      {view === "liste" && renderList()}

      <OrderDialog
        open={open}
        onOpenChange={setOpen}
        order={selected}
        orders={orders}
        buses={buses}
        drivers={drivers}
        onSaved={reload}
      />
    </DispoLayout>
  );
}
