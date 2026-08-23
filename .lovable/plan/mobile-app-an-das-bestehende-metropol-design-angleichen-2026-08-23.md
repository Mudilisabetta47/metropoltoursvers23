# Mobile-App an das bestehende METROPOL-Design angleichen

## Ziel
Die Kunden-App unter `/app` bleibt technisch eigenständig für Smartphone und Capacitor, übernimmt aber die erkennbare Designsprache, Informationsdichte und Reise-Templates der öffentlichen METROPOL-Website. Es entsteht kein zweites Designsystem.

## Festgestellte Abweichungen
- Die mobilen Reisekarten sind derzeit eigene, stark vereinfachte Karten und lassen Web-Merkmale wie Bestseller-/Rabatt-Badges, Bewertungszeile, Inklusivleistungen, klaren Terminbereich und die etablierte Preis-/CTA-Zeile weg.
- Das mobile Reisedetail übernimmt zwar Daten und Sticky CTA, bildet das bestehende Booking-Layout aber nur teilweise ab; Reiseverlauf, Komfort, Highlights, nicht enthaltene Leistungen und die bestehende visuelle Gruppierung fehlen oder sind anders aufgebaut.
- Die Suche auf der Startseite ist aktuell nur ein Link zum Reisekatalog. Echte Treffer und Vorschläge existieren erst auf der Folgeseite.
- Startseiten-Reihenfolge, Header und sehr große Rundungen wirken wie ein separates Reise-App-Template statt wie die mobile Ausprägung der Website.
- Safe Areas sind teilweise vorhanden; Touch-Flächen, Bottom Sheets und Overflow-Schutz sind noch nicht über alle Ansichten konsistent.

## Umsetzung

### 1. Gemeinsame visuelle Bausteine statt paralleler Templates
- Web-Reisekarte aus `/reisen` in einen gemeinsamen, responsiven Reise-Kartenbaustein überführen.
- Bestehende Tokens, DM Sans, METROPOL-Grün, Badge-, Button-, Icon-, Border- und Shadow-Stile beibehalten.
- Mobile Variante als Layoutmodus desselben Bausteins umsetzen: 16:11-Bild, Badges, Ort/Dauer/Bewertung, Beschreibung, Hotel/Frühstück/Reisebus, Datum, Preis, Verfügbarkeit und CTA.
- Große generische App-Rundungen auf die bestehenden Web-Radien und Abstände zurückführen.

### 2. Mobile Startseite neu ausbalancieren
- Reihenfolge herstellen: Branding → Hero/Willkommen → echte Suche → Empfehlungen → Reiseziele → kommende Buchung → Angebote/weitere Reisen.
- Hero und Bildsprache an die bestehende `/reisen`-Inszenierung angleichen, ohne das Desktop-Layout zusammenzuschieben.
- Empfohlene Reisen als touchoptimierte horizontale Swipe-Reihe mit dem gemeinsamen Reise-Template darstellen.
- Kommende Buchung weiterhin nur aus echten Buchungsdaten anzeigen.

### 3. Funktionale Startseiten-Suche
- Suchfeld „Wo möchtest du hin?“ direkt im Hero-/Startbereich integrieren.
- Vorhandene Tourdaten und dieselbe Filtersemantik wie der Web-Reisekatalog verwenden: Ziel, Land, Ort, Kategorie und Beschreibung.
- Während der Eingabe echte Vorschläge aus vorhandenen Reisen anzeigen; ein Treffer öffnet direkt das passende mobile Reisedetail.
- „Alle Ergebnisse“ übergibt den Suchbegriff an `/app/reisen`; keine Dummy-Treffer.
- Vorschläge auf Mobile als animiertes Bottom Sheet mit Tastatur-, Fokus- und Safe-Area-Unterstützung öffnen.

