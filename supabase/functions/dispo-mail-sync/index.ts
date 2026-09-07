// Provider-unabhängiger E-Mail-Abruf für das Dispo-Cockpit.
// Aktuell implementiert: IMAP (Thunderbird-kompatibles Postfach).
// Gmail API und Microsoft Graph lassen sich später als weitere Provider
// ergänzen, ohne dass Oberfläche oder Datenmodell geändert werden müssen.
// Zugangsdaten werden ausschließlich als Secret gelesen, niemals gespeichert.
import { adminClient, requireStaff } from "../_shared/authz.ts";
import { ImapClient } from "https://deno.land/x/imap@v0.1.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface FetchedMail {
  message_id: string;
  from_name: string | null;
  from_email: string | null;
  to_email: string | null;
  subject: string | null;
  body_text: string;
  received_at: string;
}

async function fetchImap(account: Record<string, any>, password: string): Promise<FetchedMail[]> {
  const client = new ImapClient({
    host: account.imap_host,
    port: account.imap_port ?? 993,
    tls: account.imap_secure !== false,
    username: account.username ?? account.email_address,
    password,
  });
  await client.connect();
  await client.selectMailbox("INBOX");
  const since = new Date(Date.now() - 14 * 86400000);
  const uids: number[] = await client.search(["SINCE", since]);
  const recent = uids.slice(-40);
  const out: FetchedMail[] = [];
  for (const uid of recent) {
    const msg: any = await client.fetch(uid);
    out.push({
      message_id: String(msg?.messageId ?? `${account.id}-${uid}`),
      from_name: msg?.from?.name ?? null,
      from_email: msg?.from?.address ?? null,
      to_email: account.email_address,
      subject: msg?.subject ?? null,
      body_text: String(msg?.text ?? msg?.body ?? ""),
      received_at: msg?.date ? new Date(msg.date).toISOString() : new Date().toISOString(),
    });
  }
  await client.close();
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = adminClient();
  const auth = await requireStaff(req, admin, ["admin", "office"]);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const { data: accounts } = await admin.from("dispo_email_accounts").select("*").eq("is_active", true);
  if (!accounts?.length) {
    return json({ imported: 0, message: "Kein aktives Postfach hinterlegt. Bitte in den Einstellungen anlegen." });
  }

  let imported = 0;
  const problems: string[] = [];

  for (const account of accounts) {
    try {
      if (account.provider !== "imap") {
        problems.push(`${account.email_address}: Provider ${account.provider} ist noch nicht angebunden.`);
        await admin.from("dispo_email_accounts")
          .update({ last_sync_at: new Date().toISOString(), last_sync_status: "provider_offen" })
          .eq("id", account.id);
        continue;
      }
      const password = Deno.env.get(account.secret_name ?? "");
      if (!password) {
        problems.push(`${account.email_address}: Zugangsdaten (${account.secret_name}) sind nicht hinterlegt.`);
        await admin.from("dispo_email_accounts")
          .update({ last_sync_at: new Date().toISOString(), last_sync_status: "zugang_fehlt" })
          .eq("id", account.id);
        continue;
      }

      const mails = await fetchImap(account, password);
      for (const m of mails) {
        const { data: exists } = await admin
          .from("dispo_emails")
          .select("id")
          .eq("message_id", m.message_id)
          .maybeSingle();
        if (exists) continue;
        const { error } = await admin.from("dispo_emails").insert({
          account_id: account.id,
          message_id: m.message_id,
          folder: "inbox",
          direction: "eingehend",
          from_name: m.from_name,
          from_email: m.from_email,
          to_email: m.to_email,
          subject: m.subject,
          body_text: m.body_text,
          received_at: m.received_at,
        });
        if (!error) imported++;
      }

      await admin.from("dispo_email_accounts")
        .update({ last_sync_at: new Date().toISOString(), last_sync_status: "ok" })
        .eq("id", account.id);
    } catch (e) {
      problems.push(`${account.email_address}: ${(e as Error).message}`);
      await admin.from("dispo_email_accounts")
        .update({ last_sync_at: new Date().toISOString(), last_sync_status: "fehler" })
        .eq("id", account.id);
    }
  }

  return json({ imported, problems });
});
