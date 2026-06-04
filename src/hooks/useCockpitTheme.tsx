import { useCallback, useEffect, useState } from "react";

export type CockpitThemeMode = "auto" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "cockpit-theme";

function readStored(): CockpitThemeMode {
  if (typeof window === "undefined") return "auto";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" || v === "auto" ? v : "auto";
}

function systemPref(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function apply(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-cockpit-theme", resolved);
}

/**
 * Cockpit-Theme (Admin / Operations / Driver).
 * - `auto` folgt prefers-color-scheme
 * - `light` / `dark` manueller Override, persistiert in localStorage
 * Setzt `data-cockpit-theme` auf <html>, das von cockpit-light.css ausgewertet wird.
 */
export function useCockpitTheme() {
  const [mode, setModeState] = useState<CockpitThemeMode>(() => readStored());
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    readStored() === "auto" ? systemPref() : (readStored() as ResolvedTheme)
  );

  useEffect(() => {
    const next: ResolvedTheme = mode === "auto" ? systemPref() : mode;
    setResolved(next);
    apply(next);
  }, [mode]);

  useEffect(() => {
    if (mode !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      const next: ResolvedTheme = mq.matches ? "light" : "dark";
      setResolved(next);
      apply(next);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setModeState(readStored());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const setMode = useCallback((m: CockpitThemeMode) => {
    window.localStorage.setItem(STORAGE_KEY, m);
    setModeState(m);
  }, []);

  const toggle = useCallback(() => {
    // auto -> opposite of system; light <-> dark; ends auto cycle
    setMode(resolved === "light" ? "dark" : "light");
  }, [resolved, setMode]);

  return { mode, resolved, setMode, toggle };
}

/** Setzt das Cockpit-Theme ohne UI (für Routen wie /admin/ops, /driver). */
export function CockpitThemeMount() {
  useCockpitTheme();
  return null;
}
