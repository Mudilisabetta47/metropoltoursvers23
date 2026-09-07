/** Preiskalkulation für Busaufträge (Metropol Tours). */

export interface CalcInput {
  km: number;
  consumption: number; // l / 100 km
  dieselPrice: number; // € / l
  drivers: number;
  driverCostPerDay: number;
  days: number;
  toll: number;
  parking: number;
  otherCost: number;
  marginPercent: number;
  platformFeePercent: number;
  vatRate: number;
  passengers: number;
}

export interface CalcResult {
  diesel: number;
  driverCost: number;
  totalCost: number;
  priceNet: number;
  vat: number;
  priceGross: number;
  platformFee: number;
  payout: number;
  margin: number;
  profitPerPerson: number;
  marginPercentReal: number;
}

export const DEFAULT_CALC: CalcInput = {
  km: 0,
  consumption: 40,
  dieselPrice: 2.2,
  drivers: 1,
  driverCostPerDay: 280,
  days: 1,
  toll: 0,
  parking: 0,
  otherCost: 0,
  marginPercent: 20,
  platformFeePercent: 0,
  vatRate: 19,
  passengers: 0,
};

export function calculate(i: CalcInput): CalcResult {
  const diesel = (i.km * i.consumption) / 100 * i.dieselPrice;
  const driverCost = i.drivers * i.driverCostPerDay * Math.max(1, i.days);
  const totalCost = diesel + driverCost + i.toll + i.parking + i.otherCost;
  const priceNet = totalCost * (1 + i.marginPercent / 100);
  const vat = priceNet * (i.vatRate / 100);
  const priceGross = priceNet + vat;
  const platformFee = priceGross * (i.platformFeePercent / 100);
  const payout = priceGross - platformFee;
  const margin = priceNet - totalCost - platformFee;
  return {
    diesel,
    driverCost,
    totalCost,
    priceNet,
    vat,
    priceGross,
    platformFee,
    payout,
    margin,
    profitPerPerson: i.passengers > 0 ? margin / i.passengers : 0,
    marginPercentReal: priceNet > 0 ? (margin / priceNet) * 100 : 0,
  };
}

/** Grobe Lenkzeit-Einschätzung (keine Rechtsberatung, nur Prüfhinweis). */
export interface DrivingCheck {
  ok: boolean;
  warnings: string[];
  hints: string[];
  drivingHours: number;
  requiredBreaksMin: number;
}

export function checkDrivingTime(distanceKm: number, drivers: number, avgSpeed = 65): DrivingCheck {
  const drivingHours = distanceKm / avgSpeed;
  const breaks = Math.floor(drivingHours / 4.5) * 45;
  const warnings: string[] = [];
  const hints: string[] = [];

  if (drivingHours > 9 && drivers < 2) {
    warnings.push(
      `Geschätzte Lenkzeit ${drivingHours.toFixed(1)} h überschreitet die Tageslenkzeit von 9 h – zweiter Fahrer oder Übernachtung nötig.`,
    );
  } else if (drivingHours > 8 && drivers < 2) {
    hints.push(`Lenkzeit nahe am Tageslimit (${drivingHours.toFixed(1)} h). Verlängerung auf 10 h ist nur 2× pro Woche zulässig.`);
  }
  if (drivingHours > 18 && drivers < 2) {
    warnings.push("Einsatzdauer nur im Doppelbesatzung-Betrieb realistisch.");
  }
  if (breaks > 0) hints.push(`Mindestens ${breaks} Minuten Lenkzeitunterbrechung einplanen (45 min je 4,5 h).`);
  hints.push("Nach dem Einsatz sind grundsätzlich 11 h Ruhezeit (verkürzt 9 h) einzuhalten.");

  return { ok: warnings.length === 0, warnings, hints, drivingHours, requiredBreaksMin: breaks };
}
