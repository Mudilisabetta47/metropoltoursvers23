
-- Booking number generator
CREATE OR REPLACE FUNCTION public.generate_admin_booking_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_part TEXT;
  seq_part TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  LOOP
    seq_part := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    new_number := 'BUC-' || year_part || '-' || seq_part;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.admin_bookings WHERE booking_number = new_number);
  END LOOP;
  RETURN new_number;
EXCEPTION WHEN undefined_table THEN
  RETURN 'BUC-' || year_part || '-' || seq_part;
END;
$$;

CREATE TABLE public.admin_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_number TEXT NOT NULL UNIQUE,
  booking_type TEXT NOT NULL DEFAULT 'reise',
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  b2b_customer_id UUID REFERENCES public.b2b_customers(id) ON DELETE SET NULL,
  pickup_location TEXT NOT NULL,
  destination_location TEXT NOT NULL,
  departure_at TIMESTAMPTZ NOT NULL,
  return_at TIMESTAMPTZ,
  passenger_count INTEGER NOT NULL DEFAULT 1,
  vehicle_class TEXT,
  assigned_bus TEXT,
  assigned_driver TEXT,
  price_net NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_gross NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'offen',
  booking_status TEXT NOT NULL DEFAULT 'anfrage',
  internal_notes TEXT,
  customer_notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_bookings_booking_type_check CHECK (booking_type IN ('reise','charter','gruppe','firma','transfer','event')),
  CONSTRAINT admin_bookings_booking_status_check CHECK (booking_status IN ('anfrage','angebot','gebucht','bestaetigt','abgeschlossen','storniert')),
  CONSTRAINT admin_bookings_payment_status_check CHECK (payment_status IN ('offen','teilbezahlt','bezahlt','ueberfaellig','storniert'))
);

CREATE INDEX idx_admin_bookings_status ON public.admin_bookings(booking_status);
CREATE INDEX idx_admin_bookings_payment ON public.admin_bookings(payment_status);
CREATE INDEX idx_admin_bookings_departure ON public.admin_bookings(departure_at);
CREATE INDEX idx_admin_bookings_b2b ON public.admin_bookings(b2b_customer_id);

ALTER TABLE public.admin_bookings ALTER COLUMN booking_number SET DEFAULT public.generate_admin_booking_number();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_bookings TO authenticated;
GRANT ALL ON public.admin_bookings TO service_role;

ALTER TABLE public.admin_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view admin bookings"
  ON public.admin_bookings FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'office')
  );

CREATE POLICY "Staff can insert admin bookings"
  ON public.admin_bookings FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'office')
  );

CREATE POLICY "Staff can update admin bookings"
  ON public.admin_bookings FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'office')
  );

CREATE POLICY "Admins can delete admin bookings"
  ON public.admin_bookings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_admin_bookings_updated_at
  BEFORE UPDATE ON public.admin_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed realistic demo data
INSERT INTO public.admin_bookings
  (booking_type, customer_name, customer_email, customer_phone, pickup_location, destination_location,
   departure_at, return_at, passenger_count, vehicle_class, assigned_bus, assigned_driver,
   price_net, price_gross, payment_status, booking_status, internal_notes)
