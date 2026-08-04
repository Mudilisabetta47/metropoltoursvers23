// Forwards public form submissions to the configured inbox via Resend.
// Public function (no JWT) — called from contact / inquiry / newsletter / job forms.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const FROM = 'Metropol Tours <buchung@app.metours.de>';
const FALLBACK_TO = 'kundenservice@metours.de';
const ALWAYS_CC = ['info@metours.de'];

interface Payload {
  type: string; // 'contact' | 'group_inquiry' | 'tour_inquiry' | 'newsletter' | 'application' | ...
  subject: string;
  body: string;
  from_email?: string;
  from_name?: string;
  reply_to?: string;
  extra_cc?: string[];
}

// --- Rate limiting (per IP): max 5 Anfragen / 5 Minuten ---
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = rateLimitStore.get(ip);
  if (!rec || now > rec.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (rec.count >= RATE_LIMIT_MAX) return false;
  rec.count += 1;
  return true;
}

const EMAIL_RE = /^[^\s@<>",;]+@[^\s@<>",;]+\.[a-zA-Z]{2,}$/;
// CC nur an eigene Domains – verhindert Missbrauch als offener Mail-Relay
const CC_ALLOWED_DOMAINS = ['metours.de', 'app.metours.de'];
const isAllowedCc = (e: string) =>
  EMAIL_RE.test(e) && CC_ALLOWED_DOMAINS.some((d) => e.toLowerCase().endsWith(`@${d}`));
// Header-Injection in Subject/Reply-To verhindern
const sanitizeLine = (s: string, max: number) =>
  String(s ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');

    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('cf-connecting-ip') ||
      'unknown';
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ error: 'rate_limited' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '300' },
      });
    }

    const payload = (await req.json()) as Payload;
    if (!payload?.subject || !payload?.body) {
      return new Response(JSON.stringify({ error: 'subject and body required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Serverseitige Eingabevalidierung (Längen + Formate)
    payload.type = sanitizeLine(payload.type || 'contact', 40);
    payload.subject = sanitizeLine(payload.subject, 200);
    payload.from_name = payload.from_name ? sanitizeLine(payload.from_name, 120) : undefined;
    payload.body = String(payload.body).slice(0, 10000);
    if (payload.from_email && !EMAIL_RE.test(payload.from_email)) payload.from_email = undefined;
    if (payload.reply_to && !EMAIL_RE.test(payload.reply_to)) payload.reply_to = undefined;
    payload.extra_cc = (payload.extra_cc ?? []).filter(isAllowedCc).slice(0, 5);


    // Load recipient from app_settings.general.email (fallback constant)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    let to = FALLBACK_TO;
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('settings')
        .eq('section_key', 'general')
        .maybeSingle();
      const cfg = (data as any)?.settings?.email;
      if (typeof cfg === 'string' && cfg.includes('@')) to = cfg;
    } catch (_) { /* keep fallback */ }

    const html = `
      <div style="font-family:Arial,sans-serif;color:#111;line-height:1.55">
        <div style="background:#0f1218;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0">
          <strong style="color:#00CC36">METROPOL TOURS</strong> — Neue Anfrage
        </div>
        <div style="border:1px solid #eee;border-top:0;padding:20px;border-radius:0 0 8px 8px">
          <p style="margin:0 0 8px"><strong>Typ:</strong> ${escapeHtml(payload.type)}</p>
          ${payload.from_name ? `<p style="margin:0 0 4px"><strong>Von:</strong> ${escapeHtml(payload.from_name)}</p>` : ''}
          ${payload.from_email ? `<p style="margin:0 0 12px"><strong>E-Mail:</strong> ${escapeHtml(payload.from_email)}</p>` : ''}
          <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
          <pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;margin:0">${escapeHtml(payload.body)}</pre>
        </div>
        <p style="color:#888;font-size:12px;margin-top:12px">
          Automatisch weitergeleitet aus dem Metropol Tours Backend.
        </p>
      </div>`;

    const cc = Array.from(new Set([...ALWAYS_CC, ...(payload.extra_cc ?? [])])).filter(e => e && e !== to);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        cc,
        reply_to: payload.reply_to || payload.from_email || undefined,
        subject: `[${payload.type}] ${payload.subject}`,
        html,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('Resend error', res.status, data);
      return new Response(JSON.stringify({ error: 'send_failed', status: res.status, details: data }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: (data as any)?.id, to, cc }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('notify-inbox error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function escapeHtml(s: string) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
