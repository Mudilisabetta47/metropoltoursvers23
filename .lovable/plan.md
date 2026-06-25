# Linienverkehr & Fahrpläne mit Live-Tracking

Komplettsystem für Linienbusse: Admin verwaltet Linien, Haltestellen und Fahrpläne. Kunden verfolgen Fahrten live auf einer Karte im FlixBus-Stil.

## 1. Datenbank (neue Tabellen)

- **bus_lines** — Linien-Stammdaten: Code (z.B. "X810"), Name, Farbe, Typ (Linie/Fernbus), aktiv
- **line_stops** — Haltestellen pro Linie mit Reihenfolge, Ankunfts-/Abfahrtszeit-Offset (Minuten ab Start), GPS (lat/lng), Bahnsteig
- **line_schedules** — Fahrplan-Einträge: Linie, Wochentage (Mo–So Bitmask), Gültig-von/bis, Abfahrtszeit, zugewiesener Bus & Fahrer
- **line_trips** — konkrete Einzelfahrten (Instanz eines Schedules an einem Datum) mit Status (geplant, unterwegs, angekommen, ausgefallen), Trip-Nummer
- **line_trip_stops** — Ist-Zeiten pro Stop & Fahrt (Soll/Ist, Verspätung in Min)

Nutzt bestehende `bus_positions_live` für GPS-Tracking.

## 2. Admin-Cockpit (3 neue Seiten in Sektion "Fahrten & Betrieb")

- **`/admin/lines`** — Linien-Übersicht
  - Tabelle aller Linien mit Status-Pille, Anzahl Stops, nächste Abfahrt
  - "Neue Linie"-Drawer
- **`/admin/lines/:id`** — Linien-Editor
  - Tab 1: Stammdaten (Code, Name, Farbe)
  - Tab 2: Haltestellen (sortierbar mit Drag-Handle, GPS-Picker, Offset-Min)
  - Tab 3: Fahrpläne (Wochentag-Picker, Abfahrtszeiten, Bus/Fahrer-Zuweisung)
  - Tab 4: Live-Vorschau auf Mapbox-Karte
- **`/admin/line-trips`** — Tagesübersicht aller konkreten Fahrten
  - Filter Datum/Linie, Status-Pillen, "Fahrt starten/abschließen", Verspätung manuell setzen

## 3. Public Tracking-Seite (FlixBus-Style)

- **`/verfolge/:tripNumber`** (öffentlich, kein Login)
- Layout exakt wie Referenz-Screenshot:
  - **Links**: Breadcrumbs · Trip-Nummer · "Amsterdam → Brussels" · Datum-Card · Einstiegsort-Card · Status-Card (geplante vs. echte Ankunft, durchgestrichene alte Zeit bei Verspätung) · FlixBus-Stil "Bus X810"-Block · "Reiseroute ansehen"-Button (grün #00CC36) · Status-Legende mit Wifi-Icons
  - **Rechts**: Vollhöhe Mapbox-Karte (Hell-Style), grüne gestrichelte Polyline der Route, animierte Marker an Start/Ende mit Pin-Flag, Live-Bus-Marker bei aktiver Fahrt
- Auto-Refresh alle 30s über `bus_positions_live`-Realtime-Channel
- Share-Button (Teilen) kopiert Public-Link

## 4. Verknüpfungen

- Sidebar-Eintrag "Linien & Fahrpläne" + "Tages-Fahrten" in Sektion 3
- Dashboard-KPI: Aktive Linien-Fahrten heute
- Fahrer-App nutzt `line_trips` für Schicht-Anzeige

## Technische Hinweise

- RLS: Admin/Office Lese-/Schreibzugriff auf Lines/Schedules; öffentlicher `SELECT` nur auf `line_trips` + `line_trip_stops` + `line_stops` für Tracking-Seite (nur nicht-PII Felder)
- Cron-Job (täglich 03:00): generiert `line_trips` für die nächsten 14 Tage aus aktiven Schedules
- Mapbox-Token bereits vorhanden via `useMapboxToken`
- Realtime: Subscription auf `bus_positions_live` für Live-Marker
- Demo-Seed: 3 Linien (Hannover–Berlin, Hannover–Amsterdam, Hannover–Prag) mit je 4–6 Stops und Wochenend-Fahrplänen

## Reihenfolge

1. Migration (Tabellen + RLS + Seed)
2. Admin-Seiten (Lines-Liste, Editor, Trip-Tagesübersicht)
3. Public Tracking-Seite + Route
4. Sidebar + Routing
5. Cron-Funktion für Trip-Generierung
