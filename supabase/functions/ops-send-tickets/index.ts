// Temporärer interner Helfer: ruft send-trip-ticket-email mit Service-Role auf.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-trip-ticket-email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return new Response(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
});
