import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { accessToken } = await req.json().catch(() => ({}));

    let email: string | null = null;
    let userId: string | null = null;

    if (accessToken && typeof accessToken === "string") {
      const { data: tokenRow } = await admin
        .from("booking_access_tokens")
        .select("email, expires_at")
        .eq("token", accessToken)
        .maybeSingle();
      if (!tokenRow || new Date(tokenRow.expires_at) <= new Date()) {
        return json({ error: "Der Zugangslink ist abgelaufen. Bitte fordern Sie einen neuen an." }, 401);
      }
      email = tokenRow.email.toLowerCase();
      await admin.from("booking_access_tokens").update({ used_at: new Date().toISOString() }).eq("token", accessToken);
    } else {
      const bearer = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
      if (!bearer || bearer === anonKey) return json({ error: "Nicht autorisiert" }, 401);
      const authClient = createClient(supabaseUrl, anonKey);
      const { data: userData } = await authClient.auth.getUser(bearer);
      if (!userData?.user) return json({ error: "Nicht autorisiert" }, 401);
      userId = userData.user.id;
      email = (userData.user.email ?? "").toLowerCase();
    }

    let q = admin
      .from("tour_bookings")
      .select(
        "id, booking_number, status, participants, total_price, payment_method, payment_reference, paid_at, created_at, contact_first_name, contact_last_name, contact_email, tour_id, tour_date_id",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    q = userId
      ? q.or(`user_id.eq.${userId},contact_email.ilike.${email}`)
      : q.ilike("contact_email", email!);

    const { data: bookings, error } = await q;
    if (error) throw error;

    const ids = (bookings ?? []).map((b: any) => b.id);
    const tourIds = [...new Set((bookings ?? []).map((b: any) => b.tour_id).filter(Boolean))];
    const dateIds = [...new Set((bookings ?? []).map((b: any) => b.tour_date_id).filter(Boolean))];

    const [toursRes, datesRes, invoicesRes, eventsRes] = await Promise.all([
      tourIds.length
        ? admin.from("package_tours").select("id, destination, country, hero_image_url").in("id", tourIds)
        : Promise.resolve({ data: [] } as any),
      dateIds.length
        ? admin.from("tour_dates").select("id, departure_date, return_date").in("id", dateIds)
        : Promise.resolve({ data: [] } as any),
      ids.length
        ? admin.from("tour_invoices").select("booking_id, invoice_number, invoice_type, status, amount, pdf_path").in("booking_id", ids)
        : Promise.resolve({ data: [] } as any),
      ids.length
        ? admin
            .from("booking_status_events")
            .select("booking_id, source, event_type, old_status, new_status, provider, created_at")
            .in("booking_id", ids)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] } as any),
    ]);

    const tours = new Map((toursRes.data ?? []).map((t: any) => [t.id, t]));
    const dates = new Map((datesRes.data ?? []).map((d: any) => [d.id, d]));

    const result = (bookings ?? []).map((b: any) => ({
      ...b,
      tour: tours.get(b.tour_id) ?? null,
      tour_date: dates.get(b.tour_date_id) ?? null,
      invoices: (invoicesRes.data ?? []).filter((i: any) => i.booking_id === b.id),
      events: (eventsRes.data ?? []).filter((e: any) => e.booking_id === b.id),
    }));

    return json({ success: true, email, bookings: result });
  } catch (error: any) {
    console.error("my-bookings error", error);
    return json({ error: error?.message ?? "Fehler beim Laden der Buchungen" }, 500);
  }
});
