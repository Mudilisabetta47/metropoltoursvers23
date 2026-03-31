import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertTriangle, UserCheck } from "lucide-react";

interface PassengerDetail {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  emergency_contact: string;
  emergency_phone: string;
}

const PassengerDataPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();

  const [status, setStatus] = useState<"loading" | "valid" | "expired" | "completed" | "error">("loading");
  const [booking, setBooking] = useState<any>(null);
  const [passengers, setPassengers] = useState<PassengerDetail[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    loadToken();
  }, [token]);

  const loadToken = async () => {
    const { data: tokenData, error } = await supabase
      .from("passenger_data_tokens" as any)
      .select("*")
      .eq("token", token!)
      .maybeSingle();

    if (error || !tokenData) { setStatus("error"); return; }
    const td = tokenData as any;

    if (td.completed_at) { setStatus("completed"); return; }
    if (new Date(td.expires_at) < new Date()) { setStatus("expired"); return; }

    // Load booking
    const { data: bookingData } = await supabase
      .from("tour_bookings")
      .select("booking_number, participants, passenger_details, contact_first_name, contact_last_name")
      .eq("id", td.booking_id)
      .single();

    if (!bookingData) { setStatus("error"); return; }

    setBooking({ ...bookingData, id: td.booking_id });

    // Initialize passenger forms
    const existing = Array.isArray(bookingData.passenger_details) ? bookingData.passenger_details : [];
    const pax: PassengerDetail[] = [];
    for (let i = 0; i < bookingData.participants; i++) {
      const ex = existing[i] as any || {};
      pax.push({
        first_name: ex.first_name || (i === 0 ? bookingData.contact_first_name : ""),
        last_name: ex.last_name || (i === 0 ? bookingData.contact_last_name : ""),
        date_of_birth: ex.date_of_birth || "",
        emergency_contact: ex.emergency_contact || "",
        emergency_phone: ex.emergency_phone || "",
      });
    }
    setPassengers(pax);
    setStatus("valid");
  };

  const updatePassenger = (idx: number, field: keyof PassengerDetail, value: string) => {
    setPassengers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async () => {
    // Validate
    const incomplete = passengers.some(p => !p.first_name.trim() || !p.last_name.trim() || !p.date_of_birth);
    if (incomplete) {
      toast({ title: "Bitte alle Namen und Geburtsdaten ausfüllen", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Update booking passenger_details
      await supabase
        .from("tour_bookings")
        .update({ passenger_details: passengers as any })
        .eq("id", booking.id);

      // Mark token as completed
      await supabase
        .from("passenger_data_tokens" as any)
        .update({ completed_at: new Date().toISOString() })
        .eq("token", token!);

      setStatus("completed");
      toast({ title: "✅ Daten gespeichert!" });
    } catch (err) {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    }
    setSaving(false);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-xl font-bold mb-2">Ungültiger Link</h1>
            <p className="text-zinc-500">Dieser Link ist ungültig. Bitte kontaktieren Sie uns.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
            <h1 className="text-xl font-bold mb-2">Link abgelaufen</h1>
            <p className="text-zinc-500">Dieser Link ist leider abgelaufen. Bitte kontaktieren Sie uns für einen neuen Link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
            <h1 className="text-xl font-bold mb-2">Daten vollständig!</h1>
            <p className="text-zinc-500">Vielen Dank! Alle Passagierdaten wurden erfolgreich gespeichert.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-emerald-700">METROPOL TOURS</h1>
          <p className="text-zinc-500 mt-1">Passagierdaten ergänzen</p>
        </div>

        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Buchung {booking?.booking_number}
            </CardTitle>
            <p className="text-sm text-zinc-500">{booking?.participants} Teilnehmer</p>
          </CardHeader>
        </Card>

        {passengers.map((pax, idx) => (
          <Card key={idx} className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Passagier {idx + 1} {idx === 0 ? "(Hauptkontakt)" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Vorname *</Label>
                  <Input value={pax.first_name} onChange={e => updatePassenger(idx, "first_name", e.target.value)} />
                </div>
                <div>
                  <Label>Nachname *</Label>
                  <Input value={pax.last_name} onChange={e => updatePassenger(idx, "last_name", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Geburtsdatum *</Label>
                <Input type="date" value={pax.date_of_birth} onChange={e => updatePassenger(idx, "date_of_birth", e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Notfallkontakt</Label>
                  <Input value={pax.emergency_contact} onChange={e => updatePassenger(idx, "emergency_contact", e.target.value)} placeholder="Name" />
                </div>
                <div>
                  <Label>Notfall-Telefon</Label>
                  <Input value={pax.emergency_phone} onChange={e => updatePassenger(idx, "emergency_phone", e.target.value)} placeholder="+49..." />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button onClick={handleSubmit} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          {saving ? "Wird gespeichert…" : "Daten speichern"}
        </Button>

        <p className="text-center text-xs text-zinc-400 mt-4">
          Ihre Daten werden gemäß DSGVO verarbeitet und nur für die Reiseorganisation verwendet.
        </p>
      </div>
    </div>
  );
};

export default PassengerDataPage;
