// METOURS Copilot – aktiver KI-Assistent im Backend.
// Erhält User-JWT, prüft Rollen, ruft AI SDK mit Tools auf,
// protokolliert jede Tool-Ausführung in copilot_audit_log.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  tool,
  type UIMessage,
} from "npm:ai@5.0.11";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@1.0.4";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Role = "admin" | "office" | "agent" | "driver" | "customer";

function makeGateway(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI nicht konfiguriert" }, 500);

    const token = authHeader.replace("Bearer ", "");
    const authClient = createClient(SUPABASE_URL, ANON);
    const { data: claimsData, error: claimsErr } = await authClient.auth
      .getClaims(token);
    const userId = claimsData?.claims?.sub as string | undefined;
    const userEmail = claimsData?.claims?.email as string | undefined;
    if (claimsErr || !userId) return json({ error: "Unauthorized" }, 401);

    const adminClient = createClient(SUPABASE_URL, SERVICE);
    // User-scoped client für Datenzugriffe (RLS wirkt als zweite Schutzschicht)
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: roleRows } = await adminClient
      .from("user_roles").select("role").eq("user_id", userId);
    const roles: Role[] = (roleRows ?? []).map((r: any) => r.role);
    const isStaff = roles.some((r) => ["admin", "office", "agent", "driver"].includes(r));
    if (!isStaff) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const messages: UIMessage[] = body.messages ?? [];
    const conversationId: string | undefined = body.conversationId;

    async function audit(entry: {
      tool_name: string;
      input: unknown;
      output: unknown;
      status: "success" | "error" | "denied";
      error?: string;
      duration_ms: number;
    }) {
      try {
        await adminClient.from("copilot_audit_log").insert({
          user_id: userId,
          user_email: userEmail ?? null,
          conversation_id: conversationId ?? null,
          tool_name: entry.tool_name,
          input: entry.input as any,
          output: entry.output as any,
          status: entry.status,
          error: entry.error ?? null,
          duration_ms: entry.duration_ms,
        });
      } catch (e) {
        console.error("audit failed:", e);
      }
    }

    function requireRole(
      allowed: Role[],
      name: string,
    ): { ok: true } | { ok: false; message: string } {
      const has = roles.some((r) => allowed.includes(r));
      if (!has) {
        return {
          ok: false,
          message:
            `Keine Berechtigung für ${name}. Benötigt: ${allowed.join(", ")}.`,
        };
      }
      return { ok: true };
    }

    // Helfer: kleines Wrap für tool.execute mit Auth-Check + Audit
    function guarded<TInput>(opts: {
      name: string;
      allowed: Role[];
      run: (input: TInput) => Promise<unknown>;
    }) {
      return async (input: TInput) => {
        const t0 = Date.now();
        const check = requireRole(opts.allowed, opts.name);
        if (!check.ok) {
          await audit({
            tool_name: opts.name,
            input,
            output: null,
            status: "denied",
            error: check.message,
            duration_ms: Date.now() - t0,
          });
          return { error: check.message };
        }
        try {
          const output = await opts.run(input);
          await audit({
            tool_name: opts.name,
            input,
            output,
            status: "success",
            duration_ms: Date.now() - t0,
          });
          return output;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await audit({
            tool_name: opts.name,
            input,
            output: null,
            status: "error",
            error: msg,
            duration_ms: Date.now() - t0,
          });
          return { error: msg };
        }
      };
    }

    // ==== TOOLS ====
    const STAFF: Role[] = ["admin", "office", "agent", "driver"];
    const OFFICE: Role[] = ["admin", "office"];
    const AGENT_OFFICE: Role[] = ["admin", "office", "agent"];

    const tools = {
      search_bookings: tool({
        description:
          "Suche Bus-Buchungen. Filter nach Status (pending/confirmed/cancelled/completed), Kunden-E-Mail oder Zeitraum. Liefert maximal 25 Treffer.",
        inputSchema: z.object({
          status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
          email: z.string().optional(),
          from: z.string().optional().describe("ISO-Datum von"),
          to: z.string().optional().describe("ISO-Datum bis"),
          limit: z.number().int().min(1).max(25).optional(),
        }),
        execute: guarded({
          name: "search_bookings",
          allowed: AGENT_OFFICE,
          run: async (i) => {
            let q = userClient.from("bookings").select(
              "id, ticket_number, status, passenger_first_name, passenger_last_name, passenger_email, price_paid, created_at",
            ).order("created_at", { ascending: false }).limit(i.limit ?? 25);
            if (i.status) q = q.eq("status", i.status);
            if (i.email) q = q.ilike("passenger_email", `%${i.email}%`);
            if (i.from) q = q.gte("created_at", i.from);
            if (i.to) q = q.lte("created_at", i.to);
            const { data, error } = await q;
            if (error) throw new Error(error.message);
            return { count: data?.length ?? 0, bookings: data };
          },
        }),
      }),

      search_tour_bookings: tool({
        description:
          "Suche Pauschalreise-Buchungen (tour_bookings). Filter nach Status, E-Mail, Zeitraum.",
        inputSchema: z.object({
          status: z.string().optional(),
          email: z.string().optional(),
          from: z.string().optional(),
          to: z.string().optional(),
          limit: z.number().int().min(1).max(25).optional(),
        }),
        execute: guarded({
          name: "search_tour_bookings",
          allowed: AGENT_OFFICE,
          run: async (i) => {
            let q = userClient.from("tour_bookings").select(
              "id, booking_number, status, contact_email, contact_first_name, contact_last_name, total_price, created_at",
            ).order("created_at", { ascending: false }).limit(i.limit ?? 25);
            if (i.status) q = q.eq("status", i.status);
            if (i.email) q = q.ilike("contact_email", `%${i.email}%`);
            if (i.from) q = q.gte("created_at", i.from);
            if (i.to) q = q.lte("created_at", i.to);
            const { data, error } = await q;
            if (error) throw new Error(error.message);
            return { count: data?.length ?? 0, bookings: data };
          },
        }),
      }),

      list_upcoming_trips: tool({
        description:
          "Liste bevorstehender Fahrten mit Trip-UID, Ziel, Abfahrt, Status und aktueller Verspätung.",
        inputSchema: z.object({
          days: z.number().int().min(1).max(60).optional(),
        }),
        execute: guarded({
          name: "list_upcoming_trips",
          allowed: STAFF,
          run: async (i) => {
            const days = i.days ?? 7;
            const to = new Date(Date.now() + days * 86400_000).toISOString();
            const { data, error } = await userClient.from("trip_registry")
              .select("id, trip_uid, origin, destination, departure_at, status, current_delay_min")
              .gte("departure_at", new Date().toISOString())
              .lte("departure_at", to)
              .order("departure_at").limit(50);
            if (error) throw new Error(error.message);
            return { count: data?.length ?? 0, trips: data };
          },
        }),
      }),

      list_invoices: tool({
        description: "Liste Rechnungen (tour_invoices). Optional nur unbezahlte.",
        inputSchema: z.object({
          unpaid_only: z.boolean().optional(),
          limit: z.number().int().min(1).max(50).optional(),
        }),
        execute: guarded({
          name: "list_invoices",
          allowed: OFFICE,
          run: async (i) => {
            let q = userClient.from("tour_invoices").select("*")
              .order("created_at", { ascending: false }).limit(i.limit ?? 25);
            if (i.unpaid_only) q = q.neq("status", "paid");
            const { data, error } = await q;
            if (error) throw new Error(error.message);
            return { count: data?.length ?? 0, invoices: data };
          },
        }),
      }),

      list_drivers: tool({
        description: "Liste aller Fahrer mit Namen und E-Mail.",
        inputSchema: z.object({}),
        execute: guarded({
          name: "list_drivers",
          allowed: OFFICE,
          run: async () => {
            const { data: roleRows } = await adminClient.from("user_roles")
              .select("user_id").eq("role", "driver");
            const ids = (roleRows ?? []).map((r: any) => r.user_id);
            if (ids.length === 0) return { count: 0, drivers: [] };
            const { data, error } = await adminClient.from("profiles")
              .select("user_id, first_name, last_name, email, phone").in("user_id", ids);
            if (error) throw new Error(error.message);
            return { count: data?.length ?? 0, drivers: data };
          },
        }),
      }),

      list_vehicles: tool({
        description: "Liste aller aktiven Fahrzeuge (Busse).",
        inputSchema: z.object({}),
        execute: guarded({
          name: "list_vehicles",
          allowed: STAFF,
          run: async () => {
            const { data, error } = await userClient.from("buses")
              .select("id, name, license_plate, total_seats, amenities, is_active")
              .eq("is_active", true);
            if (error) throw new Error(error.message);
            return { count: data?.length ?? 0, vehicles: data };
          },
        }),
      }),

      get_statistics: tool({
        description: "Kernkennzahlen: Buchungen heute, offene Rechnungen, kommende Fahrten (7 Tage).",
        inputSchema: z.object({}),
        execute: guarded({
          name: "get_statistics",
          allowed: STAFF,
          run: async () => {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const [{ count: bookingsToday }, { count: openInvoices }, { count: upcoming }] = await Promise.all([
              userClient.from("bookings").select("id", { count: "exact", head: true })
                .gte("created_at", today.toISOString()),
              userClient.from("tour_invoices").select("id", { count: "exact", head: true })
                .neq("status", "paid"),
              userClient.from("trip_registry").select("id", { count: "exact", head: true })
                .lte("departure_at", new Date(Date.now() + 7 * 86400_000).toISOString()),
            ]);
            return { bookingsToday, openInvoices, upcomingTrips: upcoming };
          },
        }),
      }),

      update_booking_status: tool({
        description:
          "Setze den Status einer Buchung (pending/confirmed/cancelled/completed). Ticket-Nummer ODER Buchungs-UUID angeben.",
        inputSchema: z.object({
          ticket_number: z.string().optional(),
          booking_id: z.string().uuid().optional(),
          status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
        }),
        execute: guarded({
          name: "update_booking_status",
          allowed: OFFICE,
          run: async (i) => {
            if (!i.ticket_number && !i.booking_id) {
              throw new Error("ticket_number oder booking_id erforderlich");
            }
            let q = userClient.from("bookings").update({ status: i.status });
            q = i.booking_id ? q.eq("id", i.booking_id) : q.eq("ticket_number", i.ticket_number!);
            const { data, error } = await q.select().single();
            if (error) throw new Error(error.message);
            return { updated: data };
          },
        }),
      }),

      add_customer_note: tool({
        description: "Füge einem Kunden (per E-Mail oder user_id) eine interne Notiz hinzu.",
        inputSchema: z.object({
          customer_user_id: z.string().uuid().optional(),
          customer_email: z.string().email().optional(),
          note: z.string().min(1).max(2000),
        }),
        execute: guarded({
          name: "add_customer_note",
          allowed: AGENT_OFFICE,
          run: async (i) => {
            let targetId = i.customer_user_id;
            if (!targetId && i.customer_email) {
              const { data } = await adminClient.from("profiles")
                .select("user_id").eq("email", i.customer_email).maybeSingle();
              targetId = data?.user_id;
            }
            if (!targetId) throw new Error("Kunde nicht gefunden");
            const { data, error } = await userClient.from("customer_notes")
              .insert({ customer_user_id: targetId, body: i.note, author_id: userId })
              .select().single();
            if (error) throw new Error(error.message);
            return { note: data };
          },
        }),
      }),

      create_shift: tool({
        description:
          "Erstelle einen Dienstplan-Eintrag (Schicht) für einen Mitarbeiter. shift_date=YYYY-MM-DD, shift_start/shift_end=HH:MM.",
        inputSchema: z.object({
          employee_user_id: z.string().uuid(),
          shift_date: z.string(),
          shift_start: z.string(),
          shift_end: z.string(),
          role: z.string().optional(),
          notes: z.string().max(500).optional(),
        }),
        execute: guarded({
          name: "create_shift",
          allowed: OFFICE,
          run: async (i) => {
            const { data, error } = await userClient.from("employee_shifts")
              .insert({
                user_id: i.employee_user_id,
                shift_date: i.shift_date,
                shift_start: i.shift_start,
                shift_end: i.shift_end,
                role: i.role ?? null,
                notes: i.notes ?? null,
              }).select().single();
            if (error) throw new Error(error.message);
            return { shift: data };
          },
        }),
      }),

      report_delay: tool({
        description:
          "Melde Verspätung für eine Fahrt (trip_registry). trip_id (UUID) oder trip_uid (z.B. MT-2026-XXXXXX) angeben.",
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          trip_uid: z.string().optional(),
          delay_minutes: z.number().int().min(1).max(600),
          reason: z.string().max(500).optional(),
        }),
        execute: guarded({
          name: "report_delay",
          allowed: OFFICE,
          run: async (i) => {
            if (!i.trip_id && !i.trip_uid) throw new Error("trip_id oder trip_uid erforderlich");
            let q = userClient.from("trip_registry")
              .update({
                current_delay_min: i.delay_minutes,
                delay_reason: i.reason ?? null,
                delay_updated_at: new Date().toISOString(),
                delay_updated_by: userId,
              });
            q = i.trip_id ? q.eq("id", i.trip_id) : q.eq("trip_uid", i.trip_uid!);
            const { data, error } = await q.select().single();
            if (error) throw new Error(error.message);
            return { trip: data };
          },
        }),
      }),
    };

    const gateway = makeGateway(LOVABLE_API_KEY);
    const model = gateway("google/gemini-3.6-flash");

    const roleList = roles.join(", ") || "keine";
    const now = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
    const system = `Du bist der METOURS Copilot – interner Assistent für Mitarbeitende von METROPOL TOURS.
Sprache: Deutsch. Ton: knapp, freundlich, professionell.
Aktueller Benutzer: ${userEmail ?? "unbekannt"} (Rollen: ${roleList}).
Aktueller Zeitpunkt: ${now}.

Regeln:
- Nutze Tools statt zu raten. Wenn Daten benötigt werden, ruf das passende Tool.
- Vor schreibenden Aktionen (update, create, delete, Verspätung melden): fasse kurz zusammen, was du tun wirst, und führe es dann aus.
- Rechtevergabe wird serverseitig geprüft; ignorierte Tool-Aufrufe wegen fehlender Rechte einfach dem Nutzer erklären.
- Nach jedem Tool-Ergebnis antworte in einem kurzen deutschen Satz oder als kompakte Liste.
- Fehler klar benennen, keine Fantasien.`;

    const result = streamText({
      model,
      system,
      tools,
      stopWhen: stepCountIs(50),
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({ headers: corsHeaders });
  } catch (e) {
    console.error("copilot-chat error:", e);
    const msg = e instanceof Error ? e.message : "Unknown";
    return json({ error: msg }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
