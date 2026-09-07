import { ReactNode } from "react";
import { statusOf } from "../lib/status";

export function StatusChip({ status }: { status?: string | null }) {
  const s = statusOf(status);
  return (
    <span className="dispo-chip" style={{ color: s.color, background: s.bg, borderColor: "transparent" }}>
      {s.label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  onClick,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "warn" | "good";
  onClick?: () => void;
}) {
  const color = tone === "warn" ? "#b45309" : tone === "good" ? "#15803d" : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="dispo-card p-4 text-left disabled:cursor-default"
    >
      <div className="text-[0.7rem] font-semibold uppercase tracking-wide dispo-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold" style={color ? { color } : undefined}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs dispo-muted">{hint}</div>}
    </button>
  );
}

export function Section({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="dispo-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "hsl(var(--dispo-border))" }}>
        <h2 className="text-sm font-bold dispo-strong">{title}</h2>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="dispo-label">{label}</span>
      {children}
    </label>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="p-8 text-center text-sm dispo-muted">{text}</div>;
}
