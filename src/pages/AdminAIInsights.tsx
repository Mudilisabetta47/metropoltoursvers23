import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  MessageSquare, ShieldAlert, BarChart3, Loader2, RefreshCw, LifeBuoy, Flag, Bot, User,
} from "lucide-react";

interface Session {
  id: string;
  session_id: string;
  ip_address: string | null;
  user_agent: string | null;
  page_url: string | null;
  message_count: number;
  started_at: string;
  last_activity_at: string;
  is_flagged: boolean;
  flag_reason: string | null;
}

interface Msg {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

interface SecEvent {
  id: string;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  event_type: string;
  severity: string;
  details: any;
  created_at: string;
}

interface Report {
  id: string;
  period_start: string;
  period_end: string;
  total_sessions: number;
  total_messages: number;
  stats: any;
  report_markdown: string | null;
  generated_at: string;
}

const dt = (v: string) => format(new Date(v), "dd.MM.yyyy HH:mm", { locale: de });

export default function AdminAIInsights() {
  const { isAdmin, hasAnyStaffRole, isLoading } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<SecEvent[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");

  const [active, setActive] = useState<Session | null>(null);
  const [transcript, setTranscript] = useState<Msg[]>([]);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticket, setTicket] = useState({
    subject: "", description: "", category: "allgemein",
    priority: "normal", customer_name: "", customer_email: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [s, e, r] = await Promise.all([
      supabase.from("advisor_chat_sessions").select("*").order("last_activity_at", { ascending: false }).limit(300),
      supabase.from("advisor_security_events").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("advisor_monthly_reports").select("*").order("period_start", { ascending: false }).limit(24),
    ]);
    setSessions((s.data as Session[]) ?? []);
    setEvents((e.data as SecEvent[]) ?? []);
    setReports((r.data as Report[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (hasAnyStaffRole) load();
  }, [hasAnyStaffRole]);

  const openSession = async (s: Session) => {
    setActive(s);
    const { data } = await supabase
      .from("advisor_chat_messages")
      .select("*")
      .eq("session_id", s.session_id)
      .order("created_at");
    setTranscript((data as Msg[]) ?? []);
  };

  const generateReport = async () => {
    setGenerating(true);
    const { error } = await supabase.functions.invoke("advisor-monthly-report", { body: {} });
    setGenerating(false);
    if (error) {
      toast({ title: "Auswertung fehlgeschlagen", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Monatsauswertung erstellt" });
    load();
  };

  const createTicket = async () => {
    if (!active) return;
    setSaving(true);
    const { data, error } = await supabase.from("support_tickets").insert({
      subject: ticket.subject || `Chat-Anfrage ${active.session_id.slice(0, 16)}`,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: "offen",
      source: "chat",
      session_id: active.session_id,
      chat_transcript: transcript.map((m) => ({ role: m.role, content: m.content, at: m.created_at })),
      customer_name: ticket.customer_name || null,
      customer_email: ticket.customer_email || null,
      ip_address: active.ip_address,
      user_agent: active.user_agent,
      chat_started_at: active.started_at,
      created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    }).select().single();
    setSaving(false);
    if (error) {
      toast({ title: "Ticket konnte nicht erstellt werden", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Ticket ${data.ticket_number} erstellt` });
    setTicketOpen(false);
    setTicket({ subject: "", description: "", category: "allgemein", priority: "normal", customer_name: "", customer_email: "" });
    navigate("/admin/support-tickets");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) =>
      [s.session_id, s.ip_address, s.page_url, s.flag_reason].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [sessions, search]);

  if (isLoading) return null;
  if (!hasAnyStaffRole) return <Navigate to="/admin/dashboard" replace />;

  const totalMsgs = sessions.reduce((a, s) => a + (s.message_count ?? 0), 0);
  const flagged = sessions.filter((s) => s.is_flagged).length;

  return (
    <AdminLayout
      title="KI-Chat-Analyse"
      subtitle="Auswertung, Sicherheitsprotokoll und Support-Übergabe des Reiseberater-Chats."
      actions={
        <Button size="sm" onClick={generateReport} disabled={generating} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-white">
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
          Monatsauswertung erzeugen
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-4 mb-5">
        {[
          { label: "Chats gesamt", value: sessions.length, icon: MessageSquare },
          { label: "Nachrichten", value: totalMsgs, icon: Bot },
          { label: "Auffällige Chats", value: flagged, icon: Flag },
          { label: "Sicherheitsereignisse", value: events.length, icon: ShieldAlert },
        ].map((k) => (
          <Card key={k.label} className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00CC36]/15 flex items-center justify-center">
              <k.icon className="w-4 h-4 text-[#00CC36]" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-400">{k.label}</p>
              <p className="text-lg font-semibold text-white">{k.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="chats">
        <TabsList>
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="reports">Monatsberichte</TabsTrigger>
          <TabsTrigger value="security">Sicherheitsprotokoll</TabsTrigger>
        </TabsList>

        {/* CHATS */}
        <TabsContent value="chats" className="mt-4">
          <div className="flex gap-2 mb-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche nach Sitzungs-ID, IP oder Seite..."
              className="max-w-sm bg-white text-black"
            />
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          </div>

          <div className="grid lg:grid-cols-[380px_1fr] gap-4">
            <Card className="p-0 overflow-hidden max-h-[70vh] overflow-y-auto">
              {loading && <div className="p-6 text-center text-zinc-400"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>}
              {!loading && filtered.length === 0 && (
                <p className="p-6 text-sm text-zinc-400 text-center">Noch keine Chats protokolliert.</p>
              )}
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openSession(s)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition ${
                    active?.id === s.id ? "bg-white/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-cockpit-mono text-zinc-300 truncate">{s.session_id}</span>
                    {s.is_flagged && <Badge variant="outline" className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">Auffällig</Badge>}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {dt(s.last_activity_at)} · {s.message_count} Nachrichten · {s.ip_address ?? "–"}
                  </p>
                </button>
              ))}
            </Card>

            <Card className="p-4 max-h-[70vh] overflow-y-auto">
              {!active && <p className="text-sm text-zinc-400">Wähle links einen Chat aus.</p>}
              {active && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="text-[11px] text-zinc-400 space-y-0.5">
                      <p className="text-white text-sm font-medium">Chatverlauf</p>
                      <p>Start: {dt(active.started_at)} · Seite: {active.page_url ?? "–"}</p>
                      <p>IP: {active.ip_address ?? "–"}</p>
                      <p className="truncate max-w-md">User-Agent: {active.user_agent ?? "–"}</p>
                      {active.flag_reason && <p className="text-red-400">Hinweis: {active.flag_reason}</p>}
                    </div>
                    <Button size="sm" onClick={() => setTicketOpen(true)} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-white">
                      <LifeBuoy className="w-4 h-4 mr-2" /> Support-Ticket erstellen
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {transcript.map((m) => (
                      <div key={m.id} className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                          {m.role === "user" ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-[#00CC36]" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-zinc-500">{dt(m.created_at)}</p>
                          <div className="text-sm text-zinc-100 bg-white/5 border border-white/10 rounded-xl px-3 py-2 whitespace-pre-wrap">
                            {m.content}
                          </div>
                        </div>
                      </div>
                    ))}
                    {transcript.length === 0 && <p className="text-sm text-zinc-500">Keine Nachrichten gespeichert.</p>}
                  </div>
                </>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports" className="mt-4 space-y-4">
          {reports.length === 0 && (
            <Card className="p-6 text-sm text-zinc-400">
              Noch keine Monatsauswertung vorhanden – die Auswertung läuft automatisch zum Monatsende oder kann oben manuell gestartet werden.
            </Card>
          )}
          {reports.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-white font-semibold">
                  {format(new Date(r.period_start), "MMMM yyyy", { locale: de })}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {r.total_sessions} Chats · {r.total_messages} Nachrichten · erstellt {dt(r.generated_at)}
                </p>
              </div>
              <div className="grid sm:grid-cols-4 gap-2 mb-4">
                {[
                  ["Ø Nachrichten/Chat", r.stats?.avg_messages_per_session ?? 0],
                  ["Abbrüche", r.stats?.drop_off_sessions ?? 0],
                  ["Unbeantwortet", r.stats?.unanswered_responses ?? 0],
                  ["Sicherheitsereignisse", r.stats?.security_events ?? 0],
                ].map(([l, v]) => (
                  <div key={l as string} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                    <p className="text-[10px] text-zinc-400">{l}</p>
                    <p className="text-sm text-white font-semibold">{String(v)}</p>
                  </div>
                ))}
              </div>
              {Array.isArray(r.stats?.top_terms) && r.stats.top_terms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {r.stats.top_terms.slice(0, 15).map((t: any) => (
                    <Badge key={t.term} variant="outline" className="text-[10px] border-white/15 text-zinc-300">
                      {t.term} · {t.count}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown>{r.report_markdown ?? ""}</ReactMarkdown>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="security" className="mt-4">
          {!isAdmin && (
            <Card className="p-6 text-sm text-zinc-400">Sicherheitsereignisse sind Administratoren vorbehalten.</Card>
          )}
          {isAdmin && (
            <Card className="p-0 overflow-hidden">
              {events.length === 0 && <p className="p-6 text-sm text-zinc-400">Keine auffälligen Aktivitäten protokolliert.</p>}
              {events.map((e) => (
                <div key={e.id} className="px-4 py-3 border-b border-white/5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        e.severity === "critical"
                          ? "bg-red-500/15 text-red-400 border-red-500/30"
                          : e.severity === "warning"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-white/5 text-zinc-300 border-white/15"
                      }`}
                    >
                      {e.severity}
                    </Badge>
                    <span className="text-sm text-white">{e.event_type}</span>
                    <span className="text-[11px] text-zinc-500">{dt(e.created_at)} · IP {e.ip_address ?? "–"}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 truncate">Sitzung: {e.session_id ?? "–"} · {e.user_agent ?? "–"}</p>
                  <pre className="mt-2 p-2 bg-black/40 rounded text-[10px] text-zinc-400 overflow-x-auto">
                    {JSON.stringify(e.details, null, 2)}
                  </pre>
                </div>
              ))}
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Ticket dialog */}
      <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Support-Ticket aus Chat erstellen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Betreff</Label>
              <Input className="bg-white text-black" value={ticket.subject} onChange={(e) => setTicket({ ...ticket, subject: e.target.value })} placeholder="Kurzbeschreibung" />
            </div>
            <div>
              <Label>Beschreibung</Label>
              <Textarea className="bg-white text-black" value={ticket.description} onChange={(e) => setTicket({ ...ticket, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategorie</Label>
                <Select value={ticket.category} onValueChange={(v) => setTicket({ ...ticket, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["allgemein", "buchung", "zahlung", "technik", "beschwerde", "sicherheit"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priorität</Label>
                <Select value={ticket.priority} onValueChange={(v) => setTicket({ ...ticket, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["niedrig", "normal", "hoch", "kritisch"].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kundenname (optional)</Label>
                <Input className="bg-white text-black" value={ticket.customer_name} onChange={(e) => setTicket({ ...ticket, customer_name: e.target.value })} />
              </div>
              <div>
                <Label>E-Mail (optional)</Label>
                <Input className="bg-white text-black" value={ticket.customer_email} onChange={(e) => setTicket({ ...ticket, customer_email: e.target.value })} />
              </div>
            </div>
            <p className="text-[11px] text-zinc-400">
              Chatverlauf, Zeitpunkt und IP-Adresse werden automatisch übernommen (nur interne Sicherheitszwecke).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTicketOpen(false)}>Abbrechen</Button>
            <Button onClick={createTicket} disabled={saving} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-white">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Ticket erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
