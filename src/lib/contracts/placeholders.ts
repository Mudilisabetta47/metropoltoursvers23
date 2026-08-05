import type { CompanyData, ContractRecord } from "./types";

export const formatDateDE = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const formatEUR = (value?: number | null) => {
  if (value == null) return "—";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
};

export interface PlaceholderDef {
  key: string;
  label: string;
}

export const PLACEHOLDERS: PlaceholderDef[] = [
  { key: "vorname", label: "Vorname" },
  { key: "nachname", label: "Nachname" },
  { key: "geburtsdatum", label: "Geburtsdatum" },
  { key: "anschrift", label: "Anschrift Mitarbeiter" },
  { key: "email", label: "E-Mail" },
  { key: "telefon", label: "Telefon" },
  { key: "steuer_id", label: "Steuer-ID" },
  { key: "sv_nummer", label: "Sozialversicherungsnummer" },
  { key: "staatsangehoerigkeit", label: "Staatsangehörigkeit" },
  { key: "iban", label: "IBAN" },
  { key: "bic", label: "BIC" },
  { key: "position", label: "Position" },
  { key: "abteilung", label: "Abteilung" },
  { key: "arbeitsbeginn", label: "Arbeitsbeginn" },
  { key: "vertragsende", label: "Vertragsende" },
  { key: "befristung_text", label: "Befristungs-Satz (automatisch)" },
  { key: "probezeit", label: "Probezeit (Monate)" },
  { key: "wochenarbeitszeit", label: "Wochenarbeitszeit" },
  { key: "arbeitsort", label: "Arbeitsort" },
  { key: "gehalt", label: "Gehalt" },
  { key: "bonus", label: "Bonus" },
  { key: "bonus_text", label: "Bonus-Satz (automatisch)" },
  { key: "urlaubstage", label: "Urlaubstage" },
  { key: "kuendigungsfrist", label: "Kündigungsfrist" },
  { key: "arbeitszeiten", label: "Arbeitszeiten" },
  { key: "sonstige_vereinbarungen", label: "Sonstige Vereinbarungen" },
  { key: "firma_name", label: "Firmenname" },
  { key: "firma_geschaeftsfuehrer", label: "Geschäftsführer" },
  { key: "firma_anschrift", label: "Firmenanschrift" },
  { key: "firma_handelsregister", label: "Handelsregister" },
  { key: "firma_steuernummer", label: "Steuernummer" },
  { key: "vertragsnummer", label: "Vertragsnummer" },
  { key: "ort_datum", label: "Ort, Datum" },
];

export function buildPlaceholderValues(
  contract: Partial<ContractRecord>,
  company: CompanyData,
): Record<string, string> {
  const dash = (v?: string | null) => (v && String(v).trim() !== "" ? String(v) : "—");

  const befristung = contract.is_temporary
    ? `Das Arbeitsverhältnis ist befristet und endet ohne Kündigung am ${formatDateDE(contract.end_date)}.`
    : "Das Arbeitsverhältnis wird auf unbestimmte Zeit geschlossen.";

  const bonusText = contract.bonus && contract.bonus.trim() !== ""
    ? `Zusätzlich erhält der Arbeitnehmer folgende Bonus-/Sonderzahlungen: ${contract.bonus}`
    : "Ein Anspruch auf Bonus- oder Sonderzahlungen besteht nicht.";

  return {
    vorname: dash(contract.first_name),
    nachname: dash(contract.last_name),
    geburtsdatum: formatDateDE(contract.birth_date),
    anschrift: dash(contract.address),
    email: dash(contract.email),
    telefon: dash(contract.phone),
    steuer_id: dash(contract.tax_id),
    sv_nummer: dash(contract.social_security_number),
    staatsangehoerigkeit: dash(contract.nationality),
    iban: dash(contract.iban),
    bic: dash(contract.bic),
    position: dash(contract.position),
    abteilung: dash(contract.department),
    arbeitsbeginn: formatDateDE(contract.start_date),
    vertragsende: contract.is_temporary ? formatDateDE(contract.end_date) : "unbefristet",
    befristung_text: befristung,
    probezeit: contract.probation_months != null ? String(contract.probation_months) : "6",
    wochenarbeitszeit: contract.weekly_hours != null
      ? new Intl.NumberFormat("de-DE").format(Number(contract.weekly_hours))
      : "—",
    arbeitsort: dash(contract.work_location),
    gehalt: formatEUR(contract.salary),
    bonus: dash(contract.bonus),
    bonus_text: bonusText,
    urlaubstage: contract.vacation_days != null ? String(contract.vacation_days) : "—",
    kuendigungsfrist: dash(contract.notice_period),
    arbeitszeiten: dash(contract.working_hours) === "—" ? "" : String(contract.working_hours),
    sonstige_vereinbarungen: dash(contract.other_agreements) === "—" ? "Keine." : String(contract.other_agreements),
    firma_name: dash(company.name),
    firma_geschaeftsfuehrer: dash(company.managing_director),
    firma_anschrift: dash(company.address),
    firma_handelsregister: dash(company.commercial_register),
    firma_steuernummer: dash(company.tax_number),
    vertragsnummer: dash(contract.contract_number),
    ort_datum: `${company.city || "—"}, den ${formatDateDE(new Date().toISOString())}`,
  };
}

/** Ersetzt {{platzhalter}} im Vorlagentext durch die konkreten Werte. */
export function renderTemplate(body: string, values: Record<string, string>): string {
  return body.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (match, key: string) => {
    const v = values[key.toLowerCase()];
    return v !== undefined ? v : match;
  });
}
