import { useState, useEffect } from "react";
import {
  Plus, Trash2, Download, Save, Euro, Calculator,
  FileText, X, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OfferItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sort_order: number;
}

interface OfferBuilderProps {
  inquiryId: string;
  customerName: string;
  customerEmail: string;
  destination: string;
  departureDate: string;
  participants: number;
  totalPrice: number;
  tourId: string;
  onClose: () => void;
  onOfferSaved: () => void;
}

const defaultItems: Omit<OfferItem, "id">[] = [
  { description: "Busfahrt hin und zurück", quantity: 1, unit_price: 0, total_price: 0, sort_order: 0 },
  { description: "Hotel — Übernachtung mit Frühstück", quantity: 1, unit_price: 0, total_price: 0, sort_order: 1 },
];

const OfferBuilder = ({
  inquiryId, customerName, customerEmail, destination,
  departureDate, participants, totalPrice, tourId, onClose, onOfferSaved,
}: OfferBuilderProps) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [items, setItems] = useState<OfferItem[]>(
    defaultItems.map((item, i) => ({ ...item, id: `new-${i}` }))
  );
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState("");
  const [validDays, setValidDays] = useState(14);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [savedOfferId, setSavedOfferId] = useState<string | null>(null);
  const [pax, setPax] = useState(participants);

  // Try loading tour data for price hints
  useEffect(() => {
    loadTourPrices();
  }, [tourId]);

  const loadTourPrices = async () => {
    try {
      const { data: tour } = await supabase
        .from('package_tours')
        .select('price_from, included_services')
        .eq('id', tourId)
        .maybeSingle();

      if (tour) {
        // Pre-fill with tour base price distributed across items
        const basePP = tour.price_from || 0;
        // Rough split: 40% bus, 60% hotel
        setItems(prev => prev.map(item => {
          if (item.description.includes("Busfahrt")) {
            const up = Math.round(basePP * 0.4);
            return { ...item, unit_price: up, quantity: pax, total_price: up * pax };
          }
          if (item.description.includes("Hotel")) {
            const up = Math.round(basePP * 0.6);
            return { ...item, unit_price: up, quantity: pax, total_price: up * pax };
          }
          return item;
        }));
      }
    } catch (e) {
      // silently fail — user can enter manually
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const discountAmt = discountPercent > 0 ? Math.round(subtotal * discountPercent / 100) : 0;
  const total = subtotal - discountAmt;

  const updateItem = (id: string, field: keyof OfferItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === "quantity" || field === "unit_price") {
        updated.total_price = Number(updated.quantity) * Number(updated.unit_price);
      }
      return updated;
    }));
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: `new-${Date.now()}`,
      description: "",
      quantity: pax,
      unit_price: 0,
      total_price: 0,
      sort_order: prev.length,
    }]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const saveOffer = async () => {
    if (items.some(i => !i.description.trim())) {
      toast({ title: "Bitte alle Positionen ausfüllen", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validDays);

      const { data: offer, error: offerErr } = await supabase
        .from('tour_offers')
        .insert({
          inquiry_id: inquiryId,
          customer_name: customerName,
          customer_email: customerEmail,
          destination,
          departure_date: departureDate,
          participants: pax,
          subtotal,
          discount_percent: discountPercent,
          discount_amount: discountAmt,
          total,
          notes: notes || null,
          valid_until: validUntil.toISOString().split('T')[0],
          status: 'draft',
          created_by: user?.id || null,
        } as never)
        .select('id, offer_number')
        .single();

      if (offerErr) throw offerErr;

      // Insert line items
      const lineItems = items.map((item, i) => ({
        offer_id: offer.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        sort_order: i,
      }));

      const { error: itemsErr } = await supabase
        .from('tour_offer_items')
        .insert(lineItems as never);

      if (itemsErr) throw itemsErr;

      setSavedOfferId(offer.id);
      toast({ title: "Angebot gespeichert", description: `Nr. ${offer.offer_number}` });

      // Also log a note on the inquiry
      await supabase.from('tour_customer_notes').insert({
        customer_email: customerEmail,
        note: `[Angebot] Angebot ${offer.offer_number} erstellt — ${total.toLocaleString('de-DE')}€ für ${pax} Personen`,
        created_by: user?.id || null,
      });

      onOfferSaved();
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const generatePdf = async () => {
    if (!savedOfferId) {
      toast({ title: "Bitte zuerst speichern", variant: "destructive" });
      return;
    }
    setIsGeneratingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-offer-pdf', {
        body: { offerId: savedOfferId },
      });
      if (error) throw error;

      // Download the PDF
      if (data?.pdf) {
        const binary = atob(data.pdf);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Angebot_${destination.replace(/\s+/g, '_')}_${customerName.replace(/\s+/g, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "PDF heruntergeladen" });
      }
    } catch (error) {
      console.error('PDF error:', error);
      toast({ title: "Fehler bei der PDF-Erstellung", variant: "destructive" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Angebot kalkulieren</h2>
          <p className="text-xs text-zinc-500">{customerName} · {destination} · {departureDate}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-zinc-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Meta Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs text-zinc-400">Teilnehmer</Label>
          <Input
            type="number" min={1} value={pax}
            onChange={e => {
              const newPax = parseInt(e.target.value) || 1;
              setPax(newPax);
              setItems(prev => prev.map(item => ({
                ...item,
                quantity: newPax,
                total_price: newPax * item.unit_price,
              })));
            }}
            className="mt-1 bg-zinc-800 border-zinc-700 text-white"
          />
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Rabatt %</Label>
          <Input
            type="number" min={0} max={100} value={discountPercent}
            onChange={e => setDiscountPercent(parseFloat(e.target.value) || 0)}
            className="mt-1 bg-zinc-800 border-zinc-700 text-white"
          />
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Gültig (Tage)</Label>
          <Input
            type="number" min={1} value={validDays}
            onChange={e => setValidDays(parseInt(e.target.value) || 14)}
            className="mt-1 bg-zinc-800 border-zinc-700 text-white"
          />
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Anfrage-Preis</Label>
          <div className="mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-400">
            {totalPrice.toLocaleString('de-DE')}€
          </div>
        </div>
      </div>

      {/* Line Items */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Positionen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 text-[10px] text-zinc-500 uppercase font-semibold px-1">
            <div className="col-span-5">Beschreibung</div>
            <div className="col-span-2 text-center">Menge</div>
            <div className="col-span-2 text-right">Einzelpreis</div>
            <div className="col-span-2 text-right">Gesamt</div>
            <div className="col-span-1" />
          </div>

          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <Input
                  value={item.description}
                  onChange={e => updateItem(item.id, "description", e.target.value)}
                  placeholder="Position beschreiben..."
                  className="text-xs bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number" min={1} value={item.quantity}
                  onChange={e => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                  className="text-xs text-center bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number" min={0} step={0.01} value={item.unit_price}
                  onChange={e => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                  className="text-xs text-right bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="col-span-2 text-right text-sm font-semibold text-zinc-200 pr-1">
                {item.total_price.toLocaleString('de-DE')}€
              </div>
              <div className="col-span-1 flex justify-center">
                <button onClick={() => removeItem(item.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          <Button variant="ghost" size="sm" onClick={addItem} className="text-xs text-zinc-400 hover:text-white">
            <Plus className="w-3 h-3 mr-1" /> Position hinzufügen
          </Button>

          <Separator className="bg-zinc-800" />

          {/* Totals */}
          <div className="space-y-1 pl-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Zwischensumme</span>
              <span className="text-zinc-200 font-medium">{subtotal.toLocaleString('de-DE')}€</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Rabatt ({discountPercent}%)</span>
                <span className="text-red-400 font-medium">-{discountAmt.toLocaleString('de-DE')}€</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-1">
              <span className="text-white">Gesamtpreis</span>
              <span className="text-emerald-400">{total.toLocaleString('de-DE')}€</span>
            </div>
            <div className="text-[10px] text-zinc-500">
              = {pax > 0 ? Math.round(total / pax).toLocaleString('de-DE') : 0}€ pro Person
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <div>
        <Label className="text-xs text-zinc-400">Anmerkungen zum Angebot</Label>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="z.B. Sonderwünsche, inkludierte Extras, Zahlungsbedingungen..."
          className="mt-1 text-xs min-h-[60px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={saveOffer} disabled={isSaving || items.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
          {isSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
          {savedOfferId ? "Aktualisieren" : "Angebot speichern"}
        </Button>
        <Button onClick={generatePdf} disabled={!savedOfferId || isGeneratingPdf} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
          {isGeneratingPdf ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
          PDF herunterladen
        </Button>
      </div>
    </div>
  );
};

export default OfferBuilder;
