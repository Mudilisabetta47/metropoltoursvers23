import { useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DispoLayout from "../DispoLayout";
import { EmptyState, Field, Section } from "../components/ui";
import { dateDE } from "../lib/format";

const db = supabase as any;

const empty = {
  label: "Kundenservice",
  email_address: "kundenservice@metours.de",
  provider: "imap",
  imap_host: "",
  imap_port: 993,
  imap_secure: true,
  smtp_host: "",
  smtp_port: 587,
  username: "",
  secret_name: "DISPO_MAIL_PASSWORD",
  is_active: true,
};

export default function DispoSettings() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await db.from("dispo_email_accounts").select("*").order("created_at");
    setAccounts(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const { error } = await db.from("dispo_email_accounts").insert(form);
    if (error) return toast.error(error.message);
    toast.success("Postfach gespeichert");
    setShowForm(false);
    setForm(empty);
    load();
  };

  const sync = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("dispo-mail-sync", { body: {} });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${data?.imported ?? 0} E-Mails abgerufen`);
    load();
  };

  const toggle = async (a: any) => {
    await db.from("dispo_email_accounts").update({ is_active: !a.is_active }).eq("id", a.id);
    load();
  };

  return (
    <DispoLayout
      title="Einstellungen"
      subtitle="E-Mail-Anbindung und Systemhinweise"
      actions={
        <button className="dispo-btn dispo-btn-ghost" onClick={sync} disabled={busy}>
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Jetzt abrufen
        </button>
      }
    >
      <div className="space-y-4">
        <Section
          title="E-Mail-Postfächer"
          right={<button className="dispo-btn dispo-btn-ghost" onClick={() => setShowForm((v) => !v)}><Plus className="h-4 w-4" /> Postfach</button>}
        >
          {accounts.length === 0 ? (
            <EmptyState text="Noch kein Postfach hinterlegt." />
          ) : (
            <table className="dispo-table">
              <thead>
                <tr><th>Bezeichnung</th><th>Adresse</th><th>Typ</th><th>Server</th><th>Letzter Abruf</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium dispo-strong">{a.label}</td>
                    <td>{a.email_address}</td>
                    <td>{a.provider}</td>
                    <td>{a.imap_host ?? "–"}:{a.imap_port ?? "–"}</td>
                    <td>{a.last_sync_at ? dateDE(String(a.last_sync_at).slice(0, 10)) : "–"} {a.last_sync_status ? `· ${a.last_sync_status}` : ""}</td>
                    <td>{a.is_active ? "aktiv" : "inaktiv"}</td>
                    <td><button className="dispo-btn dispo-btn-ghost" onClick={() => toggle(a)}>{a.is_active ? "Deaktivieren" : "Aktivieren"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {showForm && (
            <div className="grid gap-3 border-t p-4 md:grid-cols-3" style={{ borderColor: "hsl(var(--dispo-border))" }}>
              <Field label="Bezeichnung"><input className="dispo-input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Field>
              <Field label="E-Mail-Adresse"><input className="dispo-input" value={form.email_address} onChange={(e) => setForm({ ...form, email_address: e.target.value })} /></Field>
              <Field label="Typ">
                <select className="dispo-input" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
                  <option value="imap">IMAP (z. B. Thunderbird-Konto)</option>
                  <option value="gmail">Gmail API (OAuth, später)</option>
                  <option value="microsoft">Microsoft Graph (OAuth, später)</option>
                </select>
              </Field>
              <Field label="IMAP-Server"><input className="dispo-input" value={form.imap_host ?? ""} onChange={(e) => setForm({ ...form, imap_host: e.target.value })} /></Field>
              <Field label="IMAP-Port"><input className="dispo-input" type="number" value={form.imap_port ?? 993} onChange={(e) => setForm({ ...form, imap_port: Number(e.target.value) })} /></Field>
              <Field label="Benutzername"><input className="dispo-input" value={form.username ?? ""} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
              <Field label="SMTP-Server"><input className="dispo-input" value={form.smtp_host ?? ""} onChange={(e) => setForm({ ...form, smtp_host: e.target.value })} /></Field>
              <Field label="SMTP-Port"><input className="dispo-input" type="number" value={form.smtp_port ?? 587} onChange={(e) => setForm({ ...form, smtp_port: Number(e.target.value) })} /></Field>
              <Field label="Name des hinterlegten Zugangs-Secrets"><input className="dispo-input" value={form.secret_name ?? ""} onChange={(e) => setForm({ ...form, secret_name: e.target.value })} /></Field>
              <div className="md:col-span-3">
                <button className="dispo-btn dispo-btn-primary" onClick={save}>Speichern</button>
              </div>
            </div>
          )}
          <p className="p-4 text-xs dispo-muted">
            Passwörter und Tokens werden niemals in der Datenbank gespeichert. Hinterlegt wird nur der Name des sicher gespeicherten Zugangs.
            Der Abruf erfolgt serverseitig; Gmail- und Microsoft-Konten lassen sich später über OAuth ergänzen, ohne die Oberfläche zu ändern.
          </p>
        </Section>

        <Section title="Wichtige Regeln">
          <ul className="list-disc space-y-1 p-4 pl-8 text-sm">
            <li>Die KI legt ausschließlich Entwürfe an und bestätigt niemals selbstständig einen Auftrag.</li>
            <li>Antworten an Kunden werden nur vorbereitet und niemals automatisch versendet.</li>
            <li>Hinweise zu Lenk-, Pausen- und Ruhezeiten sind Prüfhinweise und keine rechtsverbindliche Bewertung.</li>
            <li>Zugriff ausschließlich für Administratoren und Disponenten; alle Änderungen sind nachvollziehbar protokolliert.</li>
          </ul>
        </Section>
      </div>
    </DispoLayout>
  );
}
