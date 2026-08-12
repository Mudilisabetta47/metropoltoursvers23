export type GpsHealth = "live" | "lost" | "offline";

/** GPS-Gesundheit aus dem letzten Positions-Update ableiten. */
export const gpsHealth = (updatedAt: string | null | undefined): GpsHealth => {
  if (!updatedAt) return "offline";
  const age = Date.now() - new Date(updatedAt).getTime();
  if (age < 60_000) return "live";
  if (age < 300_000) return "lost";
  return "offline";
};

export const GPS_HEALTH_LABEL: Record<GpsHealth, string> = {
  live: "GPS aktiv",
  lost: "GPS VERLOREN",
  offline: "OFFLINE",
};

export const GPS_HEALTH_COLOR: Record<GpsHealth, string> = {
  live: "#10b981",
  lost: "#f97316",
  offline: "#ef4444",
};

export const relativeAge = (iso: string | null | undefined): string => {
  if (!iso) return "keine Daten";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `vor ${s} Sekunden`;
  const m = Math.round(s / 60);
  if (m < 60) return `vor ${m} Min.`;
  return `vor ${Math.round(m / 60)} Std.`;
};
