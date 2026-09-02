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
const OUTBOUND_TRIP_ID = "49b5f151-d957-42fc-9596-75fb42d2f9db";

// Zustiegszeiten Hinfahrt 03.09.2026 (München in der Nacht auf 04.09.)
const BOARDING_TIMES: Record<string, string> = {
  "hamburg": "03.09.2026, 16:00 Uhr – Hamburg ZOB",
  "bremen": "03.09.2026, 18:15 Uhr – Bremen ZOB, Steig 5",
  "hannover": "03.09.2026, 20:00 Uhr – Hannover ZOB",
  "münchen": "04.09.2026, 04:30 Uhr – München ZOB",
};
const boardingInfo = (city: string) => {
  const c = (city || "").toLowerCase();
  for (const k of Object.keys(BOARDING_TIMES)) if (c.includes(k)) return BOARDING_TIMES[k];
  return "03.09.2026 – Abfahrt an Ihrem Zustiegsort";
};

interface TicketInfo {
  firstName: string;
  bookingNumber: string;
  ticketNumber: string;
  seat: string;
  route: string;
  boarding: string;
  origin: string;
  destination: string;
  walletUrl?: string | null;
}

const buildContent = (t: TicketInfo) => {
  const rows: [string, string][] = [
    ["Buchungsnummer", t.bookingNumber || "—"],
    ["Ticketnummer", t.ticketNumber || "—"],
    ["Fahrt", t.route],
    ["Ihr Zustieg (Hinfahrt)", t.boarding],
    ["Rückfahrt", "10.09.2026 – Ankunft zurück in Deutschland"],
    ["Sitzplatz", t.seat],
  ];

  return `
  <h1 style="margin:0 0 10px;font-size:22px;color:#0f1218;">Korrektur & Ihr gültiges Ticket</h1>
  <p style="margin:0 0 14px;">Guten Tag${t.firstName ? ` ${escapeHtmlBrand(t.firstName)}` : ""},</p>
  <p style="margin:0 0 14px;">bitte <strong>ignorieren Sie die zuvor erhaltene Ticket-E-Mail</strong> –
  dort waren Fahrtrichtung und Datum leider falsch angegeben.</p>
  <p style="margin:0 0 18px;">Es gilt: <strong>Hinfahrt ${escapeHtmlBrand(t.origin)} → ${escapeHtmlBrand(t.destination)} am 03.09.2026</strong> (Zustieg siehe unten)
  und <strong>Rückfahrt am 10.09.2026</strong> zurück nach Deutschland. Ihr gültiges Ticket
  (Hin- und Rückfahrt) finden Sie direkt in dieser E-Mail – auch als Apple-Wallet-Pass mit der richtigen Fahrtrichtung.</p>

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
      .select("id, booking_number, ticket_number, passenger_email, passenger_first_name, seats(seat_number), origin_stop:stops!bookings_origin_stop_id_fkey(name, city), destination_stop:stops!bookings_destination_stop_id_fkey(name, city), trips(title, routes(name, description))")
      .eq("trip_id", OUTBOUND_TRIP_ID)
      .gte("booking_number", "MT-2026-001030")
      .lte("booking_number", "MT-2026-001058")
      .order("booking_number");
    if (testEmail) query = query.eq("passenger_email", testEmail).limit(1);
    const { data: bookings, error } = await query;
    if (error) return json({ error: error.message }, 500);

    const results: { booking: string; email: string; ok: boolean; err: string | null }[] = [];
    for (const b of bookings ?? []) {
      const trip: any = (b as any).trips ?? {};
      const route = trip?.routes?.description || trip?.routes?.name || trip?.title || "Kroatien – Novalja";
      const origin: any = (b as any).origin_stop ?? {};
      const dest: any = (b as any).destination_stop ?? {};
      const originLabel = origin.city || origin.name || "Zustiegsort";
      const destLabel = dest.city || dest.name || "Novalja (Kroatien)";
      const ticketNumber = b.ticket_number ?? b.booking_number ?? "";
      let walletUrl: string | null = null;
      try {
        walletUrl = await ensureWalletUrl(admin, b.id, ticketNumber);
      } catch { /* optional */ }

      const html = emailLayout({
        title: "Korrektur & Ihr gültiges Ticket",
        preheader: "Korrektur: Hinreise 03.09. / Rückreise 10.09.2026 – inkl. gültigem Ticket",
        subtitle: "Korrektur & Ticket",
        content: buildContent({
          firstName: b.passenger_first_name ?? "",
          bookingNumber: b.booking_number ?? "",
          ticketNumber,
          seat: (b as any).seats?.seat_number ? `Platz ${(b as any).seats.seat_number}` : "wird zugewiesen",
          route: `${originLabel} → ${destLabel}`,
          boarding: boardingInfo(origin.city || origin.name || ""),
          origin: originLabel,
          destination: destLabel,
          walletUrl,
        }),
      });

      const r = await sendMail(admin, {
        from: FROM_SERVICE,
        to: b.passenger_email,
        bcc: ["kundenservice@metours.de"],
        subject: "Korrektur: Ihr Ticket Hinfahrt 03.09. / Rückfahrt 10.09.2026 – METROPOL TOURS",
        html,
        template: "return-trip-correction",
        priority: "high",
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
