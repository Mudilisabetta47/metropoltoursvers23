import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: any) => {
  console.log(`[EMAIL-AUTOMATIONS] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const results = {
      pre_departure_7d: 0,
      pre_departure_1d: 0,
      payment_reminder: 0,
      post_trip_review: 0,
      errors: 0,
    };

    // Helper: call send-automation-email
    const sendEmail = async (bookingId: string, emailType: string) => {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/send-automation-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ booking_id: bookingId, email_type: emailType }),
        });
        const data = await res.json();
        if (data.skipped) {
          log(`Skipped (already sent): ${emailType} for ${bookingId}`);
          return false;
        }
        if (!res.ok) throw new Error(data.error || "Send failed");
        return true;
      } catch (err) {
        log(`Error sending ${emailType} for ${bookingId}`, err);
        results.errors++;
        return false;
      }
    };

    // 1. PRE-DEPARTURE REMINDERS (7 days before)
    log("Checking pre-departure 7d reminders...");
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);
    const date7d = in7Days.toISOString().split("T")[0];

    const { data: bookings7d } = await admin
      .from("tour_bookings")
      .select("id, tour_date_id, tour_dates!inner(departure_date)")
      .eq("status", "confirmed")
      .eq("tour_dates.departure_date", date7d);

    for (const b of bookings7d || []) {
      if (await sendEmail(b.id, "pre_departure")) {
        results.pre_departure_7d++;
      }
    }

    // 2. PRE-DEPARTURE REMINDERS (1 day before)
    log("Checking pre-departure 1d reminders...");
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date1d = tomorrow.toISOString().split("T")[0];

    const { data: bookings1d } = await admin
      .from("tour_bookings")
      .select("id, tour_date_id, tour_dates!inner(departure_date)")
      .eq("status", "confirmed")
      .eq("tour_dates.departure_date", date1d);

    for (const b of bookings1d || []) {
      // Use force=true for 1-day reminder to send even if 7-day was sent
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/send-automation-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            booking_id: b.id,
            email_type: "pre_departure",
            force: true,
          }),
        });
        if (res.ok) results.pre_departure_1d++;
      } catch {
        results.errors++;
      }
    }

    // 3. PAYMENT REMINDERS (unpaid bookings older than 5 days)
    log("Checking payment reminders...");
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const { data: unpaidBookings } = await admin
      .from("tour_bookings")
      .select("id, created_at")
      .eq("status", "pending")
      .is("paid_at", null)
      .lt("created_at", fiveDaysAgo.toISOString());

    for (const b of unpaidBookings || []) {
      if (await sendEmail(b.id, "payment_reminder")) {
        results.payment_reminder++;
      }
    }

    // 4. POST-TRIP FEEDBACK (2 days after return)
    log("Checking post-trip feedback...");
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const dateReturn = twoDaysAgo.toISOString().split("T")[0];

    const { data: completedBookings } = await admin
      .from("tour_bookings")
      .select("id, tour_date_id, tour_dates!inner(return_date)")
      .in("status", ["confirmed", "completed"])
      .eq("tour_dates.return_date", dateReturn);

    for (const b of completedBookings || []) {
      if (await sendEmail(b.id, "post_trip_review")) {
        results.post_trip_review++;
      }
    }

    log("Automation run complete", results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    log("FATAL ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
