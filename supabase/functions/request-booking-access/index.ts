import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { sendMail, FROM_SERVICE } from "../_shared/mailer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_URL = "https://app.metours.de";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rate = new Map<string, { count: number; resetAt: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const rec = rate.get(ip);
  if (!rec || now > rec.resetAt) {
    rate.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  rec.count += 1;
  return rec.count > 5;
}

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (limited(ip)) return json({ error: "Zu viele Anfragen. Bitte kurz warten." }, 429);

    const { email } = await req.json().catch(() => ({}));
    if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
      return json({ error: "Bitte eine gültige E-Mail-Adresse angeben." }, 400);
    }
    const normalized = email.toLowerCase().trim();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: bookings } = await admin
      .from("tour_bookings")
      .select("id")
      .ilike("contact_email", normalized)
      .limit(1);

    // Immer die gleiche Antwort – kein Rückschluss darauf, ob die Adresse existiert.
    if (bookings && bookings.length > 0) {
      const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await admin.from("booking_access_tokens").insert({
        email: normalized,
        token,
        expires_at: expiresAt,
      });

      const link = `${APP_URL}/meine-buchungen?token=${token}`;
      await sendMail(admin, {
        from: FROM_SERVICE,
        to: normalized,
        subject: "Ihre Buchungsübersicht bei METROPOL TOURS",
        template: "booking_access_link",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
            <div style="background:#00CC36;padding:22px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:20px;">METROPOL TOURS</h1>
            </div>
            <div style="padding:26px;color:#333;line-height:1.6;">
              <h2 style="font-size:19px;margin:0 0 12px;">Ihre Buchungen im Überblick</h2>
              <p>Über den folgenden Link sehen Sie alle Buchungen zu dieser E-Mail-Adresse – inklusive Buchungsnummer, Status und Rechnungsdownload.</p>
              <p style="text-align:center;margin:26px 0;">
                <a href="${link}" style="background:#00CC36;color:#fff;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">Meine Buchungen öffnen</a>
              </p>
              <p style="font-size:13px;color:#777;">Der Link ist 60 Minuten gültig. Falls Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.</p>
              <p style="font-size:12px;color:#999;">Fragen? <a href="mailto:kundenservice@app.metours.de" style="color:#00CC36;">kundenservice@app.metours.de</a></p>
            </div>
          </div>`,
      });
    }

    return json({ success: true, message: "Falls Buchungen vorliegen, haben wir Ihnen einen Zugangslink geschickt." });
  } catch (error: any) {
    console.error("request-booking-access error", error);
    return json({ error: "Anfrage fehlgeschlagen" }, 500);
  }
});
