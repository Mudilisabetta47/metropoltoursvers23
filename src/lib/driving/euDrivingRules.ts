/**
 * Lenk- und Ruhezeiten-Assistent (Richtwerte nach VO (EG) 561/2006).
 *
 * WICHTIG: Diese Berechnung ist ein Hilfsmittel fuer den Fahrer und ersetzt
 * KEINEN digitalen Tachographen. Rechtlich verbindlich sind ausschliesslich die
 * Aufzeichnungen des Kontrollgeraets. Deshalb werden hier ausschliesslich
 * Hinweise ("Richtwert") ausgegeben und niemals Freigaben erteilt.
 */

export const DRIVING_LIMITS = {
  /** Maximale ununterbrochene Lenkzeit bis zur Pause: 4,5 h */
  blockSeconds: 4.5 * 3600,
  /** Vorgeschriebene Pause nach dem Lenkblock: 45 min (teilbar 15 + 30) */
  breakSeconds: 45 * 60,
  /** Tageslenkzeit: 9 h (max. zweimal woechentlich 10 h) */
  dailySeconds: 9 * 3600,
  dailyExtendedSeconds: 10 * 3600,
  /** Wochenlenkzeit: 56 h */
  weeklySeconds: 56 * 3600,
  /** Doppelwoche: 90 h */
  biweeklySeconds: 90 * 3600,
  /** Tagesruhezeit: 11 h (reduziert 9 h, max. dreimal zwischen zwei Wochenruhezeiten) */
  dailyRestSeconds: 11 * 3600,
  dailyRestReducedSeconds: 9 * 3600,
} as const;

export type DutyState = "driving" | "break" | "off";

export interface DutyDay {
  log_date: string;
  driving_seconds: number;
  break_seconds: number;
  block_seconds: number;
  driving_since: string | null;
  rest_start: string | null;
  last_break_end: string | null;
  multi_driver: boolean;
}

export type ComplianceLevel = "ok" | "warn" | "critical";

export interface ComplianceItem {
  key: "block" | "daily" | "weekly" | "biweekly" | "break";
  label: string;
  usedSeconds: number;
  limitSeconds: number;
  level: ComplianceLevel;
  hint: string | null;
}

export interface ComplianceResult {
  state: DutyState;
  /** Lenkzeit im laufenden Block inkl. laufender Fahrt. */
  blockSeconds: number;
  dailySeconds: number;
  weeklySeconds: number;
  biweeklySeconds: number;
  /** Laufende Pause in Sekunden (nur wenn state = "break"). */
  currentBreakSeconds: number;
  /** Verbleibende Lenkzeit bis zur naechsten Pflichtpause. */
  secondsToBreak: number;
  /** Verbleibende Tageslenkzeit. */
  secondsToDailyLimit: number;
  items: ComplianceItem[];
  level: ComplianceLevel;
  /** Kurzer Hinweistext fuer die Sprachansage, sonst null. */
  announcement: string | null;
}

const level = (used: number, limit: number): ComplianceLevel => {
  const ratio = limit > 0 ? used / limit : 0;
  if (ratio >= 1) return "critical";
  if (ratio >= 0.88) return "warn";
  return "ok";
};

const worst = (levels: ComplianceLevel[]): ComplianceLevel =>
  levels.includes("critical") ? "critical" : levels.includes("warn") ? "warn" : "ok";

export const formatHm = (seconds: number): string => {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")} min` : `${m} min`;
};

/**
 * @param today Journal des heutigen Tages (bereits geladen)
 * @param history Journale der letzten 14 Tage (inkl. heute)
 * @param now Referenzzeit
 */
