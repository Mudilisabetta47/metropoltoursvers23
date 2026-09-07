import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, RefreshCw, Sparkles, FileText, Reply, Mail, ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DispoLayout from "../DispoLayout";
import { EmptyState } from "../components/ui";
import { useDispoData, DispoEmail } from "../hooks/useDispoData";
import { dateDE, timeDE } from "../lib/format";

const db = supabase as any;

const FOLDERS = [
  { key: "inbox", label: "Posteingang" },
  { key: "anfragen", label: "Angebotsanfragen" },
  { key: "kunden", label: "Kunden" },
  { key: "gesendet", label: "Gesendet" },
  { key: "archiv", label: "Archiv" },
];

export default function DispoInbox() {
  const { emails, orders, loading, reload } = useDispoData();
  const [folder, setFolder] = useState("inbox");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const navigate = useNavigate();

  const list = useMemo(
    () => emails.filter((m) => (folder === "anfragen" ? m.is_inquiry : m.folder === folder)),
    [emails, folder],
  );
  const active = useMemo(() => emails.find((m) => m.id === activeId) ?? list[0] ?? null, [emails, activeId, list]);

  useEffect(() => { setDraft(""); }, [active?.id]);

  const syncMail = async () => {
    setBusy(true);
    let total = 0;
    let runs = 0;
    try {
      // Solange weiterladen, bis alle Nachrichten der letzten 90 Tage abgerufen sind.
      while (runs < 15) {
        runs++;
        const { data, error } = await supabase.functions.invoke("dispo-mail-sync", {
          body: { days: 90, limit: 40 },
        });
        if (error) {
          toast.error(`Abruf fehlgeschlagen: ${error.message}`);
          break;
        }
        total += data?.imported ?? 0;
        if (data?.problems?.length) toast.warning(String(data.problems[0]));
        if (!data?.remaining) break;
        toast.info(`${total} E-Mails geladen – es folgen noch ${data.remaining}…`);
      }
      toast.success(`${total} neue E-Mails abgerufen`);
      reload();
    } finally {
      setBusy(false);
    }
  };


  const analyse = async (mail: DispoEmail) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("dispo-ai", {
      body: { action: "parse_email", email_id: mail.id },
    });
    setBusy(false);
    if (error) return toast.error(`KI-Analyse fehlgeschlagen: ${error.message}`);
    toast.success(data?.is_inquiry ? "KI hat eine Busanfrage erkannt" : "Keine Busanfrage erkannt");
    reload();
  };

  const createOrder = async (mail: DispoEmail) => {
    const x = mail.extracted ?? {};
    const { data, error } = await db
      .from("dispo_orders")
      .insert({
        customer_name: x.customer_name || mail.from_name || mail.from_email || "Unbekannt",
        company: x.company ?? null,
        email: x.email || mail.from_email,
        phone: x.phone ?? null,
        passengers: Number(x.passengers) || 0,
        origin: x.origin ?? null,
        destination: x.destination ?? null,
        waypoints: Array.isArray(x.waypoints) ? x.waypoints.map((n: any) => (typeof n === "string" ? { name: n } : n)) : [],
        departure_date: x.departure_date || null,
        departure_time: x.departure_time || null,
        return_date: x.return_date || null,
        return_time: x.return_time || null,
        luggage: x.luggage ?? null,
        requirements: x.requirements ?? null,
        notes: `Aus E-Mail übernommen: ${mail.subject ?? ""}`,
        status: "anfrage",
        source: "e-mail",
      })
      .select("id")
      .maybeSingle();
    if (error) return toast.error(error.message);
    await db.from("dispo_emails").update({ order_id: data.id, folder: "kunden" }).eq("id", mail.id);
    toast.success("Auftrag aus Anfrage erstellt");
    reload();
    navigate(`/dispo/auftraege?id=${data.id}`);
  };

  const prepareReply = async (mail: DispoEmail) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("dispo-ai", {
      body: { action: "draft_reply", email_id: mail.id },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setDraft(data?.reply ?? "");
  };

  // Rückmeldung des Disponenten wird als Lernbeispiel gespeichert.
  const learn = async (mail: DispoEmail, isInquiry: boolean) => {
    const { error } = await db.from("dispo_ai_examples").insert({
      source_email_id: mail.id,
      subject: mail.subject,
      body_text: mail.body_text ?? "",
      from_email: mail.from_email,
      is_inquiry: isInquiry,
      label: isInquiry ? "anfrage" : "keine_anfrage",
      extracted: isInquiry ? mail.extracted ?? {} : {},
    });
    if (error) return toast.error(error.message);
    await db.from("dispo_emails").update({
      is_inquiry: isInquiry,
      ai_status: isInquiry ? "anfrage_bestaetigt" : "keine_anfrage",
      folder: isInquiry ? "anfragen" : mail.folder,
    }).eq("id", mail.id);
    toast.success(isInquiry ? "Als Busanfrage gelernt" : "Als „keine Anfrage“ gelernt");
    reload();
  };

  const markRead = async (mail: DispoEmail) => {
    setActiveId(mail.id);
    if (!mail.is_read) {
      await db.from("dispo_emails").update({ is_read: true }).eq("id", mail.id);
      reload();
    }
  };


  const linkedOrder = orders.find((o) => o.id === active?.order_id);

  return (
    <DispoLayout
      title="Postfach"
      subtitle="kundenservice@metours.de"
      actions={
        <button className="dispo-btn dispo-btn-primary" onClick={syncMail} disabled={busy}>
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> E-Mails abrufen
        </button>
      }
    >
      <div className="grid gap-3 lg:grid-cols-[180px_320px_1fr]">
        <div className="dispo-card p-2">
          {FOLDERS.map((f) => (
            <button
              key={f.key}
              className={`dispo-nav-item w-full ${folder === f.key ? "dispo-nav-active" : ""}`}
              onClick={() => setFolder(f.key)}
            >
              <Mail className="h-4 w-4" /> {f.label}
            </button>
          ))}
        </div>

        <div className="dispo-card max-h-[70vh] overflow-y-auto">
          {loading ? <EmptyState text="Lade…" /> : list.length === 0 ? (
            <EmptyState text="Keine E-Mails in diesem Ordner." />
          ) : (
            list.map((m) => (
              <button
                key={m.id}
                onClick={() => markRead(m)}
                className={`block w-full border-b p-3 text-left text-sm ${active?.id === m.id ? "bg-[hsl(var(--dispo-bg))]" : ""}`}
                style={{ borderColor: "hsl(var(--dispo-border))" }}
              >
                <div className="flex items-center gap-2">
                  <span className={`truncate ${m.is_read ? "" : "font-bold"} dispo-strong`}>{m.from_name || m.from_email}</span>
                  <span className="ml-auto shrink-0 text-xs dispo-muted">{dateDE(m.received_at?.slice(0, 10))}</span>
                </div>
                <div className="truncate">{m.subject}</div>
                {m.is_inquiry && (
                  <span className="dispo-chip mt-1 inline-flex" style={{ color: "#065f46", background: "#d1fae5" }}>
                    <Bot className="mr-1 h-3 w-3" /> KI hat Anfrage erkannt
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="dispo-card p-4">
          {!active ? (
            <EmptyState text="Bitte eine E-Mail auswählen." />
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold dispo-strong">{active.subject}</h2>
                <p className="text-sm dispo-muted">
                  {active.from_name} &lt;{active.from_email}&gt; · {dateDE(active.received_at?.slice(0, 10))} {timeDE(active.received_at?.slice(11, 16))}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button className="dispo-btn dispo-btn-ghost" onClick={() => analyse(active)} disabled={busy}>
                  <Sparkles className="h-4 w-4" /> KI-Analyse
                </button>
                <button className="dispo-btn dispo-btn-primary" onClick={() => createOrder(active)} disabled={!!active.order_id}>
                  <FileText className="h-4 w-4" /> Auftrag erstellen
                </button>
                <button className="dispo-btn dispo-btn-ghost" onClick={() => prepareReply(active)} disabled={busy}>
                  <Reply className="h-4 w-4" /> Antwort vorbereiten
                </button>
                <button className="dispo-btn dispo-btn-ghost" onClick={() => learn(active, true)}>
                  <ThumbsUp className="h-4 w-4" /> Ist eine Anfrage (lernen)
                </button>
                <button className="dispo-btn dispo-btn-ghost" onClick={() => learn(active, false)}>
                  <ThumbsDown className="h-4 w-4" /> Keine Anfrage (lernen)
                </button>

                {linkedOrder && (
                  <button className="dispo-btn dispo-btn-ghost" onClick={() => navigate(`/dispo/auftraege?id=${linkedOrder.id}`)}>
                    Auftrag {linkedOrder.order_number} öffnen
                  </button>
                )}
              </div>

              {active.extracted && Object.keys(active.extracted).length > 0 && (
                <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "hsl(var(--dispo-border))" }}>
                  <div className="mb-2 font-semibold dispo-strong">Extrahierte Daten (Entwurf – nicht automatisch bestätigt)</div>
                  <div className="grid gap-1 md:grid-cols-3">
                    {Object.entries(active.extracted).map(([k, v]) => (
                      <div key={k}><span className="dispo-muted">{k}: </span>{Array.isArray(v) ? v.join(", ") : String(v ?? "–")}</div>
                    ))}
                  </div>
                </div>
              )}

              <pre className="whitespace-pre-wrap rounded-lg bg-[hsl(var(--dispo-bg))] p-3 text-sm">{active.body_text}</pre>

              {draft && (
                <div>
                  <div className="mb-1 text-sm font-semibold dispo-strong">Antwortentwurf (wird nicht automatisch versendet)</div>
                  <textarea className="dispo-input min-h-[200px]" value={draft} onChange={(e) => setDraft(e.target.value)} />
                  <p className="mt-1 text-xs dispo-muted">Zum Versenden Text kopieren oder im Mailprogramm einfügen.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DispoLayout>
  );
}
