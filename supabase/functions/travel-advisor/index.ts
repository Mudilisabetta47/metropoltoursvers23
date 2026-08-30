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

## UNBEKANNTE ZIELE / KEIN PASSENDES ANGEBOT (SEHR WICHTIG)
Wenn der Nutzer nach einem Ziel, Termin oder Wunsch fragt, den du in den AKTUELLEN ANGEBOTEN oben NICHT findest
(z. B. ein Land/Ort, den wir nicht anbieten, oder ein Zeitraum ohne Termin):
- Sage ehrlich, dass dafür aktuell kein Angebot in unserem System hinterlegt ist.
- Biete sofort an, dass unser Reiseteam sich persönlich meldet und ein individuelles Angebot erstellt.
- Frage aktiv und freundlich nach **E-Mail-Adresse UND Telefonnummer** (gerne zusätzlich Name), damit wir Kontakt aufnehmen können.
  Beispiel: „Für **[Ziel]** habe ich aktuell kein passendes Angebot hinterlegt. 😊 Unser Reiseteam erstellt Ihnen gerne ein individuelles Angebot – dürfte ich dafür Ihre **E-Mail-Adresse** und **Telefonnummer** haben?"
- Wenn der Nutzer Kontaktdaten nennt: bedanke dich, bestätige, dass sich das Team innerhalb von 24 Stunden (werktags) meldet,
  und nenne alternativ kundenservice@metours.de bzw. +49 511 80781106.
- Frage nie mehrfach hintereinander nach denselben Daten und dränge nicht, wenn der Nutzer ablehnt.

