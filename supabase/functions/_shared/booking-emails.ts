// Zentraler Dokumenten- und Mailversand nach einer Buchung (App / Rechnung).
// Regel: Fehler beim Mail-/PDF-Versand dürfen die Buchung NIEMALS scheitern lassen.
import { encode as encodeBase64 } from "https://deno.land/std@0.190.0/encoding/base64.ts";
import { emailLayout, escapeHtmlBrand } from "./email-brand.ts";
import { sendMail, FROM_BOOKING, REPLY_TO } from "./mailer.ts";
import { buildInvoicePdf, resolveBillingAddress, COMPANY } from "./invoice-pdf.ts";

export const INTERNAL_RECIPIENTS = ["info@metours.de", "buchung@metours.de"];

const eur = (v: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(v) || 0);

const dateDE = (v?: string | null) => {
  if (!v) return "";
  try {
    return new Date(v).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return String(v);
  }
};

export interface BookingDocsInput {
  /** "tour" = Pauschalreise (tour_bookings), "trip" = Linien-/Individualfahrt (bookings) */
  kind: "tour" | "trip";
  bookingNumber: string;
  bookingId: string | null;
  customerEmail: string;
  customerName: string;
  title: string;
  /** Reisedatum / Rückreisedatum */
  departureDate?: string | null;
  returnDate?: string | null;
  /** Abfahrtsort + Zeit */
  departurePlace?: string | null;
  departureTime?: string | null;
  passengers: string[];
  seats: string[];
  extras: { label: string; quantity?: number; total: number }[];
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  /** Rohdaten für die Rechnung (nur wenn Rechnung erzeugt werden soll) */
  invoice?: {
    booking: any;
    tour: any;
    date: any;
    tariff: any;
    pickupStop: any;
    /** tour_bookings-Datensatz vorhanden -> tour_invoices befüllen */
    persist: boolean;
  };
}

interface MailLog {
  step: string;
  ok: boolean;
  detail?: string | null;
}

function detailTable(i: BookingDocsInput): string {
  const rows: [string, string][] = [
    ["Buchungsnummer", i.bookingNumber],
    ["Reise / Ziel", i.title],
  ];
  if (i.departureDate) rows.push(["Reisedatum", dateDE(i.departureDate)]);
  if (i.returnDate) rows.push(["Rückreise", dateDE(i.returnDate)]);
  if (i.departurePlace) rows.push(["Abfahrtsort", i.departurePlace]);
  if (i.departureTime) rows.push(["Abfahrtszeit", `${String(i.departureTime).slice(0, 5)} Uhr`]);
  rows.push(["Reiseteilnehmer", String(i.passengers.length)]);
  if (i.seats.length) rows.push(["Sitzplätze", i.seats.join(", ")]);
  rows.push(["Zahlungsart", i.paymentMethod]);
  rows.push(["Zahlungsstatus", i.paymentStatus]);

  const body = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#666;">${escapeHtmlBrand(k)}</td><td style="padding:6px 0;text-align:right;font-weight:600;">${escapeHtmlBrand(v)}</td></tr>`,
    )
    .join("");

  const extras = i.extras.length
    ? i.extras
        .map(
          (e) =>
            `<tr><td style="padding:6px 0;color:#666;">${escapeHtmlBrand(e.label)}${e.quantity ? ` (${e.quantity}×)` : ""}</td><td style="padding:6px 0;text-align:right;font-weight:600;">${eur(e.total)}</td></tr>`,
        )
        .join("")
    : `<tr><td style="padding:6px 0;color:#666;">Extras</td><td style="padding:6px 0;text-align:right;">keine</td></tr>`;

  return `<table style="width:100%;border-collapse:collapse;font-size:14px;">
    ${body}
    ${extras}
    <tr><td style="padding:10px 0;border-top:1px solid #eee;font-weight:700;">Gesamtpreis</td><td style="padding:10px 0;border-top:1px solid #eee;text-align:right;font-weight:700;">${eur(i.total)}</td></tr>
  </table>`;
}

