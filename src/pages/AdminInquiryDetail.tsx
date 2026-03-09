import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Mail, Phone, Users, Calendar, Euro, Clock,
  CheckCircle, XCircle, FileText, MessageSquare,
  ClipboardList, History, User, MapPin, Send, PhoneCall,
  Briefcase, Tag, Star, ArrowRight, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  useAuth();

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [internalNote, setInternalNote] = useState("");
  const [activityNote, setActivityNote] = useState("");

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
      setInquiry(data as Inquiry);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Anfrage nicht gefunden", variant: "destructive" });
      navigate('/admin/inquiries');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!inquiry) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('package_tour_inquiries')
        .update({ status: newStatus } as never)
        .eq('id', inquiry.id);
      if (error) throw error;
      setInquiry({ ...inquiry, status: newStatus });
      toast({ title: "Status aktualisiert", description: `→ ${pipelineStages.find(s => s.key === newStatus)?.label}` });
    } catch (error) {
      toast({ title: "Fehler", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePlaceholder = (label: string) => {
    toast({ title: `${label}`, description: "Diese Funktion wird in einem zukünftigen Update verfügbar sein." });
  };

  const handleSaveNote = async () => {
    if (!inquiry || !internalNote.trim()) return;
    toast({ title: "Notiz gespeichert", description: internalNote.trim() });
    setInternalNote("");
  };

  const handleSaveActivity = async () => {
    if (!activityNote.trim()) return;
    toast({ title: "Aufgabe gespeichert", description: activityNote.trim() });
    setActivityNote("");
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
                <Button size="sm" variant="outline" onClick={() => handlePlaceholder("Angebot erstellen")} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  <FileText className="w-3.5 h-3.5 mr-1.5" /> Angebot erstellen
                </Button>
                <Button size="sm" onClick={() => handlePlaceholder("In Buchung umwandeln")} className="bg-blue-600 hover:bg-blue-700">
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
                      { label: "Nächster Schritt", value: "Follow-up planen" },
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
                      { icon: FileText, label: "Angebot erstellen", action: () => handlePlaceholder("Angebot erstellen") },
                      { icon: Briefcase, label: "In Buchung umwandeln", action: () => handlePlaceholder("In Buchung umwandeln") },
                      { icon: Tag, label: "Priorität setzen", action: () => handlePlaceholder("Priorität setzen") },
                      { icon: User, label: "Bearbeiter zuweisen", action: () => handlePlaceholder("Bearbeiter zuweisen") },
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
                    <Button size="sm" variant="outline" className="w-full text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800" disabled={!internalNote.trim()} onClick={handleSaveNote}>
                      <Plus className="w-3 h-3 mr-1" /> Notiz speichern
                    </Button>
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
                    { icon: MapPin, label: "Land / Sprache", value: "— nicht erfasst —", link: undefined },
                    { icon: Briefcase, label: "Firma", value: "— keine Angabe —", link: undefined },
                    { icon: Tag, label: "Kundentyp", value: "Neukunde", link: undefined },
                    { icon: Star, label: "Kundennummer", value: "— automatisch vergeben —", link: undefined },
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
                  <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Kundenhistorie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-zinc-500">
                    <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium text-zinc-400">Neukunde</p>
                    <p className="text-xs mt-1">Keine bisherigen Anfragen oder Buchungen vorhanden.</p>
                    <p className="text-xs mt-1">Umsatzhistorie: 0€</p>
                  </div>
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
                    { label: "Tour-ID", value: inquiry.tour_id },
                    { label: "Reisetyp", value: "Pauschalreise" },
                    { label: "Hinreise", value: inquiry.departure_date },
                    { label: "Rückreise", value: "— nach Tour —" },
                    { label: "Flexible Daten", value: "— nicht angegeben —" },
                    { label: "Abfahrtsort", value: "— nach Auswahl —" },
                    { label: "Teilnehmer Erwachsene", value: `${inquiry.participants}` },
                    { label: "Teilnehmer Kinder", value: "0" },
                    { label: "Budget", value: `${inquiry.total_price.toLocaleString('de-DE')}€` },
                    { label: "Hotel", value: "— nach Angebot —" },
                    { label: "Transfer", value: "— nach Angebot —" },
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
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Kommunikationsverlauf</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="w-px flex-1 bg-zinc-800 mt-1" />
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

                    <div className="text-center py-4">
                      <p className="text-xs text-zinc-500">Noch keine weiteren Kommunikationen erfasst.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Nachricht senden</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select defaultValue="email">
                    <SelectTrigger className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">E-Mail</SelectItem>
                      <SelectItem value="phone">Anruf-Notiz</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="internal">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Nachricht verfassen..." className="text-xs min-h-[100px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
                  <Button size="sm" className="w-full text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handlePlaceholder("Nachricht senden")}>
                    <Send className="w-3 h-3 mr-1.5" /> Senden
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== AKTIVITÄTEN ===== */}
          <TabsContent value="activities">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Aufgaben & Follow-ups</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-zinc-500">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm text-zinc-400">Keine offenen Aufgaben</p>
                    <Button size="sm" variant="outline" className="mt-3 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => handlePlaceholder("Aufgabe anlegen")}>
                      <Plus className="w-3 h-3 mr-1" /> Aufgabe anlegen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Nächste Aktion</CardTitle>
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
                  <Button size="sm" variant="outline" className="w-full text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={handleSaveActivity} disabled={!activityNote.trim()}>
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
                <Button size="sm" variant="outline" className="text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => handlePlaceholder("Neues Angebot")}>
                  <Plus className="w-3 h-3 mr-1" /> Neues Angebot
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-zinc-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium text-zinc-400">Noch keine Angebote erstellt</p>
                  <p className="text-xs mt-1">Erstellen Sie ein individuelles Angebot für diese Anfrage.</p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handlePlaceholder("Angebot erstellen")}>
                      <FileText className="w-3 h-3 mr-1" /> Angebot erstellen
                    </Button>
                  </div>
                </div>
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
                  <div className="flex items-start gap-3 py-2 border-b border-dashed border-zinc-800">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm text-zinc-200">Anfrage erstellt</div>
                      <div className="text-xs text-zinc-500">
                        {format(new Date(inquiry.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: de })} · System · Website-Formular
                      </div>
                    </div>
                  </div>

                  {inquiry.updated_at !== inquiry.created_at && (
                    <div className="flex items-start gap-3 py-2 border-b border-dashed border-zinc-800">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-zinc-200">Datensatz aktualisiert</div>
                        <div className="text-xs text-zinc-500">
                          {format(new Date(inquiry.updated_at), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                        </div>
                      </div>
                    </div>
                  )}
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

export default AdminInquiryDetail;
