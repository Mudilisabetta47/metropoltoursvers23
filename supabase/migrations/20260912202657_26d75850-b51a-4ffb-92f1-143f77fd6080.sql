create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text,
  hero_image_url text,
  author_name text,
  tags text[] default '{}',
  meta_title text,
  meta_description text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.blog_posts to anon, authenticated;
grant all on public.blog_posts to service_role;
alter table public.blog_posts enable row level security;
create policy "Public read published blog posts"
  on public.blog_posts for select
  to anon, authenticated
  using (is_published = true or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'office'));
create policy "Staff manage blog posts"
  on public.blog_posts for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'office'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'office'));
insert into public.blog_posts (slug, title, excerpt, content, meta_title, meta_description, is_published, published_at, author_name, tags) values
(
  'wochenendtrips-2026',
  'Wochenendtrips 2026: Paris, Prag und Kopenhagen ab 199 €',
  'Drei Ziele, drei Länder, ein langes Wochenende: Unsere aktuellen Wochenendtrips im Überblick – inklusive Preisen und Reisedauer.',
  '## Kurz raus, ganz weit weg

Nicht jeder Ausflug braucht zwei Wochen Urlaub. Mit unseren Wochenendtrips starten Sie abends los und sind mitten im Wochenende an Ihrem Ziel. Im Programm stehen:

- **Kopenhagen** – ab 199 € pro Person, ca. 3 Tage
- **Paris** – ab 299 € pro Person, ca. 3 Tage
- **Prag** – ab 299 € pro Person, ca. 3 Tage

Alle Details wie Abfahrtszeit, Zustiegsort und Leistungen finden Sie tagesaktuell auf den jeweiligen Trip-Seiten.

## So buchen Sie

Wählen Sie Ihren Trip unter [Wochenendtrips](/wochenendtrips), legen Ihren Zustiegsort fest und buchen direkt online. Je nach Trip mit Unterkunft oder als reine Busfahrt.

## Unterwegs

Alle Fahrten erfolgen mit modernen Reisebussen (WLAN, WC, Komfortsitze). Während der Fahrt verfolgen Sie Ihre Fahrt jederzeit live unter [Fahrt verfolgen](/verfolge) – mit echten GPS-Daten vom Bus.',
  'Wochenendtrips 2026: Paris, Prag, Kopenhagen | Metropol Tours',
  'Wochenendtrips ab 199 €: Kopenhagen, Paris und Prag – 3 Tage, moderne Reisebusse, Buchung mit Zustiegsort. Jetzt Trip sichern.',
  true, now(), 'METROPOL TOURS Redaktion', array['Wochenendtrips','Reisetipps']
),
(
  'live-tracking-und-fahrplan',
  'Live-Tracking & Fahrplan: So finden Sie Ihren Zustieg und Ihren Bus',
  'Wann fährt mein Bus ab? Wo steige ich zu? Und wo ist der Bus gerade? So arbeiten Fahrplan und Live-Tracking auf metours.de zusammen.',
  '## Der Fahrplan: Zustieg auf einen Blick

Unter [Fahrplan & Zustiegsorte](/fahrplan) finden Sie alle Zustiegsorte mit den jeweiligen Abfahrtszeiten. In Bremen starten wir vom **ZOB Bremen, Steig 5** – hinterlegt im Fahrplan und in den Buchungsdaten.

## Live-Tracking: Wo ist mein Bus?

Jeder Gast erhält mit der Buchung eine persönliche Tracking-Adresse der Form metours.de/verfolge/BUCHUNGSNUMMER. Dort sehen Sie:

- die aktuelle Position des Busses (echte GPS-Daten vom Fahrzeug)
- alle Haltestellen der Fahrt inklusive geplanter Ankunftszeit
- bei Verspätungen automatisch neu berechnete Zeiten
- außerplanmäßige Zwischenhalte, die der Fahrer einträgt

## Verspätung? Wird automatisch angepasst

Meldet der Fahrer eine Verspätung, werden die Ankunftszeiten an allen Haltestellen neu berechnet – die ursprüngliche Zeit bleibt zur Orientierung durchgestrichen sichtbar.

## Fragen?

Unser Kundenservice hilft Mo–Fr von 8–20 Uhr: kundenservice@metours.de oder +49 511 80781106.',
  'Live-Tracking & Fahrplan: Bus live verfolgen | Metropol Tours',
  'Bus live verfolgen und Zustiegsort finden: Fahrplan mit Abfahrtszeiten, GPS-Live-Tracking und automatischer Verspätungsanzeige.',
  true, now(), 'METROPOL TOURS Redaktion', array['Service','Fahrplan','Live-Tracking']
)
on conflict (slug) do nothing;