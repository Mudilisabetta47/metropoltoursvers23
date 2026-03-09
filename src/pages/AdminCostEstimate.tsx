import { useState, useRef } from "react";
import { Calculator, Download, Plus, Trash2, Fuel, Route, Users, Percent, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

interface CostLine {
  id: string;
  label: string;
  amount: number;
}

const AdminCostEstimate = () => {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // Customer / meta
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [tripDescription, setTripDescription] = useState("");
  const [validDays, setValidDays] = useState(14);

  // Route
  const [distanceKm, setDistanceKm] = useState(0);
  const [returnTrip, setReturnTrip] = useState(true);
  const [tollCosts, setTollCosts] = useState(0);

  // Diesel
  const [dieselPricePerLiter, setDieselPricePerLiter] = useState(1.65);
  const [consumptionPer100km, setConsumptionPer100km] = useState(30);

  // Driver / Staff
  const [driverDays, setDriverDays] = useState(1);
  const [driverDailyRate, setDriverDailyRate] = useState(250);
  const [secondDriver, setSecondDriver] = useState(false);

  // Extras
  const [extraLines, setExtraLines] = useState<CostLine[]>([]);

  // Margin
  const [marginType, setMarginType] = useState<"percent" | "fixed">("percent");
  const [marginValue, setMarginValue] = useState(15);

  // Calculations
  const totalKm = returnTrip ? distanceKm * 2 : distanceKm;
  const fuelCost = (totalKm / 100) * consumptionPer100km * dieselPricePerLiter;
  const driverCost = driverDailyRate * driverDays * (secondDriver ? 2 : 1);
  const extrasCost = extraLines.reduce((s, l) => s + l.amount, 0);
  const subtotal = fuelCost + tollCosts + driverCost + extrasCost;
  const marginAmount = marginType === "percent" ? subtotal * (marginValue / 100) : marginValue;
  const netTotal = subtotal + marginAmount;
  const taxAmount = netTotal * 0.19;
  const grossTotal = netTotal + taxAmount;

  const addExtraLine = () => {
    setExtraLines(prev => [...prev, { id: crypto.randomUUID(), label: "", amount: 0 }]);
  };

  const updateExtraLine = (id: string, field: "label" | "amount", value: string | number) => {
    setExtraLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeExtraLine = (id: string) => {
    setExtraLines(prev => prev.filter(l => l.id !== id));
  };

  const generatePDF = () => {
    const date = new Date().toLocaleDateString("de-DE");
    const validUntil = new Date(Date.now() + validDays * 86400000).toLocaleDateString("de-DE");

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; }
  .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #059669; padding-bottom: 20px; }
  .logo { font-size: 24px; font-weight: bold; color: #059669; }
  .meta { text-align: right; font-size: 12px; color: #666; }
  h1 { font-size: 22px; margin: 20px 0 10px; }
  .customer { background: #f8f8f8; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  th { text-align: left; padding: 8px 12px; background: #f0fdf4; border-bottom: 2px solid #059669; font-size: 13px; }
  td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
  .amount { text-align: right; font-weight: 600; }
  .total-row td { border-top: 2px solid #059669; font-weight: bold; font-size: 15px; }
  .footer { margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 15px; }
  .highlight { background: #f0fdf4; }
</style>
</head><body>
<div class="header">
  <div class="logo">METROPOL TOURS</div>
  <div class="meta">
    Kostenvoranschlag<br>
    Datum: ${date}<br>
    Gültig bis: ${validUntil}
  </div>
</div>
${customerName ? `<div class="customer"><strong>${customerName}</strong>${customerEmail ? `<br>${customerEmail}` : ""}</div>` : ""}
${tripDescription ? `<p><strong>Beschreibung:</strong> ${tripDescription}</p>` : ""}
<h1>Kalkulation</h1>
<table>
  <tr><th>Position</th><th>Details</th><th class="amount">Betrag</th></tr>
  <tr><td>Strecke</td><td>${totalKm} km ${returnTrip ? "(Hin & Zurück)" : "(Einfach)"}</td><td class="amount">–</td></tr>
  <tr><td>Kraftstoff (Diesel)</td><td>${consumptionPer100km} L/100km × ${dieselPricePerLiter.toFixed(2)} €/L</td><td class="amount">${fuelCost.toFixed(2)} €</td></tr>
  ${tollCosts > 0 ? `<tr><td>Maut / Gebühren</td><td></td><td class="amount">${tollCosts.toFixed(2)} €</td></tr>` : ""}
  <tr><td>Fahrerpersonal</td><td>${secondDriver ? "2 Fahrer" : "1 Fahrer"} × ${driverDays} Tag(e) × ${driverDailyRate.toFixed(2)} €</td><td class="amount">${driverCost.toFixed(2)} €</td></tr>
  ${extraLines.filter(l => l.label).map(l => `<tr><td>${l.label}</td><td></td><td class="amount">${Number(l.amount).toFixed(2)} €</td></tr>`).join("")}
  <tr class="highlight"><td colspan="2"><strong>Zwischensumme</strong></td><td class="amount"><strong>${subtotal.toFixed(2)} €</strong></td></tr>
  <tr><td>Marge / Aufschlag</td><td>${marginType === "percent" ? `${marginValue}%` : "Pauschal"}</td><td class="amount">${marginAmount.toFixed(2)} €</td></tr>
  <tr class="highlight"><td colspan="2"><strong>Netto</strong></td><td class="amount"><strong>${netTotal.toFixed(2)} €</strong></td></tr>
  <tr><td>MwSt. (19%)</td><td></td><td class="amount">${taxAmount.toFixed(2)} €</td></tr>
  <tr class="total-row"><td colspan="2">Gesamtbetrag (brutto)</td><td class="amount">${grossTotal.toFixed(2)} €</td></tr>
</table>
<div class="footer">
  <p>Dieser Kostenvoranschlag ist unverbindlich und ${validDays} Tage gültig. Preisänderungen bei Diesel und Maut vorbehalten.</p>
  <p>METROPOL TOURS – Ihr Partner für Gruppenreisen</p>
</div>
</body></html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
    toast({ title: "✅ Kostenvoranschlag erstellt" });
  };

  return (
    <AdminLayout
      title="Kostenvoranschlag"
      subtitle="Kalkulation für Gruppenbuchungen & Charterfahrten"
      actions={
        <Button onClick={generatePDF} className="bg-emerald-600 hover:bg-emerald-700">
          <FileText className="w-4 h-4 mr-2" /> PDF erstellen
        </Button>
      }
    >
      <div ref={printRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer info */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-400 flex items-center gap-2"><Users className="w-4 h-4" /> Kunde / Anfrage</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400 text-xs">Kundenname</Label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Firma / Name" className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">E-Mail</Label>
                <Input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="email@beispiel.de" className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-zinc-400 text-xs">Beschreibung / Strecke</Label>
                <Textarea value={tripDescription} onChange={e => setTripDescription(e.target.value)} placeholder="z.B. Stuttgart → Kroatien, 3 Tage Gruppenreise..." className="bg-zinc-800 border-zinc-700 text-white" rows={2} />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Gültigkeit (Tage)</Label>
                <Input type="number" value={validDays} onChange={e => setValidDays(Number(e.target.value))} className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
            </CardContent>
          </Card>

          {/* Route & Diesel */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-400 flex items-center gap-2"><Route className="w-4 h-4" /> Strecke & Kraftstoff</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-zinc-400 text-xs">Entfernung (km, einfach)</Label>
                  <Input type="number" value={distanceKm || ""} onChange={e => setDistanceKm(Number(e.target.value))} placeholder="0" className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Hin & Zurück?</Label>
                  <Select value={returnTrip ? "yes" : "no"} onValueChange={v => setReturnTrip(v === "yes")}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="yes" className="text-white">Ja (×2)</SelectItem>
                      <SelectItem value="no" className="text-white">Nein (einfach)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Maut / Gebühren (€)</Label>
                  <Input type="number" value={tollCosts || ""} onChange={e => setTollCosts(Number(e.target.value))} placeholder="0" className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
              </div>

              <Separator className="bg-zinc-800" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-zinc-400 text-xs flex items-center gap-1"><Fuel className="w-3 h-3" /> Dieselpreis (€/L)</Label>
                  <Input type="number" step="0.01" value={dieselPricePerLiter} onChange={e => setDieselPricePerLiter(Number(e.target.value))} className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Verbrauch (L/100km)</Label>
                  <Input type="number" value={consumptionPer100km} onChange={e => setConsumptionPer100km(Number(e.target.value))} className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Gesamt km</Label>
                  <div className="h-10 flex items-center px-3 bg-zinc-800/50 border border-zinc-700 rounded-md text-emerald-400 font-bold">
                    {totalKm} km
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver costs */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-400 flex items-center gap-2"><Users className="w-4 h-4" /> Fahrer- / Personalkosten</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-zinc-400 text-xs">Einsatztage</Label>
                <Input type="number" value={driverDays} onChange={e => setDriverDays(Number(e.target.value))} className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Tagessatz pro Fahrer (€)</Label>
                <Input type="number" value={driverDailyRate} onChange={e => setDriverDailyRate(Number(e.target.value))} className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Zweiter Fahrer?</Label>
                <Select value={secondDriver ? "yes" : "no"} onValueChange={v => setSecondDriver(v === "yes")}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="no" className="text-white">Nein</SelectItem>
                    <SelectItem value="yes" className="text-white">Ja (+100%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Extra positions */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-zinc-400">Zusätzliche Positionen</CardTitle>
                <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 h-7 text-xs" onClick={addExtraLine}>
                  <Plus className="w-3 h-3 mr-1" /> Position
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {extraLines.length === 0 && <p className="text-zinc-500 text-xs text-center py-2">Keine zusätzlichen Positionen</p>}
              {extraLines.map(line => (
                <div key={line.id} className="flex items-center gap-2">
                  <Input value={line.label} onChange={e => updateExtraLine(line.id, "label", e.target.value)} placeholder="Beschreibung" className="bg-zinc-800 border-zinc-700 text-white flex-1" />
                  <Input type="number" value={line.amount || ""} onChange={e => updateExtraLine(line.id, "amount", Number(e.target.value))} placeholder="0 €" className="bg-zinc-800 border-zinc-700 text-white w-28" />
                  <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300 h-9 w-9" onClick={() => removeExtraLine(line.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Margin */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-400 flex items-center gap-2"><Percent className="w-4 h-4" /> Marge / Aufschlag</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400 text-xs">Art</Label>
                <Select value={marginType} onValueChange={v => setMarginType(v as "percent" | "fixed")}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="percent" className="text-white">Prozent (%)</SelectItem>
                    <SelectItem value="fixed" className="text-white">Pauschalbetrag (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">{marginType === "percent" ? "Aufschlag (%)" : "Aufschlag (€)"}</Label>
                <Input type="number" value={marginValue} onChange={e => setMarginValue(Number(e.target.value))} className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Live summary */}
        <div className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 sticky top-6">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                <Calculator className="w-4 h-4" /> Kalkulation Live
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Strecke</span>
                  <span className="text-white">{totalKm} km</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Kraftstoff</span>
                  <span className="text-white">{fuelCost.toFixed(2)} €</span>
                </div>
                {tollCosts > 0 && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Maut</span>
                    <span className="text-white">{tollCosts.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Fahrer</span>
                  <span className="text-white">{driverCost.toFixed(2)} €</span>
                </div>
                {extraLines.filter(l => l.amount > 0).map(l => (
                  <div key={l.id} className="flex justify-between text-zinc-400">
                    <span className="truncate max-w-[140px]">{l.label || "Zusatz"}</span>
                    <span className="text-white">{Number(l.amount).toFixed(2)} €</span>
                  </div>
                ))}

                <Separator className="bg-zinc-700" />

                <div className="flex justify-between text-zinc-300 font-medium">
                  <span>Zwischensumme</span>
                  <span>{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Marge ({marginType === "percent" ? `${marginValue}%` : "pauschal"})</span>
                  <span className="text-amber-400">+{marginAmount.toFixed(2)} €</span>
                </div>

                <Separator className="bg-zinc-700" />

                <div className="flex justify-between text-zinc-300 font-medium">
                  <span>Netto</span>
                  <span>{netTotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>MwSt. (19%)</span>
                  <span>{taxAmount.toFixed(2)} €</span>
                </div>

                <Separator className="bg-emerald-600/50" />

                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">Gesamt (brutto)</span>
                  <span className="text-emerald-400">{grossTotal.toFixed(2)} €</span>
                </div>
              </div>

              {/* Cost per km */}
              <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg space-y-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Kosten/km (netto)</span>
                  <span className="text-white">{totalKm > 0 ? (netTotal / totalKm).toFixed(2) : "0.00"} €</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Kraftstoffkosten/km</span>
                  <span className="text-white">{totalKm > 0 ? (fuelCost / totalKm).toFixed(2) : "0.00"} €</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Liter gesamt</span>
                  <span className="text-white">{((totalKm / 100) * consumptionPer100km).toFixed(1)} L</span>
                </div>
              </div>

              <Button onClick={generatePDF} className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4">
                <Download className="w-4 h-4 mr-2" /> PDF erstellen & drucken
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCostEstimate;
