import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "lookup_my_booking",
  title: "Look up my booking",
  description:
    "Look up a booking for the signed-in user by ticket number (TKT-YYYY-######). Returns booking status, passenger name and trip info.",
  inputSchema: {
    ticket_number: z
      .string()
      .trim()
      .min(3)
      .describe("Ticket number, e.g. TKT-2026-000123."),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ ticket_number }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return {
        content: [{ type: "text", text: "Not authenticated." }],
        isError: true,
      };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, ticket_number, status, passenger_first_name, passenger_last_name, price_paid, created_at, trip_id",
      )
      .eq("ticket_number", ticket_number)
      .eq("user_id", ctx.getUserId())
      .maybeSingle();
    if (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
    if (!data) {
      return {
        content: [
          { type: "text", text: `No booking found for ${ticket_number}.` },
        ],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { booking: data },
    };
  },
});
