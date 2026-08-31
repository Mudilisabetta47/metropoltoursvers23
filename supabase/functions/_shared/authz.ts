// Gemeinsame Autorisierungs-Helfer für Edge Functions.
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export type StaffRole = "admin" | "office" | "agent" | "driver";

export function bearerToken(req: Request): string {
  return (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
}

/** true, wenn der Aufruf mit dem Service-Role-Key (interner Server-Aufruf) erfolgt. */
export function isServiceRoleCall(req: Request): boolean {
  const token = bearerToken(req);
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return !!token && !!key && token === key;
}

export interface StaffAuthResult {
  ok: boolean;
  status: number;
  error?: string;
  userId?: string;
  roles: string[];
  serviceRole: boolean;
}

/**
 * Prüft, ob der Aufrufer Mitarbeitender mit einer der erlaubten Rollen ist.
 * Optional wird ein interner Service-Role-Aufruf akzeptiert.
 */
export async function requireStaff(
  req: Request,
  admin: SupabaseClient,
  allowedRoles: StaffRole[] = ["admin", "office"],
  opts: { allowServiceRole?: boolean } = {},
): Promise<StaffAuthResult> {
  if (opts.allowServiceRole !== false && isServiceRoleCall(req)) {
    return { ok: true, status: 200, roles: ["service_role"], serviceRole: true };
  }

  const token = bearerToken(req);
  if (!token) return { ok: false, status: 401, error: "unauthorized", roles: [], serviceRole: false };

  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return { ok: false, status: 401, error: "unauthorized", roles: [], serviceRole: false };

  const { data: roleRows } = await admin.from("user_roles").select("role").eq("user_id", user.id);
  const roles = (roleRows ?? []).map((r: { role: string }) => r.role);
  if (!roles.some((r) => (allowedRoles as string[]).includes(r))) {
    return { ok: false, status: 403, error: "forbidden", userId: user.id, roles, serviceRole: false };
  }
  return { ok: true, status: 200, userId: user.id, roles, serviceRole: false };
}

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}
