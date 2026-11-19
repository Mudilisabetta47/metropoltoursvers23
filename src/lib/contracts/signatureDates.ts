/**
 * Datumslogik für Arbeitsverträge.
 *
 * - Erstellungs-, Vertrags- und vorgesehene Unterschriftsdaten sind frei gewählte Angaben.
 * - Der echte Zeitpunkt einer elektronischen Unterschrift (signedAt) kommt nur vom Server.
 * - Ein vorgesehenes Datum wird nie als tatsächlich geleistete Unterschrift ausgegeben,
 *   und es wird nie automatisch das heutige Datum eingesetzt.
 */

const TZ = "Europe/Berlin";
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** TT.MM.JJJJ für reine Datumsangaben (YYYY-MM-DD) oder Zeitstempel. */
export function formatDayDE(value?: string | null): string | null {
  if (!value) return null;
  const m = DATE_ONLY.exec(value);
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("de-DE", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Kalendertag (YYYY-MM-DD) eines Zeitstempels in deutscher Zeit. */
export function berlinDay(timestamp: string): string | null {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return parts; // en-CA liefert YYYY-MM-DD
}

export function formatSignedAtDE(timestamp: string): string | null {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return null;
  const day = formatDayDE(timestamp);
  const time = d.toLocaleTimeString("de-DE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
  return `${day} um ${time} Uhr`;
}

const BLANK = "____________";

export interface PartySignatureInput {
  place?: string | null;
  /** Frei gewähltes, vorgesehenes Unterschriftsdatum (YYYY-MM-DD). */
  plannedDate?: string | null;
  /** Echter Zeitpunkt der elektronischen Unterschrift (vom Server). */
  signedAt?: string | null;
}

export interface PartySignatureLines {
  /** Zeile mit Ort und Datum unter der Unterschrift. */
  dateLine: string;
  /** Nachweiszeile der echten elektronischen Unterschrift, falls vorhanden. */
  eSignLine: string | null;
}

export function describePartySignature({ place, plannedDate, signedAt }: PartySignatureInput): PartySignatureLines {
  const ort = place?.trim() || BLANK;
  const planned = formatDayDE(plannedDate);
  const signedLabel = signedAt ? formatSignedAtDE(signedAt) : null;
  const eSignLine = signedLabel ? `Elektronisch unterschrieben am ${signedLabel}` : null;

  if (!signedAt || !signedLabel) {
    return { dateLine: `${ort}, den ${planned ?? BLANK}`, eSignLine: null };
  }
  const actualDay = berlinDay(signedAt);
  if (!plannedDate || plannedDate === actualDay) {
    return { dateLine: `${ort}, den ${planned ?? formatDayDE(signedAt)}`, eSignLine };
  }
  // Vorgesehenes Datum weicht vom echten Signaturzeitpunkt ab: klar als "vorgesehen" kennzeichnen.
  return { dateLine: `${ort}, vorgesehenes Datum: ${planned}`, eSignLine };
}

/** Datum für {{ort_datum}}: Vertragsdatum, sonst Erstellungsdatum – nie automatisch heute. */
export function contractPlaceDate(place: string | null | undefined, contractDate?: string | null, documentDate?: string | null): string {
  const ort = place?.trim() || BLANK;
  return `${ort}, den ${formatDayDE(contractDate) ?? formatDayDE(documentDate) ?? BLANK}`;
}
