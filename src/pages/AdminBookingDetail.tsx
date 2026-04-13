import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import {
  CheckCircle2, XCircle, Mail, FileText, RefreshCw,
  Loader2, Users, CreditCard, FileCheck, MessageSquare,
  History, Send, Plus, Eye, AlertTriangle, ArrowLeftRight, RotateCcw,
  Globe, Tag, Clock, User, Clipboard, MapPin, Luggage, CheckSquare, Save, Shield, Upload, Download
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
import AutomationPanel from "@/components/admin/AutomationPanel";
import BookingGuestsPanel from "@/components/admin/BookingGuestsPanel";
import { cn } from "@/lib/utils";

interface TourBooking {
  id: string; booking_number: string; contact_first_name: string; contact_last_name: string;
  contact_email: string; contact_phone: string | null; participants: number; passenger_details: any[];
  base_price: number; pickup_surcharge: number; total_price: number; discount_amount: number | null;
  discount_code: string | null; status: string; booking_type: string; payment_method: string | null;
  payment_reference: string | null; paid_at: string | null; created_at: string; updated_at: string;
  customer_notes: string | null; internal_notes: string | null; tour_id: string; tour_date_id: string;
  tariff_id: string; pickup_stop_id: string | null; luggage_addons: any;
  stripe_session_id: string | null; stripe_payment_intent_id: string | null;
}
interface PaymentEntry { id: string; amount: number; method: string; reference: string | null; note: string | null; recorded_by: string | null; recorded_at: string; }
interface AuditEntry { id: string; action: string; field_name: string | null; old_value: string | null; new_value: string | null; performed_by_email: string | null; created_at: string; }
interface DocumentSend { id: string; document_type: string; recipient_email: string; status: string; error_message: string | null; created_at: string; }
interface InsuranceData { id: string; provider: string | null; product: string | null; policy_number: string | null; policy_status: string; price: number | null; is_active: boolean; notes: string | null; policy_pdf_url: string | null; }

/* ─── Helpers ─── */
const fmt = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const Row = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("flex justify-between py-1.5 border-b border-[#1e2430] last:border-0", className)}>
    <span className="text-xs text-zinc-500">{label}</span>
    <span className="text-xs text-zinc-200 text-right max-w-[60%]">{children}</span>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    confirmed: { label: "Bestätigt", cls: "bg-emerald-500/20 text-emerald-300 border border-emerald-600/40" },
    pending: { label: "Offen", cls: "bg-amber-500/20 text-amber-300 border border-amber-600/40" },
    cancelled: { label: "Storniert", cls: "bg-red-500/20 text-red-300 border border-red-600/40" },
    draft: { label: "Entwurf", cls: "bg-zinc-500/20 text-zinc-300 border border-zinc-600/40" },
    processing: { label: "In Bearbeitung", cls: "bg-blue-500/20 text-blue-300 border border-blue-600/40" },
  };
  const m = map[status] || { label: status, cls: "bg-zinc-600/20 text-zinc-300 border border-zinc-600/40" };
  return <Badge className={cn("text-[10px] px-2 py-0.5 font-medium", m.cls)}>{m.label}</Badge>;
};

const PayBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    bezahlt: { label: "Bezahlt", cls: "bg-emerald-500/20 text-emerald-300 border border-emerald-600/40" },
    teil: { label: "Teilzahlung", cls: "bg-amber-500/20 text-amber-300 border border-amber-600/40" },
    offen: { label: "Offen", cls: "bg-red-500/20 text-red-300 border border-red-600/40" },
    erstattet: { label: "Erstattet", cls: "bg-orange-500/20 text-orange-300 border border-orange-600/40" },
  };
  const m = map[status] || { label: status, cls: "bg-zinc-600/20 text-zinc-300 border border-zinc-600/40" };
  return <Badge className={cn("text-[10px] px-2 py-0.5 font-medium", m.cls)}>{m.label}</Badge>;
};

const ConsentBadge = ({ accepted, label }: { accepted: boolean; label: string }) => (
  <span className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border", accepted ? "bg-emerald-500/10 text-emerald-400 border-emerald-600/30" : "bg-zinc-700/30 text-zinc-500 border-zinc-600/30")}>
    {accepted ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />} {label}
  </span>
);

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

