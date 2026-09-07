// Provider-unabhängiger E-Mail-Abruf für das Dispo-Cockpit.
// Implementiert: IMAP über TLS (Thunderbird-kompatibles Postfach), ohne externe Bibliothek.
// Gmail API und Microsoft Graph können später als weitere Provider ergänzt werden,
// ohne Oberfläche oder Datenmodell zu ändern.
// Zugangsdaten werden ausschließlich als Secret gelesen und niemals gespeichert.
import { adminClient, requireStaff } from "../_shared/authz.ts";

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
  uid: string;
  from_name: string | null;
  from_email: string | null;
  subject: string | null;
  body_text: string;
  received_at: string;
}

/** Minimaler IMAP-Client: LOGIN, SELECT INBOX, SEARCH, FETCH. */
class SimpleImap {
  private conn!: Deno.TlsConn;
  private buffer = "";
  private counter = 0;
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();

  constructor(private host: string, private port: number) {}

  async connect() {
    this.conn = await Deno.connectTls({ hostname: this.host, port: this.port });
    await this.readUntil(() => this.buffer.includes("\r\n"));
    this.buffer = "";
  }

  private async readChunk() {
    const buf = new Uint8Array(65536);
    const n = await this.conn.read(buf);
    if (n === null) throw new Error("IMAP-Verbindung beendet");
    this.buffer += this.decoder.decode(buf.subarray(0, n));
  }

  private async readUntil(done: () => boolean, limitMs = 20000) {
    const start = Date.now();
    while (!done()) {
      if (Date.now() - start > limitMs) throw new Error("IMAP-Zeitüberschreitung");
      await this.readChunk();
    }
  }

  async cmd(command: string): Promise<string> {
    const tag = `a${++this.counter}`;
    this.buffer = "";
    await this.conn.write(this.encoder.encode(`${tag} ${command}\r\n`));
    const re = new RegExp(`^${tag} (OK|NO|BAD)`, "m");
    await this.readUntil(() => re.test(this.buffer));
    const result = this.buffer;
    const match = result.match(re);
    if (match && match[1] !== "OK") throw new Error(`IMAP ${command.split(" ")[0]} fehlgeschlagen`);
    return result;
  }

  close() {
    try { this.conn.close(); } catch { /* ignore */ }
  }
}

function decodeHeader(value: string): string {
  return value
    .replace(/=\?[^?]+\?[Bb]\?([^?]+)\?=/g, (_m, b64) => {
      try { return new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))); } catch { return _m; }
    })
    .replace(/=\?[^?]+\?[Qq]\?([^?]+)\?=/g, (_m, q) =>
      q.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, (_x: string, h: string) => String.fromCharCode(parseInt(h, 16))))
    .trim();
}

function decodeBase64(data: string): Uint8Array {
  const clean = data.replace(/[^A-Za-z0-9+/=]/g, "");
  try { return Uint8Array.from(atob(clean), (c) => c.charCodeAt(0)); } catch { return new Uint8Array(); }
}

function decodeQuotedPrintable(data: string): Uint8Array {
  const text = data.replace(/=\r?\n/g, "");
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "=" && /[0-9A-Fa-f]{2}/.test(text.slice(i + 1, i + 3))) {
      out.push(parseInt(text.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      out.push(text.charCodeAt(i) & 0xff);
    }
  }
  return new Uint8Array(out);
}

