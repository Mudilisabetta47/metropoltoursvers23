# Fahrerinformationssystem (FIS) – Umsetzungsplan

Der Umfang deiner Anforderung ist sehr groß (Dashboard, Fahrten, Navigation, Kommunikation, Checkliste, Mängel, Dokumente, Offline, Live-Tracking, Wetter). Wir bauen das als vollwertiges FIS auf Basis des bestehenden `DriverDashboard`, ohne Demo-Daten, komplett an das Admin-/Ops-System angebunden. Damit die Qualität premium bleibt und wir keine Halb-Features liefern, schlage ich eine Auslieferung in **3 Phasen** vor.

---

## Neue Route
`/fahrer` (mit Sub-Tabs) – ersetzt/erweitert das bestehende `DriverDashboard`. Optimiert für Tablet (primär) & Smartphone. Dark Premium Theme (#0f1218 / #00CC36), große Touch-Targets, Framer-Motion Animationen.

## Datenbank-Erweiterungen (eine Migration)
- `driver_status` (user_id PK, status enum, note, updated_at) – Live Fahrerstatus
- `driver_checklists` (bus_id, driver_user_id, shift_date, items jsonb, signature, created_at) – Pre-Trip Check
- `driver_duty_log` (user_id, date, driving_seconds, break_seconds, km_start, km_end) – Lenkzeit
- `driver_chat_messages` – 1:1 Chat Fahrer ↔ Dispo (nutzt bestehende `driver_messages` + neues `sender_id`)
- Ergänzung `vehicle_damages` (bereits vorhanden) – FIS schreibt hier rein
- RLS: Fahrer sieht/schreibt nur eigene Daten; Admin/Office alles

## Phase 1 – Kern-FIS (dieser Auftrag)
1. **Layout & Navigation**: Neue `FISLayout` mit Bottom-Tab-Bar (Dashboard, Fahrten, Fahrzeug, Chat, Mehr) + Top-Bar (Uhr, Status-Pill, Notfall-Button).
2. **Dashboard-Tab**: Live-Uhr, heutige Schicht aus `employee_shifts`, nächste Abfahrt aus `trips`/`line_trips`/`tour_dates`, aktuelle Verspätung aus `trip_registry`, Kilometer/Lenkzeit aus `driver_duty_log`, Wetter am Zielort (OpenWeather über Edge Function).
3. **Fahrer-Status**: Umschalter (Bereit / Unterwegs / Am Ziel / Pause / Störung / Feierabend) → schreibt `driver_status` + realtime an `/admin/dispatch`.
4. **Fahrten-Tab**: Liste der zugewiesenen Aufträge (heute + Woche) mit allen Feldern (Auftragsnr, Kunde, Ansprechpartner+Tel, Zeiten, Route, Zwischenhalte, Pax, Bus, Fahrer/Beifahrer, Besonderheiten). Detail-Sheet mit Google-Maps-Deeplink + Anruf-Button.
5. **Fahrzeug-Tab**: Kennzeichen, Tank, AdBlue, KM, nächster Service, Mängel-Historie aus `vehicle_damages` + neue Mängelmeldung mit Foto-Upload nach `incident-documents` Bucket.
6. **Digitale Checkliste**: 8-Punkte Pre-Trip-Check mit Unterschrift-Canvas → `driver_checklists`.
7. **Kommunikation**: Chat mit Dispo (realtime), Notfallbutton (schreibt `incidents` mit severity=critical + push an alle Admins), Standort teilen (bestehend).
8. **Mängelmeldung**: Kamera-Upload, Beschreibung, Priorität → `vehicle_damages` + Notify Dispo.
9. **Dokumente**: Liste PDFs/Bilder pro Auftrag aus vorhandenen Buckets (`tour-documents`, `incident-documents`).

## Phase 2 – Erweitert (auf Zuruf)
- Live-Positionstracking mit automatischem GPS-Push (Background Location)
- Wetter-Push-Benachrichtigungen, Straßensperrungen (via Google Maps Roads API)
- Volltextsuche über Fahrten
- PDF-Betrachter inline

## Phase 3 – Offline-Modus (auf Zuruf, aufwändig)
- Service Worker + IndexedDB Cache für heutige Fahrten, Checkliste, letzte Chats
- Konfliktauflösung beim Sync
- Push Notifications via bestehendes `push_subscriptions`
- (Achtung: Erfordert dedizierte PWA-Runde nach dem PWA-Skill; Registrierung nur außerhalb Lovable-Preview)

## Design-Prinzipien
- Dark Premium, große 56px Touch-Buttons, Statusfarben Grün/Amber/Rot, Micro-Animationen (Framer Motion), Playfair nur für Zahlen-Highlights, sonst DM Sans.
- Keine Demo-Daten – wenn keine Schicht existiert, freundlicher Empty-State „Heute keine Fahrten – schönen Tag!".

## Technische Details
- Neue Dateien: `src/pages/FISPage.tsx`, `src/components/fis/*` (Layout, DashboardTab, TripsTab, VehicleTab, ChecklistDialog, DamageReportDialog, ChatPanel, EmergencyButton, WeatherWidget, StatusSwitcher, DutyTimer).
- Realtime: Supabase Channels für `driver_messages`, `driver_navigation`, `trip_registry`, `driver_status`.
- Wetter: neue Edge Function `get-weather` (OpenWeather-Free-Key nötig oder Google Weather via Connector).
- Route in `src/App.tsx` unter `/fahrer` mit Auth-Gate (Rolle `driver` oder `admin`).

## Was ich jetzt sofort baue (Phase 1)
Punkte 1–9 oben. Nach Freigabe des Plans lege ich zunächst die DB-Migration an (separater Approve-Schritt), danach folgen alle UI-Dateien in einer Runde.

**Fragen vor Start:**
1. Freigabe für die neuen Tabellen (`driver_status`, `driver_checklists`, `driver_duty_log`) via Migration?
2. Wetter-Quelle: Google Maps Weather Connector (bereits verbunden) verwenden – ok?
3. Phase 2 und 3 (Offline-Modus, GPS-Background-Tracking) jetzt nur planen, später ausliefern – einverstanden?
