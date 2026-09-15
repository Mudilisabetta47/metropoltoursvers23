# Premium-Checkout mit interaktiver METROPOL-Zahlungskarte

## Ziel
Den bestehenden Zahlungsschritt in beiden Web-Checkouts durch eine gemeinsame, responsive Premium-Oberfläche ersetzen. Buchungsdaten, Preise, Extras, Sitzplätze, Gutscheine und Bestätigungen bleiben an die vorhandenen Abläufe gebunden.

## Umsetzung
- Eine wiederverwendbare `InteractivePaymentCard`-Komponente im METROPOL-Design erstellen.
- Echte CSS-3D-Karte mit Vorder-/Rückseite, sanfter CVC-Drehung, Kartenmarke, Karteninhaber, Chip und reduzierten Lichtreflexen bauen.
- Sichere eingebettete Stripe-Felder für Kartennummer, Ablaufdatum und CVC verwenden; die App speichert oder liest keine vollständigen Kartendaten.
- Visa, Mastercard und American Express über Stripes sichere Markenerkennung anzeigen.
- Desktop: Karte und Reiseübersicht links, Zahlung und Sicherheit rechts. Mobil: Reiseübersicht, Karte, Felder, Preis und Bezahlbutton.
- Reale Daten aus den vorhandenen Zuständen anzeigen: Strecke/Ziel, Termin, Reisende, Sitzplätze, Extras, Buchungsnummer sobald erzeugt, Gutschein und Gesamtpreis.
- Zustände für Validierung, Fokus, Laden, Fehler und erfolgreiche Zahlung ergänzen.
- Bestehendes PayPal als alternative Zahlungsart erhalten.

## Zahlungsablauf
- Die vorhandenen Buchungsdatensätze und serverseitigen Preisprüfungen weiterverwenden.
- Für Kartenzahlungen einen Stripe Payment Intent erzeugen und die Zahlung innerhalb der Seite bestätigen.
- Nach erfolgreicher Zahlung die vorhandene Verifizierung, Buchungsbestätigung, Dokumente und Bestätigungsansicht verwenden.
- PayPal weiterhin über den bestehenden sicheren Ablauf öffnen.

## Sicherheitsgrenze
Stripe kapselt Kartennummer, Ablaufdatum und CVC in geschützten Feldern. Deshalb zeigt die 3D-Karte den Karteninhaber live, erkennt die Marke und reagiert auf Feldfokus; sensible Ziffern werden nur maskiert visualisiert und niemals in React-State, Logs oder der Datenbank gespeichert.

## Zusätzlich erforderlicher Schutz
- Anonyme Leser verlieren Zugriff auf interne Notizen sowie Fahrer-/Reiseleiter-Zuordnungen in Fahrten.
- Öffentliche Fahrplan-, Such- und Checkout-Daten bleiben verfügbar; interne Mitarbeiterabläufe bleiben erhalten.

## Prüfung
- Beide Checkout-Arten mit echten geladenen Reisedaten bis zum sicheren Stripe-Testablauf prüfen.
- Mobile Ansicht bei 448 px und Desktopansicht bei 1280 px visuell testen.
- Kartenrotation, Markenwechsel, Fehlerzustände, PayPal-Auswahl und Rückkehr zur bestehenden Bestätigung prüfen.
- Build- und Laufzeitfehler sowie den behobenen Sicherheitsfund kontrollieren.

## Voraussetzung
Für die eingebetteten Stripe-Felder wird zusätzlich zum bereits vorhandenen geheimen Stripe-Schlüssel der veröffentlichbare Stripe-Schlüssel benötigt. Er wird vor der Umsetzung sicher hinterlegt und darf im Browser verwendet werden.
