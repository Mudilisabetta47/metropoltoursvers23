import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Mail, Phone, Users, Calendar, Euro, Clock,
  CheckCircle, XCircle, FileText, MessageSquare,
  ClipboardList, History, User, MapPin, Send, PhoneCall,
  Briefcase, Tag, Star, ArrowRight, Plus, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import OfferBuilder from "@/components/admin/OfferBuilder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface Inquiry {
  id: string;
  inquiry_number: string;
  tour_id: string;
  destination: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  participants: number;
  message: string | null;
  total_price: number;
  departure_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CustomerNote {
  id: string;
  customer_email: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

const pipelineStages = [
  { key: "pending", label: "Neu", icon: Clock, color: "bg-yellow-500", activeBg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" },
  { key: "qualified", label: "Qualifiziert", icon: CheckCircle, color: "bg-blue-500", activeBg: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  { key: "offer_sent", label: "Angebot gesendet", icon: FileText, color: "bg-indigo-500", activeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" },
  { key: "contacted", label: "Nachfassen", icon: PhoneCall, color: "bg-purple-500", activeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  { key: "confirmed", label: "Bestätigt", icon: CheckCircle, color: "bg-green-500", activeBg: "bg-green-500/20 text-green-300 border-green-500/40" },
  { key: "converted", label: "In Buchung", icon: Briefcase, color: "bg-emerald-500", activeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  { key: "cancelled", label: "Verloren", icon: XCircle, color: "bg-red-500", activeBg: "bg-red-500/20 text-red-300 border-red-500/40" },
];

const getStageIndex = (status: string) => {
  const idx = pipelineStages.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
};

const AdminInquiryDetail = () => {
  const { inquiryId } = useParams<{ inquiryId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [internalNote, setInternalNote] = useState("");
  const [activityNote, setActivityNote] = useState("");
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [statusHistory, setStatusHistory] = useState<Array<{ status: string; timestamp: string }>>([]);

  useEffect(() => {
    if (inquiryId) fetchInquiry();
  }, [inquiryId]);

  const fetchInquiry = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('package_tour_inquiries')
        .select('*')
        .eq('id', inquiryId!)
        .single();
      if (error) throw error;
      const inq = data as Inquiry;
      setInquiry(inq);
      // Fetch notes for this customer
      fetchNotes(inq.email);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Anfrage nicht gefunden", variant: "destructive" });
      navigate('/admin/inquiries');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotes = async (email: string) => {
    try {
      const { data } = await supabase
        .from('tour_customer_notes')
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false });
      setNotes((data as CustomerNote[]) || []);
    } catch (e) {
      console.error('Error fetching notes:', e);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!inquiry) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('package_tour_inquiries')
        .update({ status: newStatus, updated_at: new Date().toISOString() } as never)
        .eq('id', inquiry.id);
      if (error) throw error;
      const now = new Date().toISOString();
      setInquiry({ ...inquiry, status: newStatus, updated_at: now });
      setStatusHistory(prev => [...prev, { status: newStatus, timestamp: now }]);
      toast({ title: "Status aktualisiert", description: `→ ${pipelineStages.find(s => s.key === newStatus)?.label}` });
      // Also save a note about the status change
      await supabase.from('tour_customer_notes').insert({
        customer_email: inquiry.email,
        note: `Status geändert: → ${pipelineStages.find(s => s.key === newStatus)?.label}`,
        created_by: user?.id || null,
      });
      fetchNotes(inquiry.email);
    } catch (error) {
      toast({ title: "Fehler beim Aktualisieren", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNote = async () => {
    if (!inquiry || !internalNote.trim()) return;
    setIsSavingNote(true);
    try {
      const { error } = await supabase.from('tour_customer_notes').insert({
        customer_email: inquiry.email,
        note: internalNote.trim(),
        created_by: user?.id || null,
      });
      if (error) throw error;
      toast({ title: "Notiz gespeichert" });
      setInternalNote("");
      fetchNotes(inquiry.email);
    } catch (error) {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase.from('tour_customer_notes').delete().eq('id', noteId);
      if (error) throw error;
      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast({ title: "Notiz gelöscht" });
    } catch {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
    }
  };

  const handleSaveActivity = async () => {
    if (!inquiry || !activityNote.trim()) return;
    setIsSavingNote(true);
    try {
      const { error } = await supabase.from('tour_customer_notes').insert({
        customer_email: inquiry.email,
        note: `[Aufgabe] ${activityNote.trim()}`,
        created_by: user?.id || null,
      });
      if (error) throw error;
      toast({ title: "Aufgabe gespeichert" });
      setActivityNote("");
      fetchNotes(inquiry.email);
    } catch (error) {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleConvertToBooking = () => {
    if (!inquiry) return;
    // Navigate to tour bookings with pre-filled data
    navigate(`/admin/tour-bookings?convert=${inquiry.id}&email=${inquiry.email}&name=${inquiry.first_name}+${inquiry.last_name}&destination=${inquiry.destination}&participants=${inquiry.participants}`);
    toast({ title: "Weiterleitung zur Buchungsverwaltung" });
  };

  const handleCreateOffer = async () => {
    if (!inquiry) return;
    // Move status to offer_sent and save note
    await updateStatus('offer_sent');
    // Open email with offer template
    const subject = encodeURIComponent(`Ihr Reiseangebot ${inquiry.inquiry_number} — ${inquiry.destination}`);
    const body = encodeURIComponent(
      `Sehr geehrte/r ${inquiry.first_name} ${inquiry.last_name},\n\n` +
      `vielen Dank für Ihre Anfrage zu unserer Reise nach ${inquiry.destination}.\n\n` +
      `Gerne unterbreiten wir Ihnen folgendes Angebot:\n\n` +
      `Reiseziel: ${inquiry.destination}\n` +
      `Reisedatum: ${inquiry.departure_date}\n` +
      `Teilnehmer: ${inquiry.participants}\n` +
      `Gesamtpreis: ${inquiry.total_price.toLocaleString('de-DE')}€\n\n` +
      `Leistungen im Preis enthalten:\n` +
      `- Busfahrt hin und zurück\n` +
      `- Übernachtung mit Frühstück\n\n` +
      `Bei Fragen stehen wir Ihnen gerne zur Verfügung.\n\n` +
      `Mit freundlichen Grüßen\nMetropol Tours`
    );
    window.location.href = `mailto:${inquiry.email}?subject=${subject}&body=${body}`;
  };

  const handleSendMessage = async (messageText: string) => {
    if (!inquiry || !messageText.trim()) return;
    // Save as note and open email
    await supabase.from('tour_customer_notes').insert({
      customer_email: inquiry.email,
      note: `[Nachricht gesendet] ${messageText.trim()}`,
      created_by: user?.id || null,
    });
    fetchNotes(inquiry.email);
    const subject = encodeURIComponent(`Ihre Anfrage ${inquiry.inquiry_number}`);
    const body = encodeURIComponent(messageText.trim());
    window.location.href = `mailto:${inquiry.email}?subject=${subject}&body=${body}`;
  };

  if (isLoading || !inquiry) {
    return (
      <AdminLayout title="Anfrage laden...">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400" />
        </div>
      </AdminLayout>
    );
  }

  const stageIndex = getStageIndex(inquiry.status);
  const createdAgo = formatDistanceToNow(new Date(inquiry.created_at), { locale: de, addSuffix: true });
  const updatedAgo = formatDistanceToNow(new Date(inquiry.updated_at), { locale: de, addSuffix: true });

  const activityNotes = notes.filter(n => n.note.startsWith('[Aufgabe]'));
  const regularNotes = notes.filter(n => !n.note.startsWith('[Aufgabe]'));

  return (
    <AdminLayout title={`Anfrage ${inquiry.inquiry_number}`} subtitle={`${inquiry.first_name} ${inquiry.last_name} — ${inquiry.destination}`}>
        {/* Back + Breadcrumb */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/inquiries')} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
            <ArrowLeft className="w-4 h-4 mr-1" /> Zurück
          </Button>
          <span className="text-xs text-zinc-500">CRM / Anfragen / {inquiry.inquiry_number}</span>
        </div>

        {/* Record Header */}
        <Card className="mb-4 bg-zinc-900 border-zinc-800">
          <CardContent className="pt-5 pb-4">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-white">{inquiry.first_name} {inquiry.last_name}</h1>
                  <Badge className="font-mono text-xs bg-zinc-800 text-zinc-300 border-zinc-700">{inquiry.inquiry_number}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {inquiry.destination}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {inquiry.participants} Teilnehmer</span>
                  <span className="flex items-center gap-1"><Euro className="w-3.5 h-3.5" /> {inquiry.total_price.toLocaleString('de-DE')}€</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {inquiry.departure_date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {createdAgo}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => window.location.href = `mailto:${inquiry.email}?subject=Ihre Anfrage ${inquiry.inquiry_number}`} className="bg-emerald-600 hover:bg-emerald-700">
                  <Mail className="w-3.5 h-3.5 mr-1.5" /> E-Mail
                </Button>
                {inquiry.phone && (
                  <Button size="sm" variant="outline" onClick={() => window.location.href = `tel:${inquiry.phone}`} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                    <Phone className="w-3.5 h-3.5 mr-1.5" /> Anrufen
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleCreateOffer} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  <FileText className="w-3.5 h-3.5 mr-1.5" /> Angebot erstellen
                </Button>
                <Button size="sm" onClick={handleConvertToBooking} className="bg-blue-600 hover:bg-blue-700">
                  <Briefcase className="w-3.5 h-3.5 mr-1.5" /> In Buchung umwandeln
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Progress */}
        <Card className="mb-6 bg-zinc-900 border-zinc-800">
          <CardContent className="py-3">
            <div className="flex items-center gap-1 overflow-x-auto">
              {pipelineStages.map((stage, i) => {
                const isActive = stage.key === inquiry.status;
                const isPast = i < stageIndex;
                const isLost = stage.key === "cancelled";
                return (
                  <button
                    key={stage.key}
                    onClick={() => updateStatus(stage.key)}
                    disabled={isUpdating}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-all whitespace-nowrap
                      ${isActive
                        ? stage.activeBg + ' ring-2 ring-offset-1 ring-offset-zinc-900 ring-emerald-500/30'
                        : isPast
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : isLost
                            ? 'bg-zinc-800/50 text-zinc-500 border-transparent hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                            : 'bg-zinc-800/50 text-zinc-500 border-transparent hover:bg-zinc-800 hover:text-zinc-300'
                      }`}
                  >
                    <stage.icon className="w-3 h-3" />
                    {stage.label}
                    {i < pipelineStages.length - 1 && !isLost && (
                      <ArrowRight className="w-3 h-3 text-zinc-600 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-zinc-800/50 p-1 border border-zinc-700/50">
            {[
              { value: "overview", label: "Übersicht", icon: ClipboardList },
              { value: "customer", label: "Kunde", icon: User },
              { value: "travel", label: "Reisedaten", icon: MapPin },
              { value: "communication", label: "Kommunikation", icon: MessageSquare },
              { value: "activities", label: "Aktivitäten", icon: ClipboardList },
              { value: "offers", label: "Angebote", icon: FileText },
              { value: "history", label: "Historie", icon: History },
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-zinc-400 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ===== ÜBERSICHT ===== */}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Zusammenfassung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: "Status", value: pipelineStages.find(s => s.key === inquiry.status)?.label || inquiry.status },
                      { label: "Quelle", value: "Website" },
                      { label: "Bearbeiter", value: "— nicht zugewiesen —" },
                      { label: "Priorität", value: "Normal" },
                      { label: "Anfragewert", value: `${inquiry.total_price.toLocaleString('de-DE')}€` },
                      { label: "Reiseziel", value: inquiry.destination },
                      { label: "Teilnehmer", value: `${inquiry.participants} Personen` },
                      { label: "Wunschdatum", value: inquiry.departure_date },
                      { label: "Letzter Kontakt", value: updatedAgo },
                      { label: "Notizen", value: `${notes.length} Einträge` },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-1.5 border-b border-dashed border-zinc-800 last:border-0">
                        <span className="text-xs text-zinc-500">{item.label}</span>
                        <span className="text-sm font-medium text-zinc-200">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {inquiry.message && (
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Nachricht des Kunden</h4>
                      <div className="p-3 bg-zinc-800/50 rounded-lg text-sm leading-relaxed text-zinc-300">{inquiry.message}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions Sidebar */}
              <div className="space-y-4">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Schnellaktionen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { icon: Mail, label: "E-Mail senden", action: () => window.location.href = `mailto:${inquiry.email}` },
                      { icon: Phone, label: "Anrufen", action: () => inquiry.phone && (window.location.href = `tel:${inquiry.phone}`) },
                      { icon: FileText, label: "Angebot erstellen", action: handleCreateOffer },
                      { icon: Briefcase, label: "In Buchung umwandeln", action: handleConvertToBooking },
                      { icon: Tag, label: "Als qualifiziert markieren", action: () => updateStatus('qualified') },
                      { icon: XCircle, label: "Als verloren markieren", action: () => updateStatus('cancelled') },
                    ].map((act, i) => (
                      <Button key={i} variant="ghost" size="sm" className="w-full justify-start text-xs h-8 text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={act.action}>
                        <act.icon className="w-3.5 h-3.5 mr-2" /> {act.label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Interne Notiz</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Notiz hinzufügen..."
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      className="text-xs min-h-[80px] mb-2 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                    <Button size="sm" variant="outline" className="w-full text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800" disabled={!internalNote.trim() || isSavingNote} onClick={handleSaveNote}>
                      <Plus className="w-3 h-3 mr-1" /> Notiz speichern
                    </Button>

                    {/* Display saved notes */}
                    {regularNotes.length > 0 && (
                      <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                        {regularNotes.slice(0, 5).map(n => (
                          <div key={n.id} className="p-2 bg-zinc-800/50 rounded text-xs text-zinc-300 group relative">
                            <div className="pr-6">{n.note}</div>
                            <div className="text-[10px] text-zinc-500 mt-1">
                              {format(new Date(n.created_at), 'dd.MM.yy HH:mm', { locale: de })}
                            </div>
                            <button onClick={() => handleDeleteNote(n.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ===== KUNDE ===== */}
          <TabsContent value="customer">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Kontaktdaten</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: User, label: "Name", value: `${inquiry.first_name} ${inquiry.last_name}`, link: undefined },
                    { icon: Mail, label: "E-Mail", value: inquiry.email, link: `mailto:${inquiry.email}` },
                    { icon: Phone, label: "Telefon", value: inquiry.phone || "—", link: inquiry.phone ? `tel:${inquiry.phone}` : undefined },
                    { icon: MapPin, label: "Reiseziel", value: inquiry.destination, link: undefined },
                    { icon: Tag, label: "Kundentyp", value: "Neukunde", link: undefined },
                    { icon: Star, label: "Anfrage-Nr.", value: inquiry.inquiry_number, link: undefined },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-dashed border-zinc-800 last:border-0">
                      <item.icon className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      <span className="text-xs text-zinc-500 w-28">{item.label}</span>
                      {item.link ? (
                        <a href={item.link} className="text-sm text-emerald-400 hover:underline">{item.value}</a>
                      ) : (
                        <span className="text-sm text-zinc-200">{item.value}</span>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Kundenhistorie & Notizen</CardTitle>
                </CardHeader>
                <CardContent>
                  {notes.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium text-zinc-400">Neukunde</p>
                      <p className="text-xs mt-1">Keine Notizen vorhanden.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {notes.map(n => (
                        <div key={n.id} className="p-2 bg-zinc-800/50 rounded text-xs text-zinc-300 group relative">
                          <div className="pr-6">{n.note}</div>
                          <div className="text-[10px] text-zinc-500 mt-1">
                            {format(new Date(n.created_at), 'dd.MM.yy HH:mm', { locale: de })}
                          </div>
                          <button onClick={() => handleDeleteNote(n.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== REISEDATEN ===== */}
          <TabsContent value="travel">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Reiseanfrage — Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: "Reiseziel", value: inquiry.destination },
                    { label: "Tour-ID", value: inquiry.tour_id.slice(0, 8) + "…" },
                    { label: "Reisetyp", value: "Pauschalreise" },
                    { label: "Hinreise", value: inquiry.departure_date },
                    { label: "Teilnehmer", value: `${inquiry.participants}` },
                    { label: "Gesamtpreis", value: `${inquiry.total_price.toLocaleString('de-DE')}€` },
                  ].map((item, i) => (
                    <div key={i} className="py-2 border-b border-dashed border-zinc-800">
                      <div className="text-xs text-zinc-500 mb-0.5">{item.label}</div>
                      <div className="text-sm font-medium text-zinc-200">{item.value}</div>
                    </div>
                  ))}
                </div>

                {inquiry.message && (
                  <div className="mt-6">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Sonderwünsche / Nachricht</h4>
                    <div className="p-3 bg-zinc-800/50 rounded-lg text-sm text-zinc-300">{inquiry.message}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== KOMMUNIKATION ===== */}
          <TabsContent value="communication">
            <CommunicationTab inquiry={inquiry} notes={notes} onSendMessage={handleSendMessage} />
          </TabsContent>

          {/* ===== AKTIVITÄTEN ===== */}
          <TabsContent value="activities">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Aufgaben & Follow-ups</CardTitle>
                </CardHeader>
                <CardContent>
                  {activityNotes.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm text-zinc-400">Keine offenen Aufgaben</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {activityNotes.map(n => (
                        <div key={n.id} className="p-3 bg-zinc-800/50 rounded group relative">
                          <div className="text-sm text-zinc-200 pr-6">{n.note.replace('[Aufgabe] ', '')}</div>
                          <div className="text-[10px] text-zinc-500 mt-1">
                            {format(new Date(n.created_at), 'dd.MM.yy HH:mm', { locale: de })}
                          </div>
                          <button onClick={() => handleDeleteNote(n.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Neue Aufgabe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select>
                    <SelectTrigger className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300">
                      <SelectValue placeholder="Aktionstyp wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="callback">Rückruf</SelectItem>
                      <SelectItem value="followup">Follow-up E-Mail</SelectItem>
                      <SelectItem value="offer">Angebot nachfassen</SelectItem>
                      <SelectItem value="check_availability">Verfügbarkeit prüfen</SelectItem>
                      <SelectItem value="price_calc">Preis kalkulieren</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="date" className="text-xs bg-zinc-800 border-zinc-700 text-white" />
                  <Textarea placeholder="Notiz zur Aufgabe..." className="text-xs min-h-[60px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" value={activityNote} onChange={e => setActivityNote(e.target.value)} />
                  <Button size="sm" variant="outline" className="w-full text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={handleSaveActivity} disabled={!activityNote.trim() || isSavingNote}>
                    <Plus className="w-3 h-3 mr-1" /> Aufgabe speichern
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== ANGEBOTE ===== */}
          <TabsContent value="offers">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Angebote</CardTitle>
                <Button size="sm" variant="outline" className="text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={handleCreateOffer}>
                  <Plus className="w-3 h-3 mr-1" /> Neues Angebot
                </Button>
              </CardHeader>
              <CardContent>
                {notes.filter(n => n.note.includes('Status geändert: → Angebot')).length > 0 ? (
                  <div className="space-y-3">
                    {notes.filter(n => n.note.includes('Angebot') || n.note.includes('offer')).map(n => (
                      <div key={n.id} className="flex items-start gap-3 py-2 border-b border-dashed border-zinc-800 last:border-0">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-zinc-200">{n.note}</div>
                          <div className="text-xs text-zinc-500">
                            {format(new Date(n.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium text-zinc-400">Noch keine Angebote erstellt</p>
                    <p className="text-xs mt-1">Erstellen Sie ein individuelles Angebot für diese Anfrage.</p>
                    <div className="mt-4 flex justify-center gap-2">
                      <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateOffer}>
                        <FileText className="w-3 h-3 mr-1" /> Angebot erstellen
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== HISTORIE ===== */}
          <TabsContent value="history">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Änderungsverlauf / Audit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Status change notes from DB */}
                  {notes.filter(n => n.note.startsWith('Status geändert')).map(n => (
                    <div key={n.id} className="flex items-start gap-3 py-2 border-b border-dashed border-zinc-800">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-zinc-200">{n.note}</div>
                        <div className="text-xs text-zinc-500">
                          {format(new Date(n.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Session status changes */}
                  {statusHistory.map((sh, i) => (
                    <div key={`sh-${i}`} className="flex items-start gap-3 py-2 border-b border-dashed border-zinc-800">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-zinc-200">Status → {pipelineStages.find(s => s.key === sh.status)?.label}</div>
                        <div className="text-xs text-zinc-500">{format(new Date(sh.timestamp), 'dd.MM.yyyy HH:mm:ss', { locale: de })}</div>
                      </div>
                    </div>
                  ))}

                  {inquiry.updated_at !== inquiry.created_at && (
                    <div className="flex items-start gap-3 py-2 border-b border-dashed border-zinc-800">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-zinc-200">Zuletzt aktualisiert</div>
                        <div className="text-xs text-zinc-500">
                          {format(new Date(inquiry.updated_at), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 py-2 border-b border-dashed border-zinc-800">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm text-zinc-200">Anfrage erstellt</div>
                      <div className="text-xs text-zinc-500">
                        {format(new Date(inquiry.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: de })} · Website-Formular
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Meta */}
        <div className="mt-6 flex items-center gap-4 text-[10px] text-zinc-600">
          <span>Erstellt: {format(new Date(inquiry.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
          <span>Aktualisiert: {format(new Date(inquiry.updated_at), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
          <span>ID: {inquiry.id}</span>
        </div>
    </AdminLayout>
  );
};

/* ============ Communication Sub-Component ============ */
const CommunicationTab = ({ inquiry, notes, onSendMessage }: { inquiry: Inquiry; notes: CustomerNote[]; onSendMessage: (msg: string) => void }) => {
  const [messageText, setMessageText] = useState("");
  const commNotes = notes.filter(n => n.note.startsWith('[Nachricht'));

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Kommunikationsverlauf</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sent messages from notes */}
            {commNotes.map(n => (
              <div key={n.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Send className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="w-px flex-1 bg-zinc-800 mt-1" />
                </div>
                <div className="pb-4">
                  <div className="text-sm font-medium text-zinc-200">{n.note.replace('[Nachricht gesendet] ', '')}</div>
                  <div className="text-xs text-zinc-500">
                    {format(new Date(n.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </div>
                </div>
              </div>
            ))}

            {/* Initial inquiry */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div className="pb-4">
                <div className="text-sm font-medium text-zinc-200">Anfrage eingegangen</div>
                <div className="text-xs text-zinc-500">
                  {format(new Date(inquiry.created_at), 'dd.MM.yyyy HH:mm', { locale: de })} · Website
                </div>
                {inquiry.message && (
                  <div className="mt-2 p-2 bg-zinc-800/50 rounded text-xs text-zinc-300">{inquiry.message}</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Nachricht senden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Nachricht verfassen..."
            className="text-xs min-h-[100px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
          />
          <Button
            size="sm"
            className="w-full text-xs bg-emerald-600 hover:bg-emerald-700"
            disabled={!messageText.trim()}
            onClick={() => { onSendMessage(messageText); setMessageText(""); }}
          >
            <Send className="w-3 h-3 mr-1.5" /> Per E-Mail senden
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInquiryDetail;
