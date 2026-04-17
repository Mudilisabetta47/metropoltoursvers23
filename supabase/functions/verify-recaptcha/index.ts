// Server-side reCAPTCHA v3 verification
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyResp {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

const MIN_SCORE = 0.5;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { token, action, minScore } = await req.json().catch(() => ({}));
    const secret = Deno.env.get('RECAPTCHA_SECRET_KEY');

    if (!secret) {
      return new Response(JSON.stringify({ success: false, error: 'Missing RECAPTCHA_SECRET_KEY' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!token || typeof token !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Missing token' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data: VerifyResp = await r.json();

    const threshold = typeof minScore === 'number' ? minScore : MIN_SCORE;
    const score = data.score ?? 0;
    const ok = data.success && score >= threshold && (!action || data.action === action);

    return new Response(JSON.stringify({
      success: ok,
      score,
      action: data.action,
      errorCodes: data['error-codes'] ?? [],
    }), {
      status: ok ? 200 : 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
