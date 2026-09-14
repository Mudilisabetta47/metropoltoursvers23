# Einheitliches Pauschalreisen-Template

## Ziel
Das bestehende zentrale Detail-Template für alle Pauschalreisen wird gezielt verbessert. URLs, Navigation, Buchungsablauf, Bilder, SEO und gespeicherte Reiseinhalte bleiben erhalten.

## Umsetzung
- Den vorhandenen Kopfbereich zu einem klaren Reiseangebot ausbauen: Ziel, Beschreibung, echtes Datum, Dauer, Nächte und vorhandener Preis mit direktem Buchungsaufruf.
- Eine kompakte, datenabhängige Reiseübersicht ergänzen. Es erscheinen nur tatsächlich vorhandene Angaben zu Termin, Dauer, Start/Zustieg, Bus, Unterkunft und Preis.
- Bestehende Bilder in einer einheitlichen Hauptbild-/Galerie-Anordnung beibehalten; fehlende Galeriebilder werden nicht künstlich vervielfacht.
- Die bestehende Desktop-Buchungsbox beibehalten und klarer gewichten; auf Mobilgeräten eine feste Buchungsleiste mit Preis und „Jetzt buchen“ ergänzen.
- Gespeicherte Leistungen ausschließlich aus den vorhandenen Reise- und Leistungstabellen darstellen; keine pauschalen Hotel-, Frühstücks-, Komfort- oder Bewertungsversprechen ergänzen.
- Das vorhandene Reiseprogramm aus den gespeicherten Tagesdaten als durchgehende Timeline ausgeben.
- Vorhandene Routen und Zustiegsorte weiterhin aus den echten Daten laden und übersichtlicher anzeigen.
- Bestehende FAQ-Inhalte im Accordion beibehalten und den Vertrauensbereich mit sachlichen, bereits vorhandenen METROPOL-TOURS-Informationen integrieren.

## Technische Details
- Änderung am gemeinsamen `TourDetailPage`-System und seinen geteilten Tour-Komponenten, damit Paris, Amsterdam, London, Prag, Wien, Rom und alle weiteren Pauschalreisen automatisch dasselbe System verwenden.
- Keine Einzelreise wird hart codiert und keine Datenbankinhalte werden verändert.
- Fiktive Bewertungszahlen und nicht belegte Inklusivleistungen werden aus dem gemeinsamen Template entfernt.
- Datums- und Preisangaben erhalten deutsches Format; leere Felder werden vollständig ausgeblendet.
- Prüfung auf Desktop und Mobil sowie Kontrolle von Buchungsnavigation, Darstellung und Projektzustand.
