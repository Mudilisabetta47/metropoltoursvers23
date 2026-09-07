export const eur = (n: number | null | undefined) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(n ?? 0));

export const num = (n: number | null | undefined, digits = 0) =>
  new Intl.NumberFormat("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(
    Number(n ?? 0),
  );

export const dateDE = (d?: string | null) => {
  if (!d) return "–";
  const dt = new Date(d.length <= 10 ? `${d}T00:00:00` : d);
  if (Number.isNaN(dt.getTime())) return "–";
  return dt.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const timeDE = (t?: string | null) => (t ? t.slice(0, 5) : "–");

export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const hoursMinutes = (minutes?: number | null) => {
  if (!minutes && minutes !== 0) return "–";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h} h ${String(m).padStart(2, "0")} min`;
};
