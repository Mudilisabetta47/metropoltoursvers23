import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatShortDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return dateStr; }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "long", year: "numeric" });
  } catch { return dateStr; }
}

const BANK = {
  recipient: "METROPOL TOURS GmbH",
  iban: "DE89 3704 0044 0532 0130 00",
  bic: "COBADEFFXXX",
  bank: "Commerzbank",
};

const COMPANY = {
  name: "METROPOL TOURS GmbH",
  address: "Musterstraße 1, 20095 Hamburg",
  phone: "+49 176 47144200",
  email: "kundenservice@metours.de",
  web: "metours.de",
  ustId: "DE123456789",
  hrb: "HRB 12345",
};

const ADMIN_EMAILS = ["kundenservice@metours.de", "kundenservice@metours.de"];

// Animated bus GIF (public CDN hosted animated travel GIFs)
const BUS_GIF = "https://media.giphy.com/media/3o7btNa0RUYa5E7iiQ/giphy.gif";
const TRAVEL_GIF = "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif";

// Inline SVG Logo as base64 data URI for email compatibility
const LOGO_BASE64 = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 48" width="240" height="48"><rect x="0" y="4" width="40" height="40" rx="10" fill="#00CC36"/><path d="M10 18h20v12a4 4 0 01-4 4H14a4 4 0 01-4-4V18z" fill="none" stroke="white" stroke-width="2"/><rect x="12" y="20" width="7" height="6" rx="1" fill="white" opacity="0.9"/><rect x="21" y="20" width="7" height="6" rx="1" fill="white" opacity="0.9"/><circle cx="15" cy="35" r="2.5" fill="white"/><circle cx="25" cy="35" r="2.5" fill="white"/><line x1="10" y1="15" x2="30" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/><text x="50" y="22" font-family="Arial,sans-serif" font-size="18" font-weight="800" fill="white" letter-spacing="1">METROPOL</text><text x="164" y="22" font-family="Arial,sans-serif" font-size="18" font-weight="800" fill="#00CC36" letter-spacing="1">TOURS</text><text x="50" y="38" font-family="Arial,sans-serif" font-size="9" fill="white" opacity="0.7" letter-spacing="2">REISEN VERBINDET</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
})();

