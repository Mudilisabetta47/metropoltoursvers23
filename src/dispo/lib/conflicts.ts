import type { DispoOrder } from "../hooks/useDispoData";

export interface Conflict {
  orderId: string;
  otherOrderId?: string;
  type: "bus_doppelt" | "fahrer_doppelt" | "ruhezeit" | "einsatzdauer" | "sitzplaetze" | "fahrzeug_status";
  severity: "warn" | "error";
  message: string;
}

const REST_HOURS = 11;

export function orderWindow(o: DispoOrder): { start: Date; end: Date } | null {
  if (!o.departure_date) return null;
  const start = new Date(`${o.departure_date}T${(o.departure_time ?? "00:00").slice(0, 5)}:00`);
  const endDate = o.return_date ?? o.departure_date;
  const endTime = (o.return_time ?? o.departure_time ?? "23:59").slice(0, 5);
  let end = new Date(`${endDate}T${endTime}:00`);
  if (end <= start) end = new Date(start.getTime() + 4 * 3600_000);
  return { start, end };
}

const overlaps = (a: { start: Date; end: Date }, b: { start: Date; end: Date }) =>
  a.start < b.end && b.start < a.end;

export function detectConflicts(orders: DispoOrder[], buses: any[]): Conflict[] {
  const out: Conflict[] = [];
  const relevant = orders.filter((o) => o.status !== "storniert" && o.departure_date);
  const busById = new Map(buses.map((b) => [b.id, b]));

  for (let i = 0; i < relevant.length; i++) {
    const a = relevant[i];
    const wa = orderWindow(a);
    if (!wa) continue;

    const bus = a.bus_id ? busById.get(a.bus_id) : null;
    if (bus) {
      if (bus.total_seats && a.passengers > bus.total_seats) {
        out.push({
          orderId: a.id,
          type: "sitzplaetze",
          severity: "error",
          message: `${a.passengers} Personen, aber ${bus.name} hat nur ${bus.total_seats} Sitzplätze.`,
        });
      }
      if (bus.is_active === false) {
        out.push({
          orderId: a.id,
          type: "fahrzeug_status",
          severity: "error",
          message: `Fahrzeug ${bus.name} ist nicht verfügbar (inaktiv/Werkstatt).`,
        });
      }
    }

    const hours = (wa.end.getTime() - wa.start.getTime()) / 3600_000;
    const driverCount = [a.driver_user_id, a.second_driver_user_id].filter(Boolean).length;
    if (hours > 13 && driverCount < 2) {
      out.push({
        orderId: a.id,
        type: "einsatzdauer",
        severity: "warn",
        message: `Einsatzdauer ca. ${hours.toFixed(1)} h mit nur einem Fahrer – Doppelbesatzung prüfen.`,
      });
    }

    for (let j = i + 1; j < relevant.length; j++) {
      const b = relevant[j];
      const wb = orderWindow(b);
      if (!wb) continue;

      if (a.bus_id && a.bus_id === b.bus_id && overlaps(wa, wb)) {
        out.push({
          orderId: a.id,
          otherOrderId: b.id,
          type: "bus_doppelt",
          severity: "error",
          message: `Bus doppelt gebucht: ${a.order_number} und ${b.order_number} überschneiden sich.`,
        });
      }

      const driversA = [a.driver_user_id, a.second_driver_user_id].filter(Boolean) as string[];
      const driversB = [b.driver_user_id, b.second_driver_user_id].filter(Boolean) as string[];
      const shared = driversA.filter((d) => driversB.includes(d));
      if (shared.length) {
        if (overlaps(wa, wb)) {
          out.push({
            orderId: a.id,
            otherOrderId: b.id,
            type: "fahrer_doppelt",
            severity: "error",
            message: `Fahrer doppelt eingeplant: ${a.order_number} und ${b.order_number}.`,
          });
        } else {
          const gap =
            wa.start > wb.end
              ? (wa.start.getTime() - wb.end.getTime()) / 3600_000
              : (wb.start.getTime() - wa.end.getTime()) / 3600_000;
          if (gap < REST_HOURS) {
            out.push({
              orderId: a.id,
              otherOrderId: b.id,
              type: "ruhezeit",
              severity: "warn",
              message: `Nur ${gap.toFixed(1)} h zwischen ${a.order_number} und ${b.order_number} – Ruhezeit von 11 h nicht eingehalten.`,
            });
          }
        }
      }
    }
  }
  return out;
}
