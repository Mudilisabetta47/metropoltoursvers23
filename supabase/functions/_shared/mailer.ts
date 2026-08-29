// Zentraler Mailversand für METROPOL TOURS.
// WICHTIG: Nur die in Resend verifizierte Sender-Domain "app.metours.de" darf im From stehen.
// Antworten laufen über die Geschäftsadresse kundenservice@metours.de (Reply-To).

export const SENDER_DOMAIN = "app.metours.de";
export const FROM_BOOKING = `METROPOL TOURS GmbH <booking@${SENDER_DOMAIN}>`;
export const FROM_SERVICE = `METROPOL TOURS GmbH <kundenservice@${SENDER_DOMAIN}>`;
export const FROM_JOBS = `METROPOL TOURS GmbH – Personal <jobs@${SENDER_DOMAIN}>`;
export const FROM_SYSTEM = `METROPOL TOURS System <booking@${SENDER_DOMAIN}>`;
export const REPLY_TO = `kundenservice@metours.de`;

export interface MailAttachment {
  filename: string;
  content: string; // base64
  content_type?: string;
}

export interface SendMailOptions {
  from?: string;
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  reply_to?: string;
  subject: string;
  html: string;
  attachments?: MailAttachment[];
  /** Logging-Kontext */
  template: string;
  bookingNumber?: string | null;
  bookingId?: string | null;
  sentByUserId?: string | null;
  sentByEmail?: string | null;
  metadata?: Record<string, unknown>;
}

export interface SendMailResult {
  ok: boolean;
  messageId: string | null;
  status: number;
  error: string | null;
}

/** Sendet die E-Mail über Resend und protokolliert das Ergebnis in email_send_log. */
export async function sendMail(
  supabaseAdmin: any,
  opts: SendMailOptions,
): Promise<SendMailResult> {
  const key = Deno.env.get("RESEND_API_KEY");
  const recipients = Array.isArray(opts.to) ? opts.to : [opts.to];
  const from = opts.from ?? FROM_BOOKING;

  let result: SendMailResult = { ok: false, messageId: null, status: 0, error: null };

  if (!key) {
    result.error = "RESEND_API_KEY missing";
  } else {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: recipients,
          cc: opts.cc?.length ? opts.cc : undefined,
          bcc: opts.bcc?.length ? opts.bcc : undefined,
          reply_to: opts.reply_to ?? REPLY_TO,
          subject: opts.subject,
          html: opts.html,
          attachments: opts.attachments?.length ? opts.attachments : undefined,
        }),
      });
      const bodyText = await res.text();
      let parsed: any = {};
      try { parsed = JSON.parse(bodyText); } catch { /* ignore */ }
      result = {
        ok: res.ok && !!parsed?.id,
        messageId: parsed?.id ?? null,
        status: res.status,
        error: res.ok ? null : (parsed?.message ?? bodyText).toString().slice(0, 500),
      };
    } catch (e) {
      result.error = (e as Error).message;
    }
  }

  // Protokollierung (blockiert den Versand nie)
  try {
    await supabaseAdmin.from("email_send_log").insert({
      template_name: opts.template,
      recipient_email: recipients.join(", "),
      message_id: result.messageId,
      status: result.ok ? "sent" : "failed",
      error_message: result.error,
      metadata: {
        subject: opts.subject,
        from,
        cc: opts.cc ?? [],
        bcc: opts.bcc ?? [],
        booking_number: opts.bookingNumber ?? null,
        booking_id: opts.bookingId ?? null,
        sent_by_user_id: opts.sentByUserId ?? null,
        sent_by_email: opts.sentByEmail ?? null,
        attachments: opts.attachments?.map((a) => a.filename) ?? [],
        provider_status: result.status,
        ...(opts.metadata ?? {}),
      },
    });
  } catch (e) {
    console.error("email_send_log insert failed", e);
  }

  if (!result.ok) console.error("sendMail failed", opts.template, result);
  return result;
}
