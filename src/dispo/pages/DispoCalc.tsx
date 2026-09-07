import { useMemo, useState } from "react";
import DispoLayout from "../DispoLayout";
import { Field, Section } from "../components/ui";
import { calculate, CalcInput, DEFAULT_CALC, checkDrivingTime } from "../lib/calc";
import { eur } from "../lib/format";

export default function DispoCalc() {
  const [c, setC] = useState<CalcInput>({ ...DEFAULT_CALC, km: 838, consumption: 40, dieselPrice: 2.2, drivers: 2, passengers: 40 });
  const set = (k: keyof CalcInput, v: number) => setC((p) => ({ ...p, [k]: v }));
  const r = useMemo(() => calculate(c), [c]);
  const driving = useMemo(() => checkDrivingTime(c.km, c.drivers), [c.km, c.drivers]);

  const rows: [string, string][] = [
    ["Diesel", eur(r.diesel)],
    ["Fahrerkosten", eur(r.driverCost)],
    ["Maut / Park / Sonstiges", eur(r.toll + r.parking + r.otherCost)],
    ["Gesamtkosten", eur(r.totalCost)],
    ["Nettoverkaufspreis", eur(r.priceNet)],
    ["MwSt.", eur(r.vat)],
    ["Bruttoverkaufspreis", eur(r.priceGross)],
    ["Plattformgebühr", eur(r.platformFee)],
    ["Auszahlung", eur(r.payout)],
    ["Deckungsbeitrag", eur(r.margin)],
    ["Gewinn pro Person", eur(r.profitPerPerson)],
    ["Gewinn in Prozent", `${r.profitPercent.toFixed(1)} %`],
  ];

  return (
    <DispoLayout title="Preiskalkulation" subtitle="Kostenbasierte Angebotskalkulation">
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Eingaben">
          <div className="grid gap-3 p-4 md:grid-cols-2">
            <Field label="Kilometer"><input className="dispo-input" type="number" value={c.km} onChange={(e) => set("km", Number(e.target.value))} /></Field>
            <Field label="Verbrauch (l/100 km)"><input className="dispo-input" type="number" value={c.consumption} onChange={(e) => set("consumption", Number(e.target.value))} /></Field>
            <Field label="Dieselpreis (€/l)"><input className="dispo-input" type="number" step="0.01" value={c.dieselPrice} onChange={(e) => set("dieselPrice", Number(e.target.value))} /></Field>
            <Field label="Fahreranzahl"><input className="dispo-input" type="number" value={c.drivers} onChange={(e) => set("drivers", Number(e.target.value))} /></Field>
            <Field label="Fahrerkosten (€/Tag)"><input className="dispo-input" type="number" value={c.driverCostPerDay} onChange={(e) => set("driverCostPerDay", Number(e.target.value))} /></Field>
            <Field label="Einsatztage"><input className="dispo-input" type="number" value={c.days} onChange={(e) => set("days", Number(e.target.value))} /></Field>
            <Field label="Maut (€)"><input className="dispo-input" type="number" value={c.toll} onChange={(e) => set("toll", Number(e.target.value))} /></Field>
            <Field label="Parkkosten (€)"><input className="dispo-input" type="number" value={c.parking} onChange={(e) => set("parking", Number(e.target.value))} /></Field>
            <Field label="Sonstige Kosten (€)"><input className="dispo-input" type="number" value={c.otherCost} onChange={(e) => set("otherCost", Number(e.target.value))} /></Field>
            <Field label="Gewünschte Marge (%)"><input className="dispo-input" type="number" value={c.marginPercent} onChange={(e) => set("marginPercent", Number(e.target.value))} /></Field>
            <Field label="Plattformgebühr (%)"><input className="dispo-input" type="number" value={c.platformFeePercent} onChange={(e) => set("platformFeePercent", Number(e.target.value))} /></Field>
            <Field label="MwSt. (%)"><input className="dispo-input" type="number" value={c.vatRate} onChange={(e) => set("vatRate", Number(e.target.value))} /></Field>
            <Field label="Personen"><input className="dispo-input" type="number" value={c.passengers} onChange={(e) => set("passengers", Number(e.target.value))} /></Field>
          </div>
        </Section>

        <div className="space-y-4">
          <Section title="Ergebnis">
            <table className="dispo-table">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k}><td>{k}</td><td className="text-right font-semibold dispo-strong">{v}</td></tr>
                ))}
              </tbody>
            </table>
          </Section>
          <Section title="Lenk- und Ruhezeiten (Prüfhinweise)">
            <div className="space-y-1 p-4 text-sm">
              {driving.hints.map((h, i) => <p key={i}>• {h}</p>)}
              {driving.warnings.map((w, i) => <p key={`w${i}`} className="text-amber-700">⚠ {w}</p>)}
              <p className="pt-2 text-xs dispo-muted">Automatische Schätzung, keine rechtsverbindliche Bewertung.</p>
            </div>
          </Section>
        </div>
      </div>
    </DispoLayout>
  );
}