function contactBlock(): string {
  return `<p style="margin:18px 0 0;color:#444;">
    <strong>Ihr Ansprechpartner</strong><br />
    METROPOL TOURS Kundenservice<br />
    Telefon: +49 511 80781106<br />
    E-Mail: <a href="mailto:${REPLY_TO}" style="color:#00A62B;">${REPLY_TO}</a>
  </p>`;
}

function passengerList(i: BookingDocsInput): string {
  return `<p style="margin:18px 0 4px;font-weight:600;">Reiseteilnehmer</p>
    <ul style="margin:0 0 16px;padding-left:18px;color:#444;">${i.passengers
      .map((p) => `<li>${escapeHtmlBrand(p)}</li>`)
      .join("")}</ul>`;
}

/** Rechnung erzeugen, in Storage ablegen (nur Pauschalreisen) und als Base64 zurückgeben. */
async function createInvoice(db: any, i: BookingDocsInput) {
  if (!i.invoice) return null;
  const year = new Date().getFullYear();
  const suffix = String(i.bookingNumber).replace(/^MT-\d{4}-?/, "").replace(/^MT-/, "");
  const invoiceNumber = `RE-${year}-${suffix}`;

  const pdfBytes = await buildInvoicePdf({
    booking: i.invoice.booking,
    tour: i.invoice.tour,
    date: i.invoice.date,
    tariff: i.invoice.tariff,
    pickupStop: i.invoice.pickupStop,
    invoiceNumber,
    isCancellation: false,
  });

  const storagePath = `${i.bookingNumber}/${invoiceNumber}.pdf`;
  const { error: upErr } = await db.storage
    .from("invoices")
    .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });
  if (upErr) console.error("invoice upload failed", upErr.message);

  if (i.invoice.persist && i.bookingId) {
    const gross = Number(i.total);
    const net = gross / 1.19;
    const { error: recErr } = await db.from("tour_invoices").upsert(
      {
        booking_id: i.bookingId,
        booking_number: i.bookingNumber,
        invoice_number: invoiceNumber,
        invoice_type: "invoice",
        amount: gross,
        net_amount: Number(net.toFixed(2)),
        tax_rate: 19,
        tax_amount: Number((gross - net).toFixed(2)),
        status: "open",
        billing_address: resolveBillingAddress(i.invoice.booking),
        pdf_path: storagePath,
        currency: "EUR",
        issued_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "booking_id,invoice_type" },
    );
    if (recErr) console.error("tour_invoices upsert failed", recErr.message);
  }

  return { invoiceNumber, storagePath, base64: encodeBase64(pdfBytes) };
}

/**
 * Versendet Buchungsbestätigung, Reiseinformationen, Rechnung (PDF-Anhang)
 * und die interne Benachrichtigung. Gibt ein Protokoll zurück.
 */
