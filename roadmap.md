# Roadmap

## Silvesterreisen-Einstieg
- [x] Zusätzlichen ersten Startseiten-Slide mit hochgeladenem Amsterdam-Busbild erstellen
- [x] Datenbasierte Silvesterreisen-Übersicht mit Buchungslinks, FAQ und Suchmaschinen-Angaben erstellen
- [x] Übersicht und veröffentlichte Silvesterreisen in Sitemap und Footer aufnehmen
- [x] Auswahlregeln mit 2 Tests prüfen; Startseite → Übersicht → eigene Reise auf Desktop/Mobil geprüft; gehostete Bildadresse liefert PNG (lokaler Browser nutzt Originalbild als CDN-Ersatz)

## Gutschein-Stornierung
- [x] Rabattierten Zahlbetrag in Verwaltung und serverseitiger Erstattungsprüfung verwenden
- [x] 22 Tests bestanden; Stripe/Mollie-Gutschein-Storno mit/ohne Gebühr und vorheriger Erstattung geprüft; Funktion bereitgestellt
- Browserprüfung einer echten Gutschein-Stornierung nicht möglich: keine zugängliche aktive rabattierte Onlinebuchung gefunden; keine echte Auszahlung ausgelöst

## Zahlungsfehler prüfen und beheben
- [x] Mollie-Tourstorno: ausdrückliche Erstattungsauswahl, korrekter Teilbetrag und keine doppelte Buchhaltung
- [x] Bus-Checkout: Zahlungsrückkehr begrenzen und gespeicherte Zahlungs-ID entfernen
- [x] 14 Regressionstests bestanden; angemeldete Buchungsrückkehr mit kontrollierter Zahlungsantwort und vorhandener Fahrt geprüft; Stornofunktion bereitgestellt (keine echte Geldbewegung getestet)

## Paris-Silvester-Special
- [x] Paris-Seite für 30.12.2026–01.01.2027 an bestehende Landingpages angleichen und Feuerwerksmotiv einbauen
- [x] Startseitenhinweis, SEO und Sitemap anbinden; Anfrage ohne erfundene Preise ermöglichen
- [x] Seite und E-Mail-Anfragelink auf Desktop und Mobil prüfen (kein Mailversand im Browsertest)

## Laufend: Website-Verbesserungen (Busunternehmen)
- [x] Gästebewertungen: TestimonialsSection DB-basiert (customer_reviews), Fake-Texte entfernt, Admin-Moderation /admin/bewertungen, JSON-LD Sterne (nur mit echten Bewertungen)
- [x] Reise-Blog: blog_posts Tabelle + RLS, /blog + /blog/:slug (react-markdown, JSON-LD Article), Admin /admin/blog, Sitemap + Footer, 2 Startartikel
- [x] Geschenkgutscheine: Shop-Produkt mit Varianten 25/50/75/100 €, Code-Erstellung in shop-create-order (GT-XXXX, inaktiv), Aktivierung bei Zahlungseingang (AdminShop → activate_gift_vouchers), Seite /gutscheine, Footer

## Laufend: Einheitliches Pauschalreisen-Template
- [x] Gemeinsamen Hero, Reiseinfos, Preise und Galerie datengetrieben verbessern
- [x] Bestehende Leistungen, Reiseprogramm und Zustiegsorte vollständig darstellen
- [x] Desktop- und Mobile-Buchungsführung verbessern
- [x] Alle Pauschalreisen über das gemeinsame Template auf Desktop und Mobil prüfen

## Laufend: Premium-Checkout
- [x] Gemeinsame interaktive METROPOL-Zahlungskarte in beide Web-Checkouts integrieren
- [x] Bestehende Stripe-/PayPal-Zahlung und reale Buchungsdaten anbinden
- [x] Responsive Darstellung und Sicherheitsfund prüfen
- [ ] Eingebettete Stripe-Kartenfelder aktivieren (blockiert: veröffentlichbarer Stripe-Schlüssel wurde nicht hinterlegt)
