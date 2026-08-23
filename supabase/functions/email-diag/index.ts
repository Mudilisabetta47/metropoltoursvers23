import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const key = Deno.env.get('RESEND_API_KEY')!
  const url = new URL(req.url)
  const from = url.searchParams.get('from') ?? 'METROPOL TOURS <booking@app.metours.de>'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: ['delivered@resend.dev'], subject: 'diag', html: '<p>diag</p>' }),
  })
  return new Response(JSON.stringify({ status: res.status, body: await res.text(), from }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
