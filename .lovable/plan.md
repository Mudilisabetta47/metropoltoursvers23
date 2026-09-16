# Stadt-Landingpages „Busunternehmen in {Stadt}" deutschlandweit

## Ausgangslage
Bereits vorhanden: hochwertige Standortseiten für Hannover, Bremen, Hamburg
(`src/content/landing/standorte.ts`, gerendert über `LandingPage.tsx` mit SEO,
LocalBusiness-Schema, FAQ-Schema, echten Fahrten aus dem Backend).

## Ziel
Neue Seiten „Busunternehmen in {Stadt}" für die wichtigsten deutschen Städte,
jede mit individuell geschriebenen Inhalten (kein Stadtname-Austausch, sonst
Doorway-Page-Risiko bei Google).

## Umfang (Stufe 1 – 12 Städte)
Berlin, München, Köln, Frankfurt am Main, Stuttgart, Düsseldorf, Leipzig,
Dresden, Nürnberg, Dortmund, Essen, Braunschweig.

Pro Stadt eine Seite `/busunternehmen-{stadt}` mit:
- Hero: „Busunternehmen in {Stadt}" + ortsbezogener Text (Startpunkte, Verkehrslage)
- Leistungen: Bus mieten, Gruppenreisen, Schulfahrten, Flughafentransfer (interne Links auf bestehende Service-Seiten)
- „Unsere Busse": Flotten-Karten (Midibus, Reisebus, Fernreisebus, Kleinbus)
- Stadtspezifische Abschnitte: beliebte Zustiege (ZOB, Hbf, Messe, Flughafen), typische Ziele ab dieser Stadt, regionale Besonderheiten
- FAQ-Accordion (5–6 echte Fragen pro Stadt, mit FAQ-Schema für Google)
- Kontakt-CTA: Anfrageformular (/business), Telefon +49 511 80781106, kundenservice@metours.de
- SEO: eigener Title/Description, LocalBusiness + Service + Breadcrumb JSON-LD

## Umsetzung
1. Neue Datei `src/content/landing/staedte.ts` mit 12 vollständig
   ausformulierten `LandingContent`-Einträgen (redaktionell, stadtbezogen).
2. `index.ts`: Import + Registrierung (Routen werden automatisch über
   `landingSlugs` erzeugt – keine Änderung an App.tsx nötig).
3. `types.ts`: `locality`-Union um die neuen Städte erweitern.
4. Sitemap-Skript `scripts/generate-sitemap.ts` prüfen/erweitern, damit die
   neuen URLs in `public/sitemap.xml` landen.
5. Footer oder Bereichsseite: Verlinkung der Städte (interne Verlinkung).
6. Build + kurzer Playwright-Check einer Beispielstadt.

## Nicht Teil dieses Plans
- Keine Seiten für alle ~2.000 deutschen Städte (Doorway-Risiko, dünn).
  Weitere Städte können später in Stufe 2 ergänzt werden.
- Keine Änderung an bestehenden Seiten, Preisen oder Buchungslogik.
