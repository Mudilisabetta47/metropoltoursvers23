export type DispoStatus =
  | "anfrage"
  | "angebot_erstellt"
  | "angebot_versendet"
  | "wartet_kunde"
  | "bestaetigt"
  | "fahrer_zugeteilt"
  | "abgeschlossen"
  | "storniert";

export const STATUS_CONFIG: Record<DispoStatus, { label: string; color: string; bg: string }> = {
  anfrage: { label: "Anfrage", color: "#6b7280", bg: "#f3f4f6" },
  angebot_erstellt: { label: "Angebot erstellt", color: "#b45309", bg: "#fef3c7" },
  angebot_versendet: { label: "Angebot versendet", color: "#c2410c", bg: "#ffedd5" },
  wartet_kunde: { label: "Wartet auf Kunde", color: "#7c3aed", bg: "#ede9fe" },
  bestaetigt: { label: "Bestätigt", color: "#0f766e", bg: "#ccfbf1" },
  fahrer_zugeteilt: { label: "Fahrer zugeteilt", color: "#15803d", bg: "#dcfce7" },
  abgeschlossen: { label: "Abgeschlossen", color: "#1d4ed8", bg: "#dbeafe" },
  storniert: { label: "Storniert", color: "#b91c1c", bg: "#fee2e2" },
};

export const STATUS_ORDER: DispoStatus[] = [
  "anfrage",
  "angebot_erstellt",
  "angebot_versendet",
  "wartet_kunde",
  "bestaetigt",
  "fahrer_zugeteilt",
  "abgeschlossen",
  "storniert",
];

export const ACTIVE_STATUSES: DispoStatus[] = [
  "bestaetigt",
  "fahrer_zugeteilt",
  "abgeschlossen",
];

export const SOURCES = ["manuell", "e-mail", "telefon", "website", "plattform", "ki-erkennung"];

export const statusOf = (s?: string | null) =>
  STATUS_CONFIG[(s as DispoStatus) ?? "anfrage"] ?? STATUS_CONFIG.anfrage;
