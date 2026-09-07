// Dispo-Cockpit KI: erkennt Busanfragen in E-Mails, erstellt Antwortentwürfe
// und beantwortet Disponenten-Fragen. Die KI bestätigt niemals Aufträge
// und versendet niemals selbstständig E-Mails.
import { adminClient, requireStaff } from "../_shared/authz.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function callAi(messages: unknown[], apiKey: string) {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({ model: MODEL, messages, stream: false }),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false as const, status: res.status, error: text };
  }
  const data = await res.json();
  return { ok: true as const, content: data?.choices?.[0]?.message?.content ?? "" };
}

function extractJson(raw: string): Record<string, unknown> {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try {
    return JSON.parse(match[0]);
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = adminClient();
    const auth = await requireStaff(req, admin, ["admin", "office"]);
    if (!auth.ok) return json({ error: auth.error }, auth.status);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI nicht konfiguriert" }, 500);

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    // Lernbeispiele aus der eigenen Trainingsdatenbank laden (few-shot).
    const loadExamples = async () => {
      const pick = async (isInquiry: boolean) => {
        const { data } = await admin
          .from("dispo_ai_examples")
          .select("subject, body_text, from_email, is_inquiry, extracted")
          .eq("use_for_training", true)
          .eq("is_inquiry", isInquiry)
          .order("created_at", { ascending: false })
          .limit(8);
        return data ?? [];
      };
      const [pos, neg] = await Promise.all([pick(true), pick(false)]);
      return [...pos, ...neg];
    };

    const exampleMessages = (examples: any[]) =>
      examples.flatMap((ex) => [
        {
          role: "user",
          content: `Absender: ${ex.from_email ?? ""}\nBetreff: ${ex.subject ?? ""}\n\n${String(ex.body_text ?? "").slice(0, 2500)}`,
        },
        {
          role: "assistant",
          content: JSON.stringify({ is_inquiry: ex.is_inquiry, confidence: 1, ...(ex.extracted ?? {}) }),
        },
      ]);

    if (action === "parse_email") {
      const { data: mail } = await admin
        .from("dispo_emails")
        .select("*")
        .eq("id", body.email_id)
        .maybeSingle();
      if (!mail) return json({ error: "E-Mail nicht gefunden" }, 404);

      const examples = await loadExamples();

      const result = await callAi(
        [
          {
            role: "system",
            content:
              "Du analysierst E-Mails eines deutschen Reisebusunternehmens. Erkenne, ob es sich um eine Busanfrage handelt. " +
              "Antworte ausschließlich mit JSON in diesem Format: " +
              '{"is_inquiry":boolean,"confidence":0-1,"customer_name":string,"company":string,"email":string,"phone":string,' +
              '"departure_date":"YYYY-MM-DD","departure_time":"HH:MM","origin":string,"destination":string,' +
              '"return_date":"YYYY-MM-DD","return_time":"HH:MM","passengers":number,"waypoints":[string],' +
              '"requirements":string,"luggage":string,"vehicle_wishes":string}. ' +
              "Unbekannte Felder als leeren String oder 0. Keine Erklärungen, kein Fließtext. " +
              (examples.length
                ? `Orientiere dich an den ${examples.length} vom Disponenten geprüften Beispielen in diesem Verlauf.`
                : ""),
          },
          ...exampleMessages(examples),
          {
            role: "user",
            content: `Absender: ${mail.from_name ?? ""} <${mail.from_email ?? ""}>\nBetreff: ${mail.subject ?? ""}\n\n${mail.body_text ?? ""}`,
          },
        ],
        apiKey,
      );

      if (!result.ok) return json({ error: "KI-Fehler", detail: result.error }, result.status);

      const parsed = extractJson(result.content);
      const isInquiry = Boolean(parsed.is_inquiry);
      const extracted = { ...parsed };
      delete (extracted as Record<string, unknown>).is_inquiry;
      delete (extracted as Record<string, unknown>).confidence;

      await admin
        .from("dispo_emails")
        .update({
          is_inquiry: isInquiry,
          ai_status: isInquiry ? "anfrage_erkannt" : "keine_anfrage",
          ai_confidence: Number(parsed.confidence ?? 0),
          extracted,
          folder: isInquiry ? "anfragen" : mail.folder,
        })
        .eq("id", mail.id);

      return json({ is_inquiry: isInquiry, extracted });
    }

    if (action === "draft_reply") {
      const { data: mail } = await admin
        .from("dispo_emails")
        .select("*")
        .eq("id", body.email_id)
        .maybeSingle();
      if (!mail) return json({ error: "E-Mail nicht gefunden" }, 404);

      const result = await callAi(
        [
          {
            role: "system",
            content:
              "Du schreibst höfliche, professionelle deutsche Antwortentwürfe für die Disposition der METROPOL TOURS GmbH. " +
              "Der Entwurf wird niemals automatisch versendet und enthält keine verbindliche Zusage. " +
              "Nenne keine Preise, wenn keine Kalkulation mitgeliefert wurde. Signatur: METROPOL TOURS GmbH, Telefon +49 511 80781106, kundenservice@metours.de.",
          },
          {
            role: "user",
            content: `Kundenanfrage:\nBetreff: ${mail.subject ?? ""}\n${mail.body_text ?? ""}\n\nExtrahierte Daten: ${JSON.stringify(mail.extracted ?? {})}`,
          },
        ],
        apiKey,
      );
      if (!result.ok) return json({ error: "KI-Fehler", detail: result.error }, result.status);
      return json({ reply: result.content });
    }

    if (action === "assistant") {
      const history = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
      const result = await callAi(
        [
          {
            role: "system",
            content:
              "Du bist der Dispositions-Assistent der METROPOL TOURS GmbH (Reisebusunternehmen). Antworte kurz, präzise und auf Deutsch, gern in Markdown-Listen. " +
              "Berücksichtige bei Fahrten Lenkzeiten, Pausen, Ruhezeiten, Fahrerwechsel, Einsatzdauer, Fahrzeugkapazität und Gepäckkapazität. " +
              "Rechtliche Aussagen sind immer nur Prüfhinweise, niemals verbindlich – weise darauf hin. " +
              "Bestätige niemals einen Auftrag und versende niemals E-Mails; du erstellst höchstens Entwürfe.\n\n" +
              `Aktuelle Dispositionsdaten (JSON): ${JSON.stringify(body.context ?? {})}`,
          },
          ...history.map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        ],
        apiKey,
      );
      if (!result.ok) {
        const msg = result.status === 429
          ? "Zu viele Anfragen – bitte kurz warten."
          : result.status === 402
            ? "KI-Guthaben aufgebraucht. Bitte im Lovable-Workspace aufladen."
            : "Die KI ist momentan nicht erreichbar.";
        return json({ error: msg, detail: result.error }, result.status);
      }
      return json({ reply: result.content });
    }

    return json({ error: "Unbekannte Aktion" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
