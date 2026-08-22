import { useState } from "react";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import ConsentCheckbox from "@/components/common/ConsentCheckbox";
import { useToast } from "@/hooks/use-toast";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { supabase } from "@/integrations/supabase/client";

interface TourInquiryDialogProps {
  tourId: string;
  destination: string;
  departureDate?: string | null;
  participants?: number;
  totalPrice?: number;
  trigger?: React.ReactNode;
}

const TourInquiryDialog = ({
  tourId, destination, departureDate, participants = 1, totalPrice = 0, trigger,
}: TourInquiryDialogProps) => {
  const { toast } = useToast();
  const { protect } = useRecaptcha();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [inquiryNumber, setInquiryNumber] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    participants, message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      toast({ title: "Zustimmung erforderlich", description: "Bitte AGB und Datenschutzerklärung akzeptieren.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const human = await protect("tour_inquiry");
      if (!human) {
        toast({ title: "Sicherheitsprüfung fehlgeschlagen", description: "Bitte erneut versuchen.", variant: "destructive" });
        return;
      }

      const { data: generatedNumber, error: numberError } = await supabase.rpc("generate_inquiry_number" as never);
      if (numberError) throw numberError;

      const { data: userData } = await supabase.auth.getUser();
      const price = totalPrice > 0 ? (totalPrice / Math.max(1, participants)) * form.participants : 0;

      const { error: insertError } = await supabase.from("package_tour_inquiries").insert({
        inquiry_number: generatedNumber as string,
        tour_id: tourId,
        destination,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone || null,
        participants: form.participants,
        message: form.message || null,
        total_price: Number(price.toFixed(2)),
        departure_date: departureDate || "auf Anfrage",
        user_id: userData?.user?.id || null,
        status: "pending",
      });
      if (insertError) throw insertError;

      supabase.functions.invoke("notify-inbox", {
        body: {
          type: "tour_inquiry",
          subject: `Reiseanfrage ${generatedNumber} – ${destination}`,
          body: [
            `Anfragenummer: ${generatedNumber}`,
            `Reise: ${destination}`,
            `Abfahrt: ${departureDate || "auf Anfrage"}`,
            `Name: ${form.firstName} ${form.lastName}`,
            `E-Mail: ${form.email}`,
            form.phone && `Telefon: ${form.phone}`,
            `Teilnehmer: ${form.participants}`,
            `Gesamtpreis (ca.): ${price.toFixed(2)} €`,
            form.message && `\nNachricht:\n${form.message}`,
          ].filter(Boolean).join("\n"),
          from_email: form.email,
          from_name: `${form.firstName} ${form.lastName}`,
          extra_cc: ["buchung@metours.de"],
        },
      }).catch((err) => console.warn("notify-inbox failed", err));

      setInquiryNumber(generatedNumber as string);
      toast({ title: "Anfrage gesendet!", description: `Ihre Anfragenummer: ${generatedNumber}` });
    } catch (error) {
      console.error("Inquiry error", error);
      toast({ title: "Fehler", description: "Anfrage konnte nicht gesendet werden. Bitte erneut versuchen.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setInquiryNumber(null);
    setConsent(false);
    setForm({ firstName: "", lastName: "", email: "", phone: "", participants, message: "" });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" variant="outline" className="w-full text-base font-semibold py-6">
            <Mail className="w-4 h-4 mr-2" />
            Unverbindlich anfragen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {inquiryNumber ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
            <DialogTitle>Anfrage eingegangen</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Ihre Anfragenummer: <span className="font-semibold text-foreground">{inquiryNumber}</span>
              <br />Wir melden uns innerhalb von 24 Stunden mit Ihrem persönlichen Angebot.
            </p>
            <Button className="w-full" onClick={() => setOpen(false)}>Schließen</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Reise anfragen: {destination}</DialogTitle>
              <DialogDescription>
                Unverbindliche Anfrage – wir prüfen Verfügbarkeit und senden Ihnen ein Angebot.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="inq-first">Vorname *</Label>
                  <Input id="inq-first" required value={form.firstName}
                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="inq-last">Nachname *</Label>
                  <Input id="inq-last" required value={form.lastName}
                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label htmlFor="inq-email">E-Mail *</Label>
                <Input id="inq-email" type="email" required value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="inq-phone">Telefon</Label>
                  <Input id="inq-phone" value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="inq-pax">Teilnehmer *</Label>
                  <Input id="inq-pax" type="number" min={1} max={90} required value={form.participants}
                    onChange={(e) => setForm((p) => ({ ...p, participants: parseInt(e.target.value) || 1 }))} />
                </div>
              </div>
              <div>
                <Label htmlFor="inq-msg">Nachricht (optional)</Label>
                <Textarea id="inq-msg" rows={3} value={form.message}
                  placeholder="Wunschtermin, Zustiegsort, besondere Wünsche…"
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} />
              </div>

              {departureDate && (
                <p className="text-sm text-muted-foreground">Gewünschter Termin: <span className="font-medium text-foreground">{departureDate}</span></p>
              )}

              <Separator />
              <ConsentCheckbox id="tour-inquiry-consent" checked={consent} onChange={setConsent} purpose="Anfrage" />

              <Button type="submit" size="lg" className="w-full" disabled={submitting || !consent}>
                {submitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Wird gesendet…</>) : "Anfrage absenden"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Unverbindlich & kostenlos – die Anfrage landet direkt in unserem Buchungssystem.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TourInquiryDialog;
