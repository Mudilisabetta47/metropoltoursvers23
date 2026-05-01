import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataTable, DataTableColumn } from "@/components/admin/core/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Inbox, Clock, AlertTriangle, CheckCircle2, MessageSquare, Send, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fmtDateTime = (d: string | null) => d ? new Date(d).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const CATEGORIES = [
  { value: "delay", label: "Verspätung" },
  { value: "comfort", label: "Komfort" },
  { value: "service", label: "Service" },
  { value: "booking", label: "Buchung" },
  { value: "billing", label: "Abrechnung" },
  { value: "damage", label: "Schaden" },
  { value: "safety", label: "Sicherheit" },
  { value: "other", label: "Sonstiges" },
];

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-zinc-700 text-zinc-300",
  normal: "bg-blue-500/15 text-blue-400",
  high: "bg-amber-500/15 text-amber-400",
  critical: "bg-red-500/15 text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-400",
  in_progress: "bg-blue-500/15 text-blue-400",
  waiting_customer: "bg-purple-500/15 text-purple-400",
  resolved: "bg-emerald-500/15 text-emerald-400",
  closed: "bg-zinc-700 text-zinc-400",
};

export default function AdminComplaints() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ category: "service", severity: "normal", channel: "email", status: "open" });
  const [detail, setDetail] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [internal, setInternal] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("complaints").select("*").order("created_at", { ascending: false }).limit(500);
    setRows(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    open: rows.filter(r => r.status === "open").length,
    overdue: rows.filter(r => r.status !== "resolved" && r.status !== "closed" && new Date(r.sla_due_at) < new Date()).length,
    critical: rows.filter(r => r.severity === "critical" && r.status !== "closed").length,
    resolved: rows.filter(r => r.status === "resolved" || r.status === "closed").length,
  }), [rows]);

  const save = async () => {
    if (!form.customer_email || !form.subject || !form.description) return toast.error("E-Mail, Betreff & Beschreibung erforderlich");
    const ticketNumber = `REK-${new Date().getFullYear()}-${String(rows.length + 1).padStart(6, "0")}`;
    const { error } = await supabase.from("complaints").insert({ ...form, ticket_number: ticketNumber });
    if (error) return toast.error(error.message);
    toast.success(`Reklamation ${ticketNumber} angelegt`);
    setOpen(false); setForm({ category: "service", severity: "normal", channel: "email", status: "open" }); load();
  };

  const openDetail = async (c: any) => {
    setDetail(c);
    const { data } = await supabase.from("complaint_messages").select("*").eq("complaint_id", c.id).order("created_at");
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !detail) return;
    const { error } = await supabase.from("complaint_messages").insert({
      complaint_id: detail.id, message: newMsg, is_internal: internal, author_type: "staff",
    });
    if (error) return toast.error(error.message);
    if (!detail.first_response_at && !internal) {
      await supabase.from("complaints").update({ first_response_at: new Date().toISOString() }).eq("id", detail.id);
    }
    setNewMsg(""); setInternal(false);
    const { data } = await supabase.from("complaint_messages").select("*").eq("complaint_id", detail.id).order("created_at");
    setMessages(data || []);
    toast.success("Antwort gesendet");
  };

  const updateStatus = async (status: string) => {
    if (!detail) return;
    const update: any = { status };
    if (status === "resolved") update.resolved_at = new Date().toISOString();
    const { error } = await supabase.from("complaints").update(update).eq("id", detail.id);
    if (error) return toast.error(error.message);
    setDetail({ ...detail, ...update }); load();
    toast.success("Status aktualisiert");
  };

  const columns: DataTableColumn<any>[] = [
    { key: "ticket", header: "Ticket", accessor: r => <span className="font-mono text-xs text-emerald-400">{r.ticket_number}</span>, sortValue: r => r.ticket_number },
    { key: "subject", header: "Betreff", accessor: r => (
      <div><div className="font-medium text-white">{r.subject}</div><div className="text-xs text-zinc-500">{r.customer_name || r.customer_email}</div></div>
    ), sortValue: r => r.subject },
    { key: "cat", header: "Kategorie", accessor: r => CATEGORIES.find(c => c.value === r.category)?.label || r.category },
    { key: "sev", header: "Priorität", accessor: r => <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_COLORS[r.severity]}`}>{r.severity}</span>, sortValue: r => r.severity },
    { key: "status", header: "Status", accessor: r => <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>{r.status}</span>, sortValue: r => r.status },
    { key: "sla", header: "SLA", accessor: r => {
      const overdue = new Date(r.sla_due_at) < new Date() && r.status !== "resolved" && r.status !== "closed";
      const remaining = Math.ceil((new Date(r.sla_due_at).getTime() - Date.now()) / 3600000);
      return <span className={overdue ? "text-red-400 font-semibold" : remaining < 12 ? "text-amber-400" : "text-zinc-400"}>{overdue ? `${Math.abs(remaining)}h überfällig` : `${remaining}h`}</span>;
    }, sortValue: r => r.sla_due_at },
    { key: "created", header: "Erstellt", accessor: r => fmtDateTime(r.created_at), sortValue: r => r.created_at },
  ];

  return (
    <AdminLayout title="Reklamationen" subtitle="Tickets mit SLA-Tracking & interner Kommunikation"
      actions={<Button onClick={() => setOpen(true)} className="bg-[#00CC36] hover:bg-[#00CC36]/90 text-black"><Plus className="w-4 h-4 mr-2" />Neue Reklamation</Button>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon={Inbox} label="Offen" value={stats.open} color="text-amber-400" />
        <Stat icon={Clock} label="SLA überfällig" value={stats.overdue} color="text-red-400" />
        <Stat icon={AlertTriangle} label="Kritisch" value={stats.critical} color="text-red-400" />
        <Stat icon={CheckCircle2} label="Gelöst" value={stats.resolved} color="text-emerald-400" />
      </div>

      <DataTable data={rows} columns={columns} rowKey={r => r.id} isLoading={loading} onRowClick={openDetail} exportFilename="reklamationen" emptyMessage="Keine offenen Reklamationen" />

      {/* New complaint dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader><DialogTitle>Reklamation anlegen</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Kundenname</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, customer_name: e.target.value })} /></div>
            <div><Label>Kunden-E-Mail *</Label><Input type="email" className="bg-white text-black" onChange={e => setForm({ ...form, customer_email: e.target.value })} /></div>
            <div><Label>Telefon</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, customer_phone: e.target.value })} /></div>
            <div>
              <Label>Kanal</Label>
              <Select value={form.channel} onValueChange={v => setForm({ ...form, channel: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="email">E-Mail</SelectItem><SelectItem value="phone">Telefon</SelectItem><SelectItem value="form">Webformular</SelectItem><SelectItem value="walk_in">Vor Ort</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kategorie</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priorität</Label>
              <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Niedrig</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">Hoch</SelectItem><SelectItem value="critical">Kritisch</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Betreff *</Label><Input className="bg-white text-black" onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
            <div className="col-span-2"><Label>Beschreibung *</Label><Textarea className="bg-white text-black min-h-[100px]" onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button><Button onClick={save} className="bg-[#00CC36] text-black">Anlegen</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <SheetContent className="bg-zinc-950 border-zinc-800 text-white w-full sm:max-w-2xl overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white flex items-center gap-3">
                  <span className="font-mono text-emerald-400 text-sm">{detail.ticket_number}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[detail.status]}`}>{detail.status}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_COLORS[detail.severity]}`}>{detail.severity}</span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-zinc-900 p-4 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-1">{detail.subject}</h3>
                  <div className="text-xs text-zinc-500 mb-2">{detail.customer_name} · {detail.customer_email} · {fmtDateTime(detail.created_at)}</div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{detail.description}</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {["open", "in_progress", "waiting_customer", "resolved", "closed"].map(s => (
                    <Button key={s} size="sm" variant={detail.status === s ? "default" : "outline"} onClick={() => updateStatus(s)} className={detail.status === s ? "bg-[#00CC36] text-black" : ""}>
                      {s}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><MessageSquare className="w-4 h-4" />Kommunikation</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {messages.length === 0 && <div className="text-xs text-zinc-500 text-center py-4">Noch keine Nachrichten</div>}
                    {messages.map(m => (
                      <div key={m.id} className={`rounded-lg p-3 text-sm ${m.is_internal ? "bg-amber-500/10 border border-amber-500/20" : "bg-zinc-900 border border-zinc-800"}`}>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                          {m.is_internal && <Lock className="w-3 h-3 text-amber-400" />}
                          <span>{m.author_type}</span>
                          <span>·</span>
                          <span>{fmtDateTime(m.created_at)}</span>
                        </div>
                        <p className="text-zinc-200 whitespace-pre-wrap">{m.message}</p>
                      </div>
                    ))}
                  </div>
                  <Textarea value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Antwort schreiben..." className="bg-white text-black min-h-[80px]" />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-zinc-400"><input type="checkbox" checked={internal} onChange={e => setInternal(e.target.checked)} />Interne Notiz</label>
                    <Button onClick={sendMessage} disabled={!newMsg.trim()} className="bg-[#00CC36] text-black"><Send className="w-4 h-4 mr-2" />Senden</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

function Stat({ icon: Icon, label, value, color }: any) {
  return (
    <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-2"><Icon className={`w-5 h-5 ${color}`} /><span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span></div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
