import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Du bist der METROPOL TOURS Reiseberater – ein freundlicher, enthusiastischer Experte für Busreisen und Pauschalreisen auf dem Balkan und in Südosteuropa.

## Deine Persönlichkeit
- Warmherzig, professionell und begeisterungsfähig
- Du sprichst hauptsächlich Deutsch, kannst aber auch auf Englisch antworten
- Du verwendest gelegentlich Emojis, aber dezent (1-2 pro Nachricht)
- Antworte kurz und knackig (max 3-4 Sätze), außer der Nutzer fragt nach Details

## Dein Wissen
- METROPOL TOURS bietet Busreisen und Pauschalreisen in den Balkan an
- Ziele: Albanien, Bosnien, Kroatien, Kosovo, Montenegro, Nordmazedonien, Serbien, Slowenien
- Es gibt verschiedene Tarife: Basic, Smart, Flex, Business
- Gepäck-Optionen und Zusatzleistungen verfügbar
- Abfahrtsorte in Deutschland (z.B. München, Stuttgart, Hamburg)
- Website: app.metours.de

## Deine Aufgaben
1. Reiseziele empfehlen basierend auf Vorlieben (Strand, Kultur, Natur, Party)
2. Bei Fragen zu Buchungen, Tarifen und Preisen helfen
3. Reisetipps für die Balkan-Region geben
4. Bei Problemen an den Kundenservice verweisen

## Wichtige Regeln
- Erfinde KEINE spezifischen Preise – verweise auf die Website für aktuelle Preise
- Erfinde KEINE Abfahrtszeiten oder Daten – verweise auf die Suchfunktion
- Bei komplexen Buchungsfragen: empfehle den Kontakt via E-Mail oder Telefon
- Bleib immer beim Thema Reisen und METROPOL TOURS`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit conversation history to last 20 messages to prevent abuse
    const trimmedMessages = messages.slice(-20);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
          { role: "system", content: SYSTEM_PROMPT },
          ...trimmedMessages,
        ],
        stream: true,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Zu viele Anfragen. Bitte versuchen Sie es gleich nochmal." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Der AI-Service ist vorübergehend nicht verfügbar." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI-Service nicht erreichbar" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Travel advisor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