## Wichtige Regeln
- Nutze die AKTUELLEN ANGEBOTE oben für Preise und Termine – diese sind echte Live-Daten!
- Empfehle konkrete Reisen mit Preisen, wenn der Nutzer nach Zielen fragt
- Wenn keine passenden Angebote da sind, weise auf die Website hin
- Bei Buchungswunsch: Verweise auf die Reiseseite auf der Website oder empfehle Kontakt via E-Mail/Telefon
- Bleib immer beim Thema Reisen und METROPOL TOURS
- Wenn Plätze knapp sind (< 10), erzeuge sanfte Dringlichkeit`;
}

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "unknown";
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]{2,}/;
// Deutsche/internationale Telefonnummern, mind. 7 Ziffern
const PHONE_RE = /(?:\+\d{1,3}[\s./-]?)?(?:\(?\d{2,5}\)?[\s./-]?)?\d{3,}(?:[\s./-]?\d{2,})+/;
const NAME_RE = /(?:ich hei(?:ß|ss)e|mein name ist|name:)\s*([A-Za-zÄÖÜäöüß' -]{2,60})/i;

function extractContact(text: string): { email: string | null; phone: string | null; name: string | null } {
  const email = text.match(EMAIL_RE)?.[0]?.slice(0, 200) ?? null;

  let phone: string | null = null;
  // E-Mail aus dem Text entfernen, damit Zahlen darin nicht als Telefon erkannt werden
  const withoutEmail = email ? text.replace(email, " ") : text;
  const m = withoutEmail.match(PHONE_RE)?.[0] ?? null;
  if (m) {
    const digits = m.replace(/\D/g, "");
    if (digits.length >= 7 && digits.length <= 18) phone = m.trim().slice(0, 40);
  }

  const name = text.match(NAME_RE)?.[1]?.trim().slice(0, 120) ?? null;
  return { email, phone, name };
}

const SUSPICIOUS_PATTERNS = [
  /ignore (all )?(previous|prior) instructions/i,
  /system prompt/i,
  /<script[\s>]/i,
  /union\s+select/i,
  /drop\s+table/i,
  /\bapi[_-]?key\b/i,
  /service[_ -]?role/i,
];

async function logSecurityEvent(
  db: ReturnType<typeof createClient>,
  payload: {
    session_id: string | null;
    ip_address: string;
    user_agent: string | null;
    event_type: string;
    severity: "info" | "warning" | "critical";
    details?: Record<string, unknown>;
  },
) {
  const { error } = await db.from("advisor_security_events").insert({
    ...payload,
    details: payload.details ?? {},
  });
  if (error) console.error("security log failed:", error.message);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages } = body;
    const sessionId: string | null = typeof body.sessionId === "string" ? body.sessionId.slice(0, 120) : null;
    const pageUrl: string | null = typeof body.pageUrl === "string" ? body.pageUrl.slice(0, 500) : null;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ip = clientIp(req);
    const userAgent = req.headers.get("user-agent");
    const db = admin();
    const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
    const lastUserText: string = typeof lastUser?.content === "string" ? lastUser.content : "";

    // ---- Rate limiting / abuse detection (per session + IP) ----
    if (sessionId) {
      const since = new Date(Date.now() - 60_000).toISOString();
      const { count } = await db
        .from("advisor_chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId)
        .eq("role", "user")
        .gte("created_at", since);

      if ((count ?? 0) >= 15) {
        await db.from("advisor_chat_sessions")
          .update({ is_flagged: true, flag_reason: "Rate-Limit überschritten (>15 Nachrichten/Minute)" })
          .eq("session_id", sessionId);
        await logSecurityEvent(db, {
          session_id: sessionId,
          ip_address: ip,
          user_agent: userAgent,
          event_type: "rate_limit_exceeded",
          severity: "warning",
          details: { messages_last_minute: count },
        });
        return new Response(
          JSON.stringify({ error: "Zu viele Anfragen. Bitte kurz warten." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const matched = SUSPICIOUS_PATTERNS.filter((p) => p.test(lastUserText)).map((p) => p.source);
    if (matched.length > 0) {
      await logSecurityEvent(db, {
        session_id: sessionId,
        ip_address: ip,
        user_agent: userAgent,
        event_type: "suspicious_input",
        severity: "critical",
        details: { patterns: matched, excerpt: lastUserText.slice(0, 300) },
      });
      if (sessionId) {
        await db.from("advisor_chat_sessions")
          .update({ is_flagged: true, flag_reason: "Verdächtige Eingabe erkannt" })
          .eq("session_id", sessionId);
      }
    }

    // ---- Session + user message logging ----
    if (sessionId) {
      const { error: sessErr } = await db.from("advisor_chat_sessions").upsert(
        {
          session_id: sessionId,
          ip_address: ip,
          user_agent: userAgent,
          page_url: pageUrl,
          last_activity_at: new Date().toISOString(),
          message_count: messages.length,
        },
        { onConflict: "session_id" },
      );
      if (sessErr) console.error("session upsert failed:", sessErr.message);

      if (lastUserText) {
        const { error: msgErr } = await db.from("advisor_chat_messages").insert({
          session_id: sessionId,
          role: "user",
          content: lastUserText.slice(0, 8000),
        });
        if (msgErr) console.error("message insert failed:", msgErr.message);
      }
    }

    // ---- Kontaktdaten-Erfassung (Lead) ----
    // Wenn der Kunde im Chat E-Mail und/oder Telefonnummer hinterlässt, speichern wir das
    // als Lead, damit das Reiseteam bei nicht erkannten Zielen zurückrufen kann.
    try {
      const contact = extractContact(lastUserText);
      if (contact.email || contact.phone) {
        const wish = [...messages]
          .filter((m: any) => m.role === "user" && typeof m.content === "string")
          .map((m: any) => m.content as string)
          .slice(-6)
          .join("\n")
          .slice(0, 4000);

        let exists = false;
        if (sessionId) {
          const { data: prev } = await db
            .from("advisor_leads")
            .select("id, email, phone")
            .eq("session_id", sessionId)
            .order("created_at", { ascending: false })
            .limit(1);
          const p = prev?.[0];
          exists = !!p && p.email === (contact.email ?? null) && p.phone === (contact.phone ?? null);
          if (p && !exists) {
            await db.from("advisor_leads").update({
              email: contact.email ?? p.email,
              phone: contact.phone ?? p.phone,
              name: contact.name ?? undefined,
              request_text: wish,
            }).eq("id", p.id);
            exists = true;
          }
        }

        if (!exists) {
          const { error: leadErr } = await db.from("advisor_leads").insert({
            session_id: sessionId,
            email: contact.email,
            phone: contact.phone,
            name: contact.name,
            request_text: wish,
            reason: "unknown_destination",
            page_url: pageUrl,
          });
          if (leadErr) console.error("lead insert failed:", leadErr.message);
        }
      }
    } catch (e) {
      console.error("lead capture failed:", e);
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

    if (!response.body || !sessionId) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Tee the stream so we can persist the assistant answer for analysis
    const [clientStream, logStream] = response.body.tee();
    (async () => {
      let assistant = "";
      let buffer = "";
      const reader = logStream.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") continue;
            try {
              const parsed = JSON.parse(json);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) assistant += delta;
            } catch { /* partial chunk */ }
          }
        }
        if (assistant) {
          await db.from("advisor_chat_messages").insert({
            session_id: sessionId,
            role: "assistant",
            content: assistant.slice(0, 8000),
          });
        }
      } catch (e) {
        console.error("stream logging failed:", e);
      }
    })();

    return new Response(clientStream, {
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