VALUES
  ('reise',    'Familie Petrov',                'petrov@example.de',     '+49 511 4421987', 'Hannover ZOB',          'Amsterdam Sloterdijk', NOW() + INTERVAL '2 days 6 hours',  NOW() + INTERVAL '5 days 22 hours', 4,  'Komfortklasse', 'ME-RB 4521', 'Krüger, M.',  262.18, 312.00, 'teilbezahlt','gebucht',     'Anzahlung 50€ am 18.06. eingegangen.'),
  ('charter',  'Schreiber GmbH',                'einkauf@schreiber.de',  '+49 5321 778899', 'Goslar Marktplatz',     'Berlin Hauptbahnhof',  NOW() + INTERVAL '4 days 7 hours',  NOW() + INTERVAL '4 days 22 hours', 47, 'Reisebus 49 Sitze', 'ME-RB 4108', 'Yilmaz, A.', 2932.77, 3490.00, 'offen',      'bestaetigt',  'Vorlauf 1 h, Verpflegung an Bord vom Kunden organisiert.'),
  ('gruppe',   'Rentnerbund Celle e.V.',        'vorstand@rentnerbund.de','+49 5141 223344', 'Celle Schloss',         'Norderney Fähre',      NOW() + INTERVAL '6 days 5 hours',  NOW() + INTERVAL '6 days 23 hours', 38, 'Reisebus 49 Sitze', 'ME-RB 5070', 'Schulz, T.', 1915.97, 2280.00, 'bezahlt',    'bestaetigt',  '38 Tickets inkl. Fähre. Hotel nicht über uns.'),
  ('firma',    'Continental AG',                'travel@continental.de', '+49 511 9381000', 'Hannover Conti-Werk',   'Messe Hannover',       NOW() + INTERVAL '1 day 7 hours',   NOW() + INTERVAL '1 day 19 hours',  35, 'VIP-Coach',         'ME-RB 3309', 'Bauer, L.',  1084.03, 1290.00, 'bezahlt',    'bestaetigt',  'Rahmenvertrag Continental, Abrechnung über Sammelrechnung.'),
  ('transfer', 'Yıldız, Selma',                  'sy@gmail.com',          '+49 172 5544001', 'Hannover Linden',       'Flughafen HAJ Terminal C', NOW() + INTERVAL '12 hours',     NULL,                                3,  'Kleinbus',          'ME-RB 2204', 'Demir, S.',  100.84, 120.00, 'bezahlt',    'gebucht',     'Frühflug, Pünktlichkeit kritisch.'),
  ('event',    'Hochzeit Yilmaz / Kaya',        'kontakt@hochzeit-yk.de','+49 178 1239988', 'Hannover Maschsee',     'Schloss Marienburg',   NOW() + INTERVAL '21 days 14 hours', NOW() + INTERVAL '22 days 1 hours', 65, '2x Reisebus',       NULL,         NULL,         5042.02, 6000.00, 'teilbezahlt','angebot',     'Angebot v2 versendet, Anzahlung 30% erwartet.'),
  ('reise',    'Becker, Lena',                  'lena.becker@web.de',    '+49 160 4002233', 'Berlin ZOB',            'Wien Erdberg',         NOW() + INTERVAL '9 days 19 hours', NOW() + INTERVAL '13 days 8 hours', 1,  'Reisebus',          NULL,         NULL,         100.00, 119.00, 'bezahlt',    'bestaetigt', NULL),
  ('reise',    'Aydın, Murat',                   'aydin@example.com',     '+49 162 8800123', 'Hannover ZOB',          'Istanbul Esenler',     NOW() + INTERVAL '15 days 16 hours',NOW() + INTERVAL '24 days 9 hours', 3,  'Reisebus',          NULL,         NULL,         542.02, 645.00, 'offen',      'anfrage',     'Kunde wartet auf Bestätigung Sitzplatz hinten.'),
  ('charter',  'Stadt Hildesheim',              'schulen@hildesheim.de', '+49 5121 301-0',  'Hildesheim Hauptschule','Berlin Bundestag',     NOW() + INTERVAL '28 days 6 hours', NOW() + INTERVAL '28 days 22 hours',84, '2x Reisebus 49',    NULL,         NULL,         3781.51, 4500.00, 'offen',      'angebot',     'Klassenfahrt Stufe 9 — Angebot ausstehend.'),
  ('firma',    'VfL Lerchenberg e.V.',          'vorstand@vfl-l.de',     '+49 511 2233556', 'Hannover Eilenriede',   'München Allianz Arena', NOW() + INTERVAL '12 days 5 hours', NOW() + INTERVAL '13 days 23 hours', 53, 'Reisebus 49 Sitze', NULL,         NULL,         2521.01, 3000.00, 'offen',      'angebot',     'EM-Spiel — Rückfahrt direkt nach Abpfiff.'),
  ('reise',    'Müller Touristik',              'b2b@mueller-tour.de',   '+49 511 9988776', 'Hannover ZOB',          'Mailand Lampugnano',   NOW() + INTERVAL '40 days 6 hours', NOW() + INTERVAL '47 days 22 hours', 49, 'Subcharter',        NULL,         NULL,         5882.35, 7000.00, 'offen',      'angebot',     'Subcharter — Fahrer & Bus von uns, Tourenleitung extern.'),
  ('transfer', 'Bosch Sennheiser GmbH',         'event@sennheiser.com',  '+49 5130 600-0',  'Wedemark Werk',         'Hannover Messe Halle 14', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days' + INTERVAL '4 hours', 22, 'Kleinbus VIP', 'ME-RB 3309', 'Bauer, L.', 504.20, 600.00, 'ueberfaellig','abgeschlossen','RE-2026-0184 — Mahnstufe 1 versendet.');
