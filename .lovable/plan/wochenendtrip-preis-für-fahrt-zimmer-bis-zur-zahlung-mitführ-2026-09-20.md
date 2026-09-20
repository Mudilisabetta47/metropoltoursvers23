# Wochenendtrip: Preis für "Fahrt + Zimmer" bis zur Zahlung mitführen

## Problem (bestätigt)
Auf der Wochenendtrip-Seite kann man "Fahrt + Doppelzimmer" oder "Fahrt + Einzelzimmer" wählen.
Der angezeigte Gesamtpreis enthält den Zimmeraufschlag. Beim Klick auf "Jetzt buchen" wird die
Zimmerwahl an die Kasse übergeben, dort aber nie gelesen: die Kasse berechnet den Preis allein
aus dem Bus-Fahrpreis der Fahrt. Ergebnis: Der Gast sieht und bezahlt an der Kasse einen anderen
(niedrigeren) Betrag als im Angebot — ohne Zimmerzeile und ohne Bestätigung der Unterkunft.

## Warum das nicht "mal eben" geändert wird
Der Endpreis wird bewusst serverseitig gebildet (Preisberechnung in der Datenbank, Zahlung über
die Zahlungs-Funktion). Ein reiner Frontend-Aufschlag wäre manipulierbar. Die Änderung berührt
Preislogik, Buchungsdatensatz und Zahlbetrag — daher als eigener, abgestimmter Schritt.

## Vorgeschlagene Lösung
1. **Zimmerwahl serverseitig bewerten**: Die Kasse liest die Zimmerwahl aus der Adresse und
   ermittelt den Aufschlag nicht aus der Adresse, sondern aus dem Wochenendtrip-Datensatz
   (Felder für Doppel-/Einzelzimmer) anhand der gebuchten Fahrt.
2. **Preisübersicht ergänzen**: Eigene Zeile "Unterkunft (Doppelzimmer/Einzelzimmer) × Personen"
   in der Zusammenfassung und in der Zahlungsansicht, damit der Betrag zum Angebot passt.
3. **Buchung speichern**: Zimmerwahl und Aufschlag werden am Buchungsdatensatz hinterlegt
   (Zusatzleistungen), damit Team, Bestätigungsmail und Rechnung die Unterkunft ausweisen.
4. **Zahlbetrag**: Die Zahlungs-Funktion nimmt den Gesamtbetrag inkl. Unterkunft aus der
   gespeicherten Buchung — kein vom Browser gesendeter Preis.
5. **Absicherung**: Ist für eine Fahrt kein Zimmerpreis hinterlegt, bleibt nur "Nur Fahrt"
   wählbar; die Kasse ignoriert eine unbekannte Zimmerwahl statt falsch zu rechnen.

## Alternative (kleiner, sofort machbar)
Zimmeroptionen führen nicht in die Kasse, sondern in eine Anfrage: Der Gast fragt "Fahrt + Zimmer"
an und erhält ein verbindliches Angebot; nur "Nur Fahrt" wird direkt online bezahlt. Das beseitigt
die Preisabweichung sofort, verzichtet aber auf die Online-Buchung mit Hotel.

## Technische Details
- `src/pages/WeekendTripDetailPage.tsx`: Parameter `unterkunft` bleibt, zusätzlich Trip-Kennung
  des Wochenendtrips übergeben.
- `src/pages/CheckoutPage.tsx`: `unterkunft` auslesen, Aufschlag aus `weekend_trips`
  (`price_double_room` / `price_single_room`) laden, in Preisübersicht und `totalPrice` einrechnen.
- Buchungsanlage: Aufschlag als Extra am Buchungsdatensatz speichern.
- `supabase/functions/create-bus-payment`: Betrag inkl. Unterkunft aus der Buchung nehmen.
