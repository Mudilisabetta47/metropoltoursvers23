# Phase 1 – Metropol Tours Kunden-App (Plan, noch keine Umsetzung)

Analyse abgeschlossen. Ergebnis: Die App kann vollständig in der bestehenden Codebasis entstehen — als eigener `/app/*`-Bereich mit eigener mobiler Shell, der dieselben Hooks, Edge Functions und Tabellen nutzt. Kein Rewrite, keine zweite Datenbank, kein Eingriff in Website, Admin oder FIS.

Wichtige Befunde:
- Capacitor 8 ist bereits als Abhängigkeit installiert, `capacitor.config.ts` zeigt aber auf die Preview-URL (`server.url`) — das ist für Production zu entfernen.
- Vorhandene wiederverwendbare Bausteine: `useAuth`, `useTicketDownload`, `useTourDocuments`, `useCookieConsent`, `tourAvailability`, alle `src/components/tours/*`, `WalletPassButton`, `TravelSearchBar`.
- Vorhandene Edge Functions decken Buchung, Zahlung, Rechnung, Ticket, Self-Service und Wallet komplett ab.
- Kritisch für Gastbuchungen: `my-bookings` / `request-booking-access` (Token-Flow) sind bereits vorhanden und in der App die Basis für „Meine Reisen“ ohne Konto.

---

## A. Wiederverwendung (unverändert)

| Bereich | Bestehend |
|---|---|
| Auth | `src/hooks/useAuth.tsx` (Session, Rollen) — 1:1 |
| Reisedaten | Abfragen auf `package_tours`, `tour_dates`, `tour_tariffs`, `tour_extras`, `tour_inclusions`, `tour_pickup_stops`, `tour_legal` |
| Buchbarkeit | `src/lib/tourAvailability.ts` |
| Checkout-Logik | Validierung, Geburtsdatum-Pflicht, Zustiegsaufschläge, Gutschein-Prüfung aus `TourCheckoutPage.tsx` (Logik wird in Hooks extrahiert, Web-Seite bleibt bestehen) |
| Zahlung | `create-tour-payment`, `verify-tour-payment`, `create-paypal-order`, `capture-paypal-order` |
| Meine Buchungen | `my-bookings`, `request-booking-access`, `booking-self-service`, `lookup-booking` |
| Dokumente | `generate-invoice-pdf`, `generate-tour-documents`, `generate-ticket-pdf`, `apple-wallet-pass` |
| Hooks | `useTicketDownload`, `useTourDocuments`, `useCookieConsent`, `useSessionId` |
| Design-Tokens | `src/index.css`, Tailwind-Theme, `Logo.tsx` |

## B. Neue Komponenten (nur additiv)

- `src/mobile/MobileAppShell.tsx` — Safe-Area-Layout, Tab-Bar (Entdecken · Reisen · Meine Reisen · Profil), Page-Transitions via framer-motion
- `src/mobile/pages/`: `AppHome.tsx` (Hero „Deine nächste Reise beginnt hier.“, Empfehlungen, Top-Ziele, bevorstehende Reise, Angebote, Schnellsuche), `AppTours.tsx` (Suche/Filter), `AppTourDetail.tsx`, `AppCheckout.tsx` (3 Schritte), `AppMyTrips.tsx`, `AppTicket.tsx`, `AppProfile.tsx`, `AppLogin.tsx` (Passwort + Gast-Token)
- `src/mobile/components/`: `TourCardMobile`, `DestinationChips`, `BookingCard`, `TicketPass` (QR + Offline), `BottomSheet`, `StepHeader`, `PaymentStatusPill`
- `src/mobile/hooks/`: `useIsNativeApp`, `useMobileTours`, `useMyTrips` (Konto **und** Gast-Token), `useOfflineTickets` (Capacitor Preferences), `usePushRegistration`
- `src/mobile/lib/secureSession.ts` — Session-Storage über Capacitor Preferences/Keychain statt LocalStorage (nur nativ aktiv)

## C. Routen (neu, additiv unter `/app`)

`/app` (Home) · `/app/reisen` · `/app/reisen/:tourId` · `/app/checkout` · `/app/meine-reisen` · `/app/ticket/:bookingNumber` · `/app/profil` · `/app/login` · `/app/einstellungen`

Bestehende Routen bleiben unverändert. Im nativen Build startet die App über einen Redirect von `/` auf `/app`; im Web bleibt `/` die Website.

## D. Capacitor-Funktionen

1. `capacitor.config.ts` bereinigen: `server.url`/`cleartext` entfernen (Production lädt `dist`), Dev-Hot-Reload nur optional über Env-Variable; `appName: "METROPOL TOURS"`, Splash- und StatusBar-Konfig, Deep-Link-Schema.
2. Plugins: `@capacitor/preferences` (sichere Session + Offline-Ticket), `@capacitor/push-notifications`, `@capacitor/camera` + Barcode-Scanner (nur falls Kunden-QR-Funktionen nötig — Scannen bleibt sonst FIS), `@capacitor/app` (Deep Links), `@capacitor/browser` (Stripe/PayPal-Redirect), `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/share`, `@capacitor/haptics`.
3. Universal Links / App Links für `app.metours.de` (`apple-app-site-association`, `assetlinks.json`) — für Zahlungsrückkehr und `?ref=`-Buchungslinks.
4. App-Icons + Splash aus dem Metropol-Logo.

