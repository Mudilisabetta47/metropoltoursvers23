// Versand von E-Mails aus dem Backend durch Mitarbeitende (Kunden, Bewerber, allgemein).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendMail, FROM_BOOKING, FROM_JOBS, FROM_SERVICE, REPLY_TO } from "../_shared/mailer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_RE = /^[^\s@<>",;]+@[^\s@<>",;]+\.[a-zA-Z]{2,}$/;
const clean = (s: unknown, max: number) =>
  String(s ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
const escapeHtml = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

const SENDERS: Record<string, string> = {
  service: FROM_SERVICE,
  booking: FROM_BOOKING,
  jobs: FROM_JOBS,
};

function wrap(bodyText: string, signatureName?: string) {
  const paragraphs = escapeHtml(bodyText).split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;white-space:pre-wrap">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.6;max-width:640px;margin:0 auto">
    <div style="background:#0f1218;padding:18px 22px;border-radius:10px 10px 0 0">
      <span style="color:#00CC36;font-weight:700;letter-spacing:.5px">METROPOL TOURS</span>
    </div>
    <div style="border:1px solid #e8e8e8;border-top:0;padding:24px 22px;border-radius:0 0 10px 10px;background:#fff">
      ${paragraphs}
      <hr style="border:none;border-top:1px solid #eee;margin:22px 0"/>
      <p style="margin:0;font-size:12px;color:#666">
        ${signatureName ? `${escapeHtml(signatureName)}<br/>` : ""}
        METROPOL TOURS GmbH · Rudolf-Diesel-Weg 8 · 30419 Hannover<br/>
        Tel. +49 511 80781106 · ${REPLY_TO} · www.metours.de
      </p>
    </div>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // --- AuthZ: nur eingeloggte Mitarbeitende (admin/office/agent) ---
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "unauthorized" }, 401);
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "unauthorized" }, 401);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const allowed = !!roles?.some((r: any) => ["admin", "office", "agent"].includes(r.role));
    if (!allowed) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const to = clean(body.to, 160).toLowerCase();
    const subject = clean(body.subject, 200);
    const message = String(body.body ?? "").slice(0, 20000);
    const senderKey = ["service", "booking", "jobs"].includes(body.sender) ? body.sender : "service";
    const context = clean(body.context ?? "manual", 40);
    const bookingNumber = body.booking_number ? clean(body.booking_number, 40) : null;
    const bookingId = body.booking_id ? clean(body.booking_id, 40) : null;

    if (!EMAIL_RE.test(to)) return json({ error: "invalid_recipient" }, 400);
    if (!subject || !message) return json({ error: "subject_and_body_required" }, 400);

    const attachments = Array.isArray(body.attachments)
      ? body.attachments.slice(0, 5).map((a: any) => ({
          filename: clean(a.filename, 120) || "anhang.pdf",
          content: String(a.content ?? ""),
          content_type: a.content_type ? clean(a.content_type, 80) : undefined,
        })).filter((a: any) => a.content.length > 0 && a.content.length < 8_000_000)
      : [];

    const result = await sendMail(admin, {
      from: SENDERS[senderKey],
      to,
      subject,
      html: body.html_override ? String(body.html_override).slice(0, 100000) : wrap(message, clean(body.signature_name, 120)),
      attachments,
      template: `staff_${context}`,
      bookingNumber,
      bookingId,
      sentByUserId: user.id,
      sentByEmail: user.email ?? null,
    });

    if (!result.ok) {
      return json({ ok: false, error: result.error ?? "send_failed", status: result.status }, 502);
    }
    return json({ ok: true, message_id: result.messageId });
  } catch (e) {
    console.error("send-staff-email error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
