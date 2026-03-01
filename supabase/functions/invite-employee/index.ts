import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Nicht autorisiert");

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Nicht autorisiert");

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: hasAdmin } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!hasAdmin) throw new Error("Nur Admins können Mitarbeiter einladen");

    const { email, role, first_name, last_name } = await req.json();
    if (!email || !role) throw new Error("E-Mail und Rolle erforderlich");

    const validRoles = ["admin", "office", "agent", "driver"];
    if (!validRoles.includes(role)) throw new Error("Ungültige Rolle");

    // Check if user already exists
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("user_id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    let userId: string;

    if (existingProfile) {
      // User exists, just assign role
      userId = existingProfile.user_id;
    } else {
      // Invite new user via admin API
      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email.trim(), {
        data: {
          first_name: first_name || null,
          last_name: last_name || null,
        },
        redirectTo: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/auth`,
      });

      if (inviteError) {
        // User might already exist in auth but not in profiles
        if (inviteError.message?.includes("already been registered")) {
          const { data: { users } } = await adminClient.auth.admin.listUsers();
          const found = users?.find((u: any) => u.email === email.trim().toLowerCase());
          if (found) {
            userId = found.id;
          } else {
            throw inviteError;
          }
        } else {
          throw inviteError;
        }
      } else {
        userId = inviteData.user.id;
      }
    }

    // Assign role (upsert to avoid duplicates)
    const { error: roleError } = await adminClient
      .from("user_roles")
      .upsert(
        { user_id: userId, role },
        { onConflict: "user_id,role" }
      );

    if (roleError) throw roleError;

    // Send custom invitation email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && !existingProfile) {
      const roleLabels: Record<string, string> = {
        admin: "Administrator",
        office: "Office-Mitarbeiter",
        agent: "Agent",
        driver: "Fahrer",
      };

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "METROPOL TOURS <booking@app.metours.de>",
          to: [email.trim()],
          subject: `Einladung als ${roleLabels[role]} – METROPOL TOURS`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #ffffff;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #00CC36; font-size: 24px; margin: 0;">METROPOL TOURS</h1>
              </div>
              <h2 style="color: #1a1a1a; font-size: 20px;">Willkommen im Team!</h2>
              <p style="color: #444; font-size: 16px; line-height: 1.6;">
                Sie wurden als <strong>${roleLabels[role]}</strong> bei METROPOL TOURS eingeladen.
                ${first_name ? `Hallo ${first_name},` : ''}
              </p>
              <p style="color: #444; font-size: 16px; line-height: 1.6;">
                Bitte klicken Sie auf den Link in der separaten Einladungs-E-Mail, um Ihr Konto zu aktivieren und Ihr Passwort festzulegen.
              </p>
              <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #666; font-size: 14px; margin: 0;"><strong>Ihre Rolle:</strong> ${roleLabels[role]}</p>
                <p style="color: #666; font-size: 14px; margin: 8px 0 0 0;"><strong>Berechtigungen:</strong></p>
                <ul style="color: #666; font-size: 14px; margin: 4px 0 0 0; padding-left: 20px;">
                  ${role === 'admin' ? '<li>Vollzugriff auf alle Bereiche</li>' : ''}
                  ${role === 'office' ? '<li>Buchungen, Reisen & Finanzen verwalten</li>' : ''}
                  ${role === 'agent' ? '<li>Buchungen verwalten & Kundenkontakt</li>' : ''}
                  ${role === 'driver' ? '<li>Fahrten einsehen & Check-in durchführen</li>' : ''}
                </ul>
              </div>
              <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">
                METROPOL TOURS Reiseorganisation
              </p>
            </div>
          `,
        }),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        invited: !existingProfile,
        message: existingProfile
          ? `Rolle "${role}" wurde ${email} zugewiesen.`
          : `Einladung an ${email} gesendet mit Rolle "${role}".`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("invite-employee error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
