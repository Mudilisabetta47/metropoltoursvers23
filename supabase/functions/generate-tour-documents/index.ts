import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  } catch { return dateStr; }
}

function formatShortDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return dateStr; }
}

function formatTime(time: string): string {
  return time?.slice(0, 5) || "";
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
  email: "info@metours.de",
  ustId: "DE123456789",
  steuerNr: "12/345/67890",
  hrb: "HRB 12345",
  web: "metours.de",
};

// SVG Logo for METROPOL TOURS (Bus icon + text)
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 48" width="280" height="48">
  <rect x="0" y="4" width="40" height="40" rx="10" fill="#00CC36"/>
  <path d="M10 18h20v12a4 4 0 01-4 4H14a4 4 0 01-4-4V18z" fill="none" stroke="white" stroke-width="2"/>
  <rect x="12" y="20" width="7" height="6" rx="1" fill="white" opacity="0.9"/>
  <rect x="21" y="20" width="7" height="6" rx="1" fill="white" opacity="0.9"/>
  <circle cx="15" cy="35" r="2.5" fill="white"/>
  <circle cx="25" cy="35" r="2.5" fill="white"/>
  <line x1="10" y1="15" x2="30" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <text x="50" y="22" font-family="Inter, Helvetica, Arial, sans-serif" font-size="19" font-weight="800" fill="white" letter-spacing="1">METROPOL</text>
  <text x="172" y="22" font-family="Inter, Helvetica, Arial, sans-serif" font-size="19" font-weight="800" fill="#00CC36" letter-spacing="1">TOURS</text>
  <text x="50" y="38" font-family="Inter, Helvetica, Arial, sans-serif" font-size="10" fill="white" opacity="0.8" letter-spacing="2">REISEN VERBINDET</text>
</svg>`;

const LOGO_SVG_DARK = LOGO_SVG.replace(/fill="white"/g, 'fill="#1a1a1a"').replace(/stroke="white"/g, 'stroke="#1a1a1a"').replace(/opacity="0.8"/g, 'opacity="0.5"').replace(/opacity="0.9"/g, 'opacity="0.85"');

// Professional base styles
const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f0f2f5; padding: 24px; color: #1a1a1a; -webkit-font-smoothing: antialiased; }
  .doc { max-width: 720px; margin: 0 auto; background: white; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 8px 30px rgba(0,0,0,0.06); }
  .header { background: linear-gradient(135deg, #0a3d1a 0%, #1a5f2a 50%, #228B22 100%); color: white; padding: 32px 40px; position: relative; overflow: hidden; }
  .header::after { content: ''; position: absolute; top: 0; right: 0; width: 200px; height: 100%; background: linear-gradient(135deg, transparent 40%, rgba(0,204,54,0.15) 100%); }
  .header-inner { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; }
  .header-meta { text-align: right; font-size: 12px; opacity: 0.85; line-height: 1.6; }
  .doc-type { margin-top: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; font-weight: 500; opacity: 0.7; }
  .content { padding: 36px 40px; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #1a5f2a; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #e8f5e9; display: flex; align-items: center; gap: 8px; }
  .section-title::before { content: ''; display: block; width: 4px; height: 16px; background: #00CC36; border-radius: 2px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .field { padding: 12px 16px; background: #f8faf9; border-radius: 8px; border: 1px solid #e8ede9; }
  .field .label { font-size: 10px; color: #6b7c6f; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px; font-weight: 600; }
  .field .value { font-size: 14px; font-weight: 600; color: #1a1a1a; }
  table { width: 100%; border-collapse: collapse; }
  table th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7c6f; padding: 10px 14px; border-bottom: 2px solid #e5e7eb; font-weight: 700; }
  table td { padding: 12px 14px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
  table tr:last-child td { border-bottom: none; }
  .total-row { background: #f0fdf4; }
  .total-row td { border-top: 2px solid #1a5f2a; font-size: 15px; font-weight: 700; color: #1a5f2a; }
  .footer { background: #fafafa; padding: 20px 40px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; line-height: 1.8; }
  .footer-line { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
  .badge { display: inline-block; background: #e8f5e9; color: #1a5f2a; padding: 4px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; }
  .status-badge { display: inline-block; padding: 5px 16px; border-radius: 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; }
  .highlight-box { background: linear-gradient(135deg, #0a3d1a 0%, #1a5f2a 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
  .highlight-box .amount { font-size: 32px; font-weight: 800; letter-spacing: -0.5px; }
  .highlight-box .lbl { font-size: 12px; opacity: 0.8; margin-top: 2px; }
  .bank-box { background: #fffbeb; border: 1px solid #fbbf24; border-radius: 10px; padding: 24px; margin-top: 24px; }
  .bank-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; border-bottom: 1px solid #fef3c7; }
  .bank-row:last-child { border-bottom: none; }
  .bank-label { color: #92400e; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .bank-value { font-weight: 700; color: #78350f; font-size: 14px; }
  .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
  .watermark { position: absolute; bottom: -20px; right: -20px; font-size: 120px; font-weight: 900; opacity: 0.03; color: white; z-index: 0; }
  @media print { 
    body { background: white; padding: 0; } 
    .doc { box-shadow: none; }
    .header::after { display: none; }
  }
`;