### 4. Reisekatalog und Filter
- Mobile Karten auf das gemeinsame Web-Template umstellen.
- Suche, Kategorien und bestehende reale Datenlogik behalten.
- Zusätzliche Web-Filter (Dauer, Monat, Abfahrtsort, Leistungen, Verfügbarkeit und Sortierung) in ein Bottom Sheet übertragen.
- Horizontale Filterchips beibehalten, aktive Filter sichtbar zählen und alle Inhalte ohne horizontalen Seitenüberlauf auslegen.

### 5. Reisedetail als mobile Version des Web-Templates
- Bestehende Hierarchie wiederherstellen: Kategorie/Bewertung/Titel → Ort und Hin-/Rückreise → Bildergalerie → Eckdaten → Beschreibung/Highlights → Reiseverlauf → Hotel → Leistungen/nicht enthalten → Reisekomfort → Abfahrtsorte und Extras.
- Galerie als performante Swipe-Galerie mit Bildzähler und optionalem Vollbild-Sheet adaptieren.
- Termine und Tarif-/Teilnehmerauswahl aus dem bestehenden Buchungsmodul in mobile Bottom Sheets bzw. kompakte Auswahlbereiche übertragen.
- Sticky Preis-/Buchungs-CTA oberhalb der Bottom Navigation behalten und exakt an Safe Areas anpassen.
- Nicht buchbare Reisen weiterhin sichtbar lassen und den bestehenden Anfrage-/„Demnächst buchbar“-Status übernehmen.

### 6. Buchungen, Ticket und Profil angleichen
- „Meine Reisen“-Karten an die visuelle Struktur der bestehenden Buchungsübersicht anpassen: Status, Strecke/Ziel, Datum, Buchungsnummer, Preis und Dokumentaktionen klar gruppieren.
- Ticket optisch an das bestehende METROPOL-Ticket/PDF annähern, ohne QR-, Offline- oder Rechnungsfunktion zu verändern.
- Profilzeilen und Formbereiche mit bestehenden Buttons, Inputs und Card-Radien vereinheitlichen.
- Bestehende echte Auth-, Gastzugangs-, Ticket- und Rechnungslogik unverändert wiederverwenden.

### 7. Mobile Interaktion und Qualität
- Bestehende Page Transitions und Press-Feedback beibehalten, aber `prefers-reduced-motion` respektieren.
- Leichte Reveal-/Sheet-Animationen verwenden; keine dauerhaft rechenintensiven Effekte.
- Mindest-Touchflächen von 44 px, lesbare Typografie und stabile Bildseitenverhältnisse sicherstellen.
- iOS Safe Areas/Dynamic Island sowie Android-Systemleisten für Header, Bottom Navigation, Sheets und Sticky CTA prüfen.
- Mobile Viewports auf Überläufe, überdeckte Inhalte, Lade-/Leerzustände und lange deutsche Texte testen.

## Technische Leitplanken
- Keine Änderungen an Buchungs-, Zahlungs-, Auth- oder Datenbanklogik, außer sie sind für die gemeinsame Darstellung zwingend nötig.
- Keine Mock-Daten; ausschließlich bestehende Reisen und Buchungen aus dem Backend.
- Bestehende shadcn-Komponenten und semantische Tailwind-Tokens nutzen; keine neuen parallelen Farb- oder Typografie-Systeme.
- Gemeinsame Präsentationslogik extrahieren, während Web- und Mobile-Routing bestehen bleiben.

## Abnahme
- `/reisen` und `/app/reisen` sind klar als dieselbe Marke und dasselbe Reise-Template erkennbar.
- Startseitensuche liefert reale Vorschläge und öffnet echte Ergebnisse.
- Alle geforderten Reisedetails bleiben mobil auffindbar.
- Kein horizontaler Seitenüberlauf bei typischen iPhone- und Android-Breiten.
- Sticky CTA und Bottom Navigation überdecken keine Inhalte und berücksichtigen Safe Areas.
- Produktions-Build sowie mobile Kernflüsse Start → Suche → Detail → Checkout und Meine Reisen → Ticket funktionieren fehlerfrei.
