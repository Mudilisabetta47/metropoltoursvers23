import { useState, useEffect, useMemo } from "react";
import {
  Inbox, Send, Star, Archive, Search, RefreshCw, Mail, MailOpen,
  Trash2, Reply, Plus, User, Briefcase, FileText, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MailItem {
  id: string;
  folder: string;
  subject: string;
  body: string;
  sender_email: string | null;
  sender_name: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  source_type: string;
  source_id: string | null;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  replied_at: string | null;
  reply_body: string | null;
  tags: string[];
  created_at: string;
}

interface MailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

interface JobApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string;
  internal_notes: string | null;
  is_read: boolean;
  created_at: string;
  job_listing_id: string | null;
  resume_url: string | null;
  resume_filename: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  earliest_start_date: string | null;
  experience_years: string | null;
  desired_salary: string | null;
  how_found_us: string | null;
}

const FOLDERS = [
  { key: "inbox", label: "Posteingang", icon: Inbox },
  { key: "applications", label: "Bewerbungen", icon: Briefcase },
  { key: "sent", label: "Gesendet", icon: Send },
  { key: "starred", label: "Markiert", icon: Star },
  { key: "archived", label: "Archiv", icon: Archive },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: "Neu", color: "bg-emerald-500/20 text-emerald-400" },
  in_review: { label: "In Prüfung", color: "bg-blue-500/20 text-blue-400" },
  interview: { label: "Interview", color: "bg-purple-500/20 text-purple-400" },
  accepted: { label: "Angenommen", color: "bg-green-500/20 text-green-400" },
  rejected: { label: "Abgelehnt", color: "bg-red-500/20 text-red-400" },
};

