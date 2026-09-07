import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Save, FileText, Info, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Field } from "./ui";
import { STATUS_ORDER, STATUS_CONFIG, SOURCES } from "../lib/status";
import { calculate, CalcInput, DEFAULT_CALC, checkDrivingTime } from "../lib/calc";
import { detectConflicts } from "../lib/conflicts";
import type { DispoOrder, DispoDriver } from "../hooks/useDispoData";
import { eur } from "../lib/format";

const db = supabase as any;

export interface OrderDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  order: Partial<DispoOrder> | null;
  orders: DispoOrder[];
  buses: any[];
  drivers: DispoDriver[];
  onSaved: () => void;
}

const emptyOrder: Partial<DispoOrder> = {
  customer_name: "",
  passengers: 0,
  status: "anfrage",
  source: "manuell",
  vat_rate: 19,
  waypoints: [],
};

export default function OrderDialog({ open, onOpenChange, order, orders, buses, drivers, onSaved }: OrderDialogProps) {
  const [f, setF] = useState<any>(emptyOrder);
  const [calc, setCalc] = useState<CalcInput>(DEFAULT_CALC);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const base = { ...emptyOrder, ...(order ?? {}) };
    setF(base);
    setCalc({
      ...DEFAULT_CALC,
      ...(order?.calculation ?? {}),
      km: Number(order?.distance_km ?? order?.calculation?.km ?? 0),
      passengers: Number(order?.passengers ?? 0),
      vatRate: Number(order?.vat_rate ?? 19),
    });
  }, [open, order]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const setCalcVal = (k: keyof CalcInput, v: number) => setCalc((p) => ({ ...p, [k]: v }));

  const result = useMemo(() => calculate(calc), [calc]);
  const driversAssigned = [f.driver_user_id, f.second_driver_user_id].filter(Boolean).length || 1;
  const driving = useMemo(
    () => checkDrivingTime(Number(f.distance_km ?? calc.km ?? 0), driversAssigned),
    [f.distance_km, calc.km, driversAssigned],
  );

  const conflicts = useMemo(() => {
    if (!f.departure_date) return [];
    const draft = { ...f, id: f.id ?? "draft", order_number: f.order_number ?? "Neuer Auftrag" } as DispoOrder;
    const list = orders.filter((o) => o.id !== draft.id).concat(draft);
    return detectConflicts(list, buses).filter((c) => c.orderId === draft.id || c.otherOrderId === draft.id);
  }, [f, orders, buses]);

  const save = async () => {
    if (!f.customer_name?.trim()) {
      toast.error("Bitte einen Kundennamen angeben.");
      return;
    }
    setSaving(true);
    const payload: any = {
      customer_name: f.customer_name,
      company: f.company || null,
      email: f.email || null,
      phone: f.phone || null,
      passengers: Number(f.passengers) || 0,
      origin: f.origin || null,
      destination: f.destination || null,
      waypoints: typeof f.waypoints === "string"
        ? f.waypoints.split("\n").filter(Boolean).map((n: string) => ({ name: n.trim() }))
        : f.waypoints ?? [],
      departure_date: f.departure_date || null,
      departure_time: f.departure_time || null,
      return_date: f.return_date || null,
      return_time: f.return_time || null,
      distance_km: f.distance_km === "" || f.distance_km == null ? null : Number(f.distance_km),
      duration_min: f.duration_min === "" || f.duration_min == null ? null : Number(f.duration_min),
      bus_id: f.bus_id || null,
      driver_user_id: f.driver_user_id || null,
      second_driver_user_id: f.second_driver_user_id || null,
      price_net: Number(f.price_net) || 0,
      vat_rate: Number(f.vat_rate) || 19,
      price_gross: Number(f.price_gross) || 0,
      platform_fee: Number(f.platform_fee) || 0,
      payout: Number(f.payout) || 0,
      estimated_cost: Number(f.estimated_cost) || 0,
      margin: Number(f.margin) || 0,
      calculation: calc,
      luggage: f.luggage || null,
      requirements: f.requirements || null,
      notes: f.notes || null,
      status: f.status || "anfrage",
      source: f.source || "manuell",
    };

    const res = f.id
      ? await db.from("dispo_orders").update(payload).eq("id", f.id).select("id").maybeSingle()
      : await db.from("dispo_orders").insert(payload).select("id").maybeSingle();

    setSaving(false);
    if (res.error) {
      toast.error(`Speichern fehlgeschlagen: ${res.error.message}`);
      return;
    }
    toast.success(f.id ? "Auftrag aktualisiert" : "Auftrag angelegt");
    onSaved();
    onOpenChange(false);
  };

  const applyCalc = () => {
    set("price_net", Number(result.priceNet.toFixed(2)));
    set("price_gross", Number(result.priceGross.toFixed(2)));
    set("platform_fee", Number(result.platformFee.toFixed(2)));
    set("payout", Number(result.payout.toFixed(2)));
    set("estimated_cost", Number(result.totalCost.toFixed(2)));
    set("margin", Number(result.margin.toFixed(2)));
    set("distance_km", calc.km);
    toast.success("Kalkulation in den Auftrag übernommen");
  };

  const createOffer = async () => {
    if (!f.id) {
      toast.error("Bitte den Auftrag zuerst speichern.");
      return;
    }
    const { data, error } = await db
      .from("dispo_offers")
      .insert({
        order_id: f.id,
        price_net: Number(f.price_net) || 0,
        vat_rate: Number(f.vat_rate) || 19,
        price_gross: Number(f.price_gross) || 0,
        valid_until: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        inclusions: "Fahrzeuggestellung, Fahrerkosten, Kraftstoff, Maut, Versicherung",
        status: "entwurf",
      })
      .select("id")
      .maybeSingle();
    if (error) {
      toast.error(error.message);
      return;
    }
    await db.from("dispo_orders").update({ status: "angebot_erstellt" }).eq("id", f.id);
    toast.success("Angebot erstellt");
    onSaved();
    navigate(`/dispo/angebot/${data.id}`);
  };

  const removeOrder = async () => {
    if (!f.id) return;
    const { error } = await db.from("dispo_orders").delete().eq("id", f.id);
    if (error) return toast.error(error.message);
    toast.success("Auftrag gelöscht");
    onSaved();
    onOpenChange(false);
  };

  const waypointText = Array.isArray(f.waypoints)
    ? f.waypoints.map((w: any) => w?.name ?? "").filter(Boolean).join("\n")
    : f.waypoints ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dispo-root max-h-[92vh] max-w-5xl overflow-y-auto bg-white p-0">
        <DialogHeader className="border-b px-5 py-4" style={{ borderColor: "hsl(var(--dispo-border))" }}>
          <DialogTitle className="text-base dispo-strong">
            {f.order_number ? `Auftrag ${f.order_number}` : "Neuer Auftrag"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 p-5">
          {(conflicts.length > 0 || driving.warnings.length > 0) && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" /> Prüfhinweise der Konfliktprüfung
              </div>
              <ul className="list-disc space-y-0.5 pl-5">
                {conflicts.map((c, i) => (
                  <li key={i}>{c.message}</li>
                ))}
                {driving.warnings.map((w, i) => (
                  <li key={`d${i}`}>{w}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs">Hinweis: automatische Prüfung, keine rechtsverbindliche Bewertung.</p>
            </div>
          )}

          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide dispo-muted">Kunde</legend>
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Kunde *"><input className="dispo-input" value={f.customer_name ?? ""} onChange={(e) => set("customer_name", e.target.value)} /></Field>
              <Field label="Firma / Verein"><input className="dispo-input" value={f.company ?? ""} onChange={(e) => set("company", e.target.value)} /></Field>
              <Field label="E-Mail"><input className="dispo-input" type="email" value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
              <Field label="Telefon"><input className="dispo-input" value={f.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide dispo-muted">Fahrt</legend>
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Personen"><input className="dispo-input" type="number" value={f.passengers ?? 0} onChange={(e) => set("passengers", e.target.value)} /></Field>
              <Field label="Abfahrtsort"><input className="dispo-input" value={f.origin ?? ""} onChange={(e) => set("origin", e.target.value)} /></Field>
              <Field label="Ziel"><input className="dispo-input" value={f.destination ?? ""} onChange={(e) => set("destination", e.target.value)} /></Field>
              <Field label="Kilometer"><input className="dispo-input" type="number" value={f.distance_km ?? ""} onChange={(e) => set("distance_km", e.target.value)} /></Field>
              <Field label="Hinfahrt Datum"><input className="dispo-input" type="date" value={f.departure_date ?? ""} onChange={(e) => set("departure_date", e.target.value)} /></Field>
              <Field label="Abfahrtszeit"><input className="dispo-input" type="time" value={(f.departure_time ?? "").slice(0, 5)} onChange={(e) => set("departure_time", e.target.value)} /></Field>
              <Field label="Rückfahrt Datum"><input className="dispo-input" type="date" value={f.return_date ?? ""} onChange={(e) => set("return_date", e.target.value)} /></Field>
              <Field label="Rückfahrtszeit"><input className="dispo-input" type="time" value={(f.return_time ?? "").slice(0, 5)} onChange={(e) => set("return_time", e.target.value)} /></Field>
              <Field label="Fahrzeit (Minuten)"><input className="dispo-input" type="number" value={f.duration_min ?? ""} onChange={(e) => set("duration_min", e.target.value)} /></Field>
              <div className="md:col-span-3">
                <Field label="Zwischenstopps (eine Station pro Zeile)">
                  <textarea className="dispo-input min-h-[42px]" rows={2} value={waypointText} onChange={(e) => set("waypoints", e.target.value)} />
                </Field>
              </div>
              <Field label="Gepäck"><input className="dispo-input" value={f.luggage ?? ""} onChange={(e) => set("luggage", e.target.value)} /></Field>
              <div className="md:col-span-3">
                <Field label="Besondere Anforderungen / Fahrzeugwünsche">
                  <input className="dispo-input" value={f.requirements ?? ""} onChange={(e) => set("requirements", e.target.value)} />
                </Field>
              </div>
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-xs dispo-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Geschätzte Lenkzeit {driving.drivingHours.toFixed(1)} h · Pausen mind. {driving.requiredBreaksMin} min. {driving.hints[driving.hints.length - 1]}
            </p>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide dispo-muted">Disposition</legend>
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Bus">
                <select className="dispo-input" value={f.bus_id ?? ""} onChange={(e) => set("bus_id", e.target.value)}>
                  <option value="">– nicht zugewiesen –</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} · {b.total_seats} Plätze</option>
                  ))}
                </select>
              </Field>
              <Field label="Fahrer">
                <select className="dispo-input" value={f.driver_user_id ?? ""} onChange={(e) => set("driver_user_id", e.target.value)}>
                  <option value="">– nicht zugewiesen –</option>
                  {drivers.map((d) => <option key={d.user_id} value={d.user_id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Zweiter Fahrer">
                <select className="dispo-input" value={f.second_driver_user_id ?? ""} onChange={(e) => set("second_driver_user_id", e.target.value)}>
                  <option value="">– keiner –</option>
                  {drivers.map((d) => <option key={d.user_id} value={d.user_id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className="dispo-input" value={f.status ?? "anfrage"} onChange={(e) => set("status", e.target.value)}>
                  {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                </select>
              </Field>
              <Field label="Quelle der Anfrage">
                <select className="dispo-input" value={f.source ?? "manuell"} onChange={(e) => set("source", e.target.value)}>
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide dispo-muted">Kalkulation</legend>
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Kilometer"><input className="dispo-input" type="number" value={calc.km} onChange={(e) => setCalcVal("km", Number(e.target.value))} /></Field>
              <Field label="Verbrauch (l/100 km)"><input className="dispo-input" type="number" value={calc.consumption} onChange={(e) => setCalcVal("consumption", Number(e.target.value))} /></Field>
              <Field label="Dieselpreis (€/l)"><input className="dispo-input" type="number" step="0.01" value={calc.dieselPrice} onChange={(e) => setCalcVal("dieselPrice", Number(e.target.value))} /></Field>
              <Field label="Fahreranzahl"><input className="dispo-input" type="number" value={calc.drivers} onChange={(e) => setCalcVal("drivers", Number(e.target.value))} /></Field>
              <Field label="Fahrerkosten (€/Tag)"><input className="dispo-input" type="number" value={calc.driverCostPerDay} onChange={(e) => setCalcVal("driverCostPerDay", Number(e.target.value))} /></Field>
              <Field label="Einsatztage"><input className="dispo-input" type="number" value={calc.days} onChange={(e) => setCalcVal("days", Number(e.target.value))} /></Field>
              <Field label="Maut (€)"><input className="dispo-input" type="number" value={calc.toll} onChange={(e) => setCalcVal("toll", Number(e.target.value))} /></Field>
              <Field label="Parkkosten (€)"><input className="dispo-input" type="number" value={calc.parking} onChange={(e) => setCalcVal("parking", Number(e.target.value))} /></Field>
              <Field label="Sonstige Kosten (€)"><input className="dispo-input" type="number" value={calc.otherCost} onChange={(e) => setCalcVal("otherCost", Number(e.target.value))} /></Field>
              <Field label="Marge (%)"><input className="dispo-input" type="number" value={calc.marginPercent} onChange={(e) => setCalcVal("marginPercent", Number(e.target.value))} /></Field>
              <Field label="Plattformgebühr (%)"><input className="dispo-input" type="number" value={calc.platformFeePercent} onChange={(e) => setCalcVal("platformFeePercent", Number(e.target.value))} /></Field>
              <Field label="MwSt. (%)"><input className="dispo-input" type="number" value={calc.vatRate} onChange={(e) => setCalcVal("vatRate", Number(e.target.value))} /></Field>
            </div>
            <div className="mt-3 grid gap-2 rounded-lg bg-[hsl(var(--dispo-bg))] p-3 text-sm md:grid-cols-4">
              <div>Diesel: <b>{eur(result.diesel)}</b></div>
              <div>Gesamtkosten: <b>{eur(result.totalCost)}</b></div>
              <div>Netto: <b>{eur(result.priceNet)}</b></div>
              <div>Brutto: <b>{eur(result.priceGross)}</b></div>
              <div>Plattformgebühr: <b>{eur(result.platformFee)}</b></div>
              <div>Auszahlung: <b>{eur(result.payout)}</b></div>
              <div>Deckungsbeitrag: <b>{eur(result.margin)}</b></div>
              <div>Gewinn/Person: <b>{eur(result.profitPerPerson)}</b></div>
            </div>
            <button type="button" className="dispo-btn dispo-btn-ghost mt-2" onClick={applyCalc}>
              Kalkulation übernehmen
            </button>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide dispo-muted">Preise & Notizen</legend>
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Preis netto (€)"><input className="dispo-input" type="number" value={f.price_net ?? 0} onChange={(e) => set("price_net", e.target.value)} /></Field>
              <Field label="MwSt. (%)"><input className="dispo-input" type="number" value={f.vat_rate ?? 19} onChange={(e) => set("vat_rate", e.target.value)} /></Field>
              <Field label="Preis brutto (€)"><input className="dispo-input" type="number" value={f.price_gross ?? 0} onChange={(e) => set("price_gross", e.target.value)} /></Field>
              <Field label="Plattformgebühren (€)"><input className="dispo-input" type="number" value={f.platform_fee ?? 0} onChange={(e) => set("platform_fee", e.target.value)} /></Field>
              <Field label="Auszahlung (€)"><input className="dispo-input" type="number" value={f.payout ?? 0} onChange={(e) => set("payout", e.target.value)} /></Field>
              <Field label="Geschätzte Kosten (€)"><input className="dispo-input" type="number" value={f.estimated_cost ?? 0} onChange={(e) => set("estimated_cost", e.target.value)} /></Field>
              <Field label="Deckungsbeitrag (€)"><input className="dispo-input" type="number" value={f.margin ?? 0} onChange={(e) => set("margin", e.target.value)} /></Field>
            </div>
            <div className="mt-3">
              <Field label="Notizen">
                <textarea className="dispo-input min-h-[70px]" value={f.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
              </Field>
            </div>
          </fieldset>
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t bg-white px-5 py-3" style={{ borderColor: "hsl(var(--dispo-border))" }}>
          <button className="dispo-btn dispo-btn-primary" onClick={save} disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? "Speichern…" : "Speichern"}
          </button>
          {f.id && (
            <button className="dispo-btn dispo-btn-ghost" onClick={createOffer}>
              <FileText className="h-4 w-4" /> Angebot erstellen
            </button>
          )}
          <div className="ml-auto" />
          {f.id && (
            <button className="dispo-btn dispo-btn-ghost text-red-600" onClick={removeOrder}>
              <Trash2 className="h-4 w-4" /> Löschen
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
