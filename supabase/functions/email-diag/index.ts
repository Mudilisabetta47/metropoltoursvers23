// Diagnose-Endpunkt für den E-Mail-Versand – ausschließlich für Admins.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { requireStaff } from "../_shared/authz.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Nur freigegebene Absenderadressen – kein frei wählbarer From-Header.
const ALLOWED_FROM: Record<string, string> = {
  booking: "METROPOL TOURS <booking@app.metours.de>",
  service: "METROPOL TOURS <kundenservice@metours.de>",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const auth = await requireStaff(req, admin, ["admin"]);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const sender = ALLOWED_FROM[String(body.sender ?? "booking")] ?? ALLOWED_FROM.booking;

  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return json({ ok: false, error: "E-Mail-Dienst ist nicht konfiguriert." }, 500);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: sender, to: ["delivered@resend.dev"], subject: "diag", html: "<p>diag</p>" }),
  });

  const raw = await res.text();
  if (!res.ok) console.error(`email-diag failed [${res.status}]: ${raw}`);

  // Keine rohen Provider-Antworten an den Client zurückgeben.
  return json({ ok: res.ok, status: res.status, from: sender });
});
