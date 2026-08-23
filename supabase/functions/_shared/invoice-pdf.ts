// Shared invoice PDF renderer (pdf-lib, A4, German layout)
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "https://esm.sh/pdf-lib@1.17.1";

export const COMPANY = {
  name: "METROPOL TOURS GmbH",
  street: "Rudolf-Diesel-Weg 8",
  city: "30419 Hannover",
  phone: "+49 511 80781106",
  email: "kundenservice@app.metours.de",
  web: "app.metours.de",
  hrb: "HRB 222247, AG Hannover",
  iban: "DE89 3704 0044 0532 0130 00",
  bic: "COBADEFFXXX",
  bank: "Commerzbank",
};

const GREEN = rgb(0, 0.62, 0.2);
const DARK = rgb(0.1, 0.12, 0.14);
const GREY = rgb(0.45, 0.47, 0.5);
const LIGHT = rgb(0.93, 0.95, 0.94);

export interface InvoiceInput {
  booking: any;
  tour: any;
  date: any;
  tariff: any;
  pickupStop: any;
  invoiceNumber: string;
  isCancellation: boolean;
}

export interface BillingAddress {
  company: string;
  firstName: string;
  lastName: string;
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  country: string;
}

export function resolveBillingAddress(booking: any): BillingAddress {
  const inv =
    booking.invoice_address && typeof booking.invoice_address === "object"
      ? booking.invoice_address
      : null;
  return {
    company: inv?.company ?? booking.billing_company ?? "",
    firstName: inv?.first_name ?? booking.billing_first_name ?? booking.contact_first_name ?? "",
    lastName: inv?.last_name ?? booking.billing_last_name ?? booking.contact_last_name ?? "",
    street: inv?.street ?? booking.billing_street ?? "",
    houseNumber: inv?.house_number ?? booking.billing_house_number ?? "",
    zip: inv?.zip ?? booking.billing_zip ?? "",
    city: inv?.city ?? booking.billing_city ?? "",
    country: inv?.country ?? booking.billing_country ?? "Deutschland",
  };
}

function money(n: number): string {
  return `${(n ?? 0).toFixed(2).replace(".", ",")} EUR`;
}

function dateDE(value?: string | null): string {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

// pdf-lib standard fonts use WinAnsi; strip anything outside of it.
function safe(text: unknown): string {
  return String(text ?? "").replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "");
}

