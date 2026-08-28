# Individuelle Fahrten als vollwertige Fahrten

Ziel: Eine im Admin erstellte Fahrt läuft durch exakt dieselbe Maschinerie wie Linien- und Pauschalfahrten — kein Parallelsystem. Statt einer neuen "Sonderfahrt"-Tabelle wird beim Anlegen automatisch der bestehende Fahrt-Stack befüllt (Route → Halte → Fahrt → Sitzplätze → Buchungen/Tickets → Trip-Registry → Dienstplan → Fahrer-App → Tracking → Wallet).

## Was neu entsteht

**1. Fahrt-Assistent `/admin/fahrten/neu`**
Ein Formular, das in einem Schritt anlegt:
- Fahrtname, Hin- und Rückfahrt (Datum/Uhrzeit), Start/Ziel, Zwischenhalte mit Zeiten (Abfahrt, Halte, Pause, Grenzübergang, Ankunft), Fahrzeug, Sitzplatzkapazität, interne Notizen
- daraus: Route (als Charter-Route markiert), Halte in Reihenfolge, Hinfahrt und optional Rückfahrt, Sitzplatzbestand aus dem Fahrzeug-Layout
- automatische Registrierung in der Fahrten-Registry → Tracking-Link und Verspätungsmeldung funktionieren sofort

**2. Fahrplan/Reiseplan**
Halte je Fahrt mit Uhrzeit und Typ (Abfahrt / Halt / Pause / Grenze / Ankunft) editierbar im Admin; dieselbe Ansicht wird in der Fahrer-App und auf der Fahrgast-Tracking-Seite gerendert.

**3. Dienstplan**
Die Fahrt erscheint in der bestehenden Schichtplanung auswählbar (Fahrt-Auswahl umfasst künftig Linien-, Pauschal- und individuelle Fahrten). Fahrer, weitere Mitarbeiter (Reiseleiter/Begleitung), Schichtzeiten und Fahrzeug wie gewohnt zuweisbar. Mitarbeitende sehen ihren Einsatz in ihrer bestehenden Ansicht.

**4. Fahrer-App**
Keine neue Oberfläche: Die Fahrt kommt über die Schichtzuweisung in "Meine Fahrten". Ergänzt werden dort Fahrplan-Anzeige, Fahrtdetails, Fahrt starten / GPS an / Fahrt beenden sowie der bestehende Ticketscanner inkl. Testscan-Modus.

**5. Ticketing**
Im Fahrtdetail ein Fahrgast-Panel: Einzelanlage und Sammelanlage (z. B. 30 Personen, mit Sitzplatzvergabe automatisch oder manuell). Pro Fahrgast entstehen Buchungsnummer, Ticketnummer, Sitzplatz, QR-Code, Apple-Wallet-Pass und persönlicher Tracking-Link — über die bestehenden Funktionen, nicht neu gebaut.

**6. Live-Tracking**
Jede Fahrt hat automatisch ihre Registry-Kennung. Fahrer startet die Fahrt → Positionen laufen in den Live-Bestand → Admin sieht den Bus, Fahrgäste sehen nur ihre eigene Fahrt über den signierten Link, keine fremden Fahrgastdaten.

**7. Apple Wallet**
Der Pass zieht Fahrtname, Start/Ziel, Datum/Zeit, Sitzplatz und Tracking-Link aus derselben Fahrt — funktioniert für individuelle Fahrten identisch.

**8. Zentrale Fahrtenübersicht**
Die bestehende Seite "Alle Fahrten" wird zur einzigen Übersicht: Linie, Pauschal, Privat, Sonder-, Gruppen- und individuelle Fahrt mit Filter nach Fahrtart, Status, Verspätung, Fahrer und Fahrzeug.

**9. Rollen**
Admin: alles. Fahrer: eigener Einsatz, Fahrplan, Scanner, GPS. Reiseleiter/Mitarbeiter: eigener Einsatzplan plus Fahrtdaten. Fahrgast: nur eigenes Ticket, eigene Buchung, Tracking dieser Fahrt.

## Technische Umsetzung

- Datenbank: `routes` erhält `trip_category` (`line` | `charter` | `private` | `group` | `special`) und `is_charter`; `trips` erhält `title`, `internal_notes`, `return_trip_id`, `guide_user_id`, `status`, `started_at`, `ended_at`; neue Tabelle `trip_schedule_stops` (Fahrt, Halt, Zeit, Typ, Sortierung) für Zeiten pro Fahrt inkl. Pausen/Grenzen; `employee_shifts` bleibt unverändert (`assigned_trip_id` genügt). Alle neuen Objekte mit GRANTs + RLS (Admin/Office schreibend, Fahrer lesend für eigene Einsätze, Fahrgast nur über Token/eigene Buchung).
- Registry-Trigger: `trips` mit Charter-Kategorie synchronisiert nach `trip_registry` (`source_type = 'charter_trip'`), analog zu Linien/Touren.
- Serverfunktion `create-charter-passengers`: legt Buchungen + Tickets + Sitzplatzbindung transaktional an (Einzeln oder Sammel), erzeugt Nummern über die bestehenden Nummernfunktionen und Tracking-Token.
- Frontend: neuer Assistent + Fahrtdetailseite unter `/admin/fahrten`, Erweiterung von `AdminTrips`, `AdminShifts` und `src/components/fis/TripsTab.tsx`; Wallet- und Ticket-PDF-Funktionen erhalten die Charter-Felder.

## Umsetzung in Etappen

1. Datenmodell + Registry-Sync (Migration)
2. Fahrt-Assistent, Fahrplan-Editor, Fahrtdetail im Admin
3. Dienstplan-Anbindung und zentrale Fahrtenübersicht
4. Fahrgäste/Ticketing inkl. Sammelanlage, Wallet, Tracking-Links
5. Fahrer-App: Fahrplan, Fahrt starten/beenden, GPS, Testscan
