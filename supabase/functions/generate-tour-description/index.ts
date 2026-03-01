import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { destination, location, country, category, highlights, duration_days, type } = await req.json();
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