export const evaluateCompliance = (
  today: DutyDay | null,
  history: DutyDay[],
  now: Date = new Date(),
): ComplianceResult => {
  const ts = now.getTime();
  const liveDriving = today?.driving_since
    ? Math.max(0, (ts - new Date(today.driving_since).getTime()) / 1000)
    : 0;
  const state: DutyState = today?.driving_since ? "driving" : today?.rest_start ? "break" : "off";

  const currentBreakSeconds =
    state === "break" && today?.rest_start
      ? Math.max(0, (ts - new Date(today.rest_start).getTime()) / 1000)
      : 0;

  const blockSeconds = (today?.block_seconds ?? 0) + liveDriving;
  const dailySeconds = (today?.driving_seconds ?? 0) + liveDriving;

  const dayMs = 86400000;
  const sumSince = (days: number) =>
    history
      .filter((d) => ts - new Date(`${d.log_date}T00:00:00`).getTime() < days * dayMs)
      .reduce((acc, d) => acc + (d.driving_seconds ?? 0), 0) + liveDriving;

  const weeklySeconds = sumSince(7);
  const biweeklySeconds = sumSince(14);

  const items: ComplianceItem[] = [
    {
      key: "block",
      label: "Lenkblock bis Pause",
      usedSeconds: blockSeconds,
      limitSeconds: DRIVING_LIMITS.blockSeconds,
      level: level(blockSeconds, DRIVING_LIMITS.blockSeconds),
      hint:
        blockSeconds >= DRIVING_LIMITS.blockSeconds
          ? "45 Minuten Pause einlegen (teilbar in 15 + 30 Minuten)."
          : null,
    },
    {
      key: "daily",
      label: "Tageslenkzeit",
      usedSeconds: dailySeconds,
      limitSeconds: DRIVING_LIMITS.dailySeconds,
      level: level(dailySeconds, DRIVING_LIMITS.dailySeconds),
      hint:
        dailySeconds >= DRIVING_LIMITS.dailySeconds
          ? "9 h erreicht – Verlängerung auf 10 h nur zweimal pro Woche zulässig."
          : null,
    },
    {
      key: "weekly",
      label: "Wochenlenkzeit",
      usedSeconds: weeklySeconds,
      limitSeconds: DRIVING_LIMITS.weeklySeconds,
      level: level(weeklySeconds, DRIVING_LIMITS.weeklySeconds),
      hint: weeklySeconds >= DRIVING_LIMITS.weeklySeconds ? "Wochenlenkzeit ausgeschöpft." : null,
    },
    {
      key: "biweekly",
      label: "Doppelwoche",
      usedSeconds: biweeklySeconds,
      limitSeconds: DRIVING_LIMITS.biweeklySeconds,
      level: level(biweeklySeconds, DRIVING_LIMITS.biweeklySeconds),
      hint: biweeklySeconds >= DRIVING_LIMITS.biweeklySeconds ? "90 h in zwei Wochen erreicht." : null,
    },
  ];

  if (state === "break") {
    items.unshift({
      key: "break",
      label: "Laufende Pause",
      usedSeconds: currentBreakSeconds,
      limitSeconds: DRIVING_LIMITS.breakSeconds,
      level: currentBreakSeconds >= DRIVING_LIMITS.breakSeconds ? "ok" : "warn",
      hint:
        currentBreakSeconds >= DRIVING_LIMITS.breakSeconds
          ? "Pause erfüllt – Lenkblock wird zurückgesetzt."
          : `Noch ${formatHm(DRIVING_LIMITS.breakSeconds - currentBreakSeconds)} bis zur vollen Pause.`,
    });
  }

  const overall = worst(items.filter((i) => i.key !== "break").map((i) => i.level));

  let announcement: string | null = null;
  const toBreak = DRIVING_LIMITS.blockSeconds - blockSeconds;
  if (state === "driving") {
    if (toBreak <= 0) announcement = "Lenkzeit von viereinhalb Stunden erreicht. Bitte 45 Minuten Pause einlegen.";
    else if (toBreak <= 15 * 60) announcement = "In 15 Minuten ist eine Pause fällig.";
    else if (toBreak <= 30 * 60) announcement = "In 30 Minuten ist eine Pause fällig.";
  }

  return {
    state,
    blockSeconds,
    dailySeconds,
    weeklySeconds,
    biweeklySeconds,
    currentBreakSeconds,
    secondsToBreak: Math.max(0, toBreak),
    secondsToDailyLimit: Math.max(0, DRIVING_LIMITS.dailySeconds - dailySeconds),
    items,
    level: overall,
    announcement,
  };
};
