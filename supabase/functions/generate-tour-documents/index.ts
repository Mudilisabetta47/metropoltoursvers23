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
};

// Shared styles
const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: #f5f5f5; padding: 20px; color: #1a1a1a; }
  .doc { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%); color: white; padding: 28px 32px; }
  .header h1 { font-size: 22px; font-weight: 700; }
  .header .sub { font-size: 13px; opacity: 0.9; margin-top: 4px; }
  .content { padding: 28px 32px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1a5f2a; margin-bottom: 12px; border-bottom: 2px solid #e8f5e9; padding-bottom: 6px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field { padding: 10px 14px; background: #f8f9fa; border-radius: 8px; }
  .field .label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .field .value { font-size: 15px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; }
  table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
  table tr:last-child td { border-bottom: none; }
  .total-row { background: #f0fdf4; font-weight: 700; }
  .total-row td { border-top: 2px solid #1a5f2a; font-size: 16px; }
  .footer { background: #f8f9fa; padding: 16px 32px; font-size: 11px; color: #666; text-align: center; border-top: 1px solid #e5e7eb; }
  .badge { display: inline-block; background: #e8f5e9; color: #1a5f2a; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  .highlight-box { background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%); color: white; padding: 16px; border-radius: 10px; text-align: center; }
  .highlight-box .amount { font-size: 28px; font-weight: 700; }
  .highlight-box .lbl { font-size: 12px; opacity: 0.9; }
  .bank-box { background: #fffbeb; border: 2px solid #f59e0b; border-radius: 10px; padding: 20px; margin-top: 20px; }
  .bank-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .bank-label { color: #92400e; font-size: 12px; }
  .bank-value { font-weight: 700; color: #78350f; }
  @media print { body { background: white; padding: 0; } .doc { box-shadow: none; } }
`;

// ── BOOKING CONFIRMATION (with bank details, contact, QR) ──
function generateConfirmation(booking: any, tour: any, date: any, tariff: any, pickupStop: any, qrDataUrl: string): string {
  const passengers = Array.isArray(booking.passenger_details) ? booking.passenger_details : [];
  const luggageAddons = Array.isArray(booking.luggage_addons) ? booking.luggage_addons : [];
  const isPaid = booking.status === "confirmed" || booking.status === "paid";
  const statusLabel = isPaid ? "✓ Bezahlt" : "⏳ Offen – Überweisung ausstehend";
  const statusColor = isPaid ? "#22c55e" : "#f59e0b";

  const passengersHtml = passengers.map((p: any, i: number) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(p.firstName || '')} ${escapeHtml(p.lastName || '')}</td>
      <td>${escapeHtml(p.email || '')}</td>
      <td>${escapeHtml(p.phone || '-')}</td>
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
            <td>${a.quantity || 1}x</td>
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
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h1>🚌 METROPOL TOURS</h1>
        <div class="sub">Buchungsbestätigung</div>
      </div>
      <div style="text-align:right; font-size:12px; opacity:0.85;">
        ${COMPANY.address}<br>
        Tel: ${COMPANY.phone}<br>
        ${COMPANY.email}
      </div>
    </div>
  </div>
  <div class="content">
    <div style="text-align:center; margin-bottom:24px;">
      <span class="badge" style="font-size:16px; padding:8px 20px;">
        ${escapeHtml(booking.booking_number)}
      </span>
      <p style="margin-top:8px; color:#666; font-size:13px;">Buchungsdatum: ${formatShortDate(booking.created_at)}</p>
      <div style="margin-top:8px;">
        <span style="padding:4px 12px; border-radius:6px; font-size:13px; font-weight:600; color:white; background:${statusColor};">${statusLabel}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Buchungsdaten</div>
      <div class="grid">
        <div class="field"><div class="label">Buchungsnummer</div><div class="value">${escapeHtml(booking.booking_number)}</div></div>
        <div class="field"><div class="label">Zahlungsart</div><div class="value">Überweisung</div></div>
        <div class="field"><div class="label">Buchungsdatum</div><div class="value">${formatShortDate(booking.created_at)}</div></div>
        <div class="field"><div class="label">Status</div><div class="value">${isPaid ? 'Bezahlt' : 'Offen'}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Reisedetails</div>
      <div class="grid">
        <div class="field"><div class="label">Reiseziel</div><div class="value">${escapeHtml(tour.destination)}</div></div>
        <div class="field"><div class="label">Ort</div><div class="value">${escapeHtml(tour.location)}, ${escapeHtml(tour.country)}</div></div>
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
        ${pickupStop.meeting_point ? `<div class="field" style="grid-column: span 2"><div class="label">Treffpunkt</div><div class="value">${escapeHtml(pickupStop.meeting_point)}</div></div>` : ''}
        ${pickupStop.address ? `<div class="field" style="grid-column: span 2"><div class="label">Adresse</div><div class="value">${escapeHtml(pickupStop.address)}</div></div>` : ''}
      </div>
      <div style="margin-top:10px; padding:10px; background:#fff3cd; border-radius:8px; font-size:13px; color:#856404;">
        ⚠️ Bitte erscheinen Sie mindestens <strong>15 Minuten vor Abfahrt</strong> am Treffpunkt.
      </div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Teilnehmer (${booking.participants})</div>
      <table>
        <tr><th>#</th><th>Name</th><th>E-Mail</th><th>Telefon</th></tr>
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
          <td>Grundpreis (${escapeHtml(tariff.name)})</td>
          <td style="text-align:center">${booking.participants}x</td>
          <td style="text-align:right">${booking.base_price.toFixed(2)} € p.P.</td>
        </tr>
        ${booking.pickup_surcharge > 0 ? `
        <tr>
          <td>Zustiegsaufpreis ${pickupStop ? escapeHtml(pickupStop.city) : ''}</td>
          <td style="text-align:center">1x</td>
          <td style="text-align:right">${booking.pickup_surcharge.toFixed(2)} €</td>
        </tr>` : ''}
        ${luggageAddons.map((a: any) => `
        <tr>
          <td>${escapeHtml(a.name || 'Zusatzgepäck')}</td>
          <td style="text-align:center">${a.quantity || 1}x</td>
          <td style="text-align:right">${(a.total || 0).toFixed(2)} €</td>
        </tr>`).join('')}
        ${booking.discount_amount > 0 ? `
        <tr>
          <td style="color:#16a34a;">Gutschein${booking.discount_code ? ' (' + escapeHtml(booking.discount_code) + ')' : ''}</td>
          <td style="text-align:center">1x</td>
          <td style="text-align:right; color:#16a34a;">-${booking.discount_amount.toFixed(2)} €</td>
        </tr>` : ''}
        <tr class="total-row">
          <td colspan="2" style="text-align:right;">Gesamtbetrag</td>
          <td style="text-align:right">${booking.total_price.toFixed(2)} €</td>
        </tr>
      </table>
    </div>

    ${!isPaid ? `
    <div class="bank-box">
      <h3 style="margin:0 0 12px; color:#92400e; font-size:16px; font-weight:700;">💳 Überweisungsdaten</h3>
      <p style="font-size:13px; color:#92400e; margin-bottom:12px;">Bitte überweisen Sie den Betrag innerhalb von 5 Werktagen.</p>
      <div class="bank-row"><span class="bank-label">Empfänger</span><span class="bank-value">${BANK.recipient}</span></div>
      <div class="bank-row"><span class="bank-label">IBAN</span><span class="bank-value">${BANK.iban}</span></div>
      <div class="bank-row"><span class="bank-label">BIC</span><span class="bank-value">${BANK.bic}</span></div>
      <div class="bank-row"><span class="bank-label">Bank</span><span class="bank-value">${BANK.bank}</span></div>
      <div class="bank-row"><span class="bank-label">Verwendungszweck</span><span class="bank-value">Buchung ${escapeHtml(booking.booking_number)}</span></div>
      <div class="bank-row"><span class="bank-label">Betrag</span><span class="bank-value">${booking.total_price.toFixed(2)} €</span></div>
    </div>
    ` : ''}

    <div class="highlight-box" style="margin-top:20px;">
      <div class="lbl">Gesamtpreis</div>
      <div class="amount">${booking.total_price.toFixed(2)} €</div>
      <div class="lbl">${booking.participants} Personen • Tarif ${escapeHtml(tariff.name)}</div>
    </div>

    <div class="section" style="margin-top:24px;">
      <div class="section-title">Notfall & Kontakt</div>
      <div class="grid">
        <div class="field"><div class="label">Hotline</div><div class="value">${COMPANY.phone}</div></div>
        <div class="field"><div class="label">E-Mail</div><div class="value">${COMPANY.email}</div></div>
      </div>
    </div>

    <div style="text-align:center; margin-top:24px; padding-top:20px; border-top:2px dashed #e0e0e0;">
      <img src="${qrDataUrl}" alt="QR Code" style="width:140px; height:140px;" />
      <p style="font-size:12px; color:#666; margin-top:8px;">Bitte QR-Code beim Einstieg vorzeigen</p>
    </div>
  </div>
  <div class="footer">
    <p>${COMPANY.name} • ${COMPANY.address} • ${COMPANY.hrb} • USt-IdNr.: ${COMPANY.ustId}</p>
    <p style="margin-top:4px;">AGB & Datenschutz: metours.de/terms • metours.de/privacy</p>
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
<style>${baseStyles}
  .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
  .company-info { font-size: 12px; line-height: 1.6; color: #444; }
  .invoice-meta { text-align: right; }
  .invoice-meta .inv-num { font-size: 20px; font-weight: 700; color: #1a5f2a; }
</style></head><body>
<div class="doc">
  <div class="header">
    <h1>🚌 METROPOL TOURS</h1>
    <div class="sub">Rechnung</div>
  </div>
  <div class="content">
    <div class="invoice-header">
      <div class="company-info">
        <strong>${COMPANY.name}</strong><br>
        ${COMPANY.address}<br>
        USt-IdNr.: ${COMPANY.ustId}<br>
        Steuernummer: ${COMPANY.steuerNr}
      </div>
      <div class="invoice-meta">
        <div class="inv-num">${escapeHtml(invoiceNumber)}</div>
        <p style="font-size:13px; color:#666; margin-top:4px;">
          Datum: ${formatShortDate(today.toISOString())}<br>
          Fällig: ${formatShortDate(dueDate.toISOString())}
        </p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Rechnungsempfänger</div>
      <div class="field" style="max-width:300px;">
        <div class="value">${escapeHtml(booking.contact_first_name)} ${escapeHtml(booking.contact_last_name)}</div>
        <div style="font-size:13px; color:#666; margin-top:4px;">${escapeHtml(booking.contact_email)}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Leistungen</div>
      <table>
        <tr><th>Beschreibung</th><th style="text-align:center">Menge</th><th style="text-align:right">Einzelpreis</th><th style="text-align:right">Gesamt</th></tr>
        <tr>
          <td>Pauschalreise ${escapeHtml(tour.destination)}<br>
            <span style="font-size:12px; color:#666;">${formatShortDate(date.departure_date)} – ${formatShortDate(date.return_date)} • Tarif: ${escapeHtml(tariff.name)}</span>
          </td>
          <td style="text-align:center">${booking.participants}</td>
          <td style="text-align:right">${booking.base_price.toFixed(2)} €</td>
          <td style="text-align:right">${(booking.base_price * booking.participants).toFixed(2)} €</td>
        </tr>
        ${booking.pickup_surcharge > 0 ? `
        <tr>
          <td>Zustiegsaufpreis ${pickupStop ? escapeHtml(pickupStop.city) : ''}</td>
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
          <td style="text-align:right; color:#16a34a;">-${booking.discount_amount.toFixed(2)} €</td>
        </tr>` : ''}
        <tr>
          <td colspan="3" style="text-align:right; font-size:13px;">Nettobetrag</td>
          <td style="text-align:right">${netPrice.toFixed(2)} €</td>
        </tr>
        <tr>
          <td colspan="3" style="text-align:right; font-size:13px;">USt. 19%</td>
          <td style="text-align:right">${vatAmount.toFixed(2)} €</td>
        </tr>
        <tr class="total-row">
          <td colspan="3" style="text-align:right;">Gesamtbetrag</td>
          <td style="text-align:right">${booking.total_price.toFixed(2)} €</td>
        </tr>
      </table>
    </div>

    <div class="bank-box">
      <h3 style="margin:0 0 12px; color:#92400e; font-size:16px;">💳 Zahlungshinweis</h3>
      <p style="font-size:13px; color:#92400e; margin-bottom:10px;">Bitte überweisen Sie den Gesamtbetrag bis zum <strong>${formatShortDate(dueDate.toISOString())}</strong>.</p>
      <div class="bank-row"><span class="bank-label">Empfänger</span><span class="bank-value">${BANK.recipient}</span></div>
      <div class="bank-row"><span class="bank-label">IBAN</span><span class="bank-value">${BANK.iban}</span></div>
      <div class="bank-row"><span class="bank-label">BIC</span><span class="bank-value">${BANK.bic}</span></div>
      <div class="bank-row"><span class="bank-label">Verwendungszweck</span><span class="bank-value">${escapeHtml(booking.booking_number)}</span></div>
    </div>

    <div class="section" style="margin-top:20px; font-size:11px; color:#888; line-height:1.6;">
      <p>Es gelten die AGB der ${COMPANY.name}. Pauschalreisen sind nach §651a BGB abgesichert. 
      Bei Fragen wenden Sie sich an ${COMPANY.email}.</p>
    </div>
  </div>
  <div class="footer">
    <p>${COMPANY.name} • ${COMPANY.address} • ${COMPANY.hrb} • USt-IdNr.: ${COMPANY.ustId}</p>
  </div>
</div></body></html>`;
}

// ── VOUCHER ──
function generateVoucher(booking: any, tour: any, date: any, tariff: any, pickupStop: any): string {
  const passengers = Array.isArray(booking.passenger_details) ? booking.passenger_details : [];

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Voucher ${escapeHtml(booking.booking_number)}</title>
<style>${baseStyles}
  .voucher-badge { background: #fef3c7; color: #92400e; padding: 6px 16px; border-radius: 20px; font-weight: 700; display: inline-block; font-size: 14px; }
</style></head><body>
<div class="doc">
  <div class="header" style="background: linear-gradient(135deg, #92400e 0%, #b45309 100%);">
    <h1>🏨 HOTEL VOUCHER</h1>
    <div class="sub">METROPOL TOURS – Leistungsträger-Gutschein</div>
  </div>
  <div class="content">
    <div style="text-align:center; margin-bottom:24px;">
      <span class="voucher-badge">${escapeHtml(booking.booking_number)}</span>
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
        <tr><th>#</th><th>Name</th></tr>
        ${passengers.map((p: any, i: number) => `
          <tr><td>${i + 1}</td><td>${escapeHtml(p.firstName || '')} ${escapeHtml(p.lastName || '')}</td></tr>
        `).join('')}
      </table>
    </div>
    <div class="section">
      <div class="section-title" style="color:#92400e; border-color:#fef3c7;">Gebuchte Leistungen</div>
      <div class="grid">
        <div class="field"><div class="value">🛏️ Übernachtung</div><div class="label">${(date.duration_days || tour.duration_days) - 1} Nächte</div></div>
        <div class="field"><div class="value">☕ Frühstück</div><div class="label">Täglich inkl.</div></div>
      </div>
    </div>
    <div class="section" style="background:#fef3c7; padding:16px; border-radius:10px; font-size:13px;">
      <p><strong>Hinweis für den Leistungsträger:</strong></p>
      <p style="margin-top:8px;">Dieser Voucher bestätigt die Buchung über METROPOL TOURS. 
      Die Abrechnung erfolgt direkt mit ${COMPANY.name}. 
      Bitte keine Zahlung vom Gast verlangen.</p>
      <p style="margin-top:8px;"><strong>Kontakt Reiseleitung:</strong> ${COMPANY.phone}</p>
    </div>
  </div>
  <div class="footer">
    <p>${COMPANY.name} • ${COMPANY.address} • ${COMPANY.email}</p>
  </div>
</div></body></html>`;
}

// ── SENIOR-FRIENDLY TRAVEL PLAN ──
function generateTravelPlan(booking: any, tour: any, date: any, tariff: any, pickupStop: any): string {
  const durationDays = date.duration_days || tour.duration_days || 7;
  const itinerary = Array.isArray(tour.itinerary) ? tour.itinerary : [];

  // Build day-by-day timeline
  let timelineHtml = '';
  for (let day = 1; day <= durationDays; day++) {
    const itineraryDay = itinerary.find((item: any) => item.day === day);
    let dayContent = '';
    if (day === 1) {
      dayContent = `<strong>Abfahrt:</strong> ${pickupStop ? `${escapeHtml(pickupStop.city)} um ${formatTime(pickupStop.departure_time)} Uhr` : 'Siehe Buchungsbestätigung'}<br>
        <strong>Ankunft:</strong> ${escapeHtml(tour.location)} • Hotel Check-in`;
    } else if (day === durationDays) {
      dayContent = `<strong>Rückreise:</strong> Abreise aus ${escapeHtml(tour.location)}<br>
        <strong>Ankunft:</strong> Voraussichtlich am Abend`;
    } else {
      dayContent = itineraryDay?.description
        ? escapeHtml(itineraryDay.description)
        : `Frühstück im Hotel → Programm/Freizeit → Abendessen`;
    }

    timelineHtml += `
      <div style="display:flex; gap:16px; margin-bottom:16px;">
        <div style="min-width:60px; text-align:center;">
          <div style="background:#1a5f2a; color:white; width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:800; margin:0 auto;">
            ${day}
          </div>
          <div style="font-size:12px; color:#666; margin-top:4px;">Tag ${day}</div>
        </div>
        <div style="flex:1; padding:14px 18px; background:#f0fdf4; border-radius:12px; border-left:4px solid #1a5f2a; font-size:15px; line-height:1.7;">
          ${dayContent}
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reiseplan – ${escapeHtml(tour.destination)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #f5f5f5; padding: 20px; color: #1a1a1a; font-size: 16px; line-height: 1.6; }
  .doc { max-width: 700px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%); color: white; padding: 36px 32px; text-align: center; }
  .header h1 { font-size: 28px; font-weight: 800; }
  .header .sub { font-size: 16px; opacity: 0.9; margin-top: 6px; }
  .content { padding: 32px; }
  .info-box { background: #e8f5e9; border-radius: 14px; padding: 20px; margin-bottom: 24px; }
  .info-box h2 { font-size: 18px; font-weight: 700; color: #1a5f2a; margin-bottom: 14px; }
  .info-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #c8e6c9; font-size: 16px; }
  .info-item:last-child { border-bottom: none; }
  .info-icon { font-size: 24px; min-width: 36px; text-align: center; }
  .section-title { font-size: 20px; font-weight: 800; color: #1a5f2a; margin: 28px 0 16px; padding-bottom: 8px; border-bottom: 3px solid #e8f5e9; }
  .checklist { list-style: none; }
  .checklist li { padding: 10px 14px; margin-bottom: 8px; background: #f8f9fa; border-radius: 10px; font-size: 16px; display: flex; align-items: center; gap: 12px; }
  .checklist li .check { color: #1a5f2a; font-size: 20px; font-weight: 700; }
  .footer { background: #f8f9fa; padding: 20px 32px; font-size: 13px; color: #666; text-align: center; border-top: 1px solid #e5e7eb; }
  @media print { body { background: white; padding: 0; font-size: 14px; } .doc { box-shadow: none; } }
</style></head><body>
<div class="doc">
  <div class="header">
    <h1>🗺️ Dein Reiseplan</h1>
    <div class="sub">${escapeHtml(tour.destination)} – auf einen Blick</div>
  </div>
  <div class="content">

    <!-- Important Info Box -->
    <div class="info-box">
      <h2>📋 Wichtige Infos</h2>
      <div class="info-item">
        <span class="info-icon">🕐</span>
        <div><strong>Abfahrt:</strong> ${pickupStop ? `${formatTime(pickupStop.departure_time)} Uhr` : 'Siehe Bestätigung'}</div>
      </div>
      <div class="info-item">
        <span class="info-icon">📍</span>
        <div><strong>Treffpunkt:</strong> ${pickupStop ? `${escapeHtml(pickupStop.city)} – ${escapeHtml(pickupStop.location_name)}${pickupStop.address ? ', ' + escapeHtml(pickupStop.address) : ''}` : 'Siehe Bestätigung'}</div>
      </div>
      <div class="info-item">
        <span class="info-icon">📅</span>
        <div><strong>Hinreise:</strong> ${formatDate(date.departure_date)}</div>
      </div>
      <div class="info-item">
        <span class="info-icon">📅</span>
        <div><strong>Rückreise:</strong> ${formatDate(date.return_date)}</div>
      </div>
      <div class="info-item">
        <span class="info-icon">👥</span>
        <div><strong>Reisende:</strong> ${booking.participants} Person(en)</div>
      </div>
      <div class="info-item">
        <span class="info-icon">📞</span>
        <div><strong>Notfall-Hotline:</strong> ${COMPANY.phone}</div>
      </div>
    </div>

    <!-- Timeline -->
    <div class="section-title">🚌 Dein Reiseablauf</div>
    ${timelineHtml}

    <!-- Checklist -->
    <div class="section-title">✅ Checkliste – Was mitnehmen?</div>
    <ul class="checklist">
      <li><span class="check">☐</span> Personalausweis / Reisepass</li>
      <li><span class="check">☐</span> Buchungsbestätigung (ausgedruckt oder Handy)</li>
      <li><span class="check">☐</span> Medikamente (falls nötig)</li>
      <li><span class="check">☐</span> Bequeme Schuhe für Ausflüge</li>
      <li><span class="check">☐</span> Ladekabel für Handy</li>
      <li><span class="check">☐</span> Sonnencreme & Sonnenbrille</li>
      <li><span class="check">☐</span> Bargeld / EC-Karte</li>
      <li><span class="check">☐</span> Leichte Jacke / Regenschutz</li>
      <li><span class="check">☐</span> Snacks & Getränke für die Fahrt</li>
    </ul>

    <!-- Contact Box -->
    <div style="margin-top:28px; padding:20px; background:#e8f5e9; border-radius:14px; text-align:center;">
      <p style="font-size:18px; font-weight:700; color:#1a5f2a; margin-bottom:8px;">Fragen? Wir sind für Sie da!</p>
      <p style="font-size:16px;">📞 ${COMPANY.phone}</p>
      <p style="font-size:16px;">✉️ ${COMPANY.email}</p>
    </div>

    <p style="text-align:center; margin-top:24px; font-size:16px; color:#1a5f2a; font-weight:700;">
      Wir wünschen Ihnen eine wunderbare Reise! 🌍
    </p>
  </div>
  <div class="footer">
    <p>${COMPANY.name} • ${COMPANY.address} • ${COMPANY.email}</p>
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

    // Auth check
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

    // Fetch booking
    let query = supabase.from("tour_bookings").select("*");
    if (bookingId) query = query.eq("id", bookingId);
    else query = query.eq("booking_number", bookingNumber);
    const { data: booking, error: bookingError } = await query.single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth check
    if (userId && booking.user_id && booking.user_id !== userId) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      const isAdmin = roles?.some((r: any) => r.role === "admin");
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch related data
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

    // Generate QR
    const qrData = JSON.stringify({ b: booking.booking_number, p: booking.participants });
    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 140, margin: 2, color: { dark: "#000000", light: "#ffffff" } });

    // Generate documents
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