export async function buildInvoicePdf(input: InvoiceInput): Promise<Uint8Array> {
  const { booking, tour, date, tariff, pickupStop, invoiceNumber, isCancellation } = input;

  const pdf = await PDFDocument.create();
  const page: PDFPage = pdf.addPage([595.28, 841.89]); // A4
  const font: PDFFont = await pdf.embedFont(StandardFonts.Helvetica);
  const bold: PDFFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  const M = 48;
  const W = 595.28;
  let y = 792;

  const text = (
    value: string,
    x: number,
    yy: number,
    size = 10,
    f: PDFFont = font,
    color = DARK,
  ) => page.drawText(safe(value), { x, y: yy, size, font: f, color });

  const right = (value: string, xRight: number, yy: number, size = 10, f: PDFFont = font, color = DARK) => {
    const s = safe(value);
    const w = f.widthOfTextAtSize(s, size);
    page.drawText(s, { x: xRight - w, y: yy, size, font: f, color });
  };

  // Header bar
  page.drawRectangle({ x: 0, y: 782, width: W, height: 60, color: GREEN });
  text("METROPOL TOURS", M, 806, 20, bold, rgb(1, 1, 1));
  right("Reiseveranstalter . Busreisen . Gruppenreisen", W - M, 808, 9, font, rgb(1, 1, 1));

  // Try embedding the logo, silently skip on failure
  try {
    const res = await fetch("https://www.metours.de/brand/metropol-logo.png");
    if (res.ok) {
      const png = await pdf.embedPng(new Uint8Array(await res.arrayBuffer()));
      const dims = png.scale(40 / png.height);
      page.drawImage(png, { x: M, y: 792, width: dims.width, height: dims.height });
      page.drawRectangle({ x: M - 4, y: 792, width: 0, height: 0 });
    }
  } catch {
    // logo optional
  }

  y = 745;
  // Sender line + billing address
  text(`${COMPANY.name} . ${COMPANY.street} . ${COMPANY.city}`, M, y, 7, font, GREY);
  y -= 22;

  const billing = resolveBillingAddress(booking);
  const addrLines = [
    billing.company,
    `${billing.firstName} ${billing.lastName}`.trim(),
    `${billing.street} ${billing.houseNumber}`.trim(),
    `${billing.zip} ${billing.city}`.trim(),
    billing.country,
  ].filter((l) => l && l.trim().length > 0);

  for (const line of addrLines) {
    text(line, M, y, 11);
    y -= 15;
  }

  // Meta box (right)
  let my = 723;
  const metaX = 350;
  const metaRows: [string, string][] = [
    [isCancellation ? "Stornorechnung" : "Rechnungsnummer", invoiceNumber],
    ["Buchungsnummer", booking.booking_number ?? "-"],
    ["Rechnungsdatum", dateDE(new Date().toISOString())],
    ["Buchungsdatum", dateDE(booking.created_at)],
    ["Kunden-Referenz", booking.booking_number ?? "-"],
  ];
  for (const [k, v] of metaRows) {
    text(k, metaX, my, 8.5, font, GREY);
    right(v, W - M, my, 9.5, bold);
    my -= 15;
  }

  y = Math.min(y, my) - 28;

  // Title
  text(isCancellation ? "Stornorechnung / Gutschrift" : "Rechnung", M, y, 20, bold, DARK);
  y -= 16;
  text(
    `zur Buchung ${booking.booking_number ?? ""} - ${tour?.destination ?? "Reise"}`,
    M,
    y,
    10,
    font,
    GREY,
  );
  y -= 26;

  // Trip facts
  page.drawRectangle({ x: M, y: y - 54, width: W - 2 * M, height: 54, color: LIGHT });
  const facts: [string, string][] = [
    ["Reiseziel", `${tour?.destination ?? "-"}${tour?.country ? ", " + tour.country : ""}`],
    ["Reisezeitraum", `${dateDE(date?.departure_date)} - ${dateDE(date?.return_date)}`],
    ["Tarif", tariff?.name ?? "-"],
    ["Zustieg", pickupStop ? `${pickupStop.city} (${(pickupStop.departure_time ?? "").slice(0, 5)} Uhr)` : "-"],
  ];
  let fx = M + 12;
  facts.forEach(([k, v], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = fx + col * 255;
    text(k, x, y - 18 - row * 24, 8, font, GREY);
    text(v, x, y - 30 - row * 24, 10, bold);
  });
  y -= 74;

  // Positions table
  const sign = isCancellation ? -1 : 1;
  const rows: [string, string, number][] = [];
  rows.push([
    `${tariff?.name ?? "Reise"}-Tarif, ${booking.participants} Person(en)`,
    `${booking.participants}x`,
    Number(booking.base_price ?? 0),
  ]);
  if (Number(booking.pickup_surcharge ?? 0) > 0) {
    rows.push([
      `Zustiegsaufpreis${pickupStop ? " " + pickupStop.city : ""}`,
      "1x",
      Number(booking.pickup_surcharge),
    ]);
  }
  const addons = Array.isArray(booking.luggage_addons) ? booking.luggage_addons : [];
  for (const a of addons) {
    rows.push([a?.name ?? "Zusatzleistung", `${a?.quantity ?? 1}x`, Number(a?.total ?? 0)]);
  }
  if (Number(booking.discount_amount ?? 0) > 0) {
    rows.push([
      `Gutschein${booking.discount_code ? " (" + booking.discount_code + ")" : ""}`,
      "1x",
      -Number(booking.discount_amount),
    ]);
  }

  text("Position", M, y, 8.5, bold, GREY);
  text("Menge", 380, y, 8.5, bold, GREY);
  right("Betrag", W - M, y, 8.5, bold, GREY);
  y -= 6;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: GREEN });
  y -= 18;

  for (const [label, qty, amount] of rows) {
    text(label, M, y, 10);
    text(qty, 380, y, 10);
    right(money(sign * amount), W - M, y, 10);
    y -= 8;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: LIGHT });
    y -= 14;
  }

  const gross = sign * Number(booking.total_price ?? 0);
  const net = gross / 1.19;
  const vat = gross - net;

  y -= 6;
  right("Nettobetrag", 470, y, 9.5, font, GREY);
  right(money(net), W - M, y, 9.5);
  y -= 15;
  right("zzgl. 19 % USt.", 470, y, 9.5, font, GREY);
  right(money(vat), W - M, y, 9.5);
  y -= 8;
  page.drawLine({ start: { x: 330, y }, end: { x: W - M, y }, thickness: 1, color: GREEN });
  y -= 18;
  right(isCancellation ? "Gutschriftbetrag" : "Rechnungsbetrag", 470, y, 12, bold);
  right(money(gross), W - M, y, 12, bold, GREEN);
  y -= 34;

  // Payment status
  const paid = booking.status === "confirmed" || booking.status === "paid" || !!booking.paid_at;
  const statusLine = isCancellation
    ? "Diese Buchung wurde storniert. Bereits gezahlte Betraege werden auf das urspruengliche Zahlungsmittel erstattet."
    : paid
      ? `Bezahlt am ${dateDE(booking.paid_at ?? booking.created_at)} via ${booking.payment_method ?? "Online-Zahlung"}. Dieser Beleg dient als Zahlungsnachweis.`
      : "Zahlung ausstehend. Bitte ueberweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen.";
  const wrapped = wrapText(statusLine, font, 9.5, W - 2 * M);
  for (const line of wrapped) {
    text(line, M, y, 9.5, font, GREY);
    y -= 13;
  }

  if (!paid && !isCancellation) {
    y -= 10;
    page.drawRectangle({ x: M, y: y - 62, width: W - 2 * M, height: 62, color: LIGHT });
    text("Bankverbindung", M + 12, y - 16, 8.5, bold, GREY);
    text(`${COMPANY.bank} . IBAN ${COMPANY.iban} . BIC ${COMPANY.bic}`, M + 12, y - 32, 9.5);
    text(`Verwendungszweck: ${booking.booking_number}`, M + 12, y - 48, 9.5, bold);
    y -= 78;
  }

  // Footer
  page.drawLine({ start: { x: M, y: 78 }, end: { x: W - M, y: 78 }, thickness: 0.5, color: LIGHT });
  text(`${COMPANY.name} . ${COMPANY.street} . ${COMPANY.city} . ${COMPANY.hrb}`, M, 64, 7.5, font, GREY);
  text(`Tel. ${COMPANY.phone} . ${COMPANY.email} . https://${COMPANY.web}`, M, 53, 7.5, font, GREY);
  text(
    `Buchungsnummer ${booking.booking_number ?? ""} . Rechnung ${invoiceNumber}`,
    M,
    42,
    7.5,
    font,
    GREY,
  );

  return await pdf.save();
}

function wrapText(value: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = safe(value).split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