// ── BOOKING CONFIRMATION ──
function generateConfirmation(booking: any, tour: any, date: any, tariff: any, pickupStop: any, qrDataUrl: string): string {
  const passengers = Array.isArray(booking.passenger_details) ? booking.passenger_details : [];
  const luggageAddons = Array.isArray(booking.luggage_addons) ? booking.luggage_addons : [];
  const isPaid = booking.status === "confirmed" || booking.status === "paid";
  const statusLabel = isPaid ? "Bezahlt" : "Offen – Überweisung ausstehend";
  const statusBg = isPaid ? "#dcfce7" : "#fef3c7";
  const statusColor = isPaid ? "#166534" : "#92400e";

  const passengersHtml = passengers.map((p: any, i: number) => `
    <tr>
      <td style="font-weight:600; color:#666;">${i + 1}</td>
      <td style="font-weight:600;">${escapeHtml(p.firstName || '')} ${escapeHtml(p.lastName || '')}</td>
      <td>${escapeHtml(p.email || '')}</td>
      <td>${escapeHtml(p.phone || '–')}</td>
    </tr>
  `).join('');

  const addonsHtml = luggageAddons.length > 0 ? `
    <div class="section">
      <div class="section-title">Zusatzleistungen</div>
      <table>
        <tr><th>Leistung</th><th>Menge</th><th style="text-align:right">Preis</th></tr>
        ${luggageAddons.map((a: any) => `
          <tr>
            <td>${escapeHtml(a.name || '')}</td>
            <td>${a.quantity || 1}×</td>
            <td style="text-align:right">${((a.total || 0)).toFixed(2)} €</td>
          </tr>
        `).join('')}
      </table>
    </div>
  ` : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Buchungsbestätigung ${escapeHtml(booking.booking_number)}</title>
<style>${baseStyles}</style></head><body>
<div class="doc">
  <div class="header">
    <div class="header-inner">
      <div>
        ${LOGO_SVG}
        <div class="doc-type">Buchungsbestätigung</div>
      </div>
      <div class="header-meta">
        ${COMPANY.address}<br>
        Tel: ${COMPANY.phone}<br>
        ${COMPANY.email}
      </div>
    </div>
  </div>
  <div class="content">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; padding-bottom:20px; border-bottom:1px solid #eee;">
      <div>
        <div style="font-size:10px; color:#999; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Buchungsnummer</div>
        <div style="font-size:22px; font-weight:800; color:#1a5f2a; margin-top:2px;">${escapeHtml(booking.booking_number)}</div>
        <div style="font-size:12px; color:#888; margin-top:4px;">Erstellt am ${formatShortDate(booking.created_at)}</div>
      </div>
      <div>
        <span class="status-badge" style="background:${statusBg}; color:${statusColor};">
          ${isPaid ? '✓' : '⏳'} ${statusLabel}
        </span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Reisedetails</div>
      <div class="grid">
        <div class="field"><div class="label">Reiseziel</div><div class="value">${escapeHtml(tour.destination)}</div></div>
        <div class="field"><div class="label">Ort / Land</div><div class="value">${escapeHtml(tour.location)}, ${escapeHtml(tour.country)}</div></div>
        <div class="field"><div class="label">Hinreise</div><div class="value">${formatShortDate(date.departure_date)}</div></div>
        <div class="field"><div class="label">Rückreise</div><div class="value">${formatShortDate(date.return_date)}</div></div>
        <div class="field"><div class="label">Dauer</div><div class="value">${date.duration_days || tour.duration_days} Tage</div></div>
        <div class="field"><div class="label">Tarif</div><div class="value">${escapeHtml(tariff.name)}</div></div>
      </div>
    </div>

    ${pickupStop ? `
    <div class="section">
      <div class="section-title">Zustieg & Abfahrt</div>
      <div class="grid">
        <div class="field"><div class="label">Abfahrtsort</div><div class="value">${escapeHtml(pickupStop.city)} – ${escapeHtml(pickupStop.location_name)}</div></div>
        <div class="field"><div class="label">Abfahrtszeit</div><div class="value">${formatTime(pickupStop.departure_time)} Uhr</div></div>
        ${pickupStop.meeting_point ? `<div class="field" style="grid-column:span 2"><div class="label">Treffpunkt</div><div class="value">${escapeHtml(pickupStop.meeting_point)}</div></div>` : ''}
        ${pickupStop.address ? `<div class="field" style="grid-column:span 2"><div class="label">Adresse</div><div class="value">${escapeHtml(pickupStop.address)}</div></div>` : ''}
      </div>
      <div style="margin-top:12px; padding:12px 16px; background:#fff7ed; border-left:4px solid #f59e0b; border-radius:0 8px 8px 0; font-size:12px; color:#92400e;">
        <strong>Wichtig:</strong> Bitte erscheinen Sie mindestens 15 Minuten vor Abfahrt am Treffpunkt.
      </div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Teilnehmer (${booking.participants})</div>
      <table>
        <tr><th style="width:40px">#</th><th>Name</th><th>E-Mail</th><th>Telefon</th></tr>
        ${passengersHtml}
      </table>
    </div>

    <div class="section">
      <div class="section-title">Inklusivleistungen</div>
      <div class="grid">
        <div class="field"><div class="value">🏨 Übernachtung</div></div>
        <div class="field"><div class="value">☕ Frühstück</div></div>
        <div class="field"><div class="value">🚌 Hin- & Rückfahrt</div></div>
        ${tariff.suitcase_included ? `<div class="field"><div class="value">🧳 Koffer bis ${tariff.suitcase_weight_kg || 20}kg</div></div>` : `<div class="field"><div class="value">🎒 Handgepäck</div></div>`}
        ${tariff.seat_reservation ? `<div class="field"><div class="value">💺 Sitzplatzreservierung</div></div>` : ''}
        ${tariff.is_refundable ? `<div class="field"><div class="value">↩️ Stornierung bis ${tariff.cancellation_days}T vorher</div></div>` : ''}
      </div>
    </div>

    ${addonsHtml}

    <div class="section">
      <div class="section-title">Preisübersicht</div>
      <table>
        <tr><th>Position</th><th style="text-align:center">Menge</th><th style="text-align:right">Preis</th></tr>
        <tr>
          <td><strong>${escapeHtml(tariff.name)}-Tarif</strong><br><span style="font-size:11px; color:#888;">pro Person</span></td>
          <td style="text-align:center">${booking.participants}×</td>
          <td style="text-align:right">${booking.base_price.toFixed(2)} €</td>
        </tr>
        ${booking.pickup_surcharge > 0 ? `
        <tr>
          <td>Zustiegsaufpreis${pickupStop ? ' ' + escapeHtml(pickupStop.city) : ''}</td>
          <td style="text-align:center">1×</td>
          <td style="text-align:right">${booking.pickup_surcharge.toFixed(2)} €</td>
        </tr>` : ''}
        ${luggageAddons.map((a: any) => `
        <tr>
          <td>${escapeHtml(a.name || 'Zusatzgepäck')}</td>
          <td style="text-align:center">${a.quantity || 1}×</td>
          <td style="text-align:right">${(a.total || 0).toFixed(2)} €</td>
        </tr>`).join('')}
        ${booking.discount_amount > 0 ? `
        <tr>
          <td style="color:#16a34a;">Gutschein${booking.discount_code ? ' (' + escapeHtml(booking.discount_code) + ')' : ''}</td>
          <td style="text-align:center">1×</td>
          <td style="text-align:right; color:#16a34a;">−${booking.discount_amount.toFixed(2)} €</td>
        </tr>` : ''}
        <tr class="total-row">
          <td colspan="2" style="text-align:right;">Gesamtbetrag</td>
          <td style="text-align:right">${booking.total_price.toFixed(2)} €</td>
        </tr>
      </table>
    </div>

    ${!isPaid ? `
    <div class="bank-box">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
        <div style="width:36px; height:36px; background:#fbbf24; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:18px;">💳</div>
        <div>
          <div style="font-size:14px; font-weight:700; color:#78350f;">Überweisungsdaten</div>
          <div style="font-size:11px; color:#92400e;">Bitte innerhalb von 5 Werktagen überweisen</div>
        </div>
      </div>
      <div class="bank-row"><span class="bank-label">Empfänger</span><span class="bank-value">${BANK.recipient}</span></div>
      <div class="bank-row"><span class="bank-label">IBAN</span><span class="bank-value">${BANK.iban}</span></div>
      <div class="bank-row"><span class="bank-label">BIC</span><span class="bank-value">${BANK.bic}</span></div>
      <div class="bank-row"><span class="bank-label">Bank</span><span class="bank-value">${BANK.bank}</span></div>
      <div class="bank-row"><span class="bank-label">Verwendungszweck</span><span class="bank-value">${escapeHtml(booking.booking_number)}</span></div>
      <div class="bank-row"><span class="bank-label">Betrag</span><span class="bank-value">${booking.total_price.toFixed(2)} €</span></div>
    </div>
    ` : ''}

    <div class="highlight-box" style="margin-top:24px;">
      <div class="lbl">Gesamtpreis</div>
      <div class="amount">${booking.total_price.toFixed(2)} €</div>
      <div class="lbl">${booking.participants} Person${booking.participants > 1 ? 'en' : ''} · Tarif ${escapeHtml(tariff.name)}</div>
    </div>

    <div class="section" style="margin-top:28px;">
      <div class="section-title">Notfall & Kontakt</div>
      <div class="grid">
        <div class="field"><div class="label">24h Hotline</div><div class="value">${COMPANY.phone}</div></div>
        <div class="field"><div class="label">E-Mail</div><div class="value">${COMPANY.email}</div></div>
      </div>
    </div>

    ${qrDataUrl ? `
    <div style="text-align:center; margin-top:28px; padding-top:24px; border-top:2px dashed #e0e0e0;">
      <img src="${qrDataUrl}" alt="QR Code" style="width:120px; height:120px;" />
      <p style="font-size:11px; color:#999; margin-top:8px;">QR-Code beim Einstieg vorzeigen</p>
    </div>
    ` : ''}
  </div>
  <div class="footer">
    <div class="footer-line">
      <span>${COMPANY.name}</span><span>·</span>
      <span>${COMPANY.address}</span><span>·</span>
      <span>${COMPANY.hrb}</span><span>·</span>
      <span>USt-IdNr.: ${COMPANY.ustId}</span>
    </div>
    <div style="margin-top:4px;">AGB: ${COMPANY.web}/terms · Datenschutz: ${COMPANY.web}/privacy</div>
  </div>
</div></body></html>`;
}

// ── INVOICE ──
function generateInvoice(booking: any, tour: any, date: any, tariff: any, pickupStop: any): string {
  const invoiceNumber = `RE-${booking.booking_number.replace('MT-', '').replace('TRB-', '')}`;
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 14);
  const netPrice = booking.total_price / 1.19;
  const vatAmount = booking.total_price - netPrice;
  const luggageAddons = Array.isArray(booking.luggage_addons) ? booking.luggage_addons : [];

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Rechnung ${invoiceNumber}</title>
<style>${baseStyles}</style></head><body>
<div class="doc">
  <div class="header">
    <div class="header-inner">
      <div>
        ${LOGO_SVG}
        <div class="doc-type">Rechnung</div>
      </div>
      <div class="header-meta">
        ${COMPANY.address}<br>
        USt-IdNr.: ${COMPANY.ustId}<br>
        Steuernr.: ${COMPANY.steuerNr}
      </div>
    </div>
  </div>
  <div class="content">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:1px solid #eee;">
      <div>
        <div style="font-size:10px; color:#999; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Rechnungsempfänger</div>
        <div style="font-size:16px; font-weight:700; margin-top:4px;">${escapeHtml(booking.contact_first_name)} ${escapeHtml(booking.contact_last_name)}</div>
        <div style="font-size:13px; color:#666; margin-top:2px;">${escapeHtml(booking.contact_email)}</div>
        ${booking.contact_phone ? `<div style="font-size:13px; color:#666;">${escapeHtml(booking.contact_phone)}</div>` : ''}
      </div>
      <div style="text-align:right;">
        <div style="font-size:10px; color:#999; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Rechnungsnr.</div>
        <div style="font-size:20px; font-weight:800; color:#1a5f2a; margin-top:2px;">${escapeHtml(invoiceNumber)}</div>
        <div style="font-size:12px; color:#888; margin-top:6px;">
          Datum: ${formatShortDate(today.toISOString())}<br>
          Fällig: ${formatShortDate(dueDate.toISOString())}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Leistungen</div>
      <table>
        <tr><th>Beschreibung</th><th style="text-align:center">Menge</th><th style="text-align:right">Einzelpreis</th><th style="text-align:right">Gesamt</th></tr>
        <tr>
          <td>
            <strong>Pauschalreise ${escapeHtml(tour.destination)}</strong><br>
            <span style="font-size:11px; color:#888;">${formatShortDate(date.departure_date)} – ${formatShortDate(date.return_date)} · Tarif: ${escapeHtml(tariff.name)}</span>
          </td>
          <td style="text-align:center">${booking.participants}</td>
          <td style="text-align:right">${booking.base_price.toFixed(2)} €</td>
          <td style="text-align:right">${(booking.base_price * booking.participants).toFixed(2)} €</td>
        </tr>
        ${booking.pickup_surcharge > 0 ? `
        <tr>
          <td>Zustiegsaufpreis${pickupStop ? ' ' + escapeHtml(pickupStop.city) : ''}</td>
          <td style="text-align:center">${booking.participants}</td>
          <td style="text-align:right">${(booking.pickup_surcharge / booking.participants).toFixed(2)} €</td>
          <td style="text-align:right">${booking.pickup_surcharge.toFixed(2)} €</td>
        </tr>` : ''}
        ${luggageAddons.map((a: any) => `
        <tr>
          <td>${escapeHtml(a.name || 'Zusatzgepäck')}</td>
          <td style="text-align:center">${a.quantity || 1}</td>
          <td style="text-align:right">${(a.price_each || 0).toFixed(2)} €</td>
          <td style="text-align:right">${(a.total || 0).toFixed(2)} €</td>
        </tr>`).join('')}
        ${booking.discount_amount > 0 ? `
        <tr>
          <td style="color:#16a34a;">Gutschein${booking.discount_code ? ' (' + escapeHtml(booking.discount_code) + ')' : ''}</td>
          <td style="text-align:center">1</td>
          <td style="text-align:right"></td>
          <td style="text-align:right; color:#16a34a;">−${booking.discount_amount.toFixed(2)} €</td>
        </tr>` : ''}
      </table>
      <div style="margin-top:16px; border-top:2px solid #eee; padding-top:12px;">
        <div style="display:flex; justify-content:space-between; padding:4px 14px; font-size:13px; color:#666;">
          <span>Nettobetrag</span><span>${netPrice.toFixed(2)} €</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:4px 14px; font-size:13px; color:#666;">
          <span>Umsatzsteuer 19%</span><span>${vatAmount.toFixed(2)} €</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:12px 14px; font-size:18px; font-weight:800; color:#1a5f2a; background:#f0fdf4; border-radius:8px; margin-top:8px;">
          <span>Gesamtbetrag</span><span>${booking.total_price.toFixed(2)} €</span>
        </div>
      </div>
    </div>

    <div class="bank-box">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
        <div style="width:36px; height:36px; background:#fbbf24; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:18px;">💳</div>
        <div>
          <div style="font-size:14px; font-weight:700; color:#78350f;">Zahlungshinweis</div>
          <div style="font-size:11px; color:#92400e;">Bitte überweisen Sie bis zum ${formatShortDate(dueDate.toISOString())}</div>
        </div>
      </div>
      <div class="bank-row"><span class="bank-label">Empfänger</span><span class="bank-value">${BANK.recipient}</span></div>
      <div class="bank-row"><span class="bank-label">IBAN</span><span class="bank-value">${BANK.iban}</span></div>
      <div class="bank-row"><span class="bank-label">BIC</span><span class="bank-value">${BANK.bic}</span></div>
      <div class="bank-row"><span class="bank-label">Verwendungszweck</span><span class="bank-value">${escapeHtml(booking.booking_number)}</span></div>
    </div>

    <div style="margin-top:24px; font-size:10px; color:#aaa; line-height:1.8;">
      Es gelten die AGB der ${COMPANY.name}. Pauschalreisen sind nach §651a BGB abgesichert.
      Bei Fragen wenden Sie sich an ${COMPANY.email}.
    </div>
  </div>
  <div class="footer">
    <div class="footer-line">
      <span>${COMPANY.name}</span><span>·</span>
      <span>${COMPANY.address}</span><span>·</span>
      <span>${COMPANY.hrb}</span><span>·</span>
      <span>USt-IdNr.: ${COMPANY.ustId}</span>
    </div>
    <div style="margin-top:4px;">${COMPANY.web} · ${COMPANY.email} · ${COMPANY.phone}</div>
  </div>
</div></body></html>`;
}

// ── VOUCHER ──
function generateVoucher(booking: any, tour: any, date: any, tariff: any, pickupStop: any): string {
  const passengers = Array.isArray(booking.passenger_details) ? booking.passenger_details : [];

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Voucher ${escapeHtml(booking.booking_number)}</title>
<style>${baseStyles}
  .voucher-header { background: linear-gradient(135deg, #78350f 0%, #a16207 50%, #ca8a04 100%); }
</style></head><body>
<div class="doc">
  <div class="header voucher-header">
    <div class="header-inner">
      <div>
        ${LOGO_SVG}
        <div class="doc-type">Hotel Voucher · Leistungsträger-Gutschein</div>
      </div>
      <div class="header-meta">
        Buchung: ${escapeHtml(booking.booking_number)}
      </div>
    </div>
  </div>
  <div class="content">
    <div style="text-align:center; margin-bottom:28px; padding:20px; background:#fffbeb; border-radius:10px; border:1px solid #fde68a;">
      <div style="font-size:10px; color:#92400e; text-transform:uppercase; letter-spacing:2px; font-weight:700;">Voucher-Nr.</div>
      <div style="font-size:24px; font-weight:800; color:#78350f; margin-top:4px;">${escapeHtml(booking.booking_number)}</div>
    </div>

    <div class="section">
      <div class="section-title" style="color:#92400e; border-color:#fef3c7;">Buchungsdetails</div>
      <div class="grid">
        <div class="field"><div class="label">Reiseziel</div><div class="value">${escapeHtml(tour.destination)}</div></div>
        <div class="field"><div class="label">Ort</div><div class="value">${escapeHtml(tour.location)}</div></div>
        <div class="field"><div class="label">Check-in</div><div class="value">${formatShortDate(date.departure_date)}</div></div>
        <div class="field"><div class="label">Check-out</div><div class="value">${formatShortDate(date.return_date)}</div></div>
        <div class="field"><div class="label">Nächte</div><div class="value">${(date.duration_days || tour.duration_days) - 1}</div></div>
        <div class="field"><div class="label">Personen</div><div class="value">${booking.participants}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title" style="color:#92400e; border-color:#fef3c7;">Gäste</div>
      <table>
        <tr><th style="width:40px">#</th><th>Name</th></tr>
        ${passengers.map((p: any, i: number) => `
          <tr><td style="font-weight:600; color:#666;">${i + 1}</td><td style="font-weight:600;">${escapeHtml(p.firstName || '')} ${escapeHtml(p.lastName || '')}</td></tr>
        `).join('')}
      </table>
    </div>

    <div class="section">
      <div class="section-title" style="color:#92400e; border-color:#fef3c7;">Gebuchte Leistungen</div>
      <div class="grid">
        <div class="field"><div class="value">🛏️ Übernachtung</div><div class="label">${(date.duration_days || tour.duration_days) - 1} Nächte</div></div>
        <div class="field"><div class="value">☕ Frühstück</div><div class="label">Täglich inklusive</div></div>
      </div>
    </div>

    <div style="background:#fffbeb; padding:20px; border-radius:10px; border:1px solid #fde68a; margin-top:24px;">
      <div style="font-size:13px; font-weight:700; color:#78350f; margin-bottom:8px;">📋 Hinweis für den Leistungsträger</div>
      <p style="font-size:12px; color:#92400e; line-height:1.7; margin:0;">
        Dieser Voucher bestätigt die Buchung über METROPOL TOURS.
        Die Abrechnung erfolgt direkt mit ${COMPANY.name}.
        Bitte keine Zahlung vom Gast verlangen.
      </p>
      <p style="font-size:12px; color:#92400e; margin-top:10px; font-weight:600;">
        Kontakt Reiseleitung: ${COMPANY.phone}
      </p>
    </div>
  </div>
  <div class="footer">
    <div class="footer-line">
      <span>${COMPANY.name}</span><span>·</span>
      <span>${COMPANY.address}</span><span>·</span>
      <span>${COMPANY.email}</span>
    </div>
  </div>
</div></body></html>`;
}

