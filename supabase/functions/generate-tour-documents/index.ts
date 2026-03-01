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

// Shared styles
const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
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
  @media print { body { background: white; padding: 0; } .doc { box-shadow: none; } }
`;

// ── BOOKING CONFIRMATION ──
function generateConfirmation(booking: any, tour: any, date: any, tariff: any, pickupStop: any, qrDataUrl: string): string {
  const passengers = Array.isArray(booking.passenger_details) ? booking.passenger_details : [];
  const luggageAddons = Array.isArray(booking.luggage_addons) ? booking.luggage_addons : [];

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
    <h1>🚌 METROPOL TOURS</h1>
    <div class="sub">Buchungsbestätigung</div>
  </div>
  <div class="content">
    <div style="text-align:center; margin-bottom:24px;">
      <span class="badge" style="font-size:16px; padding:8px 20px;">
        ${escapeHtml(booking.booking_number)}
      </span>
      <p style="margin-top:8px; color:#666; font-size:13px;">Buchungsdatum: ${formatShortDate(booking.created_at)}</p>
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
      <div class="section-title">Zustieg</div>
      <div class="grid">
        <div class="field"><div class="label">Abfahrtsort</div><div class="value">${escapeHtml(pickupStop.city)} – ${escapeHtml(pickupStop.location_name)}</div></div>
        <div class="field"><div class="label">Abfahrtszeit</div><div class="value">${formatTime(pickupStop.departure_time)} Uhr</div></div>
        ${pickupStop.meeting_point ? `<div class="field" style="grid-column: span 2"><div class="label">Treffpunkt</div><div class="value">${escapeHtml(pickupStop.meeting_point)}</div></div>` : ''}
        ${pickupStop.address ? `<div class="field" style="grid-column: span 2"><div class="label">Adresse</div><div class="value">${escapeHtml(pickupStop.address)}</div></div>` : ''}
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

    <div class="highlight-box">
      <div class="lbl">Gesamtpreis</div>
      <div class="amount">${booking.total_price.toFixed(2)} €</div>
      <div class="lbl">${booking.participants} Personen • Tarif ${escapeHtml(tariff.name)}</div>
    </div>

    <div style="text-align:center; margin-top:24px; padding-top:20px; border-top:2px dashed #e0e0e0;">
      <img src="${qrDataUrl}" alt="QR Code" style="width:140px; height:140px;" />
      <p style="font-size:12px; color:#666; margin-top:8px;">Bitte QR-Code beim Einstieg vorzeigen</p>
    </div>
  </div>
  <div class="footer">
    <p>Bitte erscheinen Sie mindestens 15 Minuten vor Abfahrt am Treffpunkt.</p>
    <p style="margin-top:4px;">METROPOL TOURS • support@metropol-tours.de</p>
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
        <strong>METROPOL TOURS GmbH</strong><br>
        Musterstraße 1<br>
        20095 Hamburg<br>
        USt-IdNr.: DE123456789<br>
        Steuernummer: 12/345/67890
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

    <div class="section">
      <div class="section-title">Zahlungshinweis</div>
      <div class="field" style="line-height:1.8; font-size:13px;">
        Bitte überweisen Sie den Gesamtbetrag bis zum <strong>${formatShortDate(dueDate.toISOString())}</strong> auf folgendes Konto:<br>
        <strong>METROPOL TOURS GmbH</strong><br>
        IBAN: DE89 3704 0044 0532 0130 00<br>
        BIC: COBADEFFXXX<br>
        Verwendungszweck: <strong>${escapeHtml(booking.booking_number)}</strong>
      </div>
    </div>

    <div class="section" style="font-size:11px; color:#888; line-height:1.6;">
      <p>Es gelten die AGB der METROPOL TOURS GmbH. Pauschalreisen sind nach §651a BGB abgesichert. 
      Bei Fragen wenden Sie sich an support@metropol-tours.de.</p>
    </div>
  </div>
  <div class="footer">
    <p>METROPOL TOURS GmbH • Musterstraße 1 • 20095 Hamburg • HRB 12345 • USt-IdNr.: DE123456789</p>
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
      Die Abrechnung erfolgt direkt mit METROPOL TOURS GmbH. 
      Bitte keine Zahlung vom Gast verlangen.</p>
      <p style="margin-top:8px;"><strong>Kontakt Reiseleitung:</strong> +49 40 123456-0</p>
    </div>
  </div>
  <div class="footer">
    <p>METROPOL TOURS GmbH • Musterstraße 1 • 20095 Hamburg • support@metropol-tours.de</p>
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

    // Auth check - optional (public for guest lookup by bookingNumber)
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
    if (bookingId) {
      query = query.eq("id", bookingId);
    } else {
      query = query.eq("booking_number", bookingNumber);
    }
    const { data: booking, error: bookingError } = await query.single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth: user must own the booking or be admin, or use bookingNumber lookup
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