function decodeBody(body: string, encoding: string, charset: string): string {
  const enc = encoding.toLowerCase();
  let bytes: Uint8Array;
  if (enc.includes("base64")) bytes = decodeBase64(body);
  else if (enc.includes("quoted-printable")) bytes = decodeQuotedPrintable(body);
  else return body;
  let cs = charset.toLowerCase().replace(/["']/g, "").trim() || "utf-8";
  if (cs === "us-ascii" || cs === "ascii") cs = "utf-8";
  try { return new TextDecoder(cs).decode(bytes); } catch { return new TextDecoder("utf-8").decode(bytes); }
}

const htmlToText = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(Number(d)));

interface MimePart { headers: string; body: string }

function splitHeaders(raw: string): MimePart {
  const idx = raw.search(/\r?\n\r?\n/);
  if (idx < 0) return { headers: raw, body: "" };
  const sep = raw.slice(idx).startsWith("\r\n\r\n") ? 4 : 2;
  return { headers: raw.slice(0, idx).replace(/\r?\n[ \t]+/g, " "), body: raw.slice(idx + sep) };
}

const headerValue = (headers: string, name: string) => {
  const m = headers.match(new RegExp(`^${name}:\\s*(.*)$`, "im"));
  return m ? m[1].trim() : "";
};

/** Läuft rekursiv durch MIME-Teile und liefert den besten lesbaren Text. */
function extractText(raw: string, depth = 0): string {
  if (depth > 6) return "";
  const { headers, body } = splitHeaders(raw);
  const ctype = headerValue(headers, "Content-Type") || "text/plain";
  const cte = headerValue(headers, "Content-Transfer-Encoding");
  const charset = ctype.match(/charset=([^;]+)/i)?.[1] ?? "utf-8";

  if (/^multipart\//i.test(ctype)) {
    const boundary = ctype.match(/boundary="?([^";]+)"?/i)?.[1];
    if (!boundary) return "";
    const parts = body.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(--)?\r?\n?`))
      .filter((p) => p && p.trim() && p !== "--");
    const texts = parts.map((p) => extractText(p, depth + 1)).filter(Boolean);
    const alternative = /alternative/i.test(ctype);
    if (alternative) {
      // Reiner Text bevorzugt, sonst der längste Teil.
      return texts.sort((a, b) => b.length - a.length)[0] ?? "";
    }
    return texts.join("\n\n");
  }

  if (/^text\/html/i.test(ctype)) return htmlToText(decodeBody(body, cte, charset));
  if (/^text\//i.test(ctype) || !ctype) return decodeBody(body, cte, charset);
  return "";
}

function parseMessage(raw: string, uid: string): FetchedMail {
  const { headers: headerBlock } = splitHeaders(raw);
  const header = (name: string) => decodeHeader(headerValue(headerBlock, name));
  const from = header("From");
  const emailMatch = from.match(/<([^>]+)>/) ?? from.match(/([^\s<>]+@[^\s<>]+)/);
  const nameMatch = from.replace(/<[^>]*>/, "").replace(/"/g, "").trim();
  const dateHeader = header("Date");
  const parsedDate = dateHeader ? new Date(dateHeader) : new Date();

  const text = extractText(raw)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 12000);

  return {
    uid,
    from_name: nameMatch || null,
    from_email: emailMatch ? emailMatch[1] : null,
    subject: header("Subject") || null,
    body_text: text,
    received_at: isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
  };
}


async function fetchImap(
  account: Record<string, any>,
  password: string,
  opts: { days: number; limit: number; known: Set<string> },
): Promise<{ mails: FetchedMail[]; total: number; remaining: number }> {
  const client = new SimpleImap(account.imap_host, account.imap_port ?? 993);
  await client.connect();
  try {
    const user = account.username || account.email_address;
    await client.cmd(`LOGIN "${user}" "${password.replace(/(["\\])/g, "\\$1")}"`);
    await client.cmd(`SELECT INBOX`);
    const since = new Date(Date.now() - opts.days * 86400000);
    const sinceStr = `${since.getDate()}-${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][since.getMonth()]}-${since.getFullYear()}`;
    const searchRes = await client.cmd(`UID SEARCH SINCE ${sinceStr}`);
    const uids = (searchRes.match(/^\* SEARCH([\d\s]*)/m)?.[1] ?? "").trim().split(/\s+/).filter(Boolean);
    // Nur noch nicht importierte Nachrichten holen – neueste zuerst.
    const missing = uids.filter((u) => !opts.known.has(u)).reverse();
    const batch = missing.slice(0, opts.limit);

    const mails: FetchedMail[] = [];
    for (const uid of batch) {
      const res = await client.cmd(`UID FETCH ${uid} (BODY.PEEK[]<0.60000>)`);
      const start = res.indexOf("\r\n");
      const raw = res.slice(start + 2);
      mails.push(parseMessage(raw, uid));
    }
    try { await client.cmd("LOGOUT"); } catch { /* ignore */ }
    return { mails, total: uids.length, remaining: Math.max(0, missing.length - batch.length) };
  } finally {
    client.close();
  }
}

/** Werbe-/Portalmails, die nicht in die Disposition gehören. */
const BLOCKED = ["busly"];
const isBlocked = (m: FetchedMail) => {
  const hay = `${m.from_email ?? ""} ${m.from_name ?? ""} ${m.subject ?? ""}`.toLowerCase();
  return BLOCKED.some((b) => hay.includes(b));
};


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = adminClient();
  const auth = await requireStaff(req, admin, ["admin", "office"]);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const body = await req.json().catch(() => ({}));
  const days = Math.min(Math.max(Number(body?.days) || 90, 1), 365);
  const limit = Math.min(Math.max(Number(body?.limit) || 40, 1), 60);

  const { data: accounts } = await admin.from("dispo_email_accounts").select("*").eq("is_active", true);
  if (!accounts?.length) {
    return json({ imported: 0, remaining: 0, problems: ["Kein aktives Postfach hinterlegt. Bitte in den Einstellungen anlegen."] });
  }

  let imported = 0;
  let skipped = 0;
  let remaining = 0;
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
      if (!account.imap_host) {
        problems.push(`${account.email_address}: IMAP-Server fehlt.`);
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

      const { data: knownRows } = await admin
        .from("dispo_emails")
        .select("message_uid")
        .eq("account_id", account.id)
        .limit(5000);
      const known = new Set((knownRows ?? []).map((r: any) => String(r.message_uid)));

      const result = await fetchImap(account, password, { days, limit, known });
      remaining += result.remaining;

      const rows = result.mails
        .filter((m) => {
          if (isBlocked(m)) { skipped++; return false; }
          return true;
        })
        .map((m) => ({
          account_id: account.id,
          message_uid: m.uid,
          folder: "inbox",
          direction: "incoming",
          from_name: m.from_name,
          from_email: m.from_email,
          to_email: account.email_address,
          subject: m.subject,
          body_text: m.body_text,
          received_at: m.received_at,
        }));

      if (rows.length) {
        const { error, count } = await admin
          .from("dispo_emails")
          .insert(rows, { count: "exact" });
        if (error) problems.push(`${account.email_address}: ${error.message}`);
        else imported += count ?? rows.length;
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

  return json({ imported, skipped, remaining, problems });
});