const AdminMailbox = () => {
  const { toast } = useToast();
  const [mails, setMails] = useState<MailItem[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [compose, setCompose] = useState({ to: "", subject: "", body: "" });
  const [replyBody, setReplyBody] = useState("");
  const [newTemplate, setNewTemplate] = useState({ name: "", subject: "", body: "", category: "general" });

  const fetchAll = async () => {
    setLoading(true);
    const [mailRes, appRes, tmplRes] = await Promise.all([
      (supabase as any).from("admin_mailbox").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("job_applications").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("admin_mail_templates").select("*").order("name"),
    ]);
    setMails(mailRes.data || []);
    setApplications(appRes.data || []);
    setTemplates(tmplRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const unreadCount = useMemo(() => mails.filter(m => !m.is_read && m.folder === "inbox").length, [mails]);
  const unreadApps = useMemo(() => applications.filter(a => !a.is_read).length, [applications]);

  const filteredMails = useMemo(() => {
    let items = mails;
    if (activeFolder === "starred") items = items.filter(m => m.is_starred);
    else if (activeFolder === "archived") items = items.filter(m => m.is_archived);
    else if (activeFolder !== "applications") items = items.filter(m => m.folder === activeFolder && !m.is_archived);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(m =>
        m.subject.toLowerCase().includes(q) ||
        m.sender_name?.toLowerCase().includes(q) ||
        m.sender_email?.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q)
      );
    }
    return items;
  }, [mails, activeFolder, searchQuery]);

  const filteredApps = useMemo(() => {
    if (!searchQuery) return applications;
    const q = searchQuery.toLowerCase();
    return applications.filter(a =>
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  }, [applications, searchQuery]);

  const toggleRead = async (mail: MailItem) => {
    await (supabase as any).from("admin_mailbox").update({ is_read: !mail.is_read }).eq("id", mail.id);
    setMails(prev => prev.map(m => m.id === mail.id ? { ...m, is_read: !m.is_read } : m));
  };

  const toggleStar = async (mail: MailItem) => {
    await (supabase as any).from("admin_mailbox").update({ is_starred: !mail.is_starred }).eq("id", mail.id);
    setMails(prev => prev.map(m => m.id === mail.id ? { ...m, is_starred: !m.is_starred } : m));
  };

  const archiveMail = async (mail: MailItem) => {
    await (supabase as any).from("admin_mailbox").update({ is_archived: true }).eq("id", mail.id);
    setMails(prev => prev.map(m => m.id === mail.id ? { ...m, is_archived: true } : m));
    setSelectedMail(null);
    toast({ title: "Archiviert" });
  };

  const deleteMail = async (mail: MailItem) => {
    await (supabase as any).from("admin_mailbox").delete().eq("id", mail.id);
    setMails(prev => prev.filter(m => m.id !== mail.id));
    setSelectedMail(null);
    toast({ title: "Gelöscht" });
  };

  const openMail = async (mail: MailItem) => {
    if (!mail.is_read) {
      await (supabase as any).from("admin_mailbox").update({ is_read: true }).eq("id", mail.id);
      setMails(prev => prev.map(m => m.id === mail.id ? { ...m, is_read: true } : m));
    }
    setSelectedMail(mail);
    setSelectedApp(null);
  };

  const openApp = async (app: JobApplication) => {
    if (!app.is_read) {
      await (supabase as any).from("job_applications").update({ is_read: true }).eq("id", app.id);
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, is_read: true } : a));
    }
    setSelectedApp(app);
    setSelectedMail(null);
  };

  const updateAppStatus = async (app: JobApplication, status: string) => {
    await (supabase as any).from("job_applications").update({ status }).eq("id", app.id);
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status } : a));
    setSelectedApp(prev => prev ? { ...prev, status } : null);
    toast({ title: `Status: ${STATUS_MAP[status]?.label || status}` });
  };

  const handleSendCompose = async () => {
    if (!compose.to || !compose.subject) {
      toast({ title: "Bitte Empfänger und Betreff ausfüllen", variant: "destructive" });
      return;
    }
    await (supabase as any).from("admin_mailbox").insert({
      folder: "sent",
      subject: compose.subject,
      body: compose.body,
      recipient_email: compose.to,
      sender_name: "Metropol Tours",
      sender_email: "info@metours.de",
      source_type: "manual",
      is_read: true,
    });
    setCompose({ to: "", subject: "", body: "" });
    setComposeOpen(false);
    fetchAll();
    toast({ title: "Nachricht gesendet" });
  };

  const handleReply = async () => {
    if (!selectedMail || !replyBody) return;
    await (supabase as any).from("admin_mailbox").update({
      replied_at: new Date().toISOString(),
      reply_body: replyBody,
    }).eq("id", selectedMail.id);

    await (supabase as any).from("admin_mailbox").insert({
      folder: "sent",
      subject: `Re: ${selectedMail.subject}`,
      body: replyBody,
      recipient_email: selectedMail.sender_email,
      recipient_name: selectedMail.sender_name,
      sender_name: "Metropol Tours",
      sender_email: "info@metours.de",
      source_type: "reply",
      source_id: selectedMail.id,
      is_read: true,
    });

    setReplyBody("");
    setReplyOpen(false);
    fetchAll();
    toast({ title: "Antwort gesendet" });
  };

  const handleSaveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject) {
      toast({ title: "Name und Betreff erforderlich", variant: "destructive" });
      return;
    }
    await (supabase as any).from("admin_mail_templates").insert(newTemplate);
    setNewTemplate({ name: "", subject: "", body: "", category: "general" });
    setTemplateDialogOpen(false);
    fetchAll();
    toast({ title: "Vorlage gespeichert" });
  };

  const applyTemplate = (tmpl: MailTemplate) => {
    setCompose(prev => ({ ...prev, subject: tmpl.subject, body: tmpl.body }));
  };

  return (
    <AdminLayout title="Postfach" subtitle="Internes Nachrichtensystem">
      <div className="flex gap-4 h-[calc(100vh-140px)]">
        {/* Sidebar Folders */}
        <div className="w-56 shrink-0 space-y-1">
          <Button
            onClick={() => setComposeOpen(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 mb-3 gap-2"
          >
            <Plus className="w-4 h-4" />Neue Nachricht
          </Button>
          {FOLDERS.map(f => (
            <button
              key={f.key}
              onClick={() => { setActiveFolder(f.key); setSelectedMail(null); setSelectedApp(null); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                activeFolder === f.key
                  ? "bg-emerald-600/15 text-emerald-400"
                  : "text-zinc-400 hover:bg-[#1e2430] hover:text-zinc-200"
              )}
            >
              <f.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{f.label}</span>
              {f.key === "inbox" && unreadCount > 0 && (
                <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 h-5 min-w-[20px] justify-center">{unreadCount}</Badge>
              )}
              {f.key === "applications" && unreadApps > 0 && (
                <Badge className="bg-orange-600 text-white text-[10px] px-1.5 h-5 min-w-[20px] justify-center">{unreadApps}</Badge>
              )}
            </button>
          ))}

          <Separator className="bg-[#2a3040] my-3" />

          <button
            onClick={() => setTemplateDialogOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:bg-[#1e2430] hover:text-zinc-300 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Vorlagen verwalten</span>
          </button>

          {templates.length > 0 && (
            <div className="mt-2 space-y-0.5">
              <p className="px-3 text-[10px] text-zinc-600 uppercase tracking-wider">Schnellvorlagen</p>
              {templates.slice(0, 5).map(t => (
                <button
                  key={t.id}
                  onClick={() => { applyTemplate(t); setComposeOpen(true); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 truncate hover:bg-[#1e2430] rounded"
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mail List */}
        <div className="w-80 shrink-0 flex flex-col bg-[#1a1f2a] rounded-xl border border-[#2a3040] overflow-hidden">
          <div className="p-3 border-b border-[#2a3040] flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Suchen..."
                className="pl-8 bg-[#151920] border-[#2a3040] h-8 text-xs"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={fetchAll} className="text-zinc-500 hover:text-white h-8 w-8 p-0">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-zinc-500 text-sm">Laden...</div>
            ) : activeFolder === "applications" ? (
              filteredApps.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">Keine Bewerbungen</div>
              ) : filteredApps.map(app => (
                <button
                  key={app.id}
                  onClick={() => openApp(app)}
                  className={cn(
                    "w-full text-left p-3 border-b border-[#252b38] hover:bg-[#1e2430] transition-colors",
                    selectedApp?.id === app.id && "bg-[#1e2430]",
                    !app.is_read && "bg-[#1a2030]"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3 h-3 text-orange-400" />
                    <span className={cn("text-sm truncate flex-1", !app.is_read ? "font-semibold text-white" : "text-zinc-300")}>
                      {app.first_name} {app.last_name}
                    </span>
                    <Badge className={cn("text-[9px] border-0 px-1.5", STATUS_MAP[app.status]?.color || "bg-zinc-700 text-zinc-300")}>
                      {STATUS_MAP[app.status]?.label || app.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">{app.email}</p>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {format(new Date(app.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                  </p>
                </button>
              ))
            ) : filteredMails.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">
                {activeFolder === "inbox" ? "Posteingang leer" : "Keine Nachrichten"}
              </div>
            ) : filteredMails.map(mail => (
              <button
                key={mail.id}
                onClick={() => openMail(mail)}
                className={cn(
                  "w-full text-left p-3 border-b border-[#252b38] hover:bg-[#1e2430] transition-colors",
                  selectedMail?.id === mail.id && "bg-[#1e2430]",
                  !mail.is_read && "bg-[#1a2030]"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {mail.is_starred ? (
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
                  ) : (
                    <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                  )}
                  <span className={cn("text-sm truncate flex-1", !mail.is_read ? "font-semibold text-white" : "text-zinc-300")}>
                    {mail.sender_name || mail.sender_email || "System"}
                  </span>
                  {mail.source_type === "application" && (
                    <Briefcase className="w-3 h-3 text-orange-400 shrink-0" />
                  )}
                </div>
                <p className={cn("text-xs truncate mb-1", !mail.is_read ? "text-zinc-200" : "text-zinc-400")}>
                  {mail.subject}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600">
                    {format(new Date(mail.created_at), "dd.MM. HH:mm", { locale: de })}
                  </span>
                  {mail.replied_at && (
                    <Reply className="w-3 h-3 text-emerald-500" />
                  )}
                  {mail.tags.length > 0 && (
                    <div className="flex gap-1">
                      {mail.tags.slice(0, 2).map(t => (
                        <Badge key={t} className="bg-[#252b38] text-zinc-400 text-[8px] border-0 px-1 py-0">{t}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-1 bg-[#1a1f2a] rounded-xl border border-[#2a3040] overflow-y-auto">
          {selectedApp ? (
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Bewerbung: {selectedApp.first_name} {selectedApp.last_name}
                  </h3>
                  <p className="text-sm text-zinc-400">{selectedApp.email}</p>
                  {selectedApp.phone && <p className="text-sm text-zinc-500">{selectedApp.phone}</p>}
                  <p className="text-xs text-zinc-600 mt-1">
                    Eingegangen: {format(new Date(selectedApp.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedApp.status} onValueChange={v => updateAppStatus(selectedApp, v)}>
                    <SelectTrigger className="w-36 bg-[#252b38] border-[#2a3040] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                      {Object.entries(STATUS_MAP).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCompose({ to: selectedApp.email, subject: `Re: Ihre Bewerbung`, body: "" });
                      setComposeOpen(true);
                    }}
                    className="border-[#2a3040] text-zinc-300 h-8 text-xs gap-1"
                  >
                    <Reply className="w-3 h-3" />Antworten
                  </Button>
                </div>
              </div>

              <Separator className="bg-[#2a3040] mb-4" />

              {selectedApp.message ? (
                <div className="bg-[#151920] rounded-lg p-4 mb-4">
                  <p className="text-xs text-zinc-500 mb-2 font-medium">Nachricht</p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{selectedApp.message}</p>
                </div>
              ) : (
                <div className="bg-[#151920] rounded-lg p-4 mb-4 text-center text-zinc-500 text-sm">
                  Keine Nachricht hinterlegt
                </div>
              )}

              <div className="bg-[#151920] rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-2 font-medium">Interne Notizen</p>
                <Textarea
                  value={selectedApp.internal_notes || ""}
                  onChange={e => setSelectedApp(prev => prev ? { ...prev, internal_notes: e.target.value } : null)}
                  onBlur={async () => {
                    if (selectedApp) {
                      await (supabase as any).from("job_applications").update({ internal_notes: selectedApp.internal_notes }).eq("id", selectedApp.id);
                    }
                  }}
                  placeholder="Interne Notizen zur Bewerbung..."
                  className="bg-[#1a1f2a] border-[#2a3040] text-sm min-h-[80px]"
                />
              </div>
            </div>
          ) : selectedMail ? (
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white mb-1">{selectedMail.subject}</h3>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-zinc-300">{selectedMail.sender_name || selectedMail.sender_email || "System"}</span>
                    {selectedMail.sender_email && (
                      <span className="text-zinc-500 text-xs">&lt;{selectedMail.sender_email}&gt;</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">
                    {format(new Date(selectedMail.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" onClick={() => toggleStar(selectedMail)} className="text-zinc-400 hover:text-yellow-400 h-7 w-7 p-0">
                    {selectedMail.is_starred ? <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> : <Star className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleRead(selectedMail)} className="text-zinc-400 hover:text-white h-7 w-7 p-0">
                    {selectedMail.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => archiveMail(selectedMail)} className="text-zinc-400 hover:text-white h-7 w-7 p-0">
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMail(selectedMail)} className="text-red-400/60 hover:text-red-400 h-7 w-7 p-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {selectedMail.tags.length > 0 && (
                <div className="flex gap-1.5 mb-4">
                  {selectedMail.tags.map(t => (
                    <Badge key={t} className="bg-[#252b38] text-zinc-300 text-[10px] border-0">{t}</Badge>
                  ))}
                </div>
              )}

              <Separator className="bg-[#2a3040] mb-4" />

              <div className="bg-[#151920] rounded-lg p-5 mb-4">
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{selectedMail.body}</p>
              </div>

              {selectedMail.replied_at && selectedMail.reply_body && (
                <div className="bg-emerald-900/10 border border-emerald-800/20 rounded-lg p-4 mb-4">
                  <p className="text-xs text-emerald-500 mb-2 flex items-center gap-1">
                    <Reply className="w-3 h-3" />
                    Geantwortet am {format(new Date(selectedMail.replied_at), "dd.MM.yyyy HH:mm", { locale: de })}
                  </p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{selectedMail.reply_body}</p>
                </div>
              )}

              {selectedMail.folder !== "sent" && !selectedMail.replied_at && (
                <div className="mt-4">
                  <Button
                    onClick={() => setReplyOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                  >
                    <Reply className="w-4 h-4" />Antworten
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <MailOpen className="w-12 h-12 mb-3 text-zinc-600" />
              <p className="text-sm">Nachricht auswählen</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="bg-[#1a1f2a] border-[#2a3040] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Neue Nachricht</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-zinc-400 text-xs">An</Label>
              <Input value={compose.to} onChange={e => setCompose(p => ({ ...p, to: e.target.value }))}
                className="bg-[#151920] border-[#2a3040] mt-1 text-white" placeholder="empfaenger@email.de" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Betreff</Label>
              <Input value={compose.subject} onChange={e => setCompose(p => ({ ...p, subject: e.target.value }))}
                className="bg-[#151920] border-[#2a3040] mt-1 text-white" />
            </div>
            {templates.length > 0 && (
              <div>
                <Label className="text-zinc-400 text-xs">Vorlage einfügen</Label>
                <Select onValueChange={v => {
                  const t = templates.find(t => t.id === v);
                  if (t) applyTemplate(t);
                }}>
                  <SelectTrigger className="bg-[#151920] border-[#2a3040] mt-1">
                    <SelectValue placeholder="Vorlage wählen..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                    {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-zinc-400 text-xs">Nachricht</Label>
              <Textarea value={compose.body} onChange={e => setCompose(p => ({ ...p, body: e.target.value }))}
                className="bg-[#151920] border-[#2a3040] mt-1 min-h-[200px] text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setComposeOpen(false)} className="text-zinc-400">Abbrechen</Button>
            <Button onClick={handleSendCompose} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Send className="w-4 h-4" />Senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="bg-[#1a1f2a] border-[#2a3040] max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Antworten: {selectedMail?.subject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">An: {selectedMail?.sender_email}</p>
            {templates.length > 0 && (
              <Select onValueChange={v => {
                const t = templates.find(t => t.id === v);
                if (t) setReplyBody(t.body);
              }}>
                <SelectTrigger className="bg-[#151920] border-[#2a3040]">
                  <SelectValue placeholder="Vorlage einfügen..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                  {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Textarea value={replyBody} onChange={e => setReplyBody(e.target.value)}
              className="bg-[#151920] border-[#2a3040] min-h-[150px]" placeholder="Ihre Antwort..." />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReplyOpen(false)} className="text-zinc-400">Abbrechen</Button>
            <Button onClick={handleReply} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Send className="w-4 h-4" />Antwort senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Manager Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="bg-[#1a1f2a] border-[#2a3040] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Vorlagen verwalten</DialogTitle>
          </DialogHeader>

          {templates.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
              {templates.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-[#151920] rounded-lg p-3">
                  <div>
                    <p className="text-sm text-white font-medium">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.subject}</p>
                  </div>
                  <Button variant="ghost" size="sm"
                    onClick={async () => {
                      await (supabase as any).from("admin_mail_templates").delete().eq("id", t.id);
                      fetchAll();
                      toast({ title: "Vorlage gelöscht" });
                    }}
                    className="text-red-400/60 hover:text-red-400 h-7 w-7 p-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator className="bg-[#2a3040]" />
          <p className="text-xs text-zinc-500 font-medium">Neue Vorlage</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400 text-xs">Name</Label>
                <Input value={newTemplate.name} onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))}
                  className="bg-[#151920] border-[#2a3040] mt-1" placeholder="z.B. Eingangsbestätigung" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Kategorie</Label>
                <Select value={newTemplate.category} onValueChange={v => setNewTemplate(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="bg-[#151920] border-[#2a3040] mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1f2a] border-[#2a3040]">
                    <SelectItem value="general">Allgemein</SelectItem>
                    <SelectItem value="application">Bewerbung</SelectItem>
                    <SelectItem value="booking">Buchung</SelectItem>
                    <SelectItem value="inquiry">Anfrage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Betreff</Label>
              <Input value={newTemplate.subject} onChange={e => setNewTemplate(p => ({ ...p, subject: e.target.value }))}
                className="bg-[#151920] border-[#2a3040] mt-1" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Text</Label>
              <Textarea value={newTemplate.body} onChange={e => setNewTemplate(p => ({ ...p, body: e.target.value }))}
                className="bg-[#151920] border-[#2a3040] mt-1 min-h-[100px]" placeholder="Sehr geehrte/r {{name}}..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTemplateDialogOpen(false)} className="text-zinc-400">Schließen</Button>
            <Button onClick={handleSaveTemplate} className="bg-emerald-600 hover:bg-emerald-700">Vorlage speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminMailbox;
