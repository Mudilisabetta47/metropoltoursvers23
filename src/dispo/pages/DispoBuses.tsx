import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DispoLayout from "../DispoLayout";
import { EmptyState } from "../components/ui";
import { useDispoData } from "../hooks/useDispoData";
import { dateDE, isoDate } from "../lib/format";

const db = supabase as any;

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  verfügbar: { color: "#065f46", bg: "#d1fae5" },
  reserviert: { color: "#92400e", bg: "#fef3c7" },
  unterwegs: { color: "#1e40af", bg: "#dbeafe" },
  Werkstatt: { color: "#9a3412", bg: "#ffedd5" },
  gesperrt: { color: "#991b1b", bg: "#fee2e2" },
};

export default function DispoBuses() {
  const { buses, orders, loading } = useDispoData();
  const [compliance, setCompliance] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [c, m] = await Promise.all([
        db.from("fleet_compliance").select("*"),
        db.from("fleet_maintenance").select("*"),
      ]);
      setCompliance(c.data ?? []);
      setMaintenance(m.data ?? []);
    })();
  }, []);

  const today = isoDate(new Date());

  const rows = useMemo(
    () =>
      buses.map((b: any) => {
        const busOrders = orders.filter((o) => o.bus_id === b.id && o.status !== "storniert");
        const todayOrder = busOrders.find((o) => o.departure_date === today);
        const futureOrder = busOrders.find((o) => (o.departure_date ?? "") > today);
        const inShop = maintenance.some((m: any) => m.bus_id === b.id && ["geplant", "offen", "in_arbeit"].includes(m.status));
        const status = b.is_active === false ? "gesperrt" : inShop ? "Werkstatt" : todayOrder ? "unterwegs" : futureOrder ? "reserviert" : "verfügbar";
        const hu = compliance
          .filter((c: any) => c.bus_id === b.id && /hu|tüv|tuv/i.test(c.type ?? c.category ?? ""))
          .sort((a: any, z: any) => String(a.due_date).localeCompare(String(z.due_date)))[0];
        const nextService = maintenance
          .filter((m: any) => m.bus_id === b.id)
          .sort((a: any, z: any) => String(a.scheduled_date ?? a.due_date).localeCompare(String(z.scheduled_date ?? z.due_date)))[0];
        return { b, status, hu, nextService, upcoming: busOrders.filter((o) => (o.departure_date ?? "") >= today).length };
      }),
    [buses, orders, compliance, maintenance, today],
  );

  return (
    <DispoLayout title="Busverwaltung" subtitle={`${buses.length} Fahrzeuge · Stammdaten werden im Backend gepflegt`}>
      {loading ? <EmptyState text="Lade Fahrzeuge…" /> : rows.length === 0 ? <EmptyState text="Keine Fahrzeuge angelegt." /> : (
        <div className="dispo-card overflow-x-auto">
          <table className="dispo-table">
            <thead>
              <tr>
                <th>Bus</th><th>Kennzeichen</th><th>Sitzplätze</th><th>Achsen</th><th>Höhe / Gewicht</th>
                <th>Antrieb</th><th>Status</th><th>HU fällig</th><th>Nächste Wartung</th><th>Geplante Fahrten</th><th>Besonderheiten</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ b, status, hu, nextService, upcoming }) => {
                const s = STATUS_STYLE[status] ?? STATUS_STYLE["verfügbar"];
                return (
                  <tr key={b.id}>
                    <td className="font-medium dispo-strong">{b.name}</td>
                    <td>{b.license_plate}</td>
                    <td>{b.total_seats}</td>
                    <td>{b.axles ?? "–"}</td>
                    <td>{b.height_cm ? `${b.height_cm} cm` : "–"} / {b.weight_kg ? `${b.weight_kg} kg` : "–"}</td>
                    <td>{b.fuel_type ?? "–"} {b.emission_class ? `· ${b.emission_class}` : ""}</td>
                    <td><span className="dispo-chip" style={{ color: s.color, background: s.bg }}>{status}</span></td>
                    <td>{hu?.due_date ? dateDE(hu.due_date) : "–"}</td>
                    <td>{nextService?.scheduled_date ? dateDE(nextService.scheduled_date) : "–"}</td>
                    <td>{upcoming}</td>
                    <td className="max-w-[220px] truncate text-xs dispo-muted">{(b.amenities ?? []).join(", ")}{b.routing_notes ? ` · ${b.routing_notes}` : ""}</td>
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
