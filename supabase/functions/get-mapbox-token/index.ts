import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Öffentlich nutzbar (Karten auf der Website), aber auf eigene Origins beschränkt,
    // um Token-Missbrauch/Billing-Fraud zu verhindern.
    const origin = req.headers.get('Origin') || req.headers.get('Referer') || '';
    const allowed = [
      'metours.de',
      'lovable.app',
      'lovableproject.com',
      'localhost',
      '127.0.0.1',
    ];
    const hasApiKey = Boolean(req.headers.get('apikey') || req.headers.get('Authorization'));
    const originOk = origin === '' ? false : allowed.some((h) => {
      try {
        const host = new URL(origin).hostname;
        return host === h || host.endsWith(`.${h}`);
      } catch {
        return false;
      }
    });

    if (!hasApiKey || !originOk) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    if (!mapboxToken) {
      return new Response(
        JSON.stringify({ error: 'Mapbox token not configured', token: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ token: mapboxToken }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in get-mapbox-token:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
