// EINMALIGE Korrektur-Mail Rückfahrt Kroatien 10.09.2026 – danach Funktion wieder löschen.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { sendMail, FROM_SERVICE } from "../_shared/mailer.ts";
import { emailLayout, qrTicketBlock, escapeHtmlBrand } from "../_shared/email-brand.ts";
import { ensureWalletUrl } from "../_shared/wallet-link.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TRACKING_URL = "https://www.metours.de/verfolge/MT-2026-QT89W8";

interface TicketInfo {
  firstName: string;
  bookingNumber: string;
  ticketNumber: string;
  seat: string;
  route: string;
  walletUrl?: string | null;
}

const buildContent = (t: TicketInfo) => {
  const rows: [string, string][] = [
    ["Buchungsnummer", t.bookingNumber || "—"],
    ["Ticketnummer", t.ticketNumber || "—"],
    ["Fahrt", t.route],
    ["Hinfahrt", "Donnerstag, 03.09.2026 – Abfahrt an Ihrem Zustiegsort (Hannover / Hamburg / München)"],
    ["Rückfahrt", "Donnerstag, 10.09.2026 – Ankunft zurück in Deutschland"],
    ["Sitzplatz", t.seat],
  ];

  return `
  <h1 style="margin:0 0 10px;font-size:22px;color:#0f1218;">Korrektur: Rückfahrt am 10.09.2026</h1>
  <p style="margin:0 0 14px;">Guten Tag${t.firstName ? ` ${escapeHtmlBrand(t.firstName)}` : ""},</p>
  <p style="margin:0 0 14px;">bitte <strong>ignorieren Sie die zuvor erhaltene Ticket-E-Mail</strong> für Ihre Rückfahrt –
  dort war das Rückfahrtdatum leider falsch angegeben (09.09.2026).</p>
  <p style="margin:0 0 18px;">Es gilt: Wir fahren am <strong>03.09.2026</strong> los und sind am
  <strong>10.09.2026 wieder zurück in Deutschland</strong>. Ihr korrigiertes Ticket finden Sie direkt in dieser E-Mail.</p>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8e4;border-radius:12px;overflow:hidden;">
    ${rows
      .map(
        ([k, v], i) =>
          `<tr style="background:${i % 2 ? "#ffffff" : "#f6faf7"};"><td style="padding:10px 14px;color:#5b6b60;font-size:13px;">${escapeHtmlBrand(k)}</td><td style="padding:10px 14px;font-weight:700;color:#0f1218;font-size:13px;">${escapeHtmlBrand(v)}</td></tr>`,
      )
      .join("")}
  </table>

  ${qrTicketBlock(t.ticketNumber || t.bookingNumber, "Dieses Ticket gilt für Hin- und Rückfahrt. Bitte beim Einstieg dem Fahrpersonal vorzeigen – der QR-Code wird direkt im Bus gescannt.", t.walletUrl ?? undefined)}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;">
    <tr><td style="background:#f6faf7;border:1px solid #d9e5dc;border-radius:12px;padding:18px;">
      <div style="font-size:14px;font-weight:700;color:#0f1218;margin-bottom:6px;">🚌 Live-Tracking Ihres Busses</div>
      <p style="margin:0 0 12px;font-size:13px;color:#5b6b60;">Verfolgen Sie den Bus während der gesamten Fahrt live auf der Karte – inklusive Position und voraussichtlicher Ankunft.</p>
      <a href="${TRACKING_URL}" style="display:inline-block;background:#00CC36;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:10px;">Bus live verfolgen</a>
      <div style="font-size:11px;color:#5b6b60;margin-top:10px;word-break:break-all;">${TRACKING_URL}</div>
    </td></tr>
  </table>

  <p style="margin:0 0 14px;font-size:14px;">Für Rückfragen erreichen Sie uns jederzeit unter
  <a href="mailto:kundenservice@metours.de" style="color:#1a5f2a;">kundenservice@metours.de</a>
  oder telefonisch unter <strong>+49 511 80781106</strong>.</p>
  <p style="margin:0;font-size:14px;">Wir bitten die Verwechslung zu entschuldigen.<br><br>
  Mit freundlichen Grüßen<br><strong>Ihr METROPOL TOURS Team</strong></p>`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    if (body?.token !== "CORR-2026-KROATIEN-x7Q9mT4p") return json({ error: "forbidden" }, 403);

    const testEmail = typeof body?.testEmail === "string" ? body.testEmail : null;

    let query = admin
      .from("bookings")
      .select("id, booking_number, ticket_number, passenger_email, passenger_first_name, seats(seat_number), trips(title, routes(name, description))")
      .gte("booking_number", "MT-2026-001101")
      .lte("booking_number", "MT-2026-001134")
      .order("booking_number");
    if (testEmail) query = query.eq("passenger_email", testEmail).limit(1);
    const { data: bookings, error } = await query;
    if (error) return json({ error: error.message }, 500);

    const results: { booking: string; email: string; ok: boolean; err: string | null }[] = [];
    for (const b of bookings ?? []) {
      const trip: any = (b as any).trips ?? {};
      const route = trip?.routes?.description || trip?.routes?.name || trip?.title || "Kroatien – Novalja";
      const ticketNumber = b.ticket_number ?? b.booking_number ?? "";
      let walletUrl: string | null = null;
      try {
        walletUrl = await ensureWalletUrl(admin, b.id, ticketNumber);
      } catch { /* optional */ }

      const html = emailLayout({
        title: "Korrektur Ihrer Rückfahrt",
        preheader: "Korrektur: Rückfahrt am 10.09.2026 – inkl. Ticket",
        subtitle: "Korrektur & Ticket",
        content: buildContent({
          firstName: b.passenger_first_name ?? "",
          bookingNumber: b.booking_number ?? "",
          ticketNumber,
          seat: (b as any).seats?.seat_number ? `Platz ${(b as any).seats.seat_number}` : "wird zugewiesen",
          route,
          walletUrl,
        }),
      });

      const r = await sendMail(admin, {
        from: FROM_SERVICE,
        to: b.passenger_email,
        bcc: ["kundenservice@metours.de"],
        subject: "Korrektur: Ihre Rückfahrt am 10.09.2026 – METROPOL TOURS",
        html,
        template: "return-trip-correction",
        bookingNumber: b.booking_number,
        bookingId: b.id,
      });
      results.push({ booking: b.booking_number, email: b.passenger_email, ok: r.ok, err: r.error });
    }

    return json({ sent: results.filter((r) => r.ok).length, total: results.length, results });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
