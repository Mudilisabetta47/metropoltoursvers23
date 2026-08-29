// Zentrales Branding für ALLE ausgehenden E-Mails von METROPOL TOURS.
// Enthält Logo-Header, rechtliche Links (Impressum, Datenschutz, AGB) und Social-Media-Links.

export const SITE_URL = "https://www.metours.de";
export const LOGO_URL = "https://app.metours.de/brand/metropol-logo.png";

export const COMPANY = {
  name: "METROPOL TOURS GmbH",
  street: "Rudolf-Diesel-Weg 8",
  city: "30419 Hannover",
  phone: "+49 511 80781106",
  email: "kundenservice@metours.de",
  ceo: "Vedat Özel",
  hrb: "HRB 222247",
};

export const SOCIALS = [
  { name: "Instagram", url: "https://www.instagram.com/metropoltours", icon: "https://cdn.simpleicons.org/instagram/ffffff" },
  { name: "TikTok", url: "https://www.tiktok.com/@metropoltours", icon: "https://cdn.simpleicons.org/tiktok/ffffff" },
  { name: "Facebook", url: "https://www.facebook.com/metropoltours", icon: "https://cdn.simpleicons.org/facebook/ffffff" },
];

export const BRAND_GREEN = "#00CC36";

export function escapeHtmlBrand(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** QR-Code Bild-URL für Tickets (scanbar durch die Fahrer-App). */
export function qrImageUrl(payload: string, size = 260): string {
  return `https://quickchart.io/qr?size=${size}&margin=2&ecLevel=M&text=${encodeURIComponent(payload)}`;
}

export function emailHeader(subtitle?: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1218;border-radius:16px 16px 0 0;">
    <tr><td align="center" style="padding:26px 24px 20px;">
      <img src="${LOGO_URL}" alt="METROPOL TOURS" width="190" style="display:block;max-width:190px;height:auto;margin:0 auto;" />
      ${subtitle ? `<div style="margin-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:${BRAND_GREEN};font-weight:700;">${escapeHtmlBrand(subtitle)}</div>` : ""}
    </td></tr>
  </table>`;
}

export function emailFooter(): string {
  const social = SOCIALS.map(
    (s) =>
      `<a href="${s.url}" style="display:inline-block;margin:0 7px;text-decoration:none;" title="${s.name}"><img src="${s.icon}" alt="${s.name}" width="22" height="22" style="display:block;opacity:0.9;" /></a>`,
  ).join("");

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1218;border-radius:0 0 16px 16px;">
    <tr><td align="center" style="padding:26px 24px 28px;font-family:Arial,Helvetica,sans-serif;color:rgba(255,255,255,0.65);font-size:12px;line-height:1.7;">
      <img src="${LOGO_URL}" alt="METROPOL TOURS" width="130" style="display:block;max-width:130px;height:auto;margin:0 auto 14px;" />
      <div style="margin-bottom:14px;">${social}</div>
      <div style="color:#ffffff;font-weight:700;font-size:13px;">${COMPANY.name}</div>
      <div>${COMPANY.street} · ${COMPANY.city}</div>
      <div>Tel. ${COMPANY.phone} · <a href="mailto:${COMPANY.email}" style="color:${BRAND_GREEN};text-decoration:none;">${COMPANY.email}</a></div>
      <div style="margin-top:6px;">Geschäftsführer: ${COMPANY.ceo} · ${COMPANY.hrb}</div>
      <div style="margin-top:14px;">
        <a href="${SITE_URL}/impressum" style="color:rgba(255,255,255,0.75);text-decoration:underline;margin:0 6px;">Impressum</a>
        <a href="${SITE_URL}/privacy" style="color:rgba(255,255,255,0.75);text-decoration:underline;margin:0 6px;">Datenschutz</a>
        <a href="${SITE_URL}/terms" style="color:rgba(255,255,255,0.75);text-decoration:underline;margin:0 6px;">AGB</a>
        <a href="${SITE_URL}/meine-buchungen" style="color:rgba(255,255,255,0.75);text-decoration:underline;margin:0 6px;">Meine Buchungen</a>
      </div>
      <div style="margin-top:12px;color:rgba(255,255,255,0.35);">© ${new Date().getFullYear()} ${COMPANY.name}. Alle Rechte vorbehalten.</div>
    </td></tr>
  </table>`;
}

/** Vollständiges E-Mail-Gerüst: Logo-Header + Inhalt + rechtlicher/sozialer Footer. */
export function emailLayout(opts: {
  title?: string;
  preheader?: string;
  subtitle?: string;
  content: string;
}): string {
  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtmlBrand(opts.title ?? "METROPOL TOURS")}</title></head>
<body style="margin:0;padding:0;background:#eef1ef;">
  ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtmlBrand(opts.preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1ef;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="620" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;">
        <tr><td>${emailHeader(opts.subtitle)}</td></tr>
        <tr><td style="background:#ffffff;padding:30px 28px;font-family:Arial,Helvetica,sans-serif;color:#243027;font-size:15px;line-height:1.65;">
          ${opts.content}
        </td></tr>
        <tr><td>${emailFooter()}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Ticket-/QR-Block für Buchungsbestätigungen. */
export function qrTicketBlock(bookingNumber: string, note?: string): string {
  const safe = escapeHtmlBrand(bookingNumber);
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td align="center" style="background:#f6faf7;border:1px solid #d9e5dc;border-radius:14px;padding:24px;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1a5f2a;margin-bottom:14px;">Ihr digitales Ticket</div>
      <img src="${qrImageUrl(bookingNumber)}" alt="Ticket QR-Code ${safe}" width="200" height="200" style="display:block;margin:0 auto;background:#ffffff;border-radius:10px;" />
      <div style="font-family:'Courier New',monospace;font-size:17px;font-weight:700;color:#0f1218;margin-top:14px;letter-spacing:1px;">${safe}</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#5b6b60;margin-top:8px;max-width:380px;">
        ${escapeHtmlBrand(note ?? "Bitte beim Einstieg dem Fahrpersonal vorzeigen – der QR-Code wird direkt im Bus gescannt. Auch ausgedruckt gültig.")}
      </div>
    </td></tr>
  </table>`;
}
