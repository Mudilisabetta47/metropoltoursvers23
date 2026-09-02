// EINMALIGE Korrektur-Mail Rückfahrt Kroatien 10.09.2026 – danach Funktion wieder löschen.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { sendMail, FROM_SERVICE } from "../_shared/mailer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TRACKING_URL = "https://www.metours.de/verfolge/MT-2026-QT89W8";

const buildHtml = (firstName: string) => `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#0f1218;border-radius:12px 12px 0 0;padding:24px 28px;">
      <div style="color:#00CC36;font-size:20px;font-weight:bold;letter-spacing:1px;">METROPOL TOURS</div>
      <div style="color:#9aa4b2;font-size:12px;margin-top:4px;">Wichtige Korrektur zu Ihrer Reise</div>
    </div>
    <div style="background:#ffffff;padding:28px;border-radius:0 0 12px 12px;border:1px solid #e5e9ef;border-top:none;">
      <h1 style="font-size:20px;color:#0f1218;margin:0 0 16px;">Korrektur: Rückfahrt am 10.09.2026</h1>
      <p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 14px;">
        Guten Tag${firstName ? ` ${firstName}` : ""},
      </p>
      <p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 14px;">
        bitte <strong>ignorieren Sie die soeben erhaltene Ticket-E-Mail</strong> für Ihre Rückfahrt.
        In dieser E-Mail war das Rückfahrtdatum leider falsch angegeben (09.09.2026).
      </p>
      <div style="background:#f0fdf4;border:1px solid #00CC36;border-radius:8px;padding:16px 18px;margin:0 0 18px;">
        <div style="font-size:13px;font-weight:bold;color:#0f1218;margin-bottom:8px;">Ihre korrekten Reisedaten:</div>
        <div style="font-size:14px;color:#333;line-height:1.7;">
          <strong>Hinfahrt:</strong> 03.09.2026 – Abfahrt an Ihrem Zustiegsort (Hannover / Hamburg / München)<br>
          <strong>Rückfahrt:</strong> 10.09.2026 – Ankunft in Deutschland
        </div>
      </div>
      <p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 18px;">
        Ihre Buchung bleibt selbstverständlich bestehen. Sie erhalten Ihre korrigierten Tickets in Kürze.
      </p>
      <div style="background:#f4f6f8;border-radius:8px;padding:16px 18px;margin:0 0 18px;">
        <div style="font-size:13px;font-weight:bold;color:#0f1218;margin-bottom:6px;">🚌 Live-Tracking Ihres Busses</div>
        <p style="font-size:13px;color:#555;line-height:1.6;margin:0 0 10px;">
          Verfolgen Sie Ihren Bus während der gesamten Fahrt live auf der Karte – inklusive aktueller Position und Ankunftszeit:
        </p>
        <a href="${TRACKING_URL}" style="display:inline-block;background:#00CC36;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 22px;border-radius:8px;">Bus live verfolgen</a>
        <div style="font-size:12px;color:#888;margin-top:10px;word-break:break-all;">${TRACKING_URL}</div>
      </div>
      <p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 14px;">
        Für Rückfragen erreichen Sie uns jederzeit unter
        <a href="mailto:kundenservice@metours.de" style="color:#00a32e;">kundenservice@metours.de</a>
        oder telefonisch unter <strong>+49 511 80781106</strong>.
      </p>
      <p style="font-size:14px;color:#333;line-height:1.6;margin:0;">
        Wir bitten die Verwechslung zu entschuldigen.<br><br>
        Mit freundlichen Grüßen<br>
        <strong>Ihr METROPOL TOURS Team</strong>
      </p>
    </div>
    <div style="text-align:center;color:#9aa4b2;font-size:11px;padding:16px;">
      METROPOL TOURS GmbH · Hannover · kundenservice@metours.de
    </div>
  </div>
</body>
</html>`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    // Einmal-Token (nur dieser eine Aufruf, Funktion wird danach gelöscht)
    const body = await req.json().catch(() => ({}));
    if (body?.token !== "CORR-2026-KROATIEN-x7Q9mT4p") return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const testEmail = typeof body?.testEmail === "string" ? body.testEmail : null;

    let query = admin
      .from("bookings")
      .select("booking_number, passenger_email, passenger_first_name")
      .gte("booking_number", "MT-2026-001101")
      .lte("booking_number", "MT-2026-001134")
      .order("booking_number");
    if (testEmail) query = query.eq("passenger_email", testEmail).limit(1);
    const { data: bookings, error } = await query;
    if (error) return json({ error: error.message }, 500);

    const results: { booking: string; email: string; ok: boolean; err: string | null }[] = [];
    for (const b of bookings ?? []) {
      const r = await sendMail(admin, {
        from: FROM_SERVICE,
        to: b.passenger_email,
        bcc: ["kundenservice@metours.de"],
        subject: "Korrektur: Ihre Rückfahrt am 10.09.2026 – METROPOL TOURS",
        html: buildHtml(b.passenger_first_name ?? ""),
        template: "return-trip-correction",
        bookingNumber: b.booking_number,
      });
      results.push({ booking: b.booking_number, email: b.passenger_email, ok: r.ok, err: r.error });
    }

    return json({ sent: results.filter((r) => r.ok).length, total: results.length, results });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
