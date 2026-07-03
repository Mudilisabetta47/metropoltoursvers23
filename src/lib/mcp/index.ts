import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listPackageToursTool from "./tools/list-package-tours";
import lookupBookingTool from "./tools/lookup-booking";

const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "metropol-tours-mcp",
  title: "METROPOL TOURS MCP",
  version: "0.1.0",
  instructions:
    "Tools for METROPOL TOURS. Use `list_package_tours` to browse active package tours (Pauschalreisen). Use `lookup_my_booking` (requires sign-in) to look up a booking by its TKT-YYYY-###### ticket number for the authenticated user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listPackageToursTool, lookupBookingTool],
});
