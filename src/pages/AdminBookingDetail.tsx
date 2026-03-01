import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  CheckCircle2, XCircle, Mail, FileText, RefreshCw,
  Loader2, Users, CreditCard, FileCheck, MessageSquare,
  History, Send, Plus, Eye, Shield
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface TourBooking {
  id: string;
  booking_number: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_phone: string | null;
  participants: number;
  passenger_details: any[];
  base_price: number;
  pickup_surcharge: number;
  total_price: number;
  discount_amount: number | null;
  discount_code: string | null;
  status: string;
  booking_type: string;
  payment_method: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  customer_notes: string | null;
  internal_notes: string | null;
  tour_id: string;
  tour_date_id: string;
  tariff_id: string;
  pickup_stop_id: string | null;
  luggage_addons: any;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
}

interface PaymentEntry {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  note: string | null;
  recorded_by: string | null;
  recorded_at: string;
}

interface AuditEntry {
  id: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  performed_by_email: string | null;
  created_at: string;
}

interface DocumentSend {
  id: string;
  document_type: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface InsuranceData {
  id: string;
  provider: string | null;
  product: string | null;
  policy_number: string | null;
  policy_status: string;
  price: number | null;
  is_active: boolean;
  notes: string | null;
  policy_pdf_url: string | null;
}

const AdminBookingDetail = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading } = useAuth();

  const [booking, setBooking] = useState<TourBooking | null>(null);
  const [tourInfo, setTourInfo] = useState<any>(null);
  const [dateInfo, setDateInfo] = useState<any>(null);
  const [tariffInfo, setTariffInfo] = useState<any>(null);
  const [pickupInfo, setPickupInfo] = useState<any>(null);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [docSends, setDocSends] = useState<DocumentSend[]>([]);
  const [insurance, setInsurance] = useState<InsuranceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0, method: "bank_transfer", reference: "", note: "", sendEmail: true,
  });

  useEffect(() => {
    if (!authLoading && user && isAdmin && bookingId) loadBooking();
  }, [bookingId, user, isAdmin, authLoading]);

  const loadBooking = async () => {
    if (!bookingId) return;
    setIsLoading(true);
    try {
      const { data: b, error } = await supabase.from("tour_bookings").select("*").eq("id", bookingId).single();
      if (error) throw error;
      setBooking(b as TourBooking);

      const [tourRes, dateRes, tariffRes, pickupRes, paymentsRes, auditRes, docsRes, insuranceRes] = await Promise.all([
        supabase.from("package_tours").select("destination, location, country, duration_days, image_url").eq("id", b.tour_id).single(),
        supabase.from("tour_dates").select("departure_date, return_date, duration_days, total_seats, booked_seats").eq("id", b.tour_date_id).single(),
        supabase.from("tour_tariffs").select("name, slug, suitcase_included, suitcase_weight_kg, is_refundable").eq("id", b.tariff_id).single(),
        b.pickup_stop_id ? supabase.from("tour_pickup_stops").select("city, location_name, departure_time, surcharge").eq("id", b.pickup_stop_id).single() : Promise.resolve({ data: null }),
        supabase.from("tour_payment_entries").select("*").eq("booking_id", bookingId).order("recorded_at", { ascending: false }),
        supabase.from("tour_booking_audit").select("*").eq("booking_id", bookingId).order("created_at", { ascending: false }),
        supabase.from("tour_document_sends").select("*").eq("booking_id", bookingId).order("created_at", { ascending: false }),
        supabase.from("tour_booking_insurance").select("*").eq("booking_id", bookingId).maybeSingle(),
      ]);

      setTourInfo(tourRes.data);
      setDateInfo(dateRes.data);
      setTariffInfo(tariffRes.data);
      setPickupInfo(pickupRes.data);
      setPayments((paymentsRes.data || []) as PaymentEntry[]);
      setAuditLog((auditRes.data || []) as AuditEntry[]);
      setDocSends((docsRes.data || []) as DocumentSend[]);
      setInsurance(insuranceRes.data as InsuranceData | null);

      const paid = (paymentsRes.data || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
      setPaymentForm(f => ({ ...f, amount: Math.max(0, b.total_price - paid) }));
    } catch (err) {
      console.error(err);
      toast({ title: "Buchung nicht gefunden", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const logAudit = async (action: string, fieldName?: string, oldVal?: string, newVal?: string) => {
    await supabase.from("tour_booking_audit").insert({
      booking_id: bookingId!, action, field_name: fieldName || null,
      old_value: oldVal || null, new_value: newVal || null,
      performed_by: user?.id, performed_by_email: user?.email || null,
    });
  };

  const updateBookingStatus = async (newStatus: string) => {
    if (!booking) return;
    setProcessing("status");
    try {
      const oldStatus = booking.status;
      const updateData: any = { status: newStatus };
      if (newStatus === "confirmed" && !booking.paid_at) updateData.paid_at = new Date().toISOString();
      const { error } = await supabase.from("tour_bookings").update(updateData).eq("id", booking.id);
      if (error) throw error;
      await logAudit("STATUS_CHANGE", "status", oldStatus, newStatus);
      toast({ title: `Status auf "${newStatus}" geändert` });
      loadBooking();
    } catch { toast({ title: "Fehler", variant: "destructive" }); }
    finally { setProcessing(null); }
  };

  const handlePaymentReceived = async () => {
    if (!booking) return;
    setProcessing("payment");
    try {
      await supabase.from("tour_payment_entries").insert({
        booking_id: booking.id, amount: paymentForm.amount, method: paymentForm.method,
        reference: paymentForm.reference || null, note: paymentForm.note || null, recorded_by: user?.id,
      });
      const totalPaidNow = payments.reduce((s, p) => s + Number(p.amount), 0) + paymentForm.amount;
      const isFullyPaid = totalPaidNow >= booking.total_price;
      const updateData: any = { payment_method: paymentForm.method, payment_reference: paymentForm.reference || booking.payment_reference };
      if (isFullyPaid) { updateData.status = "confirmed"; updateData.paid_at = new Date().toISOString(); }
      await supabase.from("tour_bookings").update(updateData).eq("id", booking.id);
      await logAudit("PAYMENT_RECEIVED", "amount", null, `${paymentForm.amount}€ via ${paymentForm.method}`);
      if (paymentForm.sendEmail && isFullyPaid) {
        try {
          await supabase.functions.invoke("send-booking-confirmation", { body: { bookingId: booking.id } });
          await supabase.from("tour_document_sends").insert({ booking_id: booking.id, document_type: "payment_confirmation", recipient_email: booking.contact_email, status: "sent", sent_by: user?.id });
          toast({ title: "✅ Zahlung erfasst & Bestätigung gesendet" });
        } catch { toast({ title: "✅ Zahlung erfasst (Mail fehlgeschlagen)" }); }
      } else { toast({ title: "✅ Zahlung erfasst" }); }
      setPaymentModal(false);
      loadBooking();
    } catch (err) { console.error(err); toast({ title: "Fehler", variant: "destructive" }); }
    finally { setProcessing(null); }
  };

  const sendEmail = async (type: string) => {
    if (!booking) return;
    setProcessing(type);
    try {
      await supabase.functions.invoke("send-booking-confirmation", { body: { bookingId: booking.id } });
      await supabase.from("tour_document_sends").insert({ booking_id: booking.id, document_type: type, recipient_email: booking.contact_email, status: "sent", sent_by: user?.id });
      await logAudit("EMAIL_SENT", "document_type", null, type);
      toast({ title: "✅ E-Mail gesendet" });
      loadBooking();
    } catch { toast({ title: "Fehler beim Senden", variant: "destructive" }); }
    finally { setProcessing(null); }
  };

  const regenerateDocuments = async () => {
    if (!booking) return;
    setProcessing("regen");
    try {
      await supabase.functions.invoke("generate-tour-documents", { body: { bookingId: booking.id, documentType: "all" } });
      await logAudit("DOCUMENTS_REGENERATED");
      toast({ title: "✅ Dokumente neu generiert" });
    } catch { toast({ title: "Fehler", variant: "destructive" }); }
    finally { setProcessing(null); }
  };

  const saveInsurance = async (data: Partial<InsuranceData>) => {
    if (!booking) return;
    setProcessing("insurance");
    try {
      if (insurance) {
        await supabase.from("tour_booking_insurance").update(data).eq("id", insurance.id);
      } else {
        await supabase.from("tour_booking_insurance").insert({ booking_id: booking.id, ...data });
      }
      await logAudit("INSURANCE_UPDATED", "policy_status", insurance?.policy_status, data.policy_status);
      toast({ title: "✅ Versicherung aktualisiert" });
      loadBooking();
    } catch { toast({ title: "Fehler", variant: "destructive" }); }
    finally { setProcessing(null); }
  };

  if (authLoading || isLoading || !booking) {
    return <AdminLayout title="Buchung laden..."><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div></AdminLayout>;
  }
  if (!user || !isAdmin) {
    return <AdminLayout title="Kein Zugriff"><p className="text-zinc-400">Admin-Rechte erforderlich.</p></AdminLayout>;
  }

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const openAmount = Math.max(0, booking.total_price - totalPaid);
  const paymentStatus = totalPaid >= booking.total_price ? "bezahlt" : totalPaid > 0 ? "teil" : "offen";
  const passengers: any[] = Array.isArray(booking.passenger_details) ? booking.passenger_details : [];

  const getStatusColor = (s: string) => {
    switch (s) { case "confirmed": return "bg-emerald-600"; case "pending": return "bg-amber-600"; case "cancelled": return "bg-red-600"; default: return "bg-zinc-600"; }
  };
  const getPaymentStatusColor = (s: string) => {
    switch (s) { case "bezahlt": return "bg-emerald-600"; case "teil": return "bg-amber-600"; case "offen": return "bg-red-500"; default: return "bg-zinc-600"; }
  };

  return (
    <AdminLayout
      title={`Buchung ${booking.booking_number}`}
      subtitle={`${booking.contact_first_name} ${booking.contact_last_name} • ${tourInfo?.destination || ''}`}
      actions={<Button variant="ghost" size="sm" onClick={loadBooking} className="text-zinc-400"><RefreshCw className="w-4 h-4" /></Button>}
    >
      {/* Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="text-xs text-zinc-500 mb-1">Buchungsstatus</div>
          <Badge className={getStatusColor(booking.status)}>{booking.status === "confirmed" ? "Bezahlt" : booking.status === "pending" ? "Offen" : booking.status}</Badge>
        </div>
        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="text-xs text-zinc-500 mb-1">Zahlungsstatus</div>
          <Badge className={getPaymentStatusColor(paymentStatus)}>{paymentStatus === "bezahlt" ? "✓ Bezahlt" : paymentStatus === "teil" ? `Teilzahlung (${totalPaid.toFixed(2)}€)` : "Offen"}</Badge>
        </div>
        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="text-xs text-zinc-500 mb-1">Dokumente</div>
          <Badge className={docSends.length > 0 ? "bg-emerald-600" : "bg-amber-600"}>{docSends.length > 0 ? `${docSends.length}x gesendet` : "Noch nicht gesendet"}</Badge>
        </div>
        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="text-xs text-zinc-500 mb-1">Check-in</div>
          <Badge className="bg-zinc-600">0/{booking.participants} eingecheckt</Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {booking.status === "pending" && (
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setPaymentModal(true)} disabled={!!processing}>
            <CreditCard className="w-3 h-3 mr-1" /> Zahlung erhalten
          </Button>
        )}
        {booking.status === "pending" && (
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => updateBookingStatus("confirmed")} disabled={!!processing}>
            <CheckCircle2 className="w-3 h-3 mr-1" /> Bestätigen
          </Button>
        )}
        {booking.status !== "cancelled" && (
          <Button size="sm" variant="destructive" onClick={() => { if (confirm("Buchung wirklich stornieren?")) updateBookingStatus("cancelled"); }} disabled={!!processing}>
            <XCircle className="w-3 h-3 mr-1" /> Stornieren
          </Button>
        )}
        <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300" onClick={() => sendEmail("booking_confirmation")} disabled={!!processing}>
          <Mail className="w-3 h-3 mr-1" /> E-Mail senden
        </Button>
        <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300" onClick={regenerateDocuments} disabled={!!processing}>
          <FileText className="w-3 h-3 mr-1" /> PDF neu erstellen
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800 flex-wrap h-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Eye className="w-3 h-3 mr-1" /> Übersicht</TabsTrigger>
          <TabsTrigger value="guests" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Users className="w-3 h-3 mr-1" /> Gäste</TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><CreditCard className="w-3 h-3 mr-1" /> Zahlungen</TabsTrigger>
          <TabsTrigger value="insurance" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Shield className="w-3 h-3 mr-1" /> Versicherung</TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><FileCheck className="w-3 h-3 mr-1" /> Dokumente</TabsTrigger>
          <TabsTrigger value="communication" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><MessageSquare className="w-3 h-3 mr-1" /> Kommunikation</TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><History className="w-3 h-3 mr-1" /> Änderungen</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-sm text-zinc-400">Kontaktdaten</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Name</span><span className="text-white font-medium">{booking.contact_first_name} {booking.contact_last_name}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">E-Mail</span><span className="text-white">{booking.contact_email}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Telefon</span><span className="text-white">{booking.contact_phone || "–"}</span></div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-sm text-zinc-400">Reisedetails</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Reiseziel</span><span className="text-white font-medium">{tourInfo?.destination}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Ort</span><span className="text-white">{tourInfo?.location}, {tourInfo?.country}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Hinreise</span><span className="text-white">{dateInfo ? format(new Date(dateInfo.departure_date), "dd.MM.yyyy") : "–"}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Rückreise</span><span className="text-white">{dateInfo ? format(new Date(dateInfo.return_date), "dd.MM.yyyy") : "–"}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Tarif</span><span className="text-white">{tariffInfo?.name}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Teilnehmer</span><span className="text-white">{booking.participants}</span></div>
                {pickupInfo && <div className="flex justify-between"><span className="text-zinc-500">Zustieg</span><span className="text-white">{pickupInfo.city} ({pickupInfo.departure_time?.slice(0,5)} Uhr)</span></div>}
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-sm text-zinc-400">Preisberechnung</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Grundpreis</span><span className="text-white">{booking.base_price.toFixed(2)}€</span></div>
                {booking.pickup_surcharge > 0 && <div className="flex justify-between"><span className="text-zinc-500">Zustiegs-Aufpreis</span><span className="text-white">+{booking.pickup_surcharge.toFixed(2)}€</span></div>}
                {booking.discount_amount && booking.discount_amount > 0 && <div className="flex justify-between"><span className="text-zinc-500">Rabatt ({booking.discount_code})</span><span className="text-emerald-400">-{booking.discount_amount.toFixed(2)}€</span></div>}
                <Separator className="bg-zinc-700" />
                <div className="flex justify-between font-bold"><span className="text-zinc-300">Gesamt</span><span className="text-emerald-400 text-lg">{booking.total_price.toFixed(2)}€</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Bezahlt</span><span className={totalPaid >= booking.total_price ? "text-emerald-400" : "text-amber-400"}>{totalPaid.toFixed(2)}€</span></div>
                {openAmount > 0 && <div className="flex justify-between"><span className="text-zinc-500">Offen</span><span className="text-red-400">{openAmount.toFixed(2)}€</span></div>}
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-sm text-zinc-400">Interne Notizen</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="text-zinc-500 block mb-1">Kundennotiz:</span><span className="text-white">{booking.customer_notes || "–"}</span></div>
                <div><span className="text-zinc-500 block mb-1">Interne Notiz:</span><span className="text-white">{booking.internal_notes || "–"}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Erstellt</span><span className="text-white">{format(new Date(booking.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</span></div>
                {booking.paid_at && <div className="flex justify-between"><span className="text-zinc-500">Bezahlt am</span><span className="text-emerald-400">{format(new Date(booking.paid_at), "dd.MM.yyyy HH:mm", { locale: de })}</span></div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* GUESTS */}
        <TabsContent value="guests">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-400">Passagiere ({passengers.length}/{booking.participants})</CardTitle></CardHeader>
            <CardContent>
              {passengers.length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center">Keine Passagierdaten hinterlegt</p>
              ) : (
                <Table>
                  <TableHeader><TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">#</TableHead>
                    <TableHead className="text-zinc-400">Vorname</TableHead>
                    <TableHead className="text-zinc-400">Nachname</TableHead>
                    <TableHead className="text-zinc-400">Geburtsdatum</TableHead>
                    <TableHead className="text-zinc-400">Notizen</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {passengers.map((p: any, i: number) => (
                      <TableRow key={i} className="border-zinc-800">
                        <TableCell className="text-zinc-500">{i + 1}</TableCell>
                        <TableCell className="text-white">{p.firstName || p.first_name || "–"}</TableCell>
                        <TableCell className="text-white">{p.lastName || p.last_name || "–"}</TableCell>
                        <TableCell className="text-zinc-300">{p.birthDate || p.birth_date || "–"}</TableCell>
                        <TableCell className="text-zinc-400">{p.notes || "–"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENTS */}
        <TabsContent value="payments">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-4"><div className="text-xs text-zinc-500 mb-1">Sollbetrag</div><div className="text-2xl font-bold text-white">{booking.total_price.toFixed(2)}€</div></CardContent></Card>
              <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-4"><div className="text-xs text-zinc-500 mb-1">Bezahlt</div><div className="text-2xl font-bold text-emerald-400">{totalPaid.toFixed(2)}€</div></CardContent></Card>
              <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-4"><div className="text-xs text-zinc-500 mb-1">Offen</div><div className={`text-2xl font-bold ${openAmount > 0 ? "text-red-400" : "text-emerald-400"}`}>{openAmount.toFixed(2)}€</div></CardContent></Card>
            </div>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-zinc-400">Zahlungseingänge</CardTitle>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setPaymentModal(true)}><Plus className="w-3 h-3 mr-1" /> Zahlung erfassen</Button>
                </div>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? <p className="text-zinc-500 text-sm py-4 text-center">Noch keine Zahlungseingänge</p> : (
                  <Table>
                    <TableHeader><TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Datum</TableHead><TableHead className="text-zinc-400">Betrag</TableHead><TableHead className="text-zinc-400">Methode</TableHead><TableHead className="text-zinc-400">Referenz</TableHead><TableHead className="text-zinc-400">Notiz</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id} className="border-zinc-800">
                          <TableCell className="text-zinc-300">{format(new Date(p.recorded_at), "dd.MM.yy HH:mm", { locale: de })}</TableCell>
                          <TableCell className="text-emerald-400 font-semibold">{Number(p.amount).toFixed(2)}€</TableCell>
                          <TableCell className="text-zinc-300">{p.method === "bank_transfer" ? "Überweisung" : p.method === "cash" ? "Bar" : p.method}</TableCell>
                          <TableCell className="text-zinc-400">{p.reference || "–"}</TableCell>
                          <TableCell className="text-zinc-400">{p.note || "–"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* INSURANCE */}
        <TabsContent value="insurance">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-zinc-400">Reiseversicherung</CardTitle>
                {!insurance && (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => saveInsurance({ is_active: true, policy_status: "requested" })} disabled={!!processing}>
                    <Plus className="w-3 h-3 mr-1" /> Versicherung anlegen
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!insurance ? (
                <p className="text-zinc-500 text-sm py-4 text-center">Keine Versicherung für diese Buchung hinterlegt</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-zinc-400 text-xs">Anbieter</Label>
                      <Input defaultValue={insurance.provider || ""} className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="z.B. Europäische Reiseversicherung"
                        onBlur={(e) => saveInsurance({ provider: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Produkt</Label>
                      <Input defaultValue={insurance.product || ""} className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="z.B. Reiserücktritt Plus"
                        onBlur={(e) => saveInsurance({ product: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Policennummer</Label>
                      <Input defaultValue={insurance.policy_number || ""} className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="POL-..."
                        onBlur={(e) => saveInsurance({ policy_number: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Preis (€)</Label>
                      <Input type="number" defaultValue={insurance.price || 0} className="bg-zinc-800 border-zinc-700 text-white mt-1"
                        onBlur={(e) => saveInsurance({ price: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Policenstatus</Label>
                      <Select defaultValue={insurance.policy_status} onValueChange={(v) => saveInsurance({ policy_status: v })}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="not_requested" className="text-white">Nicht angefragt</SelectItem>
                          <SelectItem value="requested" className="text-white">Angefragt</SelectItem>
                          <SelectItem value="active" className="text-white">Aktiv</SelectItem>
                          <SelectItem value="expired" className="text-white">Abgelaufen</SelectItem>
                          <SelectItem value="cancelled" className="text-white">Storniert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Notizen</Label>
                      <Textarea defaultValue={insurance.notes || ""} className="bg-zinc-800 border-zinc-700 text-white mt-1" rows={2}
                        onBlur={(e) => saveInsurance({ notes: e.target.value })} />
                    </div>
                  </div>
                  <Badge className={insurance.policy_status === "active" ? "bg-emerald-600" : insurance.policy_status === "requested" ? "bg-amber-600" : "bg-zinc-600"}>
                    Status: {insurance.policy_status === "active" ? "Aktiv" : insurance.policy_status === "requested" ? "Angefragt" : insurance.policy_status === "not_requested" ? "Nicht angefragt" : insurance.policy_status}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents">
          <div className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-zinc-400">System-generierte Dokumente</CardTitle>
                  <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300" onClick={regenerateDocuments} disabled={processing === "regen"}>
                    {processing === "regen" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />} Alle neu generieren
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {["Buchungsbestätigung", "Rechnung", "Hotel-Voucher", "Reiseplan"].map((doc) => (
                    <div key={doc} className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-emerald-400" />
                        <div><div className="text-sm font-medium text-white">{doc}</div><div className="text-xs text-zinc-500">PDF • Auto-generiert</div></div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white h-8 w-8 p-0" onClick={() => sendEmail(doc.toLowerCase())} disabled={!!processing}>
                        <Send className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-sm text-zinc-400">Versandverlauf</CardTitle></CardHeader>
              <CardContent>
                {docSends.length === 0 ? <p className="text-zinc-500 text-sm py-4 text-center">Noch keine Dokumente versendet</p> : (
                  <Table>
                    <TableHeader><TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Zeitpunkt</TableHead><TableHead className="text-zinc-400">Dokument</TableHead><TableHead className="text-zinc-400">Empfänger</TableHead><TableHead className="text-zinc-400">Status</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {docSends.map((d) => (
                        <TableRow key={d.id} className="border-zinc-800">
                          <TableCell className="text-zinc-300">{format(new Date(d.created_at), "dd.MM.yy HH:mm", { locale: de })}</TableCell>
                          <TableCell className="text-white">{d.document_type}</TableCell>
                          <TableCell className="text-zinc-400">{d.recipient_email}</TableCell>
                          <TableCell><Badge className={d.status === "sent" ? "bg-emerald-600" : "bg-red-600"}>{d.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* COMMUNICATION */}
        <TabsContent value="communication">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-400">Quick Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { label: "Zahlungsinfos erneut senden", type: "payment_info", icon: CreditCard },
                  { label: "Buchungsbestätigung erneut senden", type: "booking_confirmation", icon: CheckCircle2 },
                  { label: "Reiseinfos senden (Treffpunkt, Uhrzeit)", type: "travel_info", icon: Mail },
                  { label: "Ticket/QR erneut senden", type: "ticket_resend", icon: FileText },
                ].map((action) => (
                  <Button key={action.type} variant="outline" className="border-zinc-700 text-zinc-300 justify-start h-auto py-3" onClick={() => sendEmail(action.type)} disabled={!!processing}>
                    {processing === action.type ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <action.icon className="w-4 h-4 mr-2" />}
                    {action.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 mt-4">
            <CardHeader><CardTitle className="text-sm text-zinc-400">E-Mail Verlauf</CardTitle></CardHeader>
            <CardContent>
              {docSends.length === 0 ? <p className="text-zinc-500 text-sm py-4 text-center">Keine E-Mails gesendet</p> : (
                <div className="space-y-2">
                  {docSends.map((d) => (
                    <div key={d.id} className="bg-zinc-800 rounded-lg p-3 flex items-center justify-between">
                      <div><div className="text-sm text-white">{d.document_type}</div><div className="text-xs text-zinc-500">{format(new Date(d.created_at), "dd.MM.yyyy HH:mm", { locale: de })} → {d.recipient_email}</div></div>
                      <Badge className={d.status === "sent" ? "bg-emerald-600" : "bg-red-600"}>{d.status === "sent" ? "✓ Gesendet" : "Fehler"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIT LOG */}
        <TabsContent value="audit">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-zinc-400">Änderungsverlauf</CardTitle></CardHeader>
            <CardContent>
              {auditLog.length === 0 ? <p className="text-zinc-500 text-sm py-4 text-center">Keine Änderungen protokolliert</p> : (
                <div className="space-y-2">
                  {auditLog.map((entry) => (
                    <div key={entry.id} className="bg-zinc-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium text-white">{entry.action.replace(/_/g, " ")}</div>
                        <div className="text-xs text-zinc-500">{format(new Date(entry.created_at), "dd.MM.yy HH:mm", { locale: de })}</div>
                      </div>
                      <div className="text-xs text-zinc-400">
                        {entry.performed_by_email && <span>von {entry.performed_by_email}</span>}
                        {entry.field_name && <span> • Feld: {entry.field_name}</span>}
                        {entry.old_value && <span> • Vorher: <span className="text-red-400">{entry.old_value}</span></span>}
                        {entry.new_value && <span> • Nachher: <span className="text-emerald-400">{entry.new_value}</span></span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
      <Dialog open={paymentModal} onOpenChange={setPaymentModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>Zahlung erfassen</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-zinc-400">Betrag (€)</Label><Input type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <div><Label className="text-zinc-400">Zahlungsart</Label>
              <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm(f => ({ ...f, method: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="bank_transfer" className="text-white">Überweisung</SelectItem>
                  <SelectItem value="cash" className="text-white">Bar</SelectItem>
                  <SelectItem value="stripe" className="text-white">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-zinc-400">Referenz</Label><Input value={paymentForm.reference} onChange={(e) => setPaymentForm(f => ({ ...f, reference: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" placeholder="z.B. Kontoauszug 15.03" /></div>
            <div><Label className="text-zinc-400">Notiz</Label><Textarea value={paymentForm.note} onChange={(e) => setPaymentForm(f => ({ ...f, note: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="sendEmailCheckbox" checked={paymentForm.sendEmail} onChange={(e) => setPaymentForm(f => ({ ...f, sendEmail: e.target.checked }))} className="rounded border-zinc-600" />
              <Label htmlFor="sendEmailCheckbox" className="text-zinc-400 text-sm cursor-pointer">Bestätigungs-E-Mail senden</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPaymentModal(false)} className="text-zinc-400">Abbrechen</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handlePaymentReceived} disabled={processing === "payment"}>
              {processing === "payment" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />} Zahlung erfassen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBookingDetail;
