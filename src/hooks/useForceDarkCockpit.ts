import { useEffect } from "react";

/**
 * Erzwingt das dunkle Cockpit-Design für die Fahrer-App.
 * Das Light-Skin (`data-cockpit-theme="light"`) wird waehrend der Fahrt
 * deaktiviert und beim Verlassen der Seite wiederhergestellt.
 */
export function useForceDarkCockpit() {
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.getAttribute("data-cockpit-theme");
    const hadDark = el.classList.contains("dark");
    el.setAttribute("data-cockpit-theme", "dark");
    el.classList.add("dark");
    return () => {
      if (prev) el.setAttribute("data-cockpit-theme", prev);
      else el.removeAttribute("data-cockpit-theme");
      // Dark-Mode nur fuer das Cockpit: beim Verlassen wieder zuruecksetzen,
      // sonst bleibt die ganze App (SPA-Navigation) dunkel.
      if (!hadDark) el.classList.remove("dark");
    };
  }, []);
}
