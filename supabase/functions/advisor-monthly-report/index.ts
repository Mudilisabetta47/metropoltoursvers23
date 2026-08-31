import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { requireStaff } from "../_shared/authz.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STOPWORDS = new Set([
  "und", "oder", "der", "die", "das", "ich", "ist", "ein", "eine", "mit", "für", "auf", "was",
  "wie", "wo", "wann", "gibt", "es", "habt", "ihr", "mir", "mich", "sie", "wir", "nach", "von",
  "zum", "zur", "den", "dem", "des", "auch", "noch", "mal", "kann", "möchte", "bitte", "eure",
  "einen", "einem", "aber", "nicht", "sind", "haben", "hat", "man", "the", "and", "you",
]);

function topTerms(texts: string[], limit = 20) {
  const counts = new Map<string, number>();
  for (const t of texts) {
    for (const raw of t.toLowerCase().split(/[^a-zäöüß0-9]+/)) {
      if (raw.length < 4 || STOPWORDS.has(raw)) continue;
      counts.set(raw, (counts.get(raw) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // --- AuthZ: nur Mitarbeitende (admin/office) ---
    const auth = await requireStaff(req, db, ["admin", "office"]);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const now = new Date();
    // default: previous month
    const ref = body.month ? new Date(`${body.month}-01T00:00:00Z`) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const periodStart = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
    const periodEnd = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0));
    const startIso = periodStart.toISOString();
    const endIso = new Date(periodEnd.getTime() + 86_400_000).toISOString();

    const { data: sessions } = await db
      .from("advisor_chat_sessions")
      .select("session_id, started_at, message_count, is_flagged, flag_reason")
      .gte("started_at", startIso)
      .lt("started_at", endIso);

    const { data: messages } = await db
      .from("advisor_chat_messages")
      .select("session_id, role, content, created_at")
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .order("created_at");

    const { data: secEvents } = await db
      .from("advisor_security_events")
      .select("event_type, severity")
      .gte("created_at", startIso)
      .lt("created_at", endIso);

    const msgs = messages ?? [];
    const userMsgs = msgs.filter((m) => m.role === "user");
    const assistantMsgs = msgs.filter((m) => m.role === "assistant");

    // Sessions that ended right after a user message (possible drop-off)
    const bySession = new Map<string, typeof msgs>();
    for (const m of msgs) {
      const arr = bySession.get(m.session_id) ?? [];
      arr.push(m);
      bySession.set(m.session_id, arr);
    }
    let dropOffs = 0;
    let singleTurn = 0;
    for (const [, arr] of bySession) {
      if (arr[arr.length - 1]?.role === "user") dropOffs++;
      if (arr.filter((m) => m.role === "user").length === 1) singleTurn++;
    }

    const unanswered = assistantMsgs.filter((m) =>
      /(kann ich (dir )?(leider )?nicht|keine (passenden|informationen)|weiß ich nicht|nicht verfügbar|kundenservice)/i.test(m.content)
    ).length;

    const stats = {
      total_sessions: sessions?.length ?? 0,
      total_messages: msgs.length,
      user_messages: userMsgs.length,
      assistant_messages: assistantMsgs.length,
      avg_messages_per_session: bySession.size ? +(msgs.length / bySession.size).toFixed(1) : 0,
      drop_off_sessions: dropOffs,
      single_turn_sessions: singleTurn,
      unanswered_responses: unanswered,
      flagged_sessions: (sessions ?? []).filter((s) => s.is_flagged).length,
      security_events: secEvents?.length ?? 0,
      critical_security_events: (secEvents ?? []).filter((e) => e.severity === "critical").length,
      top_terms: topTerms(userMsgs.map((m) => m.content)),
    };

    // AI-generated qualitative report
    let reportMarkdown = "";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY && userMsgs.length > 0) {
      const sample = userMsgs.slice(0, 300).map((m) => `- ${m.content.slice(0, 300)}`).join("\n");
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "Du bist Analyst für METROPOL TOURS. Erstelle einen kompakten, deutschen Monatsbericht in Markdown mit den Abschnitten: " +
                "## Zusammenfassung, ## Häufige Fragen, ## Erkannte Probleme & Abbruchstellen, ## Fehlende Antworten der KI, " +
                "## Beliebte Reiseziele & Suchanfragen, ## Verbesserungsvorschläge. Sei konkret und handlungsorientiert.",
            },
            {
              role: "user",
              content:
                `Zeitraum: ${startIso.slice(0, 10)} bis ${periodEnd.toISOString().slice(0, 10)}\n\n` +
                `Kennzahlen: ${JSON.stringify(stats)}\n\nKundenfragen:\n${sample}`,
            },
          ],
          max_tokens: 1800,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        reportMarkdown = json.choices?.[0]?.message?.content ?? "";
      } else {
        console.error("AI report failed:", res.status, await res.text());
      }
    }

    if (!reportMarkdown) {
      reportMarkdown = `## Zusammenfassung\n\nIm Zeitraum wurden ${stats.total_sessions} Chats mit insgesamt ${stats.total_messages} Nachrichten geführt. Für eine qualitative Auswertung liegen zu wenige Daten vor.`;
    }

    const { data: saved, error } = await db
      .from("advisor_monthly_reports")
      .upsert(
        {
          period_start: startIso.slice(0, 10),
          period_end: periodEnd.toISOString().slice(0, 10),
          total_sessions: stats.total_sessions,
          total_messages: stats.total_messages,
          stats,
          report_markdown: reportMarkdown,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "period_start,period_end" },
      )
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, report: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("monthly report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