const AdminBookingDetail = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const _navigate = useNavigate();
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
  const [internalNotes, setInternalNotes] = useState("");
  const [internalTags, setInternalTags] = useState<string[]>([]);

  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, method: "bank_transfer", reference: "", note: "", sendEmail: true });
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelForm, setCancelForm] = useState({ reason: "customer_request", customReason: "", applyFee: true, feePercent: 20 });
  const [refundModal, setRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({ amount: 0, note: "" });

  useEffect(() => { if (!authLoading && user && isAdmin && bookingId) loadBooking(); }, [bookingId, user, isAdmin, authLoading]);

  const loadBooking = async () => {
    if (!bookingId) return;
    setIsLoading(true);
    try {
      const { data: b, error } = await supabase.from("tour_bookings").select("*").eq("id", bookingId).single();
      if (error) throw error;
      setBooking(b as TourBooking);
      setInternalNotes(b.internal_notes || "");

      // Parse tags from internal_notes
      const tagMatch = (b.internal_notes || "").match(/\[TAGS:(.*?)\]/);
      if (tagMatch) setInternalTags(tagMatch[1].split(",").map((t: string) => t.trim()).filter(Boolean));

      const [tourRes, dateRes, tariffRes, pickupRes, paymentsRes, auditRes, docsRes, insuranceRes] = await Promise.all([
        supabase.from("package_tours").select("destination, location, country, duration_days, image_url").eq("id", b.tour_id).single(),
        supabase.from("tour_dates").select("departure_date, return_date, duration_days, total_seats, booked_seats").eq("id", b.tour_date_id).single(),
        supabase.from("tour_tariffs").select("name, slug, suitcase_included, suitcase_weight_kg, is_refundable, cancellation_days, cancellation_fee_percent").eq("id", b.tariff_id).single(),
        b.pickup_stop_id ? supabase.from("tour_pickup_stops").select("city, location_name, departure_time, surcharge").eq("id", b.pickup_stop_id).single() : Promise.resolve({ data: null }),
        supabase.from("tour_payment_entries").select("*").eq("booking_id", bookingId).order("recorded_at", { ascending: false }),
        supabase.from("tour_booking_audit").select("*").eq("booking_id", bookingId).order("created_at", { ascending: false }),
        supabase.from("tour_document_sends").select("*").eq("booking_id", bookingId).order("created_at", { ascending: false }),
        supabase.from("tour_booking_insurance").select("*").eq("booking_id", bookingId).maybeSingle(),
      ]);
      setTourInfo(tourRes.data); setDateInfo(dateRes.data); setTariffInfo(tariffRes.data); setPickupInfo(pickupRes.data);
      setPayments((paymentsRes.data || []) as PaymentEntry[]); setAuditLog((auditRes.data || []) as AuditEntry[]);
      setDocSends((docsRes.data || []) as DocumentSend[]); setInsurance(insuranceRes.data as InsuranceData | null);
      const paid = (paymentsRes.data || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
      setPaymentForm(f => ({ ...f, amount: Math.max(0, b.total_price - paid) }));
    } catch (err) { console.error(err); toast({ title: "Buchung nicht gefunden", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const logAudit = async (action: string, fieldName?: string, oldVal?: string, newVal?: string) => {
    await supabase.from("tour_booking_audit").insert({ booking_id: bookingId!, action, field_name: fieldName || null, old_value: oldVal || null, new_value: newVal || null, performed_by: user?.id, performed_by_email: user?.email || null });
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
      toast({ title: `Status auf „${newStatus}" geändert` }); loadBooking();
    } catch { toast({ title: "Fehler", variant: "destructive" }); } finally { setProcessing(null); }
  };

  const handlePaymentReceived = async () => {
    if (!booking) return;
    setProcessing("payment");
    try {
      await supabase.from("tour_payment_entries").insert({ booking_id: booking.id, amount: paymentForm.amount, method: paymentForm.method, reference: paymentForm.reference || null, note: paymentForm.note || null, recorded_by: user?.id });
      const totalPaidNow = payments.reduce((s, p) => s + Number(p.amount), 0) + paymentForm.amount;
      const isFullyPaid = totalPaidNow >= booking.total_price;
      const updateData: any = { payment_method: paymentForm.method, payment_reference: paymentForm.reference || booking.payment_reference };
      if (isFullyPaid) { updateData.status = "confirmed"; updateData.paid_at = new Date().toISOString(); }
      await supabase.from("tour_bookings").update(updateData).eq("id", booking.id);
      await logAudit("PAYMENT_RECEIVED", "amount", null, `${paymentForm.amount}€ via ${paymentForm.method}`);
      if (paymentForm.sendEmail && isFullyPaid) {
        try { await supabase.functions.invoke("send-booking-confirmation", { body: { bookingId: booking.id } }); await supabase.from("tour_document_sends").insert({ booking_id: booking.id, document_type: "payment_confirmation", recipient_email: booking.contact_email, status: "sent", sent_by: user?.id }); toast({ title: "✅ Zahlung erfasst & Bestätigung gesendet" }); } catch { toast({ title: "✅ Zahlung erfasst (Mail fehlgeschlagen)" }); }
      } else { toast({ title: "✅ Zahlung erfasst" }); }
      setPaymentModal(false); loadBooking();
    } catch (err) { console.error(err); toast({ title: "Fehler", variant: "destructive" }); } finally { setProcessing(null); }
  };

  const handleCancellation = async () => {
    if (!booking) return;
    setProcessing("cancel");
    try {
      const reason = cancelForm.reason === "other" ? cancelForm.customReason : cancelForm.reason;
      const hasStripePayment = !!booking.stripe_payment_intent_id && !!booking.paid_at;

      // Use edge function for cancellation with automatic Stripe refund
      const { data, error } = await supabase.functions.invoke("cancel-tour-booking", {
        body: {
          bookingId: booking.id,
          reason,
          refundType: hasStripePayment ? "full" : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Also record local payment entry for non-Stripe refunds
      if (!hasStripePayment) {
        const feeAmount = cancelForm.applyFee ? (booking.total_price * cancelForm.feePercent / 100) : 0;
        const totalPaidNow = payments.reduce((s, p) => s + Number(p.amount), 0);
        if (totalPaidNow > 0) {
          const refundAmount = Math.max(0, totalPaidNow - feeAmount);
          if (refundAmount > 0) {
            await supabase.from("tour_payment_entries").insert({
              booking_id: booking.id, amount: -refundAmount, method: "refund",
              note: `Storno-Erstattung (Grund: ${reason})`, recorded_by: user?.id,
            });
          }
        }
      }

      const msg = data?.refundAmount > 0
        ? `✅ Buchung storniert & ${data.refundAmount.toFixed(2)}€ über Stripe zurückerstattet`
        : "✅ Buchung storniert";
      toast({ title: msg });
      setCancelModal(false);
      loadBooking();
    } catch (err: any) {
      console.error("Cancellation error:", err);
      toast({ title: "Fehler bei Stornierung", description: err.message, variant: "destructive" });
    } finally { setProcessing(null); }
  };

  const handleRefund = async () => {
    if (!booking) return;
    setProcessing("refund");
    try {
      await supabase.from("tour_payment_entries").insert({ booking_id: booking.id, amount: -refundForm.amount, method: "refund", note: refundForm.note || "Manuelle Erstattung", recorded_by: user?.id });
      await logAudit("REFUND_CREATED", "amount", null, `-${refundForm.amount.toFixed(2)}€ (${refundForm.note})`);
      toast({ title: "✅ Erstattung erfasst" }); setRefundModal(false); loadBooking();
    } catch { toast({ title: "Fehler", variant: "destructive" }); } finally { setProcessing(null); }
  };

  const sendEmail = async (type: string) => {
    if (!booking) return;
    setProcessing(type);
    try {
      await supabase.functions.invoke("send-booking-confirmation", { body: { bookingId: booking.id } });
      await supabase.from("tour_document_sends").insert({ booking_id: booking.id, document_type: type, recipient_email: booking.contact_email, status: "sent", sent_by: user?.id });
      await logAudit("EMAIL_SENT", "document_type", null, type);
      toast({ title: "✅ E-Mail gesendet" }); loadBooking();
    } catch { toast({ title: "Fehler beim Senden", variant: "destructive" }); } finally { setProcessing(null); }
  };

  const regenerateDocuments = async () => {
    if (!booking) return;
    setProcessing("regen");
    try { await supabase.functions.invoke("generate-tour-documents", { body: { bookingId: booking.id, documentType: "all" } }); await logAudit("DOCUMENTS_REGENERATED"); toast({ title: "✅ Dokumente neu generiert" }); } catch { toast({ title: "Fehler", variant: "destructive" }); } finally { setProcessing(null); }
  };

  const saveInsurance = async (data: Partial<InsuranceData>) => {
    if (!booking) return;
    setProcessing("insurance");
    try {
      if (insurance) { await supabase.from("tour_booking_insurance").update(data).eq("id", insurance.id); } else { await supabase.from("tour_booking_insurance").insert({ booking_id: booking.id, ...data }); }
      await logAudit("INSURANCE_UPDATED", "policy_status", insurance?.policy_status, data.policy_status);
      toast({ title: "✅ Versicherung aktualisiert" }); loadBooking();
    } catch { toast({ title: "Fehler", variant: "destructive" }); } finally { setProcessing(null); }
  };

  const saveInternalNotes = async () => {
    if (!booking) return;
    try {
      await supabase.from("tour_bookings").update({ internal_notes: internalNotes }).eq("id", booking.id);
      await logAudit("NOTES_UPDATED", "internal_notes");
      toast({ title: "✅ Notizen gespeichert" });
    } catch { toast({ title: "Fehler", variant: "destructive" }); }
  };

  if (authLoading || isLoading || !booking) {
    return <AdminLayout title="Buchung laden..."><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div></AdminLayout>;
  }
  if (!user || !isAdmin) {
    return <AdminLayout title="Kein Zugriff"><p className="text-zinc-400">Admin-Rechte erforderlich.</p></AdminLayout>;
  }

  const totalPaid = payments.filter(p => Number(p.amount) > 0).reduce((s, p) => s + Number(p.amount), 0);
  const totalRefunded = payments.filter(p => Number(p.amount) < 0).reduce((s, p) => s + Math.abs(Number(p.amount)), 0);
  const netPaid = totalPaid - totalRefunded;
  const openAmount = Math.max(0, booking.total_price - netPaid);
  const paymentStatus = netPaid >= booking.total_price ? "bezahlt" : netPaid > 0 ? "teil" : "offen";
  const passengers: any[] = Array.isArray(booking.passenger_details) ? booking.passenger_details : [];
  const missingPassengerData = passengers.length < booking.participants || passengers.some((p: any) => !p.firstName && !p.first_name);
  const hasInsurance = insurance && insurance.is_active;
  const daysSinceBooking = Math.floor((Date.now() - new Date(booking.created_at).getTime()) / 86400000);

  // Parse consent from customer_notes
  const parseConsent = () => {
    try {
      if (!booking.customer_notes) return { agb: false, datenschutz: false, reiseinfos: false, timestamp: null };
      const parsed = JSON.parse(booking.customer_notes);
      return { agb: !!parsed.agb_accepted, datenschutz: !!parsed.privacy_accepted || !!parsed.datenschutz, reiseinfos: !!parsed.travel_info_accepted || !!parsed.reiseinfos, timestamp: parsed.timestamp || parsed.accepted_at || null };
    } catch {
      return { agb: false, datenschutz: false, reiseinfos: false, timestamp: null, raw: booking.customer_notes };
    }
  };
  const consent = parseConsent();

  const warnings: { text: string; severity: "warning" | "error" }[] = [];
  if (missingPassengerData) warnings.push({ text: "Passagierdaten unvollständig", severity: "warning" });
  if (!hasInsurance && booking.status !== "cancelled") warnings.push({ text: "Keine Versicherung hinterlegt", severity: "warning" });
  if (paymentStatus === "offen" && booking.status === "pending" && daysSinceBooking > 3) warnings.push({ text: `Zahlung seit ${daysSinceBooking} Tagen offen`, severity: "error" });
  if (docSends.length === 0 && booking.status !== "cancelled") warnings.push({ text: "Noch keine Dokumente versendet", severity: "warning" });
  if (booking.status === "pending" && daysSinceBooking > 7) warnings.push({ text: "Buchung seit über 7 Tagen unbestätigt", severity: "error" });

  const bookingSource = booking.stripe_session_id ? "Website (Stripe)" : booking.booking_type === "request" ? "Anfrage" : booking.booking_type === "manual" ? "Manuell" : "Website";
  const luggageAddons = Array.isArray(booking.luggage_addons) ? booking.luggage_addons : [];

  return (
    <AdminLayout
      title={`Buchung ${booking.booking_number}`}
      subtitle={`${booking.contact_first_name} ${booking.contact_last_name} · ${tourInfo?.destination || ""}`}
      actions={<Button variant="ghost" size="sm" onClick={loadBooking} className="text-zinc-400"><RefreshCw className="w-4 h-4" /></Button>}
    >
      {/* ══════ WARNINGS ══════ */}
      {warnings.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {warnings.map((w, i) => (
            <div key={i} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border", w.severity === "error" ? "bg-red-500/10 text-red-400 border-red-600/30" : "bg-amber-500/10 text-amber-400 border-amber-600/30")}>
              <AlertTriangle className="w-3 h-3" /> {w.text}
            </div>
          ))}
        </div>
      )}

      {/* ══════ COMMAND CENTER HEADER ══════ */}
      <div className="bg-[#151920] border border-[#252b38] rounded-lg p-4 mb-4 space-y-3">
        {/* Row 1: Key status indicators */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Buchung</span>
            <span className="text-xs font-mono text-emerald-400">{booking.booking_number}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Status</span>
            <StatusBadge status={booking.status} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Zahlung</span>
            <PayBadge status={paymentStatus} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Check-in</span>
            <Badge className="bg-zinc-700/50 text-zinc-300 text-[10px] border border-zinc-600/40">0/{booking.participants}</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Dokumente</span>
            <Badge className={cn("text-[10px] border", docSends.length > 0 ? "bg-emerald-500/20 text-emerald-300 border-emerald-600/40" : "bg-zinc-700/50 text-zinc-400 border-zinc-600/40")}>{docSends.length}x versendet</Badge>
          </div>
          {totalRefunded > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Erstattung</span>
              <Badge className="bg-orange-500/20 text-orange-300 text-[10px] border border-orange-600/40">{fmt(totalRefunded)}</Badge>
            </div>
          )}
        </div>

        {/* Row 2: Meta info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Erstellt: {format(new Date(booking.created_at), "dd.MM.yyyy HH:mm", { locale: de })} ({formatDistanceToNow(new Date(booking.created_at), { locale: de, addSuffix: true })})</span>
          <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Quelle: {bookingSource}</span>
          <span className="flex items-center gap-1"><User className="w-3 h-3" /> Typ: {booking.booking_type === "request" ? "Anfrage" : "Direktbuchung"}</span>
          {booking.paid_at && <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> Bezahlt: {format(new Date(booking.paid_at), "dd.MM.yyyy HH:mm", { locale: de })}</span>}
          <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Tarif: {tariffInfo?.name || "–"}</span>
        </div>

        {/* Row 3: Quick Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {booking.status === "pending" && (
            <>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs" onClick={() => setPaymentModal(true)} disabled={!!processing}><CreditCard className="w-3 h-3 mr-1" /> Zahlung erfassen</Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 text-xs" onClick={() => updateBookingStatus("confirmed")} disabled={!!processing}><CheckCircle2 className="w-3 h-3 mr-1" /> Bestätigen</Button>
            </>
          )}
          <Button size="sm" variant="outline" className="border-[#2a3040] text-zinc-300 h-7 text-xs" onClick={() => sendEmail("booking_confirmation")} disabled={!!processing}><Mail className="w-3 h-3 mr-1" /> PDF senden</Button>
          <Button size="sm" variant="outline" className="border-[#2a3040] text-zinc-300 h-7 text-xs" onClick={regenerateDocuments} disabled={!!processing}><FileText className="w-3 h-3 mr-1" /> PDF neu</Button>
          {booking.status !== "cancelled" && (
            <>
              <Button size="sm" variant="outline" className="border-[#2a3040] text-zinc-300 h-7 text-xs" disabled={!!processing}><ArrowLeftRight className="w-3 h-3 mr-1" /> Umbuchen</Button>
              <Button size="sm" variant="outline" className="border-orange-800/50 text-orange-400 hover:bg-orange-950/30 h-7 text-xs" onClick={() => { setRefundForm({ amount: netPaid, note: "" }); setRefundModal(true); }} disabled={!!processing || netPaid <= 0}><RotateCcw className="w-3 h-3 mr-1" /> Erstattung</Button>
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => { setCancelForm({ reason: "customer_request", customReason: "", applyFee: true, feePercent: tariffInfo?.cancellation_fee_percent || 20 }); setCancelModal(true); }} disabled={!!processing}><XCircle className="w-3 h-3 mr-1" /> Stornieren</Button>
            </>
          )}
        </div>
      </div>

      {/* ══════ TABS ══════ */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-[#151920] border border-[#252b38] flex-wrap h-auto gap-0.5 p-1">
          {[
            { value: "overview", icon: Eye, label: "Übersicht" },
            { value: "guests", icon: Users, label: "Reisende" },
            { value: "payments", icon: CreditCard, label: "Zahlungen" },
            { value: "documents", icon: FileCheck, label: "Dokumente" },
            { value: "communication", icon: MessageSquare, label: "Kommunikation" },
            { value: "insurance", icon: Shield, label: "Versicherung" },
            { value: "checkin", icon: CheckSquare, label: "Check-in" },
            { value: "automation", icon: Mail, label: "Automationen" },
            { value: "audit", icon: History, label: "Änderungen" },
            { value: "internal", icon: Clipboard, label: "Intern" },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs gap-1">
              <tab.icon className="w-3 h-3" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── OVERVIEW ─── */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Col 1: Customer */}
            <SectionCard title="Kontaktdaten">
              <div className="space-y-0">
                <Row label="Name"><span className="font-medium">{booking.contact_first_name} {booking.contact_last_name}</span></Row>
                <Row label="E-Mail">{booking.contact_email}</Row>
                <Row label="Telefon">{booking.contact_phone || "–"}</Row>
                <Row label="Buchungstyp">{booking.booking_type === "request" ? "Anfrage" : "Direktbuchung"}</Row>
                <Row label="Quelle">{bookingSource}</Row>
              </div>
              <div className="mt-3 space-y-1.5">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Einwilligungen</p>
                <div className="flex flex-wrap gap-1">
                  <ConsentBadge accepted={consent.agb} label="AGB" />
                  <ConsentBadge accepted={consent.datenschutz} label="Datenschutz" />
                  <ConsentBadge accepted={consent.reiseinfos} label="Reiseinfos" />
                </div>
                {consent.timestamp && <p className="text-[10px] text-zinc-600">Akzeptiert: {typeof consent.timestamp === "string" ? consent.timestamp : ""}</p>}
                {(consent as any).raw && <p className="text-[10px] text-zinc-500 italic mt-1">{(consent as any).raw}</p>}
              </div>
            </SectionCard>

            {/* Col 2: Travel details */}
            <SectionCard title="Reisedetails">
              <div className="space-y-0">
                <Row label="Reiseziel"><span className="font-medium">{tourInfo?.destination}</span></Row>
                <Row label="Ort / Land">{tourInfo?.location}, {tourInfo?.country}</Row>
                <Row label="Hinreise">{dateInfo ? format(new Date(dateInfo.departure_date), "dd.MM.yyyy", { locale: de }) : "–"}</Row>
                <Row label="Rückreise">{dateInfo ? format(new Date(dateInfo.return_date), "dd.MM.yyyy", { locale: de }) : "–"}</Row>
                <Row label="Dauer">{dateInfo?.duration_days || tourInfo?.duration_days || "–"} Tage</Row>
                <Row label="Tarif">{tariffInfo?.name || "–"}</Row>
                <Row label="Teilnehmer">{booking.participants} Person(en)</Row>
                {pickupInfo && <Row label="Zustieg"><span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-400" />{pickupInfo.city} – {pickupInfo.location_name} ({pickupInfo.departure_time?.slice(0, 5)} Uhr)</span></Row>}
                <Row label="Auslastung">{dateInfo ? `${dateInfo.booked_seats}/${dateInfo.total_seats} Plätze` : "–"}</Row>
              </div>
              {/* Luggage */}
              <div className="mt-3 space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1"><Luggage className="w-3 h-3" /> Gepäck</p>
                <div className="text-xs text-zinc-300">
                  {tariffInfo?.suitcase_included ? <span className="text-emerald-400">✓ Koffer inkl. ({tariffInfo.suitcase_weight_kg || "–"} kg)</span> : <span className="text-zinc-500">Nur Handgepäck</span>}
                </div>
                {luggageAddons.length > 0 && luggageAddons.map((l: any, i: number) => (
                  <div key={i} className="text-xs text-zinc-400">+ {l.name || "Zusatzgepäck"} ({fmt(l.price || 0)})</div>
                ))}
              </div>
              {/* Cancellation rules */}
              <div className="mt-3 space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Stornoregeln</p>
                <div className="text-xs text-zinc-300">
                  {tariffInfo?.is_refundable
                    ? <span className="text-emerald-400">Erstattbar bis {tariffInfo.cancellation_days} Tage vor Abfahrt ({tariffInfo.cancellation_fee_percent}% Gebühr)</span>
                    : <span className="text-red-400">Nicht erstattbar</span>
                  }
                </div>
              </div>
            </SectionCard>

            {/* Col 3: Price breakdown */}
            <SectionCard title="Preisberechnung">
              <div className="space-y-0">
                <Row label="Grundpreis">{fmt(booking.base_price)}</Row>
                {booking.pickup_surcharge > 0 && <Row label="Zustiegs-Zuschlag">+ {fmt(booking.pickup_surcharge)}</Row>}
                {luggageAddons.length > 0 && luggageAddons.map((l: any, i: number) => (
                  <Row key={i} label={`Gepäck: ${l.name || "Zusatz"}`}>+ {fmt(l.price || 0)}</Row>
                ))}
                {insurance?.is_active && insurance.price && <Row label="Versicherung">+ {fmt(insurance.price)}</Row>}
                {booking.discount_amount && booking.discount_amount > 0 && (
                  <Row label={`Rabatt${booking.discount_code ? ` (${booking.discount_code})` : ""}`} className="text-emerald-400">- {fmt(booking.discount_amount)}</Row>
                )}
                <div className="border-t border-[#2a3040] my-1" />
                <Row label="Gesamtbetrag" className="font-bold"><span className="text-emerald-400 text-sm font-bold">{fmt(booking.total_price)}</span></Row>
                <div className="border-t border-[#2a3040] my-1" />
                <Row label="Bezahlt"><span className={netPaid >= booking.total_price ? "text-emerald-400" : "text-amber-400"}>{fmt(netPaid)}</span></Row>
                {openAmount > 0 && <Row label="Offen"><span className="text-red-400 font-medium">{fmt(openAmount)}</span></Row>}
                {totalRefunded > 0 && <Row label="Erstattet"><span className="text-orange-400">- {fmt(totalRefunded)}</span></Row>}
              </div>
              <div className="mt-3 text-[10px] text-zinc-600">
                Zahlungsart: {booking.payment_method === "bank_transfer" ? "Überweisung" : booking.payment_method === "stripe" ? "Stripe" : booking.payment_method === "cash" ? "Bar" : booking.payment_method || "–"}
                {booking.payment_reference && <> · Ref: {booking.payment_reference}</>}
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        {/* ─── GUESTS ─── */}
        <TabsContent value="guests">
          <SectionCard title={`Reisende (${passengers.length}/${booking.participants})`} actions={missingPassengerData && <Badge className="bg-amber-500/20 text-amber-300 text-[10px] border border-amber-600/40">Daten unvollständig</Badge>}>
            {passengers.length === 0 ? (
              <p className="text-zinc-500 text-sm py-6 text-center">Keine Passagierdaten hinterlegt</p>
            ) : (
              <Table>
                <TableHeader><TableRow className="border-[#252b38]">
                  <TableHead className="text-zinc-400 text-xs">#</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Vorname</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Nachname</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Geburtsdatum</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Hinweise</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Check-in</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {passengers.map((p: any, i: number) => {
                    const hasData = (p.firstName || p.first_name) && (p.lastName || p.last_name);
                    return (
                      <TableRow key={i} className={cn("border-[#252b38]", i % 2 === 0 ? "bg-[#151920]" : "bg-[#1a1f2a]")}>
                        <TableCell className="text-zinc-500 text-xs">{i + 1}</TableCell>
                        <TableCell className="text-zinc-200 text-xs">{p.firstName || p.first_name || "–"}</TableCell>
                        <TableCell className="text-zinc-200 text-xs">{p.lastName || p.last_name || "–"}</TableCell>
                        <TableCell className="text-zinc-400 text-xs">{p.birthDate || p.birth_date || "–"}</TableCell>
                        <TableCell className="text-zinc-400 text-xs">{p.notes || p.special_needs || "–"}</TableCell>
                        <TableCell><Badge className="bg-zinc-700/50 text-zinc-400 text-[10px] border border-zinc-600/40">Offen</Badge></TableCell>
                        <TableCell>{hasData ? <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-600/40">✓ Vollständig</Badge> : <Badge className="bg-amber-500/20 text-amber-300 text-[10px] border border-amber-600/40">Fehlt</Badge>}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </TabsContent>

        {/* ─── PAYMENTS ─── */}
        <TabsContent value="payments">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Sollbetrag", value: fmt(booking.total_price), cls: "text-zinc-100" },
                { label: "Eingegangen", value: fmt(totalPaid), cls: "text-emerald-400" },
                { label: "Erstattet", value: fmt(totalRefunded), cls: "text-orange-400" },
                { label: "Offen", value: fmt(openAmount), cls: openAmount > 0 ? "text-red-400" : "text-emerald-400" },
                { label: "Zahlungsstatus", value: "", badge: paymentStatus },
              ].map((kpi, i) => (
                <Card key={i} className="bg-[#151920] border-[#252b38]">
                  <CardContent className="pt-3 pb-2 px-3">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{kpi.label}</div>
                    {kpi.badge ? <PayBadge status={kpi.badge} /> : <div className={cn("text-lg font-bold", kpi.cls)}>{kpi.value}</div>}
                  </CardContent>
                </Card>
              ))}
            </div>

            <SectionCard title="Zahlungseingänge & Erstattungen" actions={
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs" onClick={() => setPaymentModal(true)}><Plus className="w-3 h-3 mr-1" /> Zahlung erfassen</Button>
            }>
              {payments.length === 0 ? <p className="text-zinc-500 text-sm py-4 text-center">Noch keine Zahlungseingänge</p> : (
                <Table>
                  <TableHeader><TableRow className="border-[#252b38]">
                    <TableHead className="text-zinc-400 text-xs">Datum</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Betrag</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Art</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Referenz</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Notiz</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {payments.map((p, i) => (
                      <TableRow key={p.id} className={cn("border-[#252b38]", i % 2 === 0 ? "bg-[#151920]" : "bg-[#1a1f2a]")}>
                        <TableCell className="text-zinc-300 text-xs">{format(new Date(p.recorded_at), "dd.MM.yy HH:mm", { locale: de })}</TableCell>
                        <TableCell className={cn("font-semibold text-xs", Number(p.amount) < 0 ? "text-orange-400" : "text-emerald-400")}>{Number(p.amount) < 0 ? "" : "+"}{fmt(Number(p.amount))}</TableCell>
                        <TableCell className="text-zinc-300 text-xs">{p.method === "bank_transfer" ? "Überweisung" : p.method === "cash" ? "Bar" : p.method === "refund" ? "Erstattung" : p.method === "stripe" ? "Stripe" : p.method}</TableCell>
                        <TableCell className="text-zinc-400 text-xs font-mono">{p.reference || "–"}</TableCell>
                        <TableCell className="text-zinc-400 text-xs">{p.note || "–"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </SectionCard>
          </div>
        </TabsContent>

        {/* ─── DOCUMENTS ─── */}
        <TabsContent value="documents">
          <div className="space-y-4">
            <SectionCard title="Dokumente generieren & versenden" actions={
              <Button size="sm" variant="outline" className="border-[#2a3040] text-zinc-300 h-7 text-xs" onClick={regenerateDocuments} disabled={processing === "regen"}>
                {processing === "regen" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />} Alle neu generieren
              </Button>
            }>
              <div className="grid md:grid-cols-2 gap-2">
                {[
                  { name: "Buchungsbestätigung", type: "booking_confirmation", desc: "PDF mit Buchungsdetails" },
                  { name: "Rechnung", type: "invoice", desc: "Rechnung inkl. MwSt." },
                  { name: "Hotel-Voucher", type: "voucher", desc: "Hotelgutschein" },
                  { name: "Reiseplan", type: "travel_plan", desc: "Seniorenfreundlicher Plan (16pt)" },
                ].map(doc => {
                  const sent = docSends.find(d => d.document_type === doc.type);
                  return (
                    <div key={doc.type} className="bg-[#1a1f2a] border border-[#2a3040] rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-zinc-200">{doc.name}</div>
                          <div className="text-[10px] text-zinc-500">{doc.desc}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {sent && <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-600/40">✓</Badge>}
                        <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white h-7 w-7 p-0" onClick={() => sendEmail(doc.type)} disabled={!!processing}>
                          <Send className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Versandverlauf">
              {docSends.length === 0 ? <p className="text-zinc-500 text-sm py-4 text-center">Noch keine Dokumente versendet</p> : (
                <Table>
                  <TableHeader><TableRow className="border-[#252b38]">
                    <TableHead className="text-zinc-400 text-xs">Zeitpunkt</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Dokument</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Empfänger</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Status</TableHead>
                    <TableHead className="text-zinc-400 text-xs"></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {docSends.map((d, i) => (
                      <TableRow key={d.id} className={cn("border-[#252b38]", i % 2 === 0 ? "bg-[#151920]" : "bg-[#1a1f2a]")}>
                        <TableCell className="text-zinc-300 text-xs">{format(new Date(d.created_at), "dd.MM.yy HH:mm", { locale: de })}</TableCell>
                        <TableCell className="text-zinc-200 text-xs">{d.document_type}</TableCell>
                        <TableCell className="text-zinc-400 text-xs">{d.recipient_email}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-[10px] border", d.status === "sent" ? "bg-emerald-500/20 text-emerald-300 border-emerald-600/40" : "bg-red-500/20 text-red-300 border-red-600/40")}>{d.status === "sent" ? "✓ Gesendet" : d.status === "failed" ? "✗ Fehler" : d.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="text-zinc-500 h-6 text-[10px]" onClick={() => sendEmail(d.document_type)} disabled={!!processing}><RefreshCw className="w-2.5 h-2.5 mr-1" /> Erneut</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </SectionCard>
          </div>
        </TabsContent>

        {/* ─── COMMUNICATION ─── */}
        <TabsContent value="communication">
          <div className="space-y-4">
            <SectionCard title="Schnellaktionen">
              <div className="grid md:grid-cols-2 gap-2">
                {[
                  { label: "Zahlungsinfos senden", type: "payment_info", icon: CreditCard },
                  { label: "Buchungsbestätigung senden", type: "booking_confirmation", icon: CheckCircle2 },
                  { label: "Reiseinfos senden (Treffpunkt, Uhrzeit)", type: "travel_info", icon: MapPin },
                  { label: "Ticket / QR-Code erneut senden", type: "ticket_resend", icon: FileText },
                ].map((action) => (
                  <Button key={action.type} variant="outline" className="border-[#2a3040] text-zinc-300 justify-start h-auto py-2.5 text-xs" onClick={() => sendEmail(action.type)} disabled={!!processing}>
                    {processing === action.type ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <action.icon className="w-3.5 h-3.5 mr-2 shrink-0" />}
                    {action.label}
                  </Button>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Kommunikations-Timeline">
              {docSends.length === 0 ? <p className="text-zinc-500 text-sm py-4 text-center">Keine Kommunikation protokolliert</p> : (
                <div className="relative pl-4 space-y-0">
                  <div className="absolute left-1.5 top-2 bottom-2 w-px bg-[#2a3040]" />
                  {[...docSends].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((d) => (
                    <div key={d.id} className="relative flex items-start gap-3 py-2.5">
                      <div className={cn("absolute left-[-10px] top-3.5 w-2 h-2 rounded-full border-2", d.status === "sent" ? "bg-emerald-500 border-emerald-400" : "bg-red-500 border-red-400")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-zinc-200">{d.document_type.replace(/_/g, " ")}</span>
                          <span className="text-[10px] text-zinc-600">{format(new Date(d.created_at), "dd.MM.yy HH:mm", { locale: de })}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">→ {d.recipient_email} · {d.status === "sent" ? "Zugestellt" : `Fehler: ${d.error_message || "Unbekannt"}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </TabsContent>

        {/* ─── INSURANCE ─── */}
        <TabsContent value="insurance">
          <div className="space-y-4">
            {/* Status Banner */}
            {(() => {
              const statusMap: Record<string, { label: string; cls: string }> = {
                not_requested: { label: "Keine Versicherung angefragt", cls: "bg-zinc-700/30 border-zinc-600/40 text-zinc-400" },
                pending: { label: "Versicherung in Bearbeitung", cls: "bg-amber-500/10 border-amber-600/30 text-amber-400" },
                requested: { label: "Versicherung angefragt", cls: "bg-blue-500/10 border-blue-600/30 text-blue-400" },
                active: { label: "Versicherung aktiv", cls: "bg-emerald-500/10 border-emerald-600/30 text-emerald-400" },
                denied: { label: "Versicherung abgelehnt", cls: "bg-red-500/10 border-red-600/30 text-red-400" },
              };
              const s = statusMap[insurance?.policy_status || "not_requested"] || statusMap.not_requested;
              return (
                <div className={cn("flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium", s.cls)}>
                  <Shield className="w-4 h-4" /> {s.label}
                </div>
              );
            })()}

            {!insurance ? (
              <SectionCard title="Versicherung anlegen">
                <div className="text-center py-6">
                  <p className="text-zinc-500 text-sm mb-3">Für diese Buchung wurde noch keine Versicherung angelegt.</p>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs" onClick={() => saveInsurance({ is_active: true, policy_status: "requested" })} disabled={!!processing}>
                    <Plus className="w-3 h-3 mr-1" /> Versicherung anlegen
                  </Button>
                </div>
              </SectionCard>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {/* Form Card */}
                <SectionCard title="Versicherungsdaten">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-zinc-400 text-xs">Status</Label>
                      <Select value={insurance.policy_status} onValueChange={(v) => saveInsurance({ policy_status: v })}>
                        <SelectTrigger className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                          <SelectItem value="not_requested" className="text-white">Nicht angefragt</SelectItem>
                          <SelectItem value="requested" className="text-white">Angefragt</SelectItem>
                          <SelectItem value="pending" className="text-white">In Bearbeitung</SelectItem>
                          <SelectItem value="active" className="text-white">Aktiv</SelectItem>
                          <SelectItem value="denied" className="text-white">Abgelehnt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Anbieter</Label>
                      <Select value={insurance.provider || ""} onValueChange={(v) => saveInsurance({ provider: v })}>
                        <SelectTrigger className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1"><SelectValue placeholder="Anbieter wählen" /></SelectTrigger>
                        <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                          <SelectItem value="ERGO" className="text-white">ERGO Reiseversicherung</SelectItem>
                          <SelectItem value="HanseMerkur" className="text-white">HanseMerkur</SelectItem>
                          <SelectItem value="Allianz" className="text-white">Allianz Travel</SelectItem>
                          <SelectItem value="Europäische" className="text-white">Europäische Reiseversicherung</SelectItem>
                          <SelectItem value="Sonstige" className="text-white">Sonstige</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Produkt</Label>
                      <Select value={insurance.product || ""} onValueChange={(v) => saveInsurance({ product: v })}>
                        <SelectTrigger className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1"><SelectValue placeholder="Produkt wählen" /></SelectTrigger>
                        <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                          <SelectItem value="Reiserücktritt" className="text-white">Reiserücktrittsversicherung</SelectItem>
                          <SelectItem value="Vollschutz" className="text-white">Reise-Vollschutz</SelectItem>
                          <SelectItem value="Storno+Abbruch" className="text-white">Storno + Abbruch</SelectItem>
                          <SelectItem value="Sicherungsschein" className="text-white">Nur Sicherungsschein</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Policennummer</Label>
                      <Input defaultValue={insurance.policy_number || ""} onBlur={(e) => { if (e.target.value !== (insurance.policy_number || "")) saveInsurance({ policy_number: e.target.value }); }} className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1" placeholder="z.B. POL-2026-123456" />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Preis (€)</Label>
                      <Input type="number" step="0.01" defaultValue={insurance.price || 0} onBlur={(e) => { const v = parseFloat(e.target.value) || 0; if (v !== (insurance.price || 0)) saveInsurance({ price: v }); }} className="bg-[#1a1f2a] border-[#2a3040] text-white mt-1" />
                    </div>
                  </div>
                </SectionCard>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* PDF Upload/Download */}
                  <SectionCard title="Policen-Dokument">
                    {insurance.policy_pdf_url ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 bg-[#1a1f2a] border border-[#2a3040] rounded-lg p-3">
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-xs text-zinc-200 flex-1 truncate">{insurance.policy_pdf_url.split("/").pop()}</span>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-400" onClick={() => {
                            const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/authenticated/tour-documents/${insurance.policy_pdf_url}`;
                            window.open(url, "_blank");
                          }}><Download className="w-3 h-3 mr-1" /> Öffnen</Button>
                        </div>
                        <Button size="sm" variant="outline" className="border-[#2a3040] text-zinc-300 h-7 text-xs w-full" onClick={async () => {
                          const input = document.createElement("input");
                          input.type = "file"; input.accept = ".pdf";
                          input.onchange = async () => {
                            const file = input.files?.[0];
                            if (!file) return;
                            const path = `insurance/${booking.id}/${file.name}`;
                            const { error } = await supabase.storage.from("tour-documents").upload(path, file, { upsert: true });
                            if (error) { toast({ title: "Upload fehlgeschlagen", variant: "destructive" }); return; }
                            await saveInsurance({ policy_pdf_url: path });
                            toast({ title: "✅ PDF aktualisiert" });
                          };
                          input.click();
                        }}><Upload className="w-3 h-3 mr-1" /> PDF ersetzen</Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-zinc-500 text-xs mb-2">Kein PDF hochgeladen</p>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs" onClick={async () => {
                          const input = document.createElement("input");
                          input.type = "file"; input.accept = ".pdf";
                          input.onchange = async () => {
                            const file = input.files?.[0];
                            if (!file) return;
                            const path = `insurance/${booking.id}/${file.name}`;
                            const { error } = await supabase.storage.from("tour-documents").upload(path, file, { upsert: true });
                            if (error) { toast({ title: "Upload fehlgeschlagen", variant: "destructive" }); return; }
                            await saveInsurance({ policy_pdf_url: path });
                            toast({ title: "✅ PDF hochgeladen" });
                          };
                          input.click();
                        }} disabled={!!processing}><Upload className="w-3 h-3 mr-1" /> PDF hochladen</Button>
                      </div>
                    )}
                  </SectionCard>

                  {/* Insured Persons */}
                  <SectionCard title="Versicherte Personen">
                    {(() => {
                      const persons = Array.isArray((insurance as any).insured_persons) ? (insurance as any).insured_persons : [];
                      return persons.length === 0 ? (
                        <p className="text-zinc-500 text-xs py-3 text-center">
                          {passengers.length > 0 ? `${passengers.length} Reisende vorhanden – Personen werden aus Passagierdaten übernommen` : "Keine versicherten Personen hinterlegt"}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {persons.map((p: any, i: number) => (
                            <div key={i} className="flex justify-between py-1.5 border-b border-[#1e2430] last:border-0 text-xs">
                              <span className="text-zinc-200">{p.firstName || p.first_name || ""} {p.lastName || p.last_name || ""}</span>
                              <span className="text-zinc-500">{p.birthDate || p.birth_date || "–"}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </SectionCard>

                  {/* Notes */}
                  <SectionCard title="Notizen zur Versicherung">
                    <Textarea defaultValue={insurance.notes || ""} onBlur={(e) => { if (e.target.value !== (insurance.notes || "")) saveInsurance({ notes: e.target.value }); }} className="bg-[#1a1f2a] border-[#2a3040] text-zinc-100 text-xs min-h-[80px]" placeholder="Interne Anmerkungen zur Versicherung..." />
                  </SectionCard>

                  {/* Send to customer */}
                  <Button size="sm" variant="outline" className="border-[#2a3040] text-zinc-300 h-8 text-xs w-full" onClick={() => sendEmail("insurance_certificate")} disabled={!!processing || insurance.policy_status !== "active"}>
                    <Send className="w-3 h-3 mr-1" /> Sicherungsschein an Kunden senden
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="checkin">
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <Card className="bg-[#151920] border-[#252b38]"><CardContent className="pt-3 pb-2 px-3">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Check-in Status</div>
                <div className="text-lg font-bold text-zinc-100">0 / {booking.participants}</div>
                <p className="text-[10px] text-zinc-500">Kein Passagier eingecheckt</p>
              </CardContent></Card>
              <Card className="bg-[#151920] border-[#252b38]"><CardContent className="pt-3 pb-2 px-3">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Boarding-Status</div>
                <Badge className="bg-zinc-700/50 text-zinc-300 text-[10px] border border-zinc-600/40">Nicht gestartet</Badge>
              </CardContent></Card>
              <Card className="bg-[#151920] border-[#252b38]"><CardContent className="pt-3 pb-2 px-3">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Ticket-Gültigkeit</div>
                <Badge className={cn("text-[10px] border", booking.status === "confirmed" ? "bg-emerald-500/20 text-emerald-300 border-emerald-600/40" : "bg-zinc-700/50 text-zinc-400 border-zinc-600/40")}>{booking.status === "confirmed" ? "Gültig" : "Nicht aktiviert"}</Badge>
              </CardContent></Card>
            </div>

            <SectionCard title="Passagier-Check-in">
              <Table>
                <TableHeader><TableRow className="border-[#252b38]">
                  <TableHead className="text-zinc-400 text-xs">#</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Name</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Check-in</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Eingecheckt von</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Zeitpunkt</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Boarding</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(passengers.length > 0 ? passengers : Array.from({ length: booking.participants }, (_, i) => ({ index: i }))).map((p: any, i: number) => (
                    <TableRow key={i} className={cn("border-[#252b38]", i % 2 === 0 ? "bg-[#151920]" : "bg-[#1a1f2a]")}>
                      <TableCell className="text-zinc-500 text-xs">{i + 1}</TableCell>
                      <TableCell className="text-zinc-200 text-xs">{(p.firstName || p.first_name || "") + " " + (p.lastName || p.last_name || "") || "–"}</TableCell>
                      <TableCell><Badge className="bg-zinc-700/50 text-zinc-400 text-[10px] border border-zinc-600/40">Offen</Badge></TableCell>
                      <TableCell className="text-zinc-500 text-xs">–</TableCell>
                      <TableCell className="text-zinc-500 text-xs">–</TableCell>
                      <TableCell><Badge className="bg-zinc-700/50 text-zinc-400 text-[10px] border border-zinc-600/40">–</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>

            <SectionCard title="Scan-Historie">
              <p className="text-zinc-500 text-sm py-4 text-center">Keine Scan-Ereignisse für diese Buchung</p>
            </SectionCard>
          </div>
        </TabsContent>

        {/* ─── AUTOMATION ─── */}
        <TabsContent value="automation">
          <AutomationPanel bookingId={booking.id} bookingStatus={booking.status} paidAt={booking.paid_at} contactEmail={booking.contact_email} passengerDetails={booking.passenger_details} participants={booking.participants} />
        </TabsContent>

        {/* ─── AUDIT ─── */}
        <TabsContent value="audit">
          <SectionCard title="Änderungsverlauf">
            {auditLog.length === 0 ? <p className="text-zinc-500 text-sm py-4 text-center">Keine Änderungen protokolliert</p> : (
              <Table>
                <TableHeader><TableRow className="border-[#252b38]">
                  <TableHead className="text-zinc-400 text-xs">Zeitpunkt</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Aktion</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Feld</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Vorher</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Nachher</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Benutzer</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {auditLog.map((entry, i) => (
                    <TableRow key={entry.id} className={cn("border-[#252b38]", i % 2 === 0 ? "bg-[#151920]" : "bg-[#1a1f2a]")}>
                      <TableCell className="text-zinc-300 text-xs font-mono">{format(new Date(entry.created_at), "dd.MM.yy HH:mm", { locale: de })}</TableCell>
                      <TableCell className="text-zinc-200 text-xs">{entry.action.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-zinc-400 text-xs">{entry.field_name || "–"}</TableCell>
                      <TableCell className="text-red-400 text-xs">{entry.old_value || "–"}</TableCell>
                      <TableCell className="text-emerald-400 text-xs">{entry.new_value || "–"}</TableCell>
                      <TableCell className="text-zinc-500 text-xs">{entry.performed_by_email || "System"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </TabsContent>

        {/* ─── INTERNAL ─── */}
        <TabsContent value="internal">
          <div className="grid md:grid-cols-2 gap-4">
            <SectionCard title="Interne Notizen">
              <Textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} className="bg-[#1a1f2a] border-[#2a3040] text-zinc-100 text-xs min-h-[120px]" placeholder="Interne Anmerkungen zur Buchung..." />
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs mt-2" onClick={saveInternalNotes}><Save className="w-3 h-3 mr-1" /> Speichern</Button>
            </SectionCard>

            <div className="space-y-4">
              <SectionCard title="Interne Tags">
                <div className="flex flex-wrap gap-1.5">
                  {["VIP", "Problemfall", "Rückruf", "Gruppenreise", "Kulanz", "Reklamation", "Neukunde", "Firmenkunde"].map(tag => (
                    <button key={tag} onClick={() => setInternalTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                      className={cn("text-[10px] px-2 py-1 rounded-full border transition-colors", internalTags.includes(tag) ? "bg-emerald-500/20 text-emerald-300 border-emerald-600/40" : "bg-[#1a1f2a] text-zinc-500 border-[#2a3040] hover:text-zinc-300")}>
                      {tag}
                    </button>
                  ))}
                </div>
              </SectionCard>

              {/* Versicherung wurde in eigenen Tab verschoben */}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ══════ MODALS ══════ */}
      {/* Payment Modal */}
      <Dialog open={paymentModal} onOpenChange={setPaymentModal}>
        <DialogContent className="bg-[#151920] border-[#252b38] text-white">
          <DialogHeader><DialogTitle>Zahlung erfassen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-zinc-400 text-xs">Betrag (€)</Label><Input type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" /></div>
            <div><Label className="text-zinc-400 text-xs">Zahlungsart</Label>
              <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm(f => ({ ...f, method: v }))}>
                <SelectTrigger className="bg-[#1a1f2a] border-[#2a3040] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                  <SelectItem value="bank_transfer" className="text-white">Überweisung</SelectItem>
                  <SelectItem value="cash" className="text-white">Bar</SelectItem>
                  <SelectItem value="stripe" className="text-white">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-zinc-400 text-xs">Referenz</Label><Input value={paymentForm.reference} onChange={(e) => setPaymentForm(f => ({ ...f, reference: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" placeholder="z.B. Kontoauszug 15.03" /></div>
            <div><Label className="text-zinc-400 text-xs">Notiz</Label><Textarea value={paymentForm.note} onChange={(e) => setPaymentForm(f => ({ ...f, note: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="sendEmailCheckbox" checked={paymentForm.sendEmail} onChange={(e) => setPaymentForm(f => ({ ...f, sendEmail: e.target.checked }))} className="rounded border-zinc-600" />
              <Label htmlFor="sendEmailCheckbox" className="text-zinc-400 text-xs cursor-pointer">Bestätigungs-E-Mail senden</Label>
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

      {/* Cancellation Modal */}
      <Dialog open={cancelModal} onOpenChange={setCancelModal}>
        <DialogContent className="bg-[#151920] border-[#252b38] text-white">
          <DialogHeader><DialogTitle className="text-red-400">Buchung stornieren</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-zinc-400 text-xs">Stornogrund</Label>
              <Select value={cancelForm.reason} onValueChange={(v) => setCancelForm(f => ({ ...f, reason: v }))}>
                <SelectTrigger className="bg-[#1a1f2a] border-[#2a3040] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                  <SelectItem value="customer_request" className="text-white">Kundenwunsch</SelectItem>
                  <SelectItem value="no_payment" className="text-white">Keine Zahlung</SelectItem>
                  <SelectItem value="tour_cancelled" className="text-white">Reise abgesagt</SelectItem>
                  <SelectItem value="medical" className="text-white">Krankheit / Notfall</SelectItem>
                  <SelectItem value="duplicate" className="text-white">Doppelbuchung</SelectItem>
                  <SelectItem value="other" className="text-white">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {cancelForm.reason === "other" && <div><Label className="text-zinc-400 text-xs">Grund (Freitext)</Label><Input value={cancelForm.customReason} onChange={(e) => setCancelForm(f => ({ ...f, customReason: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" /></div>}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="applyFeeCheckbox" checked={cancelForm.applyFee} onChange={(e) => setCancelForm(f => ({ ...f, applyFee: e.target.checked }))} className="rounded border-zinc-600" />
              <Label htmlFor="applyFeeCheckbox" className="text-zinc-400 text-xs cursor-pointer">Stornogebühr anwenden</Label>
            </div>
            {cancelForm.applyFee && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-zinc-400 text-xs">Gebühr (%)</Label><Input type="number" value={cancelForm.feePercent} onChange={(e) => setCancelForm(f => ({ ...f, feePercent: parseInt(e.target.value) || 0 }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" /></div>
                <div><Label className="text-zinc-400 text-xs">Gebühr (€)</Label><div className="bg-[#1a1f2a] border border-[#2a3040] rounded-md px-3 py-2 text-white mt-1 text-sm">{fmt(booking.total_price * cancelForm.feePercent / 100)}</div></div>
              </div>
            )}
            {netPaid > 0 && (
              <div className="bg-[#1a1f2a] border border-[#2a3040] rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-zinc-400">Bereits bezahlt</span><span className="text-zinc-200">{fmt(netPaid)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">Stornogebühr</span><span className="text-red-400">{fmt(cancelForm.applyFee ? booking.total_price * cancelForm.feePercent / 100 : 0)}</span></div>
                <Separator className="bg-[#2a3040]" />
                <div className="flex justify-between font-bold"><span className="text-zinc-300">Erstattung</span><span className="text-emerald-400">{fmt(Math.max(0, netPaid - (cancelForm.applyFee ? booking.total_price * cancelForm.feePercent / 100 : 0)))}</span></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelModal(false)} className="text-zinc-400">Abbrechen</Button>
            <Button variant="destructive" onClick={handleCancellation} disabled={processing === "cancel"}>
              {processing === "cancel" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <XCircle className="w-4 h-4 mr-1" />} Endgültig stornieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={refundModal} onOpenChange={setRefundModal}>
        <DialogContent className="bg-[#151920] border-[#252b38] text-white">
          <DialogHeader><DialogTitle className="text-orange-400">Erstattung erfassen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-zinc-400 text-xs">Betrag (€)</Label><Input type="number" step="0.01" value={refundForm.amount} onChange={(e) => setRefundForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" /></div>
            <div><Label className="text-zinc-400 text-xs">Notiz</Label><Textarea value={refundForm.note} onChange={(e) => setRefundForm(f => ({ ...f, note: e.target.value }))} className="bg-[#1a1f2a] border-[#2a3040] text-white" placeholder="Grund für Erstattung" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRefundModal(false)} className="text-zinc-400">Abbrechen</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleRefund} disabled={processing === "refund"}>
              {processing === "refund" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RotateCcw className="w-4 h-4 mr-1" />} Erstattung buchen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBookingDetail;
