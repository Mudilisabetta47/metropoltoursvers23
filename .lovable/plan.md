# Plan: Einheitliches Fahrtmanagement, Verspätungen & Benachrichtigungen

## Ziele
1. **Einheitliche Fahrt-IDs** für Linienfahrten **und** Pauschalreise-Termine
2. **Strukturiertes Backend** statt verstreuter Tabellen — eine zentrale Sicht „Alle Fahrten"
3. **Verspätungen im Ops-Cockpit** melden (für beide Fahrtarten)
4. **Live-Verfolgung** zeigt Verspätung sofort an (Realtime)
5. **Automatische E-Mail** an betroffene Fahrgäste bei Verspätung
6. **Echte Daten** statt Demo (Seeds aus realen Linien/Tourdaten)

---

## 1. Backend-Struktur (Migration)

**Neue Tabelle `trip_registry`** — einheitliches Fahrt-Verzeichnis:
- `trip_uid` (TEXT, unique, Format: `MT-YYYY-XXXXXX`) — die eine ID für alles
- `source_type` (`line_trip` | `package_tour_date`)
- `source_id` (FK auf line_trips.id oder tour_dates.id)
- `departure_at`, `origin`, `destination`, `status`
- `current_delay_min` (INT, default 0)
- `delay_reason`, `delay_updated_at`, `delay_updated_by`

**Neue Tabelle `trip_delay_events`** — Audit + Versand-Status:
- `trip_uid`, `delay_min`, `reason`, `reported_by`, `notified_count`, `created_at`

**Trigger:** beim Insert in `line_trips` oder `tour_dates` → automatisch Eintrag in `trip_registry` mit generierter `trip_uid`.

**RPC `report_trip_delay(trip_uid, delay_min, reason)`** (SECURITY DEFINER, staff-only):
- Aktualisiert `trip_registry` + `line_trips.delay_minutes` bzw. `tour_dates`
- Schreibt Event in `trip_delay_events`
- Triggert Edge Function `notify-trip-delay`

---

## 2. Ops-Seite: `/admin/trips` (Alle Fahrten + Verspätung)

Eine zentrale Tabelle mit Filtern (heute/morgen/Woche, Linie/Pauschal, Status):
- Spalten: Trip-UID · Typ · Route · Abfahrt · Status · **aktuelle Verspätung** · Aktion
- Action-Button **„Verspätung melden"** → Drawer mit:
  - Verspätung in Minuten (Slider/Input)
  - Grund (Stau, Panne, Wetter, Sonstiges + Freitext)
  - Checkbox „Fahrgäste benachrichtigen"
- Sub-Tab **„Verspätungs-Historie"** = Liste aller `trip_delay_events`

Ersetzt die parallele Logik in `AdminLineTrips` und `AdminDispatch` durch eine Sicht. Bestehende Seiten bleiben, linken aber auf `/admin/trips`.

---

## 3. Live-Verfolgung (`/verfolge/:tripNumber`)

- Liest `trip_registry.current_delay_min` zusätzlich zu `line_trips`
- Realtime-Subscribe auf `trip_registry` UND `trip_delay_events`
- Großes rotes Banner „**Verspätung +25 min** — Grund: Stau A2" wenn `delay > 0`
- Funktioniert auch für Pauschalreise-Trip-UIDs

---

## 4. E-Mail-Versand bei Verspätung

**Edge Function `notify-trip-delay`**:
- Input: `trip_uid`
- Findet alle Fahrgäste:
  - Linienfahrt: `bookings` JOIN `trips` WHERE `trip_id` matched
  - Pauschalreise: `tour_bookings` WHERE `tour_date_id` matched
- Schickt jedem eine personalisierte Mail über bestehendes `send-transactional-email`
- Template `trip-delay-notification.tsx` mit: Trip-UID, Route, ursprüngliche/neue Abfahrt, Grund, Verfolgungs-Link
- Schreibt Anzahl zurück in `trip_delay_events.notified_count`

---

## 5. Echte Daten (Seed)

- Linien aus DB (bestehend) — bleiben
- Pauschalreise-Termine aus `tour_dates` — bekommen Trip-UID per Backfill
- Backfill-Migration: für alle bestehenden `line_trips` und zukünftigen `tour_dates` jeweils `trip_registry`-Eintrag erzeugen
- Demo-Verspätung **nicht** seeden — User pflegt live

---

## Technische Details

**Trip-UID-Format:** `MT-2026-A7K3X9` (Prefix Metropol Tours · Jahr · 6-stellig Base32) — generiert via DB-Funktion `generate_trip_uid()`.

**Realtime aktivieren:** `ALTER PUBLICATION supabase_realtime ADD TABLE trip_registry, trip_delay_events;`

**RLS:**
- `trip_registry` SELECT public (nur Basis-Felder via View ohne Pax-Daten)
- `trip_delay_events` SELECT staff, INSERT nur via RPC
- `report_trip_delay` nur admin/office/agent/driver

**Files:**
- Migration: trip_registry + trip_delay_events + Trigger + RPC + Backfill
- `src/pages/AdminTrips.tsx` (neu)
- `src/pages/TrackTripPage.tsx` (Delay-Banner + Realtime)
- `supabase/functions/notify-trip-delay/index.ts` (neu)
- `supabase/functions/_shared/transactional-email-templates/trip-delay-notification.tsx` (neu)
- `supabase/functions/_shared/transactional-email-templates/registry.ts` (Eintrag)
- Sidebar: „Alle Fahrten" als neuer Eintrag in „Fahrten & Betrieb"

**Liste der Trip-UIDs:** Nach Migration zeige ich dir im Chat die ersten 50 generierten UIDs als CSV/Tabelle.

---

## Reihenfolge der Umsetzung
1. Migration (Tabellen + RPC + Trigger + Backfill)
2. E-Mail-Template + Edge Function
3. AdminTrips-Seite + Sidebar
4. Live-Verfolgung Delay-Banner
5. Liste der UIDs liefern

Soll ich starten?