// ── TRAVEL PLAN ──
function generateTravelPlan(booking: any, tour: any, date: any, tariff: any, pickupStop: any): string {
  const durationDays = date.duration_days || tour.duration_days || 7;
  const itinerary = Array.isArray(tour.itinerary) ? tour.itinerary : [];

  let timelineHtml = '';
  for (let day = 1; day <= durationDays; day++) {
    const itineraryDay = itinerary.find((item: any) => item.day === day);
    let dayContent = '';
    let dayTitle = '';
    if (day === 1) {
      dayTitle = 'Anreise';
      dayContent = `<strong>Abfahrt:</strong> ${pickupStop ? `${escapeHtml(pickupStop.city)} um ${formatTime(pickupStop.departure_time)} Uhr` : 'Siehe Buchungsbestätigung'}<br>
        <strong>Ankunft:</strong> ${escapeHtml(tour.location)} · Hotel Check-in`;
    } else if (day === durationDays) {
      dayTitle = 'Heimreise';
      dayContent = `<strong>Abreise:</strong> Hotel Check-out & Rückfahrt<br>
        <strong>Ankunft:</strong> Voraussichtlich am Abend`;
    } else {
      dayTitle = itineraryDay?.title || 'Programm / Freizeit';
      dayContent = itineraryDay?.description
        ? escapeHtml(itineraryDay.description)
        : `Frühstück im Hotel · Programm / Freizeit · Rückkehr zum Hotel`;
    }

    timelineHtml += `
      <div style="display:flex; gap:20px; margin-bottom:20px;">
        <div style="min-width:56px; text-align:center;">
          <div style="background:linear-gradient(135deg, #0a3d1a, #1a5f2a); color:white; width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:800; margin:0 auto;">
            ${day}
          </div>
        </div>
        <div style="flex:1; padding:16px 20px; background:#f8faf9; border-radius:12px; border-left:4px solid #00CC36;">
          <div style="font-size:13px; font-weight:700; color:#1a5f2a; margin-bottom:6px;">${dayTitle}</div>
          <div style="font-size:14px; line-height:1.7; color:#444;">${dayContent}</div>
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reiseplan – ${escapeHtml(tour.destination)}</title>
<style>${baseStyles}
  body { font-size: 15px; }
</style></head><body>
<div class="doc">
  <div class="header" style="text-align:center; padding:40px;">
    <div style="display:inline-block; margin-bottom:12px;">
      ${LOGO_SVG}
    </div>
    <h1 style="font-size:28px; font-weight:800; margin-top:16px;">Dein Reiseplan</h1>
    <div style="font-size:16px; opacity:0.9; margin-top:6px;">${escapeHtml(tour.destination)} – auf einen Blick</div>
  </div>
  <div class="content">

    <div style="background:#f0fdf4; border-radius:12px; padding:24px; margin-bottom:28px; border:1px solid #dcfce7;">
      <div style="font-size:13px; font-weight:700; color:#1a5f2a; margin-bottom:16px; text-transform:uppercase; letter-spacing:1px;">📋 Wichtige Infos auf einen Blick</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
        <div style="display:flex; align-items:center; gap:12px; font-size:14px;">
          <span style="font-size:22px;">🕐</span>
          <div><span style="color:#6b7c6f; font-size:11px; display:block;">Abfahrt</span><strong>${pickupStop ? `${formatTime(pickupStop.departure_time)} Uhr` : 'Siehe Bestätigung'}</strong></div>
        </div>
        <div style="display:flex; align-items:center; gap:12px; font-size:14px;">
          <span style="font-size:22px;">📍</span>
          <div><span style="color:#6b7c6f; font-size:11px; display:block;">Treffpunkt</span><strong>${pickupStop ? `${escapeHtml(pickupStop.city)}` : 'Siehe Bestätigung'}</strong></div>
        </div>
        <div style="display:flex; align-items:center; gap:12px; font-size:14px;">
          <span style="font-size:22px;">📅</span>
          <div><span style="color:#6b7c6f; font-size:11px; display:block;">Hinreise</span><strong>${formatShortDate(date.departure_date)}</strong></div>
        </div>
        <div style="display:flex; align-items:center; gap:12px; font-size:14px;">
          <span style="font-size:22px;">📅</span>
          <div><span style="color:#6b7c6f; font-size:11px; display:block;">Rückreise</span><strong>${formatShortDate(date.return_date)}</strong></div>
        </div>
        <div style="display:flex; align-items:center; gap:12px; font-size:14px;">
          <span style="font-size:22px;">👥</span>
          <div><span style="color:#6b7c6f; font-size:11px; display:block;">Reisende</span><strong>${booking.participants} Person(en)</strong></div>
        </div>
        <div style="display:flex; align-items:center; gap:12px; font-size:14px;">
          <span style="font-size:22px;">📞</span>
          <div><span style="color:#6b7c6f; font-size:11px; display:block;">Notfall-Hotline</span><strong>${COMPANY.phone}</strong></div>
        </div>
      </div>
    </div>

    <div class="section-title" style="font-size:14px;">Dein Reiseablauf</div>
    ${timelineHtml}

    <div class="section-title" style="font-size:14px; margin-top:32px;">Checkliste – Was mitnehmen?</div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      ${['Personalausweis / Reisepass', 'Buchungsbestätigung', 'Medikamente', 'Bequeme Schuhe', 'Ladekabel', 'Sonnencreme & Brille', 'Bargeld / EC-Karte', 'Jacke / Regenschutz', 'Snacks & Getränke'].map(item => `
        <div style="display:flex; align-items:center; gap:10px; padding:10px 14px; background:#f8faf9; border-radius:8px; font-size:13px; border:1px solid #e8ede9;">
          <span style="color:#00CC36; font-size:16px; font-weight:700;">☐</span>
          ${item}
        </div>
      `).join('')}
    </div>

    <div style="margin-top:32px; padding:24px; background:linear-gradient(135deg, #0a3d1a, #1a5f2a); border-radius:12px; text-align:center; color:white;">
      <div style="font-size:18px; font-weight:700; margin-bottom:8px;">Fragen? Wir sind für Sie da!</div>
      <div style="font-size:14px; opacity:0.9;">📞 ${COMPANY.phone} · ✉️ ${COMPANY.email}</div>
      <div style="font-size:16px; margin-top:12px; font-weight:700;">Wir wünschen Ihnen eine wunderbare Reise! 🌍</div>
    </div>
  </div>
  <div class="footer">
    <div class="footer-line">
      <span>${COMPANY.name}</span><span>·</span>
      <span>${COMPANY.address}</span><span>·</span>
      <span>${COMPANY.email}</span>
    </div>
  </div>
</div></body></html>`;
}

// ── MAIN HANDLER ──
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const { bookingId, bookingNumber, documentType = "all" } = await req.json();

    if (!bookingId && !bookingNumber) {
      return new Response(JSON.stringify({ error: "bookingId or bookingNumber required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabaseAuth.auth.getUser();
      userId = user?.id || null;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase.from("tour_bookings").select("*");
    if (bookingId) query = query.eq("id", bookingId);
    else query = query.eq("booking_number", bookingNumber);
    const { data: booking, error: bookingError } = await query.single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (userId && booking.user_id && booking.user_id !== userId) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      const isAdmin = roles?.some((r: any) => r.role === "admin");
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const [tourRes, dateRes, tariffRes, pickupRes] = await Promise.all([
      supabase.from("package_tours").select("*").eq("id", booking.tour_id).single(),
      supabase.from("tour_dates").select("*").eq("id", booking.tour_date_id).single(),
      supabase.from("tour_tariffs").select("*").eq("id", booking.tariff_id).single(),
      booking.pickup_stop_id
        ? supabase.from("tour_pickup_stops").select("*").eq("id", booking.pickup_stop_id).single()
        : Promise.resolve({ data: null }),
    ]);

    const tour = tourRes.data;
    const date = dateRes.data;
    const tariff = tariffRes.data;
    const pickupStop = pickupRes.data;

    if (!tour || !date || !tariff) {
      return new Response(JSON.stringify({ error: "Related data not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const qrData = JSON.stringify({ b: booking.booking_number, p: booking.participants });
    let qrDataUrl = "";
    try {
      const qrSvg = await QRCode.toString(qrData, { type: "svg", width: 140, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
      qrDataUrl = `data:image/svg+xml;base64,${btoa(qrSvg)}`;
    } catch (qrErr) {
      console.error("QR generation failed:", qrErr);
    }

    const documents: Record<string, string> = {};

    if (documentType === "all" || documentType === "confirmation") {
      documents.confirmation = generateConfirmation(booking, tour, date, tariff, pickupStop, qrDataUrl);
    }
    if (documentType === "all" || documentType === "invoice") {
      documents.invoice = generateInvoice(booking, tour, date, tariff, pickupStop);
    }
    if (documentType === "all" || documentType === "voucher") {
      documents.voucher = generateVoucher(booking, tour, date, tariff, pickupStop);
    }
    if (documentType === "all" || documentType === "travelplan") {
      documents.travelplan = generateTravelPlan(booking, tour, date, tariff, pickupStop);
    }

    return new Response(JSON.stringify({
      success: true,
      bookingNumber: booking.booking_number,
      documents,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating documents:", error);
    return new Response(JSON.stringify({ error: "Failed to generate documents" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
