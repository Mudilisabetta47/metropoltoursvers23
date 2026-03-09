

## Login-Seite Redesign

### Aktueller Zustand
Die Login-Seite ist funktional, aber visuell einfach -- ein zentriertes Formular auf grauem Hintergrund. Es fehlt ein visueller "Wow-Faktor" und das Layout nutzt den verfügbaren Platz nicht optimal.

### Plan

**1. Split-Screen Layout (Desktop)**
- Links: Visueller Bereich mit einem Reise-Hintergrundbild (vorhandenes Hero-Asset), Overlay-Gradient, Branding und einem kurzen Slogan ("Entdecke den Balkan")
- Rechts: Login-Formular wie bisher, aber mit verbessertem Spacing und modernerem Look
- Mobile: Nur das Formular, mit kleinem Bild-Header oben

**2. UI-Verbesserungen**
- Agentur-Toggle entfernen (ist per Memory ohnehin versteckt und nur via Footer erreichbar -- Sicherheitskonzept bleibt erhalten)
- Sanfte Einblend-Animation mit framer-motion beim Seitenladen
- "Passwort vergessen?" Link hinzufuegen (als Platzhalter, ohne Reset-Flow)
- Groessere, modernere Input-Felder mit abgerundeten Ecken
- Subtiler Schatten und Glassmorphism-Effekt auf dem Formular-Container
- Trust-Badges unten ("Sichere Verbindung", "Datenschutz")

**3. Responsive Optimierung**
- Mobile: Full-width Formular, kompakter Header mit Logo
- Tablet: Schmaler Split mit kleinerem Bild
- Desktop: 50/50 Split

### Dateien
- `src/pages/AuthPage.tsx` -- Komplettes Redesign

