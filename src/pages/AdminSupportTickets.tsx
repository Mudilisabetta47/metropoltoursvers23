import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { LifeBuoy, RefreshCw, Loader2, Plus } from "lucide-react";

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string | null;
  category: string | null;
  priority: string;
  status: string;
  source: string | null;
  session_id: string | null;
  chat_transcript: any;
  customer_name: string | null;
  customer_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  chat_started_at: string | null;
  internal_note: string | null;
  created_at: string;
}

const STATUS = ["offen", "in_bearbeitung", "wartet_auf_kunde", "geloest", "geschlossen"];
const PRIORITIES = ["niedrig", "normal", "hoch", "kritisch"];

const CATEGORIES = ["allgemein", "buchung", "zahlung", "reklamation", "technik", "sonstiges"];

const emptyDraft = {
  subject: "",
  description: "",
  category: "allgemein",
  priority: "normal",
  customer_name: "",
  customer_email: "",
};

const statusColor = (s: string) =>
  s === "offen"
    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
    : s === "in_bearbeitung"
    ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
    : s === "geloest" || s === "geschlossen"
    ? "bg-[#00CC36]/15 text-[#00CC36] border-[#00CC36]/30"
    : "bg-white/5 text-zinc-300 border-white/15";

export default function AdminSupportTickets() {
  const { hasAnyStaffRole, isLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [active, setActive] = useState<Ticket | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({ ...emptyDraft });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setTickets((data as Ticket[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { if (hasAnyStaffRole) load(); }, [hasAnyStaffRole]);

  const createTicket = async () => {
    if (!draft.subject.trim()) {
      toast({ title: "Betreff fehlt", description: "Bitte einen Betreff angeben.", variant: "destructive" });
      return;
    }
    setCreating(true);
    const year = new Date().getFullYear();
    const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        ticket_number: `SUP-${year}-${rnd}`,
        subject: draft.subject.trim(),
        description: draft.description.trim() || null,
        category: draft.category,
        priority: draft.priority,
        status: "offen",
        source: "manuell",
        customer_name: draft.customer_name.trim() || null,
        customer_email: draft.customer_email.trim() || null,
        created_by: userData?.user?.id ?? null,
      } as any)
      .select()
      .maybeSingle();
    setCreating(false);
    if (error) {
      toast({ title: "Anlegen fehlgeschlagen", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ticket erstellt", description: (data as any)?.ticket_number });
    setTickets((prev) => [data as Ticket, ...prev]);
    setDraft({ ...emptyDraft });
    setCreateOpen(false);
  };


  const update = async (t: Ticket, patch: Partial<Ticket>) => {
    setSaving(true);
    const { error } = await supabase.from("support_tickets").update(patch as any).eq("id", t.id);
    setSaving(false);
    if (error) {
      toast({ title: "Speichern fehlgeschlagen", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ticket aktualisiert" });
    setTickets((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...patch } as Ticket : x)));
    setActive((prev) => (prev && prev.id === t.id ? { ...prev, ...patch } as Ticket : prev));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== "alle" && t.status !== statusFilter) return false;
      if (!q) return true;
      return [t.ticket_number, t.subject, t.customer_email, t.customer_name, t.category]
        .some((v) => v?.toLowerCase().includes(q));
    });
  }, [tickets, search, statusFilter]);

  if (isLoading) return null;
  if (!hasAnyStaffRole) return <Navigate to="/admin/dashboard" replace />;

  return (
    <AdminLayout title="Support-Tickets" subtitle="Anfragen aus dem KI-Chat und weiteren Kanälen bearbeiten.">
      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suche nach Nummer, Betreff, Kunde..."
          className="max-w-sm bg-white text-black"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Status</SelectItem>
            {STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading && <div className="p-8 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-zinc-400" /></div>}
        {!loading && filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-zinc-400">
            <LifeBuoy className="w-6 h-6 mx-auto mb-2 text-zinc-500" />
            Keine Tickets gefunden.
          </div>
        )}
        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => { setActive(t); setNote(t.internal_note ?? ""); }}
            className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-cockpit-mono text-[12px] text-zinc-300">{t.ticket_number}</span>
              <span className="text-sm text-white">{t.subject}</span>
              <Badge variant="outline" className={`text-[10px] ${statusColor(t.status)}`}>{t.status}</Badge>
              <Badge variant="outline" className="text-[10px] border-white/15 text-zinc-300">{t.priority}</Badge>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {format(new Date(t.created_at), "dd.MM.yyyy HH:mm", { locale: de })} · {t.category ?? "–"} · Quelle: {t.source ?? "–"}
            </p>
          </button>
        ))}
      </Card>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle>{active.ticket_number} · {active.subject}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Status</Label>
                    <Select value={active.status} onValueChange={(v) => update(active, { status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priorität</Label>
                    <Select value={active.priority} onValueChange={(v) => update(active, { priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 space-y-0.5 rounded-lg bg-white/5 border border-white/10 p-3">
                  <p>Kunde: {active.customer_name ?? "–"} {active.customer_email ? `(${active.customer_email})` : ""}</p>
                  <p>Chat-Start: {active.chat_started_at ? format(new Date(active.chat_started_at), "dd.MM.yyyy HH:mm", { locale: de }) : "–"}</p>
                  <p>IP: {active.ip_address ?? "–"}</p>
                  <p className="break-all">User-Agent: {active.user_agent ?? "–"}</p>
                </div>

                {active.description && (
                  <div>
                    <Label>Beschreibung</Label>
                    <p className="text-sm text-zinc-200 whitespace-pre-wrap">{active.description}</p>
                  </div>
                )}

                {Array.isArray(active.chat_transcript) && active.chat_transcript.length > 0 && (
                  <div>
                    <Label>Chatverlauf</Label>
                    <div className="space-y-2 mt-1 max-h-72 overflow-y-auto">
                      {active.chat_transcript.map((m: any, i: number) => (
                        <div key={i} className="text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-zinc-500 mb-0.5">{m.role === "user" ? "Kunde" : "KI"}</p>
                          <p className="text-zinc-100 whitespace-pre-wrap">{m.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Interne Notiz</Label>
                  <Textarea className="bg-white text-black" value={note} onChange={(e) => setNote(e.target.value)} />
                  <Button
                    size="sm"
                    className="mt-2 bg-[#00CC36] hover:bg-[#00CC36]/90 text-white"
                    disabled={saving}
                    onClick={() => update(active, { internal_note: note })}
                  >
                    Notiz speichern
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