## E. Backend-Erweiterungen (nur additiv, später)

- Neue Edge Function `register-push-device` (Device-Token entgegennehmen, an `auth.uid()` oder Buchungsnummer binden).
- Neue Edge Function `send-push-native` (FCM/APNs-Versand), aufgerufen aus bestehenden Flows (Buchungsbestätigung, Zahlung, Verspätung `notify-trip-delay`) — bestehende Funktionen werden **erweitert, nicht ersetzt**.
- Secrets: FCM-Server-Key, APNs-Key — ausschließlich serverseitig.

## F. Mögliche Datenbankänderungen (nur Vorschlag, wird NICHT automatisch ausgeführt)

1. `push_subscriptions`: additive Spalten `platform` (`ios`/`android`/`web`), `device_token`, `device_id`, `app_version`, `last_seen_at`. Bestehende Spalten und Web-Push bleiben unverändert.
2. Optional: Verknüpfungstabelle `booking_devices` (booking_number ↔ device_token), damit auch Gastbuchungen Push erhalten.
3. Optional: RLS-Policy-Ergänzung, damit Rolle `customer` die eigenen `tour_bookings`, `tour_invoices` und `booking_status_events` per `user_id`/E-Mail lesen darf — heute läuft das über Edge Functions. Nur wenn wir Direktzugriff wollen; sonst nicht nötig.

Keine Löschungen, keine Umbenennungen, keine Migration bestehender Daten. Jede dieser Änderungen wird vor Ausführung einzeln zur Freigabe vorgelegt.

## G. Was NICHT nötig ist

- Keine neue Datenbank, kein Datenexport/-import
- Keine Änderung an Website-, Admin- oder FIS-Routen
- Keine neue Zahlungslogik, keine neuen Zahlungs-Edge-Functions
- Keine zweite Authentifizierung
- Keine Lockerung bestehender RLS-Policies
- Kein Rewrite bestehender Seiten (Web-Checkout bleibt aktiv)

## H. Sicherheitsrisiken

| Risiko | Maßnahme |
|---|---|
| Admin-/FIS-Routen im App-Bundle erreichbar | Kunden-Build lädt `/app/*`; Admin-Routen per Guard und Build-Flag ausgeschlossen |
| Session im LocalStorage auf dem Gerät | Umstellung auf Preferences/Keychain im nativen Kontext |
| Fahrzeug-Standortdaten im Realtime-Kanal (bekannter offener Punkt) | Vor öffentlichem Launch absichern; Live-Position in der Kunden-App erst danach freischalten |
| Preisberechnung auf dem Gerät | Preise bleiben serverseitig; App zeigt nur die Server-Antwort |
| Secrets im Build | Nur Anon-Key; keine Service-Role-, Stripe- oder Resend-Keys im Client |
| Offline-Ticket auf dem Gerät | Nur nicht-sensible Felder (Buchungsnummer, Reise, Datum, QR), verschlüsselte Ablage, kein Zahlungs-/PII-Überschuss |
| Gast-Token-Flow | Kurze Gültigkeit beibehalten, Rate-Limit auf `request-booking-access` prüfen |

## I. Reihenfolge der Umsetzung

1. Mobile Shell + Tab-Navigation + `/app`-Routen (leere, gestaltete Screens)
2. Entdecken + Reisen (Live-Daten aus `package_tours`/`tour_dates`)
3. Reise-Detail (alle geforderten Felder inkl. Hotel, Zustiegsorte, Leistungen, Hinweise)
4. Checkout (Wiederverwendung der bestehenden Logik + Stripe/PayPal über In-App-Browser)
5. Meine Reisen (Konto + Gast-Token) inkl. Rechnung/Storno/Umbuchung
6. Ticketansicht + Offline-Speicherung + Apple Wallet
7. Profil & Einstellungen
8. Capacitor-Production-Konfiguration, Icons, Splash, Deep Links
9. Push-Infrastruktur (DB-Erweiterung zur Freigabe, dann Edge Functions, dann Client)
10. Härtung: sichere Token-Ablage, RLS-Review `customer`, Realtime-Absicherung

## J. Testabnahme vor dem ersten iOS/Android-Build

- Reisen laden live, keine Dummy-Daten; unveröffentlichte Reisen zeigen „Demnächst buchbar“ und blockieren den Checkout
- Vollständige Testbuchung mit Stripe **und** PayPal, Rückkehr in die App per Deep Link, Status korrekt
- Gutschein, Zustiegsaufschlag und Extras ergeben serverseitig denselben Preis wie in der Anzeige
- „Meine Reisen“ funktioniert mit Konto **und** mit Gast-E-Mail-Token
- Rechnung als PDF ladbar, Ticket-QR wird vom bestehenden FIS-Scanner akzeptiert
- Ticket im Flugmodus sichtbar
- Kein Zugriff auf Admin-/FIS-Routen aus dem Kunden-Build
- Safe Areas, Notch, Tastatur, Back-Button (Android), Dark/Light
- Lighthouse/Bundle-Check und sauberer `npm run build` + `npx cap sync`

---

Nach deiner Freigabe starte ich mit Schritt 1–3 und lege dir jede Datenbankänderung vorher einzeln zur Bestätigung vor.
