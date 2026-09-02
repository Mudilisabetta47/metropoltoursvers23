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
    el.setAttribute("data-cockpit-theme", "dark");
    el.classList.add("dark");
    return () => {
      if (prev) el.setAttribute("data-cockpit-theme", prev);
      else el.removeAttribute("data-cockpit-theme");
    };
  }, []);
}
