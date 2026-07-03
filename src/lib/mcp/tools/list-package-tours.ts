declare const process: { env: Record<string, string | undefined> };

import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

function serviceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export default defineTool({
  name: "list_package_tours",
  title: "List package tours",
  description:
    "List active METROPOL TOURS package tours (Pauschalreisen) with title, destination, price and slug.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Maximum number of tours to return (default 20)."),
    search: z
      .string()
      .optional()
      .describe("Case-insensitive substring to filter tour titles."),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ limit, search }) => {
    const supabase = serviceClient();
    let query = supabase
      .from("package_tours")
      .select("id, title, slug, destination, base_price, duration_days, is_active")
      .eq("is_active", true)
      .limit(limit ?? 20);
    if (search) query = query.ilike("title", `%${search}%`);
    const { data, error } = await query;
    if (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { tours: data ?? [] },
    };
  },
});
