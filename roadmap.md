# Roadmap

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
