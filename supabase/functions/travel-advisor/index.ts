import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchCurrentOffers(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch active package tours with upcoming dates
  const { data: tours } = await supabase
    .from("package_tours")
    .select(`
      destination, country, location, price_from, duration_days, 
      description, short_description, highlights, included_services,
      category, discount_percent, is_featured,
      tour_dates(departure_date, return_date, price_basic, price_smart, price_flex, price_business, total_seats, booked_seats, status, early_bird_discount_percent, early_bird_deadline)
    `)
    .eq("is_active", true)
    .order("is_featured", { ascending: false });

  if (!tours || tours.length === 0) return "Aktuell keine Angebote in der Datenbank.";

  const now = new Date().toISOString().split("T")[0];

  const offerLines = tours.map((t: any) => {
    const upcomingDates = (t.tour_dates || [])
      .filter((d: any) => d.departure_date >= now && d.status === "available")
      .sort((a: any, b: any) => a.departure_date.localeCompare(b.departure_date));

    const dateInfo = upcomingDates.length > 0
      ? upcomingDates.map((d: any) => {
          const avail = d.total_seats - d.booked_seats;
          const earlyBird = d.early_bird_discount_percent && d.early_bird_deadline && d.early_bird_deadline >= now
            ? ` (Frühbucher: -${d.early_bird_discount_percent}% bis ${d.early_bird_deadline})`
            : "";
          return `  📅 ${d.departure_date} - ${d.return_date} | ab ${d.price_basic}€ (Basic)${d.price_smart ? `, ${d.price_smart}€ (Smart)` : ""}${d.price_flex ? `, ${d.price_flex}€ (Flex)` : ""}${d.price_business ? `, ${d.price_business}€ (Business)` : ""} | ${avail} Plätze frei${earlyBird}`;
        }).join("\n")
      : "  Keine kommenden Termine";

    const discount = t.discount_percent ? ` 🔥 ${t.discount_percent}% Rabatt!` : "";
    const featured = t.is_featured ? " ⭐ TOP-ANGEBOT" : "";
    const highlights = t.highlights?.length ? `  Highlights: ${t.highlights.join(", ")}` : "";
    const included = t.included_services?.length ? `  Inkl.: ${t.included_services.join(", ")}` : "";

    return `🗺️ ${t.destination} (${t.country}) – ${t.location}${featured}${discount}
  ${t.duration_days} Tage | ab ${t.price_from}€ p.P.
  ${t.short_description || ""}
${highlights}
${included}
${dateInfo}`;
  }).join("\n\n");

  return offerLines;
}

function buildSystemPrompt(offers: string): string {
  return `Du bist der METROPOL TOURS Reiseberater – ein freundlicher, enthusiastischer Experte für Busreisen und Pauschalreisen auf dem Balkan und in Südosteuropa.

## Deine Persönlichkeit
- Warmherzig, professionell und begeisterungsfähig
- Du sprichst hauptsächlich Deutsch, kannst aber auch auf Englisch antworten
- Du verwendest gelegentlich Emojis, aber dezent (1-2 pro Nachricht)
- Antworte kurz und knackig (max 3-4 Sätze), außer der Nutzer fragt nach Details

## Dein Wissen
- METROPOL TOURS bietet Busreisen und Pauschalreisen in den Balkan an
- Ziele: Albanien, Bosnien, Kroatien, Kosovo, Montenegro, Nordmazedonien, Serbien, Slowenien
- Es gibt verschiedene Tarife: Basic (nur Handgepäck), Smart (20kg Koffer), Flex (23kg Koffer), Business (Sitzplatzreservierung, Storno bis 1 Tag)
- Gepäck-Optionen und Zusatzleistungen verfügbar
- Abfahrtsorte in Deutschland (z.B. München, Stuttgart, Hamburg)
- Website: app.metours.de
- Bei allen Reisen sind Übernachtung und Frühstück inklusive

## AKTUELLE ANGEBOTE (LIVE-DATEN)
${offers}

## Deine Aufgaben
1. Reiseziele empfehlen basierend auf Vorlieben (Strand, Kultur, Natur, Party)
2. **AKTUELLE ANGEBOTE zeigen** – nutze die Live-Daten oben, um konkrete Reisen mit echten Preisen und Terminen zu empfehlen
3. Reisetipps für die Balkan-Region geben
4. Auf Frühbucher-Rabatte und Sonderangebote hinweisen wenn verfügbar
5. Verfügbarkeit prüfen: Wenn wenige Plätze frei sind, darauf hinweisen
6. Bei komplexen Buchungsfragen an den Kundenservice verweisen

## Wichtige Regeln
- Nutze die AKTUELLEN ANGEBOTE oben für Preise und Termine – diese sind echte Live-Daten!
- Empfehle konkrete Reisen mit Preisen, wenn der Nutzer nach Zielen fragt
- Wenn keine passenden Angebote da sind, weise auf die Website hin
- Bei Buchungswunsch: Verweise auf die Reiseseite auf der Website oder empfehle Kontakt via E-Mail/Telefon
- Bleib immer beim Thema Reisen und METROPOL TOURS
- Wenn Plätze knapp sind (< 10), erzeuge sanfte Dringlichkeit`;
}

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

    const trimmedMessages = messages.slice(-20);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch live offers from DB
    let offers: string;
    try {
      offers = await fetchCurrentOffers();
    } catch (e) {
      console.error("Failed to fetch offers:", e);
      offers = "Angebotsdaten konnten nicht geladen werden. Verweise auf die Website für aktuelle Preise.";
    }

    const systemPrompt = buildSystemPrompt(offers);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...trimmedMessages,
        ],
        stream: true,
        max_tokens: 800,
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
