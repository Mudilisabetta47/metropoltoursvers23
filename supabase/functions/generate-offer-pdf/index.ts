import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { offerId } = await req.json();
    if (!offerId) throw new Error("offerId required");

    // Fetch offer
    const { data: offer, error: offerErr } = await supabase
      .from("tour_offers")
      .select("*")
      .eq("id", offerId)
      .single();
    if (offerErr) throw offerErr;

    // Fetch items
    const { data: items, error: itemsErr } = await supabase
      .from("tour_offer_items")
      .select("*")
      .eq("offer_id", offerId)
      .order("sort_order");
    if (itemsErr) throw itemsErr;

    // Generate PDF HTML
    const validUntil = offer.valid_until
      ? new Date(offer.valid_until).toLocaleDateString("de-DE")
      : "—";
    const createdAt = new Date(offer.created_at).toLocaleDateString("de-DE");

    const itemsHtml = (items || [])
      .map(
        (item: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${item.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;">${Number(item.unit_price).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;font-weight:600;">${Number(item.total_price).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</td>
      </tr>`
      )
      .join("");

    const discountRow =
      offer.discount_percent > 0
        ? `<tr>
        <td colspan="3" style="padding:8px 12px;font-size:13px;text-align:right;color:#dc2626;">Rabatt (${offer.discount_percent}%)</td>
        <td style="padding:8px 12px;font-size:13px;text-align:right;color:#dc2626;font-weight:600;">-${Number(offer.discount_amount).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</td>
      </tr>`
        : "";

    const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><title>Angebot ${offer.offer_number}</title></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;background:#fff;">
  <div style="max-width:680px;margin:0 auto;padding:40px 30px;">

    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;">
      <div>
        <h1 style="margin:0;font-size:28px;font-weight:800;color:#059669;">METROPOL TOURS</h1>
        <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Reiseveranstalter · Busreisen · Pauschalreisen</p>
      </div>
      <div style="text-align:right;">
        <div style="font-size:20px;font-weight:700;color:#1a1a1a;">ANGEBOT</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">${offer.offer_number}</div>
        <div style="font-size:11px;color:#6b7280;">Datum: ${createdAt}</div>
      </div>
    </div>

    <hr style="border:none;border-top:2px solid #059669;margin:0 0 24px;" />

    <!-- Customer & Trip Info -->
    <div style="display:flex;gap:40px;margin-bottom:24px;">
      <div style="flex:1;">
        <div style="font-size:10px;text-transform:uppercase;color:#9ca3af;font-weight:600;letter-spacing:0.5px;margin-bottom:6px;">Kunde</div>
        <div style="font-size:14px;font-weight:600;">${offer.customer_name}</div>
        <div style="font-size:12px;color:#6b7280;">${offer.customer_email}</div>
      </div>
      <div style="flex:1;">
        <div style="font-size:10px;text-transform:uppercase;color:#9ca3af;font-weight:600;letter-spacing:0.5px;margin-bottom:6px;">Reise</div>
        <div style="font-size:14px;font-weight:600;">${offer.destination}</div>
        <div style="font-size:12px;color:#6b7280;">${offer.departure_date || "nach Vereinbarung"} · ${offer.participants} Teilnehmer</div>
      </div>
    </div>

    <!-- Items Table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;font-weight:600;">Beschreibung</th>
          <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#6b7280;font-weight:600;">Menge</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#6b7280;font-weight:600;">Einzelpreis</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#6b7280;font-weight:600;">Gesamt</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr>
          <td colspan="3" style="padding:10px 12px;font-size:13px;text-align:right;font-weight:600;">Zwischensumme</td>
          <td style="padding:10px 12px;font-size:13px;text-align:right;font-weight:600;">${Number(offer.subtotal).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</td>
        </tr>
        ${discountRow}
        <tr style="background:#059669;color:white;">
          <td colspan="3" style="padding:12px;font-size:15px;text-align:right;font-weight:700;">Gesamtpreis</td>
          <td style="padding:12px;font-size:15px;text-align:right;font-weight:700;">${Number(offer.total).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</td>
        </tr>
      </tbody>
    </table>

    <p style="font-size:11px;color:#6b7280;margin:0 0 4px;">Preis pro Person: ${offer.participants > 0 ? Math.round(Number(offer.total) / offer.participants).toLocaleString("de-DE") : "—"} €</p>

    ${offer.notes ? `
    <div style="margin:20px 0;padding:12px 16px;background:#f9fafb;border-left:3px solid #059669;border-radius:4px;">
      <div style="font-size:10px;text-transform:uppercase;color:#9ca3af;font-weight:600;margin-bottom:4px;">Anmerkungen</div>
      <div style="font-size:12px;color:#374151;white-space:pre-wrap;">${offer.notes}</div>
    </div>` : ""}

    <!-- Validity -->
    <div style="margin:24px 0;padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;text-align:center;">
      <div style="font-size:12px;color:#92400e;font-weight:600;">Dieses Angebot ist gültig bis ${validUntil}</div>
    </div>

    <!-- Included services -->
    <div style="margin:20px 0;">
      <div style="font-size:10px;text-transform:uppercase;color:#9ca3af;font-weight:600;letter-spacing:0.5px;margin-bottom:8px;">Inklusivleistungen</div>
      <ul style="margin:0;padding:0 0 0 16px;font-size:12px;color:#374151;line-height:1.8;">
        <li>Komfortable Busfahrt mit Klima, WLAN & WC</li>
        <li>Übernachtung im Hotel mit Frühstück</li>
        <li>Reiseleitung / Betreuung</li>
        <li>Sicherungsschein gemäß §651r BGB</li>
      </ul>
    </div>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <!-- Footer -->
    <div style="font-size:10px;color:#9ca3af;text-align:center;line-height:1.6;">
      Metropol Tours · Reiseveranstalter<br/>
      E-Mail: info@metours.de · Tel: +49 (0) 123 456 789<br/>
      Dieses Angebot ist freibleibend und unverbindlich.
    </div>
  </div>
</body>
</html>`;

    // Update offer status
    await supabase
      .from("tour_offers")
      .update({ status: "sent" } as never)
      .eq("id", offerId);

    return new Response(
      JSON.stringify({ html }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
