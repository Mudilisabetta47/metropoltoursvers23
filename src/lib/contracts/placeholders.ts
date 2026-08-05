import { CONTRACT_TYPE_LABEL, type CompanyData, type ContractRecord } from "./types";

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
  { key: "personalnummer", label: "Personalnummer" },
  { key: "vorname", label: "Vorname" },
  { key: "nachname", label: "Nachname" },
  { key: "geburtsdatum", label: "Geburtsdatum" },
  { key: "geburtsort", label: "Geburtsort" },
  { key: "anschrift", label: "Anschrift Mitarbeiter" },
  { key: "email", label: "E-Mail" },
  { key: "telefon", label: "Telefon" },
  { key: "steuer_id", label: "Steuer-ID" },
  { key: "sv_nummer", label: "Sozialversicherungsnummer" },
  { key: "krankenkasse", label: "Krankenkasse" },
  { key: "staatsangehoerigkeit", label: "Staatsangehörigkeit" },
  { key: "iban", label: "IBAN" },
  { key: "bic", label: "BIC" },
  { key: "notfallkontakt", label: "Notfallkontakt" },
  { key: "fuehrerscheinklassen", label: "Führerscheinklassen" },
  { key: "fuehrerschein_ablauf", label: "Führerschein gültig bis" },
  { key: "qualifikation_95", label: "Schlüsselzahl 95 (ja/nein)" },
  { key: "code95_ablauf", label: "Modul 95 gültig bis" },
  { key: "fahrerkarte", label: "Fahrerkarte (ja/nein)" },
  { key: "fahrerkarte_ablauf", label: "Fahrerkarte gültig bis" },
  { key: "vertragsart", label: "Vertragsart" },
  { key: "position", label: "Position" },
  { key: "abteilung", label: "Abteilung" },
  { key: "arbeitsbeginn", label: "Arbeitsbeginn" },
  { key: "vertragsende", label: "Vertragsende" },
  { key: "befristung_text", label: "Befristungs-Satz (automatisch)" },
  { key: "probezeit", label: "Probezeit (Monate)" },
  { key: "wochenarbeitszeit", label: "Wochenarbeitszeit" },
  { key: "arbeitszeitmodell", label: "Arbeitszeitmodell" },
  { key: "arbeitsort", label: "Arbeitsort" },
  { key: "gehalt", label: "Monatsgehalt" },
  { key: "stundenlohn", label: "Stundenlohn" },
  { key: "zuschlaege", label: "Zuschläge" },
  { key: "sonderzahlungen", label: "Sonderzahlungen" },
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
  { key: "firma_ustid", label: "USt-IdNr." },
  { key: "vertragsnummer", label: "Vertragsnummer" },
  { key: "ort_datum", label: "Ort, Datum" },
];

export function buildPlaceholderValues(
  contract: Partial<ContractRecord>,
  company: CompanyData,
): Record<string, string> {
  const dash = (v?: string | null) => (v && String(v).trim() !== "" ? String(v) : "—");
  const yesNo = (v?: boolean | null) => (v ? "ja" : "nein");

  const befristung = contract.is_temporary
    ? `Das Arbeitsverhältnis ist befristet und endet ohne Kündigung am ${formatDateDE(contract.end_date)}.`
    : "Das Arbeitsverhältnis wird auf unbestimmte Zeit geschlossen.";

  const bonusText = contract.bonus && contract.bonus.trim() !== ""
    ? `Zusätzlich erhält der Arbeitnehmer folgende Bonus-/Sonderzahlungen: ${contract.bonus}`
    : "Ein Anspruch auf Bonus- oder Sonderzahlungen besteht nicht.";

  return {
    personalnummer: dash(contract.personnel_number),
    vorname: dash(contract.first_name),
    nachname: dash(contract.last_name),
    geburtsdatum: formatDateDE(contract.birth_date),
    geburtsort: dash(contract.birth_place),
    anschrift: dash(contract.address),
    email: dash(contract.email),
    telefon: dash(contract.phone),
    steuer_id: dash(contract.tax_id),
    sv_nummer: dash(contract.social_security_number),
    krankenkasse: dash(contract.health_insurance),
    staatsangehoerigkeit: dash(contract.nationality),
    iban: dash(contract.iban),
    bic: dash(contract.bic),
    notfallkontakt: dash(contract.emergency_contact),
    fuehrerscheinklassen: dash(contract.license_classes),
    fuehrerschein_ablauf: formatDateDE(contract.license_expiry),
    qualifikation_95: yesNo(contract.driver_qualification_95),
    code95_ablauf: formatDateDE(contract.code95_expiry),
    fahrerkarte: yesNo(contract.driver_card),
    fahrerkarte_ablauf: formatDateDE(contract.driver_card_expiry),
    vertragsart: CONTRACT_TYPE_LABEL(contract.contract_type),
    position: dash(contract.position),
    abteilung: dash(contract.department),
    arbeitsbeginn: formatDateDE(contract.start_date),
    vertragsende: contract.is_temporary ? formatDateDE(contract.end_date) : "unbefristet",
    befristung_text: befristung,
    probezeit: contract.probation_months != null ? String(contract.probation_months) : "6",
    wochenarbeitszeit: contract.weekly_hours != null
      ? new Intl.NumberFormat("de-DE").format(Number(contract.weekly_hours))
      : "—",
    arbeitszeitmodell: dash(contract.work_time_model),
    arbeitsort: dash(contract.work_location),
    gehalt: formatEUR(contract.salary),
    stundenlohn: formatEUR(contract.hourly_wage),
    zuschlaege: dash(contract.supplements) === "—" ? "keine gesonderten Zuschläge" : String(contract.supplements),
    sonderzahlungen: dash(contract.special_payments) === "—" ? "keine" : String(contract.special_payments),
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
    firma_ustid: dash(company.vat_id),
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
