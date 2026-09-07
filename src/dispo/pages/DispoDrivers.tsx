import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DispoLayout from "../DispoLayout";
import { EmptyState, Section, StatusChip } from "../components/ui";
import { useDispoData } from "../hooks/useDispoData";
import { detectConflicts } from "../lib/conflicts";
import { dateDE, isoDate, timeDE } from "../lib/format";

const db = supabase as any;
const DAYS = 14;

export default function DispoDrivers() {
  const { drivers, orders, buses, loading } = useDispoData();
  const [licenses, setLicenses] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await db.from("driver_licenses").select("*");
      setLicenses(data ?? []);
    })();
  }, []);

  const today = isoDate(new Date());
  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => isoDate(new Date(Date.now() + i * 86400000))), []);
  const conflicts = useMemo(() => detectConflicts(orders, buses), [orders, buses]);

  const rows = useMemo(
    () =>
      drivers.map((d) => {
        const own = orders.filter(
          (o) => (o.driver_user_id === d.user_id || o.second_driver_user_id === d.user_id) && o.status !== "storniert",
        );
        const upcoming = own.filter((o) => (o.departure_date ?? "") >= today);
        const lic = licenses.find((l: any) => l.user_id === d.user_id || l.driver_user_id === d.user_id);
        const restWarn = conflicts.some((c) => c.type === "ruhezeit" && own.some((o) => o.id === c.orderId || o.id === c.otherOrderId));
        const activeToday = own.filter((o) => o.departure_date === today);
        return { d, own, upcoming, lic, restWarn, activeToday };
      }),
    [drivers, orders, licenses, conflicts, today],
  );

  return (
    <DispoLayout title="Fahrerverwaltung" subtitle={`${drivers.length} Fahrer`}>
      {loading ? <EmptyState text="Lade Fahrer…" /> : rows.length === 0 ? <EmptyState text="Keine Fahrer mit Fahrerrolle gefunden." /> : (
        <div className="space-y-4">
          <div className="dispo-card overflow-x-auto">
            <table className="dispo-table">
              <thead>
                <tr>
                  <th>Name</th><th>Telefon</th><th>Führerscheinklasse</th><th>Fahrerkarte</th><th>Gültig bis</th>
                  <th>Heute im Einsatz</th><th>Geplante Fahrten</th><th>Verfügbarkeit</th><th>Ruhezeit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ d, upcoming, lic, restWarn, activeToday }) => (
                  <tr key={d.user_id}>
                    <td className="font-medium dispo-strong">{d.name}</td>
                    <td>{d.phone ?? "–"}</td>
                    <td>{lic?.license_class ?? "D"}</td>
                    <td>{lic?.card_number ?? lic?.driver_card_number ?? "–"}</td>
                    <td>{lic?.expires_at ? dateDE(String(lic.expires_at).slice(0, 10)) : "–"}</td>
                    <td>{activeToday.length ? `${activeToday.length} Fahrt(en)` : "–"}</td>
                    <td>{upcoming.length}</td>
                    <td>
                      <span className="dispo-chip" style={activeToday.length
                        ? { color: "#1e40af", background: "#dbeafe" }
                        : { color: "#065f46", background: "#d1fae5" }}>
                        {activeToday.length ? "im Einsatz" : "verfügbar"}
                      </span>
                    </td>
                    <td>{restWarn ? <span className="dispo-chip" style={{ color: "#92400e", background: "#fef3c7" }}>Warnung</span> : "ok"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Section title={`Fahrerkalender · nächste ${DAYS} Tage`}>
            <div className="overflow-x-auto p-3">
              <table className="dispo-table min-w-[900px]">
                <thead>
                  <tr>
                    <th>Fahrer</th>
                    {days.map((d) => <th key={d} className="text-center text-xs">{d.slice(8)}.{d.slice(5, 7)}.</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ d, own }) => (
                    <tr key={d.user_id}>
                      <td className="whitespace-nowrap font-medium dispo-strong">{d.name}</td>
                      {days.map((day) => {
                        const o = own.find((x) => x.departure_date === day);
                        return (
                          <td key={day} className="text-center">
                            {o ? (
                              <span title={`${o.order_number} ${o.origin ?? ""} → ${o.destination ?? ""} ${timeDE(o.departure_time)}`}>
                                <StatusChip status={o.status} />
                              </span>
                            ) : <span className="dispo-muted">·</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      )}
    </DispoLayout>
  );
}
