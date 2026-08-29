import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { emailLayout, qrTicketBlock, escapeHtmlBrand } from "../_shared/email-brand.ts";
import { sendMail, FROM_BOOKING } from "../_shared/mailer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const randomToken = (len = 24) =>
  Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map((b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36])
    .join("");

/** Apple-Wallet-Pass für eine Buchung sicherstellen und die Download-URL zurückgeben. */
async function ensureWalletUrl(admin: any, bookingId: string, ticketNumber: string): Promise<string | null> {
  try {
    const { data: existing } = await admin
      .from("wallet_passes")
      .select("id, serial_number, auth_token, pass_url")
      .eq("booking_id", bookingId)
      .eq("booking_type", "bus")
      .eq("pass_type", "apple")
      .eq("is_voided", false)
      .order("last_updated", { ascending: false })
      .limit(1)
      .maybeSingle();

    const base = `${Deno.env.get("SUPABASE_URL")}/functions/v1/apple-wallet-pass`;
    if (existing) {
      const url = `${base}?serial=${existing.serial_number}&token=${existing.auth_token}`;
      if (existing.pass_url !== url) await admin.from("wallet_passes").update({ pass_url: url }).eq("id", existing.id);
      return url;
    }

    const serial = `MT-${ticketNumber}-${randomToken(8)}`;
    const token = randomToken(24);
    const url = `${base}?serial=${serial}&token=${token}`;
    const ins = await admin.from("wallet_passes").insert({
      booking_id: bookingId,
      booking_type: "bus",
      pass_type: "apple",
      serial_number: serial,
      auth_token: token,
      pass_url: url,
    }).select("id").single();
    if (ins.error) return null;
    return url;
  } catch {
    return null;
  }
}

const fmtDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return d;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Auth: nur Admin/Office dürfen Bestätigungen versenden
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!token) return json({ error: "unauthorized" }, 401);
    const { data: userRes } = await admin.auth.getUser(token);
    const user = userRes?.user;
    if (!user) return json({ error: "unauthorized" }, 401);

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const allowed = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "office");
    if (!allowed) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.bookingIds) ? body.bookingIds : [];
    const valid = ids.filter((id) => typeof id === "string" && UUID.test(id)).slice(0, 100);
    if (!valid.length) return json({ error: "bookingIds required" }, 400);

    const { data: bookings, error } = await admin
      .from("bookings")
      .select("*, seats(seat_number), trips(id, title, departure_date, departure_time, routes(name, description))")
      .in("id", valid);
    if (error) return json({ error: error.message }, 400);

    let sent = 0;
    const skipped: string[] = [];

    for (const b of bookings ?? []) {
      const to = (b.passenger_email || "").trim();
      if (!to || to.startsWith("no-reply@")) {
        skipped.push(b.ticket_number ?? b.id);
        continue;
      }
      const trip: any = b.trips ?? {};
      const routeName = trip?.routes?.description || trip?.routes?.name || trip?.title || "Ihre Fahrt";
      const rows: [string, string][] = [
        ["Buchungsnummer", b.booking_number ?? "—"],
        ["Ticketnummer", b.ticket_number ?? "—"],
        ["Fahrt", routeName],
        ["Datum", trip?.departure_date ? fmtDate(trip.departure_date) : "—"],
        ["Abfahrt", trip?.departure_time ? `${String(trip.departure_time).slice(0, 5)} Uhr` : "—"],
        ["Sitzplatz", b.seats?.seat_number ? `Platz ${b.seats.seat_number}` : "wird zugewiesen"],
      ];

      const content = `
        <h1 style="margin:0 0 10px;font-size:22px;color:#0f1218;">Ihre Buchungsbestätigung</h1>
        <p style="margin:0 0 18px;">Hallo ${escapeHtmlBrand(`${b.passenger_first_name ?? ""} ${b.passenger_last_name ?? ""}`.trim())},<br />
        vielen Dank für Ihre Buchung bei METROPOL TOURS. Hier sind Ihre Reisedaten:</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8e4;border-radius:12px;overflow:hidden;">
          ${rows
            .map(
              ([k, v], i) =>
                `<tr style="background:${i % 2 ? "#ffffff" : "#f6faf7"};"><td style="padding:10px 14px;color:#5b6b60;font-size:13px;">${escapeHtmlBrand(k)}</td><td style="padding:10px 14px;font-weight:700;color:#0f1218;font-size:13px;">${escapeHtmlBrand(v)}</td></tr>`,
            )
            .join("")}
        </table>
        ${qrTicketBlock(b.ticket_number ?? b.booking_number ?? "")}
        <p style="margin:18px 0 0;font-size:13px;color:#5b6b60;">Bitte seien Sie 15 Minuten vor Abfahrt am Abfahrtsort. Bei Fragen antworten Sie einfach auf diese E-Mail.</p>
      `;

      const res = await sendMail(admin, {
        from: FROM_BOOKING,
        to,
        subject: `Buchungsbestätigung ${b.booking_number ?? b.ticket_number} – METROPOL TOURS`,
        html: emailLayout({ title: "Buchungsbestätigung", preheader: `Ihre Fahrt: ${routeName}`, subtitle: "Buchungsbestätigung", content }),
        template: "trip_booking_confirmation",
        bookingNumber: b.booking_number,
        bookingId: b.id,
        sentByUserId: user.id,
      });
      if (res.ok) sent++;
      else skipped.push(b.ticket_number ?? b.id);
    }

    return json({ sent, skipped });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
