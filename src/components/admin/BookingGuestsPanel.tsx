import { useState } from "react";
import {
  User, Edit3, Save, X, Upload, Loader2, Link2, Calendar, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Passenger {
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  date_of_birth?: string;
  birthDate?: string;
  birth_date?: string;
  gender?: string;
  nationality?: string;
  id_type?: string;
  id_number?: string;
  id_expiry?: string;
  phone?: string;
  email?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  dietary?: string;
  special_needs?: string;
  notes?: string;
  room_preference?: string;
  seat_preference?: string;
  checkin_status?: string;
}

interface BookingGuestsPanelProps {
  bookingId: string;
  bookingNumber: string;
  contactEmail: string;
  contactFirstName: string;
  contactLastName: string;
  participants: number;
  passengerDetails: any[];
  userId?: string;
  onReload: () => void;
}

const SectionCard = ({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) => (
  <Card className="bg-[#151920] border-[#252b38]">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-xs text-zinc-400 uppercase tracking-wider">{title}</CardTitle>
        {actions}
      </div>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const BookingGuestsPanel = ({
  bookingId, bookingNumber, contactEmail, contactFirstName, contactLastName,
  participants, passengerDetails, userId, onReload
}: BookingGuestsPanelProps) => {
  const { toast } = useToast();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Passenger>({});
  const [saving, setSaving] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [idUploadModal, setIdUploadModal] = useState<number | null>(null);
  const [addPassengerModal, setAddPassengerModal] = useState(false);
  const [newPassenger, setNewPassenger] = useState<Passenger>({});

  const passengers: Passenger[] = Array.isArray(passengerDetails)
    ? passengerDetails.map(p => ({
        first_name: p.first_name || p.firstName || "",
        last_name: p.last_name || p.lastName || "",
        date_of_birth: p.date_of_birth || p.birthDate || p.birth_date || "",
        gender: p.gender || "",
        nationality: p.nationality || "",
        id_type: p.id_type || "",
        id_number: p.id_number || "",
        id_expiry: p.id_expiry || "",
        phone: p.phone || "",
        email: p.email || "",
        emergency_contact: p.emergency_contact || "",
        emergency_phone: p.emergency_phone || "",
        dietary: p.dietary || "",
        special_needs: p.special_needs || p.notes || "",
        notes: p.notes || "",
        room_preference: p.room_preference || "",
        seat_preference: p.seat_preference || "",
        checkin_status: p.checkin_status || "pending",
      }))
    : [];

  // Fill empty slots
  while (passengers.length < participants) {
    passengers.push({
      first_name: passengers.length === 0 ? contactFirstName : "",
      last_name: passengers.length === 0 ? contactLastName : "",
      date_of_birth: "", gender: "", nationality: "", id_type: "", id_number: "",
      id_expiry: "", phone: "", email: passengers.length === 0 ? contactEmail : "",
      emergency_contact: "", emergency_phone: "", dietary: "", special_needs: "",
      notes: "", room_preference: "", seat_preference: "", checkin_status: "pending",
    });
  }

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditForm({ ...passengers[idx] });
  };

  const cancelEdit = () => { setEditingIdx(null); setEditForm({}); };

  const savePassenger = async () => {
    if (editingIdx === null) return;
    setSaving(true);
    try {
      const updated = [...passengers];
      updated[editingIdx] = { ...updated[editingIdx], ...editForm };
      const { error } = await supabase
        .from("tour_bookings")
        .update({ passenger_details: updated as any })
        .eq("id", bookingId);
      if (error) throw error;

      await supabase.from("tour_booking_audit").insert({
        booking_id: bookingId,
        action: "PASSENGER_UPDATED",
        field_name: `passenger_${editingIdx + 1}`,
        old_value: `${passengers[editingIdx].first_name} ${passengers[editingIdx].last_name}`,
        new_value: `${editForm.first_name} ${editForm.last_name}`,
        performed_by: userId,
      });

      toast({ title: `✅ Passagier ${editingIdx + 1} aktualisiert` });
      setEditingIdx(null);
      onReload();
    } catch { toast({ title: "Fehler beim Speichern", variant: "destructive" }); }
    setSaving(false);
  };

  const addPassenger = async () => {
    setSaving(true);
    try {
      const updated = [...passengers, newPassenger];
      const { error } = await supabase
        .from("tour_bookings")
        .update({
          passenger_details: updated as any,
          participants: updated.length,
        })
        .eq("id", bookingId);
      if (error) throw error;
      toast({ title: "✅ Passagier hinzugefügt" });
      setAddPassengerModal(false);
      setNewPassenger({});
      onReload();
    } catch { toast({ title: "Fehler", variant: "destructive" }); }
    setSaving(false);
  };

  const removePassenger = async (idx: number) => {
    if (!confirm(`Passagier ${idx + 1} wirklich entfernen?`)) return;
    setSaving(true);
    try {
      const updated = passengers.filter((_, i) => i !== idx);
      const { error } = await supabase
        .from("tour_bookings")
        .update({ passenger_details: updated as any, participants: updated.length })
        .eq("id", bookingId);
      if (error) throw error;
      await supabase.from("tour_booking_audit").insert({
        booking_id: bookingId, action: "PASSENGER_REMOVED",
        field_name: `passenger_${idx + 1}`,
        old_value: `${passengers[idx].first_name} ${passengers[idx].last_name}`,
        performed_by: userId,
      });
      toast({ title: "✅ Passagier entfernt" });
      onReload();
    } catch { toast({ title: "Fehler", variant: "destructive" }); }
    setSaving(false);
  };

  const sendPassengerDataLink = async () => {
    setSendingLink(true);
    try {
      const { error } = await supabase.from("passenger_data_tokens").insert({
        booking_id: bookingId,
      });
      if (error) throw error;

      const { data: tokenData } = await supabase
        .from("passenger_data_tokens")
        .select("token")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (tokenData) {
        const link = `${window.location.origin}/passenger-data?token=${tokenData.token}`;
        await navigator.clipboard.writeText(link);
        toast({ title: "✅ Link erstellt & kopiert!", description: link });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Fehler beim Erstellen", variant: "destructive" });
    }
    setSendingLink(false);
  };

  const requestIdDocument = async (idx: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setSaving(true);
      try {
        const path = `passenger-ids/${bookingId}/pax-${idx + 1}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("tour-documents")
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;

        const updated = [...passengers];
        updated[idx] = { ...updated[idx], id_type: "uploaded", id_number: path };
        await supabase.from("tour_bookings")
          .update({ passenger_details: updated as any })
          .eq("id", bookingId);

        await supabase.from("tour_booking_audit").insert({
          booking_id: bookingId, action: "ID_DOCUMENT_UPLOADED",
          field_name: `passenger_${idx + 1}_id`,
          new_value: file.name,
          performed_by: userId,
        });

        toast({ title: `✅ Ausweis für Passagier ${idx + 1} hochgeladen` });
        onReload();
      } catch { toast({ title: "Upload fehlgeschlagen", variant: "destructive" }); }
      setSaving(false);
    };
    input.click();
  };

  // Stats
  const completePax = passengers.filter(p => p.first_name && p.last_name && p.date_of_birth).length;
  const withId = passengers.filter(p => p.id_type || p.id_number).length;
  const withDietary = passengers.filter(p => p.dietary).length;
  const withEmergency = passengers.filter(p => p.emergency_contact).length;

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Passagiere", value: `${passengers.length}/${participants}`, color: "text-zinc-100" },
          { label: "Daten vollständig", value: `${completePax}/${participants}`, color: completePax === participants ? "text-emerald-400" : "text-amber-400" },
          { label: "Ausweis hinterlegt", value: `${withId}/${participants}`, color: withId === participants ? "text-emerald-400" : "text-zinc-400" },
          { label: "Notfallkontakt", value: `${withEmergency}/${participants}`, color: withEmergency > 0 ? "text-emerald-400" : "text-zinc-500" },
          { label: "Verpflegung", value: `${withDietary}/${participants}`, color: withDietary > 0 ? "text-blue-400" : "text-zinc-500" },
        ].map((s, i) => (
          <Card key={i} className="bg-[#151920] border-[#252b38]">
            <CardContent className="pt-3 pb-2 px-3">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{s.label}</div>
              <div className={cn("text-lg font-bold", s.color)}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="border-[#2a3040] text-zinc-300 h-8 text-xs" onClick={sendPassengerDataLink} disabled={sendingLink}>
          {sendingLink ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Link2 className="w-3 h-3 mr-1" />}
          Daten-Link erstellen & kopieren
        </Button>
        <Button size="sm" variant="outline" className="border-[#2a3040] text-zinc-300 h-8 text-xs" onClick={() => setAddPassengerModal(true)}>
          <User className="w-3 h-3 mr-1" /> Passagier hinzufügen
        </Button>
        <Button size="sm" variant="outline" className="border-[#2a3040] text-zinc-300 h-8 text-xs" onClick={async () => {
          // Request all missing birth dates by sending email reminder
          toast({ title: "📧 Erinnerung an fehlende Geburtsdaten wird vorbereitet..." });
          await sendPassengerDataLink();
        }}>
          <Calendar className="w-3 h-3 mr-1" /> Geburtsdaten anfordern
        </Button>
        <Button size="sm" variant="outline" className="border-[#2a3040] text-zinc-300 h-8 text-xs" onClick={() => {
          toast({ title: "📧 Ausweiskopien anfordern", description: "Der Daten-Link enthält die Option zum Upload." });
          sendPassengerDataLink();
        }}>
          <ShieldCheck className="w-3 h-3 mr-1" /> Ausweise anfordern
        </Button>
      </div>

      {/* Passenger Cards */}
      {passengers.map((pax, idx) => {
        const isEditing = editingIdx === idx;
        const hasName = pax.first_name && pax.last_name;
        const hasDob = !!pax.date_of_birth;
        const hasId = !!pax.id_type || !!pax.id_number;
        const isComplete = hasName && hasDob;

        return (
          <Card key={idx} className={cn("bg-[#151920] border-[#252b38]", !isComplete && "border-l-2 border-l-amber-500/60")}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold", isComplete ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400")}>
                    {idx + 1}
                  </div>
                  <div>
                    <CardTitle className="text-sm text-zinc-100">
                      {hasName ? `${pax.first_name} ${pax.last_name}` : `Passagier ${idx + 1}`}
                      {idx === 0 && <Badge className="ml-2 bg-blue-500/20 text-blue-300 text-[9px] border border-blue-600/40">Hauptkontakt</Badge>}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-0.5">
                      {isComplete
                        ? <Badge className="bg-emerald-500/20 text-emerald-300 text-[9px] border border-emerald-600/40">✓ Vollständig</Badge>
                        : <Badge className="bg-amber-500/20 text-amber-300 text-[9px] border border-amber-600/40">Daten unvollständig</Badge>}
                      {hasId && <Badge className="bg-blue-500/20 text-blue-300 text-[9px] border border-blue-600/40">Ausweis ✓</Badge>}
                      {pax.dietary && <Badge className="bg-purple-500/20 text-purple-300 text-[9px] border border-purple-600/40">{pax.dietary}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {!isEditing ? (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-400 hover:text-white" onClick={() => startEdit(idx)} title="Bearbeiten">
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-400 hover:text-white" onClick={() => requestIdDocument(idx)} title="Ausweis hochladen">
                        <Upload className="w-3.5 h-3.5" />
                      </Button>
                      {idx > 0 && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => removePassenger(idx)} title="Entfernen">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs" onClick={savePassenger} disabled={saving}>
                        {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Speichern
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-zinc-400" onClick={cancelEdit}>
                        <X className="w-3 h-3 mr-1" /> Abbrechen
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                /* ═══ EDIT MODE ═══ */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-zinc-400 text-xs">Vorname *</Label>
                      <Input value={editForm.first_name || ""} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))}
                        className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1 h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Nachname *</Label>
                      <Input value={editForm.last_name || ""} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))}
                        className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1 h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Geburtsdatum *</Label>
                      <Input type="date" value={editForm.date_of_birth || ""} onChange={e => setEditForm(f => ({ ...f, date_of_birth: e.target.value }))}
                        className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1 h-8 text-xs" />
                    </div>
                  </div>

                  <Separator className="bg-[#2a3040]" />
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Persönliche Daten</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-zinc-400 text-xs">Geschlecht</Label>
                      <Select value={editForm.gender || ""} onValueChange={v => setEditForm(f => ({ ...f, gender: v }))}>
                        <SelectTrigger className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1 h-8 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                        <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                          <SelectItem value="männlich" className="text-white">Männlich</SelectItem>
                          <SelectItem value="weiblich" className="text-white">Weiblich</SelectItem>
                          <SelectItem value="divers" className="text-white">Divers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Nationalität</Label>
                      <Input value={editForm.nationality || ""} onChange={e => setEditForm(f => ({ ...f, nationality: e.target.value }))}
                        className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1 h-8 text-xs" placeholder="z.B. Deutsch" />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Telefon</Label>
                      <Input value={editForm.phone || ""} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                        className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1 h-8 text-xs" placeholder="+49..." />
                    </div>
                  </div>

                  <Separator className="bg-[#2a3040]" />
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Ausweisdaten</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-zinc-400 text-xs">Dokumenttyp</Label>
                      <Select value={editForm.id_type || ""} onValueChange={v => setEditForm(f => ({ ...f, id_type: v }))}>
                        <SelectTrigger className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1 h-8 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                        <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                          <SelectItem value="personalausweis" className="text-white">Personalausweis</SelectItem>
                          <SelectItem value="reisepass" className="text-white">Reisepass</SelectItem>
                          <SelectItem value="kinderreisepass" className="text-white">Kinderreisepass</SelectItem>
                          <SelectItem value="sonstiges" className="text-white">Sonstiges</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Dokumentnummer</Label>
                      <Input value={editForm.id_number || ""} onChange={e => setEditForm(f => ({ ...f, id_number: e.target.value }))}
                        className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1 h-8 text-xs" placeholder="z.B. L01X00T47" />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Gültig bis</Label>
                      <Input type="date" value={editForm.id_expiry || ""} onChange={e => setEditForm(f => ({ ...f, id_expiry: e.target.value }))}
                        className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1 h-8 text-xs" />
                    </div>
                  </div>

                  <Separator className="bg-[#2a3040]" />
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Notfallkontakt</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-zinc-400 text-xs">Kontaktperson</Label>
                      <Input value={editForm.emergency_contact || ""} onChange={e => setEditForm(f => ({ ...f, emergency_contact: e.target.value }))}
                        className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1 h-8 text-xs" placeholder="Name" />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Notfall-Telefon</Label>
                      <Input value={editForm.emergency_phone || ""} onChange={e => setEditForm(f => ({ ...f, emergency_phone: e.target.value }))}
                        className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1 h-8 text-xs" placeholder="+49..." />
                    </div>
                  </div>

                  <Separator className="bg-[#2a3040]" />
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Reisepräferenzen</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-zinc-400 text-xs">Verpflegungswunsch</Label>
                      <Select value={editForm.dietary || ""} onValueChange={v => setEditForm(f => ({ ...f, dietary: v }))}>
                        <SelectTrigger className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1 h-8 text-xs"><SelectValue placeholder="Keine Angabe" /></SelectTrigger>
                        <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                          <SelectItem value="" className="text-white">Keine Angabe</SelectItem>
                          <SelectItem value="vegetarisch" className="text-white">Vegetarisch</SelectItem>
                          <SelectItem value="vegan" className="text-white">Vegan</SelectItem>
                          <SelectItem value="halal" className="text-white">Halal</SelectItem>
                          <SelectItem value="koscher" className="text-white">Koscher</SelectItem>
                          <SelectItem value="glutenfrei" className="text-white">Glutenfrei</SelectItem>
                          <SelectItem value="laktosefrei" className="text-white">Laktosefrei</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Sitzplatz-Wunsch</Label>
                      <Select value={editForm.seat_preference || ""} onValueChange={v => setEditForm(f => ({ ...f, seat_preference: v }))}>
                        <SelectTrigger className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1 h-8 text-xs"><SelectValue placeholder="Egal" /></SelectTrigger>
                        <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                          <SelectItem value="" className="text-white">Egal</SelectItem>
                          <SelectItem value="fenster" className="text-white">Fenster</SelectItem>
                          <SelectItem value="gang" className="text-white">Gang</SelectItem>
                          <SelectItem value="vorne" className="text-white">Vorne</SelectItem>
                          <SelectItem value="hinten" className="text-white">Hinten</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Zimmer-Wunsch</Label>
                      <Select value={editForm.room_preference || ""} onValueChange={v => setEditForm(f => ({ ...f, room_preference: v }))}>
                        <SelectTrigger className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1 h-8 text-xs"><SelectValue placeholder="Standard" /></SelectTrigger>
                        <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                          <SelectItem value="" className="text-white">Standard</SelectItem>
                          <SelectItem value="einzel" className="text-white">Einzelzimmer</SelectItem>
                          <SelectItem value="doppel" className="text-white">Doppelzimmer</SelectItem>
                          <SelectItem value="twin" className="text-white">Zweibett</SelectItem>
                          <SelectItem value="barrierefrei" className="text-white">Barrierefrei</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-zinc-400 text-xs">Besondere Bedürfnisse / Hinweise</Label>
                    <Textarea value={editForm.special_needs || ""} onChange={e => setEditForm(f => ({ ...f, special_needs: e.target.value }))}
                      className="bg-[#1a1f2a] border-[#2a3040] text-zinc-100 text-xs min-h-[60px] mt-1"
                      placeholder="z.B. Rollstuhlfahrer, Allergie, Medikamente..." />
                  </div>
                </div>
              ) : (
                /* ═══ VIEW MODE ═══ */
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Geburtsdatum</span>
                    <span className={cn("text-zinc-200", !hasDob && "text-amber-400 italic")}>
                      {hasDob ? pax.date_of_birth : "⚠ Fehlt"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Geschlecht</span>
                    <span className="text-zinc-300">{pax.gender || "–"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Nationalität</span>
                    <span className="text-zinc-300">{pax.nationality || "–"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Ausweis</span>
                    <span className={cn("text-zinc-300", !hasId && "text-zinc-500")}>
                      {hasId ? `${pax.id_type || "Dokument"} ${pax.id_number ? "✓" : ""}` : "Nicht hinterlegt"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Notfallkontakt</span>
                    <span className="text-zinc-300">{pax.emergency_contact || "–"} {pax.emergency_phone ? `(${pax.emergency_phone})` : ""}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Verpflegung</span>
                    <span className="text-zinc-300">{pax.dietary || "Standard"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Sitzplatz</span>
                    <span className="text-zinc-300">{pax.seat_preference || "Egal"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Zimmer</span>
                    <span className="text-zinc-300">{pax.room_preference || "Standard"}</span>
                  </div>
                  {pax.special_needs && (
                    <div className="col-span-2 md:col-span-4">
                      <span className="text-[10px] text-zinc-500 block">Besondere Bedürfnisse</span>
                      <span className="text-zinc-300">{pax.special_needs}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Add Passenger Modal */}
      <Dialog open={addPassengerModal} onOpenChange={setAddPassengerModal}>
        <DialogContent className="bg-[#151920] border-[#252b38] text-white max-w-lg">
          <DialogHeader><DialogTitle>Passagier hinzufügen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400 text-xs">Vorname *</Label>
                <Input value={newPassenger.first_name || ""} onChange={e => setNewPassenger(f => ({ ...f, first_name: e.target.value }))}
                  className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Nachname *</Label>
                <Input value={newPassenger.last_name || ""} onChange={e => setNewPassenger(f => ({ ...f, last_name: e.target.value }))}
                  className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Geburtsdatum *</Label>
              <Input type="date" value={newPassenger.date_of_birth || ""} onChange={e => setNewPassenger(f => ({ ...f, date_of_birth: e.target.value }))}
                className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400 text-xs">E-Mail</Label>
                <Input value={newPassenger.email || ""} onChange={e => setNewPassenger(f => ({ ...f, email: e.target.value }))}
                  className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Telefon</Label>
                <Input value={newPassenger.phone || ""} onChange={e => setNewPassenger(f => ({ ...f, phone: e.target.value }))}
                  className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddPassengerModal(false)} className="text-zinc-400">Abbrechen</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={addPassenger} disabled={saving || !newPassenger.first_name || !newPassenger.last_name}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <User className="w-4 h-4 mr-1" />} Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingGuestsPanel;