export async function sendBookingDocuments(db: any, i: BookingDocsInput): Promise<MailLog[]> {
  const log: MailLog[] = [];
  const table = detailTable(i);

  // ── 1. Buchungsbestätigung ──────────────────────────────────────
  try {
    const content = `
      <h2 style="margin:0 0 8px;">Buchungsbestätigung</h2>
      <p style="margin:0 0 16px;color:#444;">Guten Tag ${escapeHtmlBrand(i.customerName)}, vielen Dank für Ihre Buchung bei METROPOL TOURS.</p>
      <p style="font-size:18px;font-weight:700;margin:0 0 16px;">${escapeHtmlBrand(i.title)}</p>
      ${table}
      ${passengerList(i)}
      <p style="color:#444;">Die Zahlung erfolgt auf Rechnung. Die Rechnung mit allen Zahlungsdetails erhalten Sie in einer separaten E-Mail als PDF.</p>
      ${contactBlock()}
    `;
    const r = await sendMail(db, {
      from: FROM_BOOKING,
      to: i.customerEmail,
      subject: `Buchungsbestätigung ${i.bookingNumber} – METROPOL TOURS`,
      html: emailLayout({ title: "Buchungsbestätigung", preheader: `Buchung ${i.bookingNumber}`, content }),
      template: "app_booking_confirmation",
      bookingNumber: i.bookingNumber,
      bookingId: i.bookingId,
      metadata: { channel: "mobile_app", payment_method: i.paymentMethod },
    });
    log.push({ step: "confirmation", ok: r.ok, detail: r.error });
  } catch (e) {
    console.error("confirmation mail failed", (e as Error).message);
    log.push({ step: "confirmation", ok: false, detail: (e as Error).message });
  }

  // ── 2. Reiseinformationen ───────────────────────────────────────
  try {
    const infoRows: [string, string][] = [];
    if (i.departureDate) infoRows.push(["Reisedatum", dateDE(i.departureDate)]);
    if (i.returnDate) infoRows.push(["Rückreise", dateDE(i.returnDate)]);
    if (i.departurePlace) infoRows.push(["Treffpunkt / Abfahrtsort", i.departurePlace]);
    if (i.departureTime) infoRows.push(["Abfahrtszeit", `${String(i.departureTime).slice(0, 5)} Uhr`]);
    if (i.seats.length) infoRows.push(["Sitzplätze", i.seats.join(", ")]);

    const content = `
      <h2 style="margin:0 0 8px;">Ihre Reiseinformationen</h2>
      <p style="margin:0 0 16px;color:#444;">Alle wichtigen Angaben zu Ihrer Reise <strong>${escapeHtmlBrand(i.title)}</strong> (Buchung ${escapeHtmlBrand(i.bookingNumber)}).</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${infoRows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:6px 0;color:#666;">${escapeHtmlBrand(k)}</td><td style="padding:6px 0;text-align:right;font-weight:600;">${escapeHtmlBrand(v)}</td></tr>`,
          )
          .join("")}
      </table>
      ${passengerList(i)}
      <p style="margin:0 0 6px;font-weight:600;">Bitte beachten Sie</p>
      <ul style="margin:0 0 16px;padding-left:18px;color:#444;">
        <li>Bitte seien Sie 15 Minuten vor Abfahrt am Treffpunkt.</li>
        <li>Führen Sie einen gültigen Personalausweis oder Reisepass mit.</li>
        <li>Pro Person sind ein Koffer und ein Handgepäckstück inklusive.</li>
        <li>Ihr Ticket finden Sie jederzeit in der METROPOL TOURS App unter „Meine Reisen".</li>
      </ul>
      ${contactBlock()}
    `;
    const r = await sendMail(db, {
      from: FROM_BOOKING,
      to: i.customerEmail,
      subject: `Reiseinformationen zu Ihrer Buchung ${i.bookingNumber}`,
      html: emailLayout({ title: "Reiseinformationen", preheader: `Reiseinfos ${i.bookingNumber}`, content }),
      template: "app_booking_travel_info",
      bookingNumber: i.bookingNumber,
      bookingId: i.bookingId,
      metadata: { channel: "mobile_app" },
    });
    log.push({ step: "travel_info", ok: r.ok, detail: r.error });
  } catch (e) {
    console.error("travel info mail failed", (e as Error).message);
    log.push({ step: "travel_info", ok: false, detail: (e as Error).message });
  }

  // ── 3. Rechnung als PDF ─────────────────────────────────────────
  try {
    const inv = await createInvoice(db, i);
    if (inv) {
      const due = new Date(Date.now() + 14 * 86400000);
      const content = `
        <h2 style="margin:0 0 8px;">Ihre Rechnung ${escapeHtmlBrand(inv.invoiceNumber)}</h2>
        <p style="margin:0 0 16px;color:#444;">Im Anhang finden Sie Ihre Rechnung als PDF.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 0;color:#666;">Rechnungsnummer</td><td style="padding:6px 0;text-align:right;font-weight:700;">${escapeHtmlBrand(inv.invoiceNumber)}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Rechnungsdatum</td><td style="padding:6px 0;text-align:right;font-weight:600;">${dateDE(new Date().toISOString())}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Buchungsnummer</td><td style="padding:6px 0;text-align:right;font-weight:600;">${escapeHtmlBrand(i.bookingNumber)}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Zahlungsart</td><td style="padding:6px 0;text-align:right;font-weight:600;">Rechnung</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Zahlungsziel</td><td style="padding:6px 0;text-align:right;font-weight:600;">${dateDE(due.toISOString())}</td></tr>
          <tr><td style="padding:10px 0;border-top:1px solid #eee;font-weight:700;">Gesamtbetrag</td><td style="padding:10px 0;border-top:1px solid #eee;text-align:right;font-weight:700;">${eur(i.total)}</td></tr>
        </table>
        <p style="margin:16px 0 0;color:#444;">Bitte überweisen Sie den Betrag unter Angabe der Buchungsnummer ${escapeHtmlBrand(i.bookingNumber)} an:<br />
        ${escapeHtmlBrand(COMPANY.name)} · IBAN ${escapeHtmlBrand(COMPANY.iban)} · BIC ${escapeHtmlBrand(COMPANY.bic)} (${escapeHtmlBrand(COMPANY.bank)})</p>
        ${contactBlock()}
      `;
      const r = await sendMail(db, {
        from: FROM_BOOKING,
        to: i.customerEmail,
        subject: `Rechnung ${inv.invoiceNumber} zu Buchung ${i.bookingNumber}`,
        html: emailLayout({ title: "Rechnung", preheader: `Rechnung ${inv.invoiceNumber}`, content }),
        attachments: [
          { filename: `${inv.invoiceNumber}.pdf`, content: inv.base64, content_type: "application/pdf" },
        ],
        template: "app_booking_invoice",
        bookingNumber: i.bookingNumber,
        bookingId: i.bookingId,
        metadata: { channel: "mobile_app", invoice_number: inv.invoiceNumber, pdf_path: inv.storagePath },
      });
      log.push({ step: "invoice", ok: r.ok, detail: r.error ?? inv.invoiceNumber });
    } else {
      log.push({ step: "invoice", ok: false, detail: "skipped" });
    }
  } catch (e) {
    console.error("invoice mail failed", (e as Error).message);
    log.push({ step: "invoice", ok: false, detail: (e as Error).message });
  }

  // ── 4. Interne Benachrichtigung ─────────────────────────────────
  try {
    const content = `
      <h2 style="margin:0 0 8px;">Neue Buchung über die App</h2>
      ${table}
      ${passengerList(i)}
      <p style="color:#444;">Kunde: ${escapeHtmlBrand(i.customerName)} · ${escapeHtmlBrand(i.customerEmail)}<br />
      Kanal: Mobile App · Typ: ${i.kind === "tour" ? "Pauschalreise" : "Fahrt"}</p>
    `;
    const r = await sendMail(db, {
      from: FROM_BOOKING,
      to: INTERNAL_RECIPIENTS,
      subject: `Neue App-Buchung ${i.bookingNumber} (Rechnung) – ${i.title}`,
      html: emailLayout({ title: "Neue Buchung", content }),
      template: "app_booking_internal",
      bookingNumber: i.bookingNumber,
      bookingId: i.bookingId,
      metadata: { channel: "mobile_app", internal: true },
    });
    log.push({ step: "internal", ok: r.ok, detail: r.error });
  } catch (e) {
    console.error("internal mail failed", (e as Error).message);
    log.push({ step: "internal", ok: false, detail: (e as Error).message });
  }

  console.log("booking documents result", i.bookingNumber, JSON.stringify(log));
  return log;
}