function buildCustomerEmailHtml(booking: any, tour: any, date: any, tariff: any, pickup: any): string {
  const safeFirst = escapeHtml(booking.contact_first_name);
  const safeLast = escapeHtml(booking.contact_last_name);
  const safeDest = escapeHtml(tour?.destination || "");
  const safeLocation = escapeHtml(tour?.location || "");
  const safeCountry = escapeHtml(tour?.country || "");
  const safeBookingNum = escapeHtml(booking.booking_number);
  const safeTariff = escapeHtml(tariff?.name || "");
  const isPaid = booking.status === "confirmed" || booking.status === "paid";
  const statusLabel = isPaid ? "✓ Bezahlt" : "⏳ Zahlung ausstehend";
  const statusBg = isPaid ? "#dcfce7" : "#fef3c7";
  const statusColor = isPaid ? "#166534" : "#92400e";
  const passengers = Array.isArray(booking.passenger_details) ? booking.passenger_details : [];
  const luggageAddons = Array.isArray(booking.luggage_addons) ? booking.luggage_addons : [];
  const durationDays = date?.duration_days || tour?.duration_days || 7;

  const passengersHtml = passengers.map((p: any, i: number) => `
    <tr>
      <td style="padding:10px 14px; border-bottom:1px solid #f0f0f0; color:#888; font-weight:600; font-size:13px;">${i + 1}</td>
      <td style="padding:10px 14px; border-bottom:1px solid #f0f0f0; font-weight:600; font-size:13px;">${escapeHtml(p.firstName || '')} ${escapeHtml(p.lastName || '')}</td>
      <td style="padding:10px 14px; border-bottom:1px solid #f0f0f0; font-size:13px; color:#666;">${escapeHtml(p.email || '')}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Buchungsbestätigung – ${safeBookingNum}</title></head>
<body style="margin:0; padding:0; background:#f0f2f5; font-family:'Segoe UI',Arial,sans-serif; -webkit-font-smoothing:antialiased;">

<!-- Preheader (hidden text for email preview) -->
<div style="display:none; max-height:0; overflow:hidden; font-size:1px; color:#f0f2f5;">
  Ihre Reise nach ${safeDest} ist gebucht! Buchungsnr. ${safeBookingNum} – ${booking.participants} Personen, ${durationDays} Tage Abenteuer.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;">
<tr><td align="center" style="padding:24px 16px;">

<table role="presentation" width="620" cellpadding="0" cellspacing="0" style="max-width:620px; width:100%;">

  <!-- HERO HEADER -->
  <tr><td style="background:linear-gradient(135deg, #0a3d1a 0%, #1a5f2a 40%, #228B22 100%); border-radius:16px 16px 0 0; padding:0; position:relative;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:32px 36px 20px;">
          <img src="${LOGO_BASE64}" alt="METROPOL TOURS" width="200" height="40" style="display:block; width:200px; height:auto;" />
        </td>
      </tr>
      <tr>
        <td style="padding:0 36px;">
          <h1 style="margin:0; font-size:28px; font-weight:800; color:white; letter-spacing:-0.5px;">
            Ihre Reise ist gebucht! 🎉
          </h1>
          <p style="margin:8px 0 0; font-size:15px; color:rgba(255,255,255,0.85); line-height:1.5;">
            ${safeDest} erwartet Sie – ${durationDays} Tage voller Erlebnisse.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 36px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:rgba(255,255,255,0.15); border-radius:10px; padding:14px 22px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:20px; border-right:1px solid rgba(255,255,255,0.2);">
                      <div style="font-size:10px; color:rgba(255,255,255,0.6); text-transform:uppercase; letter-spacing:1.5px; font-weight:600;">Buchungsnr.</div>
                      <div style="font-size:18px; font-weight:800; color:white; margin-top:2px; letter-spacing:0.5px;">${safeBookingNum}</div>
                    </td>
                    <td style="padding-left:20px; padding-right:20px; border-right:1px solid rgba(255,255,255,0.2);">
                      <div style="font-size:10px; color:rgba(255,255,255,0.6); text-transform:uppercase; letter-spacing:1.5px; font-weight:600;">Reisende</div>
                      <div style="font-size:18px; font-weight:800; color:white; margin-top:2px;">${booking.participants}</div>
                    </td>
                    <td style="padding-left:20px;">
                      <div style="font-size:10px; color:rgba(255,255,255,0.6); text-transform:uppercase; letter-spacing:1.5px; font-weight:600;">Tarif</div>
                      <div style="font-size:18px; font-weight:800; color:#00CC36; margin-top:2px;">${safeTariff}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- STATUS BAR -->
  <tr><td style="background:white; padding:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:16px 36px; border-bottom:1px solid #eee;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size:12px; color:#888;">Status</span>
              </td>
              <td align="right">
                <span style="display:inline-block; padding:6px 16px; border-radius:8px; font-size:12px; font-weight:700; background:${statusBg}; color:${statusColor};">
                  ${statusLabel}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- MAIN CONTENT -->
  <tr><td style="background:white; padding:28px 36px;">

    <!-- Greeting -->
    <p style="margin:0 0 20px; font-size:15px; color:#333; line-height:1.6;">
      Hallo <strong>${safeFirst}</strong>,<br>
      vielen Dank für Ihre Buchung! Hier finden Sie alle Details zu Ihrer bevorstehenden Reise.
    </p>

    <!-- TRAVEL DETAILS CARD -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8faf9; border-radius:12px; border:1px solid #e8ede9; margin-bottom:24px;">
      <tr><td style="padding:20px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td colspan="2" style="padding-bottom:14px; border-bottom:2px solid #e8f5e9;">
            <div style="font-size:10px; color:#1a5f2a; text-transform:uppercase; letter-spacing:1.5px; font-weight:700;">✈️ Reisedetails</div>
          </td></tr>
          <tr>
            <td style="padding:12px 0; width:50%; vertical-align:top;">
              <div style="font-size:10px; color:#999; text-transform:uppercase; letter-spacing:0.8px; font-weight:600;">Reiseziel</div>
              <div style="font-size:16px; font-weight:700; color:#1a1a1a; margin-top:2px;">${safeDest}</div>
            </td>
            <td style="padding:12px 0; width:50%; vertical-align:top;">
              <div style="font-size:10px; color:#999; text-transform:uppercase; letter-spacing:0.8px; font-weight:600;">Ort / Land</div>
              <div style="font-size:14px; font-weight:600; color:#1a1a1a; margin-top:2px;">${safeLocation}, ${safeCountry}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0; border-top:1px solid #e8ede9;">
              <div style="font-size:10px; color:#999; text-transform:uppercase; letter-spacing:0.8px; font-weight:600;">📅 Hinreise</div>
              <div style="font-size:14px; font-weight:700; color:#1a1a1a; margin-top:2px;">${date ? formatDate(date.departure_date) : "-"}</div>
            </td>
            <td style="padding:12px 0; border-top:1px solid #e8ede9;">
              <div style="font-size:10px; color:#999; text-transform:uppercase; letter-spacing:0.8px; font-weight:600;">📅 Rückreise</div>
              <div style="font-size:14px; font-weight:700; color:#1a1a1a; margin-top:2px;">${date ? formatDate(date.return_date) : "-"}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0; border-top:1px solid #e8ede9;">
              <div style="font-size:10px; color:#999; text-transform:uppercase; letter-spacing:0.8px; font-weight:600;">⏱️ Dauer</div>
              <div style="font-size:14px; font-weight:700; color:#1a1a1a; margin-top:2px;">${durationDays} Tage</div>
            </td>
            <td style="padding:12px 0; border-top:1px solid #e8ede9;">
              <div style="font-size:10px; color:#999; text-transform:uppercase; letter-spacing:0.8px; font-weight:600;">🎫 Tarif</div>
              <div style="font-size:14px; font-weight:700; color:#1a5f2a; margin-top:2px;">${safeTariff}</div>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    ${pickup ? `
    <!-- PICKUP CARD -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed; border-radius:12px; border:1px solid #fed7aa; margin-bottom:24px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:10px; color:#c2410c; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; margin-bottom:12px;">🚌 Zustieg & Abfahrt</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:50%; padding:8px 0;">
              <div style="font-size:10px; color:#9a3412; text-transform:uppercase; letter-spacing:0.8px;">Abfahrtsort</div>
              <div style="font-size:14px; font-weight:700; color:#1a1a1a; margin-top:2px;">${escapeHtml(pickup.city)} – ${escapeHtml(pickup.location_name)}</div>
            </td>
            <td style="width:50%; padding:8px 0;">
              <div style="font-size:10px; color:#9a3412; text-transform:uppercase; letter-spacing:0.8px;">Abfahrtszeit</div>
              <div style="font-size:20px; font-weight:800; color:#c2410c; margin-top:2px;">${pickup.departure_time?.slice(0, 5)} Uhr</div>
            </td>
          </tr>
        </table>
        <div style="margin-top:12px; padding:10px 14px; background:#fff; border-radius:8px; border-left:4px solid #f59e0b; font-size:12px; color:#92400e;">
          ⚠️ Bitte erscheinen Sie mindestens <strong>15 Minuten vor Abfahrt</strong> am Treffpunkt.
        </div>
      </td></tr>
    </table>
    ` : ''}

    <!-- PASSENGERS -->
    ${passengers.length > 0 ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="padding-bottom:10px; border-bottom:2px solid #e8f5e9;">
        <div style="font-size:10px; color:#1a5f2a; text-transform:uppercase; letter-spacing:1.5px; font-weight:700;">👥 Reisende (${booking.participants})</div>
      </td></tr>
      <tr><td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
          <tr>
            <th style="text-align:left; font-size:10px; color:#999; text-transform:uppercase; letter-spacing:0.8px; padding:8px 14px; border-bottom:2px solid #eee;">#</th>
            <th style="text-align:left; font-size:10px; color:#999; text-transform:uppercase; letter-spacing:0.8px; padding:8px 14px; border-bottom:2px solid #eee;">Name</th>
            <th style="text-align:left; font-size:10px; color:#999; text-transform:uppercase; letter-spacing:0.8px; padding:8px 14px; border-bottom:2px solid #eee;">E-Mail</th>
          </tr>
          ${passengersHtml}
        </table>
      </td></tr>
    </table>
    ` : ''}

    <!-- PRICE BREAKDOWN -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="padding-bottom:10px; border-bottom:2px solid #e8f5e9;">
        <div style="font-size:10px; color:#1a5f2a; text-transform:uppercase; letter-spacing:1.5px; font-weight:700;">💰 Preisübersicht</div>
      </td></tr>
      <tr><td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
          <tr>
            <td style="padding:10px 14px; border-bottom:1px solid #f0f0f0; font-size:13px;">${safeTariff}-Tarif (${booking.participants}× ${booking.base_price.toFixed(2)} €)</td>
            <td align="right" style="padding:10px 14px; border-bottom:1px solid #f0f0f0; font-size:13px; font-weight:600;">${(booking.base_price * booking.participants).toFixed(2)} €</td>
          </tr>
          ${booking.pickup_surcharge > 0 ? `
          <tr>
            <td style="padding:10px 14px; border-bottom:1px solid #f0f0f0; font-size:13px;">Zustiegsaufpreis${pickup ? ' ' + escapeHtml(pickup.city) : ''}</td>
            <td align="right" style="padding:10px 14px; border-bottom:1px solid #f0f0f0; font-size:13px; font-weight:600;">${booking.pickup_surcharge.toFixed(2)} €</td>
          </tr>` : ''}
          ${luggageAddons.map((a: any) => `
          <tr>
            <td style="padding:10px 14px; border-bottom:1px solid #f0f0f0; font-size:13px;">${escapeHtml(a.name || 'Zusatzgepäck')} (${a.quantity || 1}×)</td>
            <td align="right" style="padding:10px 14px; border-bottom:1px solid #f0f0f0; font-size:13px; font-weight:600;">${(a.total || 0).toFixed(2)} €</td>
          </tr>`).join('')}
          ${booking.discount_amount > 0 ? `
          <tr>
            <td style="padding:10px 14px; border-bottom:1px solid #f0f0f0; font-size:13px; color:#16a34a;">Gutschein${booking.discount_code ? ' (' + escapeHtml(booking.discount_code) + ')' : ''}</td>
            <td align="right" style="padding:10px 14px; border-bottom:1px solid #f0f0f0; font-size:13px; font-weight:600; color:#16a34a;">−${booking.discount_amount.toFixed(2)} €</td>
          </tr>` : ''}
        </table>
      </td></tr>
    </table>

    <!-- TOTAL PRICE BOX -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="background:linear-gradient(135deg, #0a3d1a 0%, #1a5f2a 100%); border-radius:12px; padding:24px; text-align:center;">
        <div style="font-size:11px; color:rgba(255,255,255,0.7); text-transform:uppercase; letter-spacing:1.5px;">Gesamtpreis</div>
        <div style="font-size:36px; font-weight:800; color:white; margin:4px 0; letter-spacing:-1px;">${booking.total_price.toFixed(2)} €</div>
        <div style="font-size:12px; color:rgba(255,255,255,0.7);">${booking.participants} Person${booking.participants > 1 ? 'en' : ''} · ${durationDays} Tage · ${safeTariff}</div>
      </td></tr>
    </table>

    ${!isPaid ? `
    <!-- BANK TRANSFER BOX -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="background:#fffbeb; border:1px solid #fbbf24; border-radius:12px; padding:24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom:16px; border-bottom:1px solid #fde68a;">
              <div style="font-size:16px; font-weight:700; color:#78350f;">💳 Überweisungsdaten</div>
              <div style="font-size:12px; color:#92400e; margin-top:4px;">Bitte überweisen Sie den Betrag innerhalb von 5 Werktagen</div>
            </td>
          </tr>
          <tr><td style="padding-top:14px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:6px 0; font-size:11px; color:#92400e; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">Empfänger</td><td align="right" style="padding:6px 0; font-size:14px; font-weight:700; color:#78350f;">${BANK.recipient}</td></tr>
              <tr><td style="padding:6px 0; font-size:11px; color:#92400e; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">IBAN</td><td align="right" style="padding:6px 0; font-size:14px; font-weight:700; color:#78350f; font-family:monospace;">${BANK.iban}</td></tr>
              <tr><td style="padding:6px 0; font-size:11px; color:#92400e; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">BIC</td><td align="right" style="padding:6px 0; font-size:14px; font-weight:700; color:#78350f;">${BANK.bic}</td></tr>
              <tr><td style="padding:6px 0; font-size:11px; color:#92400e; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">Bank</td><td align="right" style="padding:6px 0; font-size:14px; font-weight:700; color:#78350f;">${BANK.bank}</td></tr>
              <tr><td colspan="2" style="padding:12px 0 0; border-top:1px solid #fde68a;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7; border-radius:8px;">
                  <tr>
                    <td style="padding:12px 16px;">
                      <div style="font-size:10px; color:#92400e; text-transform:uppercase; letter-spacing:1px;">Verwendungszweck</div>
                      <div style="font-size:16px; font-weight:800; color:#78350f; margin-top:2px;">Buchung ${safeBookingNum}</div>
                    </td>
                    <td align="right" style="padding:12px 16px;">
                      <div style="font-size:10px; color:#92400e; text-transform:uppercase; letter-spacing:1px;">Betrag</div>
                      <div style="font-size:16px; font-weight:800; color:#78350f; margin-top:2px;">${booking.total_price.toFixed(2)} €</div>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>
    ` : ''}

    <!-- DOCUMENTS INFO -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:20px 24px;">
        <div style="font-size:14px; font-weight:700; color:#1e40af; margin-bottom:8px;">📎 Ihre Reiseunterlagen</div>
        <p style="font-size:13px; color:#1e3a5f; margin:0 0 12px; line-height:1.5;">
          Im Anhang dieser E-Mail finden Sie Ihre vollständigen Reiseunterlagen:
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr><td style="padding:4px 0; font-size:13px; color:#1e3a5f;">📄 <strong>Buchungsbestätigung</strong> – Alle Details auf einen Blick</td></tr>
          <tr><td style="padding:4px 0; font-size:13px; color:#1e3a5f;">🧾 <strong>Rechnung</strong> – Mit USt-Ausweis</td></tr>
          <tr><td style="padding:4px 0; font-size:13px; color:#1e3a5f;">🏨 <strong>Hotel-Voucher</strong> – Für den Check-in</td></tr>
          <tr><td style="padding:4px 0; font-size:13px; color:#1e3a5f;">🗺️ <strong>Reiseplan</strong> – Tag für Tag Ihr Programm</td></tr>
        </table>
      </td></tr>
    </table>

    <!-- FUN BUS GIF -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td align="center" style="padding:8px 0;">
        <img src="${BUS_GIF}" alt="Bus Animation" width="280" style="display:block; max-width:280px; width:100%; height:auto; border-radius:12px;" />
        <p style="font-size:12px; color:#999; margin:8px 0 0;">Los geht's – Ihr Bus wartet! 🚌💨</p>
      </td></tr>
    </table>

    <!-- NEXT STEPS -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="padding-bottom:10px; border-bottom:2px solid #e8f5e9;">
        <div style="font-size:10px; color:#1a5f2a; text-transform:uppercase; letter-spacing:1.5px; font-weight:700;">📋 Nächste Schritte</div>
      </td></tr>
      <tr><td style="padding-top:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:40px; vertical-align:top; padding:8px 0;">
              <div style="width:32px; height:32px; background:#dcfce7; border-radius:50%; text-align:center; line-height:32px; font-size:14px; font-weight:700; color:#166534;">1</div>
            </td>
            <td style="padding:8px 0 8px 8px; font-size:13px; color:#333; line-height:1.5;">
              <strong>Betrag überweisen</strong> – Verwenden Sie die oben genannten Bankdaten
            </td>
          </tr>
          <tr>
            <td style="width:40px; vertical-align:top; padding:8px 0;">
              <div style="width:32px; height:32px; background:#dcfce7; border-radius:50%; text-align:center; line-height:32px; font-size:14px; font-weight:700; color:#166534;">2</div>
            </td>
            <td style="padding:8px 0 8px 8px; font-size:13px; color:#333; line-height:1.5;">
              <strong>Bestätigung abwarten</strong> – Sie erhalten eine Zahlungsbestätigung per E-Mail
            </td>
          </tr>
          <tr>
            <td style="width:40px; vertical-align:top; padding:8px 0;">
              <div style="width:32px; height:32px; background:#dcfce7; border-radius:50%; text-align:center; line-height:32px; font-size:14px; font-weight:700; color:#166534;">3</div>
            </td>
            <td style="padding:8px 0 8px 8px; font-size:13px; color:#333; line-height:1.5;">
              <strong>Koffer packen!</strong> – 15 Min vor Abfahrt am Treffpunkt sein 🧳
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- CTA BUTTON -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td align="center">
        <a href="https://metours.de/bookings" style="display:inline-block; background:linear-gradient(135deg, #00CC36, #00a82d); color:white; padding:14px 36px; border-radius:10px; font-size:14px; font-weight:700; text-decoration:none; letter-spacing:0.3px;">
          Meine Buchung ansehen →
        </a>
      </td></tr>
    </table>

    <!-- CONTACT -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr><td style="background:#f8faf9; border-radius:12px; border:1px solid #e8ede9; padding:20px 24px; text-align:center;">
        <div style="font-size:14px; font-weight:700; color:#1a5f2a; margin-bottom:8px;">Fragen? Wir helfen gerne!</div>
        <div style="font-size:13px; color:#666;">📞 ${COMPANY.phone} · ✉️ ${COMPANY.email}</div>
      </td></tr>
    </table>

  </td></tr>

  <!-- CREATIVE FOOTER -->
  <tr><td style="background:linear-gradient(135deg, #111827 0%, #1f2937 100%); border-radius:0 0 16px 16px; padding:32px 36px; text-align:center;">
    
    <!-- Footer Logo -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:20px;">
        <img src="${LOGO_BASE64}" alt="METROPOL TOURS" width="160" height="32" style="display:block; width:160px; height:auto; opacity:0.9;" />
      </td></tr>
    </table>

    <!-- Tagline -->
    <p style="margin:0 0 16px; font-size:14px; color:rgba(255,255,255,0.7); font-style:italic;">
      „Reisen verbindet – seit 2024 Ihr Partner für unvergessliche Busreisen."
    </p>

    <!-- Social-style icons -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
      <tr>
        <td style="padding:0 8px;">
          <div style="width:36px; height:36px; background:rgba(255,255,255,0.1); border-radius:50%; text-align:center; line-height:36px; font-size:16px;">🌍</div>
        </td>
        <td style="padding:0 8px;">
          <div style="width:36px; height:36px; background:rgba(255,255,255,0.1); border-radius:50%; text-align:center; line-height:36px; font-size:16px;">📸</div>
        </td>
        <td style="padding:0 8px;">
          <div style="width:36px; height:36px; background:rgba(255,255,255,0.1); border-radius:50%; text-align:center; line-height:36px; font-size:16px;">💬</div>
        </td>
      </tr>
    </table>

    <!-- Trust badges -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
      <tr>
        <td style="padding:0 12px; text-align:center;">
          <div style="font-size:18px;">⭐</div>
          <div style="font-size:10px; color:rgba(255,255,255,0.5); margin-top:2px;">4.8 / 5</div>
        </td>
        <td style="padding:0 12px; text-align:center;">
          <div style="font-size:18px;">🛡️</div>
          <div style="font-size:10px; color:rgba(255,255,255,0.5); margin-top:2px;">Sicher</div>
        </td>
        <td style="padding:0 12px; text-align:center;">
          <div style="font-size:18px;">🏆</div>
          <div style="font-size:10px; color:rgba(255,255,255,0.5); margin-top:2px;">Top Hotels</div>
        </td>
        <td style="padding:0 12px; text-align:center;">
          <div style="font-size:18px;">🚌</div>
          <div style="font-size:10px; color:rgba(255,255,255,0.5); margin-top:2px;">Komfort</div>
        </td>
      </tr>
    </table>

    <!-- Divider -->
    <div style="height:1px; background:rgba(255,255,255,0.1); margin:0 0 16px;"></div>

    <!-- Company Info -->
    <p style="margin:0 0 4px; font-size:11px; color:rgba(255,255,255,0.4); line-height:1.6;">
      ${COMPANY.name} · ${COMPANY.address} · ${COMPANY.hrb}
    </p>
    <p style="margin:0 0 4px; font-size:11px; color:rgba(255,255,255,0.4);">
      ${COMPANY.phone} · ${COMPANY.email} · ${COMPANY.web}
    </p>
    <p style="margin:0; font-size:10px; color:rgba(255,255,255,0.3); margin-top:8px;">
      © ${new Date().getFullYear()} METROPOL TOURS · <a href="https://metours.de/terms" style="color:rgba(255,255,255,0.4); text-decoration:underline;">AGB</a> · <a href="https://metours.de/privacy" style="color:rgba(255,255,255,0.4); text-decoration:underline;">Datenschutz</a> · <a href="https://metours.de/impressum" style="color:rgba(255,255,255,0.4); text-decoration:underline;">Impressum</a>
    </p>
  </td></tr>

</table>

</td></tr>
</table>
</body></html>`;
}

function buildAdminEmailHtml(booking: any, tour: any, date: any, tariff: any, pickup: any): string {
  const passengers = Array.isArray(booking.passenger_details) ? booking.passenger_details : [];

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #333; margin: 0; padding: 0; background: #f0f2f5; }
  .container { max-width: 600px; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 28px 32px; border-radius: 12px 12px 0 0; }
  .content { background: white; padding: 28px 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
  .section { margin: 16px 0; padding: 16px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
  .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
  .label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  .value { font-weight: 600; }
  .total-box { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 18px; border-radius: 10px; text-align: center; font-size: 22px; font-weight: 800; margin-top: 16px; }
  h3 { margin: 0 0 10px; font-size: 12px; color: #334155; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
</style></head><body>
<div class="container">
  <div class="header">
    <h1 style="margin:0; font-size:20px; font-weight:700;">🔔 Neue Buchung eingegangen</h1>
    <p style="margin:8px 0 0; opacity:0.7; font-size:13px;">${escapeHtml(booking.booking_number)} · ${escapeHtml(tour?.destination || "")} · ${booking.total_price.toFixed(2)} €</p>
  </div>
  <div class="content">
    <div class="section">
      <h3>📋 Buchung</h3>
      <div class="row"><span class="label">Nummer</span><span class="value">${escapeHtml(booking.booking_number)}</span></div>
      <div class="row"><span class="label">Status</span><span class="value" style="color:#f59e0b;">⏳ Überweisung ausstehend</span></div>
      <div class="row"><span class="label">Datum</span><span class="value">${new Date(booking.created_at).toLocaleDateString("de-DE")} ${new Date(booking.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</span></div>
    </div>
    <div class="section">
      <h3>🚌 Reise</h3>
      <div class="row"><span class="label">Ziel</span><span class="value">${escapeHtml(tour?.destination || "")}</span></div>
      <div class="row"><span class="label">Hin / Rück</span><span class="value">${date ? formatShortDate(date.departure_date) : "-"} – ${date ? formatShortDate(date.return_date) : "-"}</span></div>
      <div class="row"><span class="label">Tarif</span><span class="value">${escapeHtml(tariff?.name || "")}</span></div>
      <div class="row"><span class="label">Teilnehmer</span><span class="value">${booking.participants}</span></div>
      ${pickup ? `<div class="row"><span class="label">Zustieg</span><span class="value">${escapeHtml(pickup.city)} ${pickup.departure_time?.slice(0, 5)}</span></div>` : ""}
    </div>
    <div class="section">
      <h3>👤 Kontakt</h3>
      <div class="row"><span class="label">Name</span><span class="value">${escapeHtml(booking.contact_first_name)} ${escapeHtml(booking.contact_last_name)}</span></div>
      <div class="row"><span class="label">E-Mail</span><span class="value">${escapeHtml(booking.contact_email)}</span></div>
      <div class="row"><span class="label">Telefon</span><span class="value">${escapeHtml(booking.contact_phone || "-")}</span></div>
    </div>
    ${passengers.length > 1 ? `
    <div class="section">
      <h3>👥 Alle Reisenden</h3>
      ${passengers.map((p: any, i: number) => `<div class="row"><span class="label">Person ${i + 1}</span><span class="value">${escapeHtml(p.firstName)} ${escapeHtml(p.lastName)}</span></div>`).join("")}
    </div>` : ""}
    <div class="section">
      <h3>💰 Preis</h3>
      <div class="row"><span class="label">Grundpreis</span><span class="value">${booking.base_price.toFixed(2)} € × ${booking.participants}</span></div>
      ${booking.pickup_surcharge > 0 ? `<div class="row"><span class="label">Zustieg</span><span class="value">+${booking.pickup_surcharge.toFixed(2)} €</span></div>` : ""}
      ${booking.discount_amount > 0 ? `<div class="row"><span class="label">Gutschein</span><span class="value" style="color:#16a34a;">-${booking.discount_amount.toFixed(2)} €</span></div>` : ""}
    </div>
    <div class="total-box">${booking.total_price.toFixed(2)} €</div>
    <p style="margin-top:16px; color:#94a3b8; font-size:12px; text-align:center;">
      ⚡ Aktion: Zahlungseingang prüfen → Status auf "bestätigt" setzen
    </p>
  </div>
</div></body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Use service role for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData = await req.json();
    const { bookingId, tourBookingId } = requestData;

    // Input validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (tourBookingId && !uuidRegex.test(tourBookingId)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid tourBookingId" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (bookingId && !uuidRegex.test(bookingId)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid bookingId" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (tourBookingId) {
      // ── TOUR BOOKING CONFIRMATION ──
      const { data: booking, error: bookingError } = await supabase
        .from("tour_bookings")
        .select("*")
        .eq("id", tourBookingId)
        .single();

      if (bookingError || !booking) {
        return new Response(JSON.stringify({ success: false, error: "Tour booking not found" }), {
          status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const [tourRes, dateRes, tariffRes, pickupRes] = await Promise.all([
        supabase.from("package_tours").select("destination, location, country, duration_days").eq("id", booking.tour_id).single(),
        supabase.from("tour_dates").select("departure_date, return_date, duration_days").eq("id", booking.tour_date_id).single(),
        supabase.from("tour_tariffs").select("name").eq("id", booking.tariff_id).single(),
        booking.pickup_stop_id
          ? supabase.from("tour_pickup_stops").select("city, location_name, departure_time").eq("id", booking.pickup_stop_id).single()
          : Promise.resolve({ data: null }),
      ]);

      const tour = tourRes.data;
      const date = dateRes.data;
      const tariff = tariffRes.data;
      const pickup = pickupRes.data;

      const safeDest = escapeHtml(tour?.destination || "");
      const safeBookingNum = escapeHtml(booking.booking_number);

      // Generate documents for attachment
      let attachments: any[] = [];
      try {
        const docsUrl = `${supabaseUrl}/functions/v1/generate-tour-documents`;
        const docsRes = await fetch(docsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ bookingId: booking.id, documentType: "all" }),
        });
        
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          if (docsData.success && docsData.documents) {
            const docNames: Record<string, string> = {
              confirmation: `Buchungsbestaetigung-${booking.booking_number}.html`,
              invoice: `Rechnung-${booking.booking_number}.html`,
              voucher: `Hotel-Voucher-${booking.booking_number}.html`,
              travelplan: `Reiseplan-${booking.booking_number}.html`,
            };
            for (const [key, filename] of Object.entries(docNames)) {
              if (docsData.documents[key]) {
                // Convert HTML string to base64 for Resend attachment
                const content = btoa(unescape(encodeURIComponent(docsData.documents[key])));
                attachments.push({
                  filename,
                  content,
                  content_type: "text/html",
                });
              }
            }
          }
        }
      } catch (docErr) {
        console.error("Failed to generate document attachments:", docErr);
        // Continue without attachments
      }

      // 1) Send customer email with documents attached
      const customerEmailRes = await resend.emails.send({
        from: "METROPOL TOURS <booking@app.metours.de>",
        to: [booking.contact_email],
        subject: `✈️ Buchungsbestätigung ${safeBookingNum} – ${safeDest} | Ihre Reiseunterlagen`,
        html: buildCustomerEmailHtml(booking, tour, date, tariff, pickup),
        ...(attachments.length > 0 ? { attachments } : {}),
      });
      console.log("Customer email sent with", attachments.length, "attachments:", customerEmailRes);

      // 2) Send admin notification
      const adminEmailRes = await resend.emails.send({
        from: "METROPOL TOURS System <booking@app.metours.de>",
        to: ADMIN_EMAILS,
        subject: `🔔 Neue Buchung ${safeBookingNum} – ${safeDest} – ${booking.total_price.toFixed(2)}€`,
        html: buildAdminEmailHtml(booking, tour, date, tariff, pickup),
      });
      console.log("Admin email sent:", adminEmailRes);

      return new Response(JSON.stringify({ 
        success: true, 
        data: { customer: customerEmailRes, admin: adminEmailRes },
        attachmentsCount: attachments.length,
      }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } else if (bookingId) {
      // ── REGULAR LINE BOOKING CONFIRMATION (existing logic) ──
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(bookingId)) {
        return new Response(JSON.stringify({ success: false, error: "Invalid bookingId" }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select(`*, trip:trips(departure_date, departure_time, arrival_time, route:routes(name)), origin_stop:stops!bookings_origin_stop_id_fkey(city, name), destination_stop:stops!bookings_destination_stop_id_fkey(city, name)`)
        .eq("id", bookingId)
        .single();

      if (bookingError || !booking) {
        return new Response(JSON.stringify({ success: false, error: "Booking not found" }), {
          status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const safeFirst = escapeHtml(booking.passenger_first_name);
      const safeLast = escapeHtml(booking.passenger_last_name);
      const safeFrom = escapeHtml(booking.origin_stop?.city || "");
      const safeTo = escapeHtml(booking.destination_stop?.city || "");
      const safeTicket = escapeHtml(booking.ticket_number);

      const emailResponse = await resend.emails.send({
        from: "METROPOL TOURS <booking@app.metours.de>",
        to: [booking.passenger_email],
        subject: `Buchungsbestätigung ${safeTicket} – ${safeFrom} → ${safeTo}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0; background:#f0f2f5; }
  .container { max-width: 600px; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #0a3d1a 0%, #1a5f2a 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
  .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
  .booking-box { background: #f0fdf4; border-radius: 10px; padding: 20px; margin: 20px 0; }
  .route { text-align: center; font-size: 20px; font-weight: bold; margin: 15px 0; }
  .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8f5e9; }
  .total { background: linear-gradient(135deg, #0a3d1a 0%, #1a5f2a 100%); color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; margin-top: 20px; }
  .footer { text-align: center; padding: 20px; color: #888; font-size: 13px; }
</style></head><body>
<div class="container">
  <div class="header">
    <img src="${LOGO_BASE64}" alt="METROPOL TOURS" width="180" style="display:block; margin:0 auto 12px;" />
    <h1 style="margin:0; font-size:22px;">Buchung bestätigt!</h1>
  </div>
  <div class="content">
    <p>Hallo ${safeFirst} ${safeLast},</p>
    <p>Ihre Busreise wurde erfolgreich gebucht!</p>
    <div class="booking-box">
      <div style="text-align:center; margin-bottom:12px;"><span style="background:#1a5f2a; color:white; padding:5px 15px; border-radius:20px; font-size:14px;">${safeTicket}</span></div>
      <div class="route">${safeFrom} → ${safeTo}</div>
      <div class="detail-row"><span>Datum</span><span style="font-weight:600">${booking.trip?.departure_date || ""}</span></div>
      <div class="detail-row"><span>Abfahrt</span><span style="font-weight:600">${booking.trip?.departure_time || ""}</span></div>
      <div class="detail-row"><span>Ankunft</span><span style="font-weight:600">${booking.trip?.arrival_time || ""}</span></div>
    </div>
    <div class="total">Gesamtpreis: €${(booking.price_paid || 0).toFixed(2)}</div>
    <p style="margin-top:20px;">Bitte zeigen Sie diese Bestätigung beim Einsteigen vor.</p>
    <p>Ihr METROPOL TOURS Team</p>
  </div>
  <div class="footer"><p>${COMPANY.email} · ${COMPANY.phone}</p><p>© ${new Date().getFullYear()} METROPOL TOURS</p></div>
</div></body></html>`,
      });

      return new Response(JSON.stringify({ success: true, data: emailResponse }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "bookingId or tourBookingId required" }), {
      status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending booking confirmation:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
