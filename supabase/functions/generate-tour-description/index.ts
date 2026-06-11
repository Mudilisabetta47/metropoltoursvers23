import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // AuthN + AuthZ: only authenticated admin/office/agent users can use AI credits
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    const userId = claimsData?.claims?.sub;
    if (claimsErr || !userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await adminClient.from("user_roles").select("role").eq("user_id", userId);
    const isAuthorized = roles?.some((r: any) => ["admin", "office", "agent"].includes(r.role));
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const destination = String(body.destination || "").slice(0, 200);
    const location = String(body.location || "").slice(0, 200);
    const country = String(body.country || "").slice(0, 100);
    const category = String(body.category || "").slice(0, 100);
    const highlights = Array.isArray(body.highlights) ? body.highlights.slice(0, 20).map((h: any) => String(h).slice(0, 200)) : [];
    const duration_days = Number(body.duration_days) || 0;
    const type = ["short", "meta_description", "long"].includes(body.type) ? body.type : "long";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const highlightStr = (highlights || []).join(", ");

    let prompt = "";
    if (type === "short") {
      prompt = `Schreibe eine kurze, verkaufsfördernde Beschreibung (max. 180 Zeichen) für eine Busreise nach ${destination}, ${location} (${country}). Kategorie: ${category}. Highlights: ${highlightStr}. Dauer: ${duration_days} Tage. Nur den Text, keine Anführungszeichen.`;
    } else if (type === "meta_description") {
      prompt = `Schreibe eine SEO-optimierte Meta-Description (max. 155 Zeichen) für eine Busreise nach ${destination}, ${location} (${country}). Inkludiere einen Call-to-Action. Nur den Text.`;
    } else {
      prompt = `Schreibe eine ausführliche, ansprechende Reisebeschreibung (3-4 Absätze) für eine ${duration_days}-tägige Busreise nach ${destination}, ${location} (${country}).
Kategorie: ${category || "Pauschalreise"}.
Highlights: ${highlightStr || "Keine angegeben"}.

Die Beschreibung soll:
- Emotionen wecken und Lust auf die Reise machen
- Die wichtigsten Sehenswürdigkeiten und Erlebnisse beschreiben
- Praktische Vorteile der Busreise erwähnen (Komfort, kein Stress, Gemeinschaft)
- In einem professionellen aber einladenden Ton geschrieben sein

Nur den fertigen Text ohne Überschriften oder Formatierung.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Du bist ein erfahrener Reise-Texter für METROPOL TOURS, einen deutschen Busreiseanbieter. Schreibe auf Deutsch." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es in einer Minute erneut." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits aufgebraucht. Bitte Credits aufladen." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-tour-description error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
