import { useEffect, useRef } from "react";
import { useIncidents } from "@/hooks/useOperations";

const IncidentNotifications = () => {
  const { incidents } = useIncidents();
  const prevCountRef = useRef(incidents.length);
  const permissionRef = useRef<NotificationPermission>("default");

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((p) => {
          permissionRef.current = p;
        });
      } else {
        permissionRef.current = Notification.permission;
      }
    }
  }, []);

  // Watch for new critical/warning incidents
  useEffect(() => {
    if (incidents.length > prevCountRef.current) {
      const newIncidents = incidents.slice(0, incidents.length - prevCountRef.current);
      
      newIncidents.forEach((incident) => {
        if (
          (incident.severity === "critical" || incident.severity === "warning") &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          const icon = incident.severity === "critical" ? "🔴" : "🟡";
          new Notification(`${icon} ${incident.title}`, {
            body: incident.description || `Schweregrad: ${incident.severity}`,
            tag: incident.id,
            requireInteraction: incident.severity === "critical",
          });
        }
      });
    }
    prevCountRef.current = incidents.length;
  }, [incidents]);

  // This component renders nothing - it just manages notifications
  return null;
};

export default IncidentNotifications;
