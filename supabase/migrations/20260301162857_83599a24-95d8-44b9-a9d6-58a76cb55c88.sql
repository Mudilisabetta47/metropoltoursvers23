
-- Insurance per booking
CREATE TABLE public.tour_booking_insurance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.tour_bookings(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT false,
  provider text,
  product text,
  insured_persons jsonb DEFAULT '[]',
  price numeric DEFAULT 0,
  policy_number text,
  policy_status text NOT NULL DEFAULT 'not_requested',
  policy_pdf_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tour_booking_insurance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage insurance" ON public.tour_booking_insurance FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents view insurance" ON public.tour_booking_insurance FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'agent'));

-- Email templates
CREATE TABLE public.tour_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  category text NOT NULL DEFAULT 'booking',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tour_email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage templates" ON public.tour_email_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Invoice number series
CREATE TABLE public.tour_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.tour_bookings(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  tax_rate numeric NOT NULL DEFAULT 19,
  tax_amount numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  issued_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tour_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invoices" ON public.tour_invoices FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents view invoices" ON public.tour_invoices FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'agent'));

-- Customer notes (CRM)
CREATE TABLE public.tour_customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  note text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tour_customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage customer notes" ON public.tour_customer_notes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Legal documents versioning
CREATE TABLE public.tour_legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL,
  version text NOT NULL DEFAULT 'v1',
  title text NOT NULL,
  file_url text,
  content text,
  is_current boolean NOT NULL DEFAULT true,
  valid_from timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tour_legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage legal docs" ON public.tour_legal_documents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can view current legal docs" ON public.tour_legal_documents FOR SELECT USING (is_current = true);

-- Seed default email templates
INSERT INTO public.tour_email_templates (slug, name, subject, body_html, category) VALUES
('payment_pending', 'Zahlung offen', 'Zahlungserinnerung – Buchung {{booking_number}}', '<p>Sehr geehrte/r {{first_name}} {{last_name}},</p><p>Ihre Buchung <strong>{{booking_number}}</strong> ist noch nicht bezahlt. Bitte überweisen Sie den Betrag von <strong>{{total_price}}€</strong> auf folgendes Konto:</p><p>IBAN: DE89 3704 0044 0532 0130 00<br>BIC: COBADEFFXXX<br>Verwendungszweck: {{booking_number}}</p><p>Mit freundlichen Grüßen,<br>METROPOL TOURS</p>', 'payment'),
('payment_confirmed', 'Zahlung bestätigt', 'Zahlungsbestätigung – Buchung {{booking_number}}', '<p>Sehr geehrte/r {{first_name}} {{last_name}},</p><p>Wir bestätigen den Eingang Ihrer Zahlung für Buchung <strong>{{booking_number}}</strong>. Ihre Reise ist damit fest gebucht!</p><p>Ihre Reiseunterlagen finden Sie im Anhang.</p><p>Vielen Dank und gute Reise!<br>METROPOL TOURS</p>', 'payment'),
('reminder_48h', 'Reise 48h Reminder', 'Ihre Reise steht bevor – {{destination}}', '<p>Hallo {{first_name}},</p><p>In 48 Stunden geht es los! Hier nochmal die wichtigsten Infos:</p><p><strong>Reiseziel:</strong> {{destination}}<br><strong>Abfahrt:</strong> {{departure_date}} um {{departure_time}} Uhr<br><strong>Treffpunkt:</strong> {{pickup_city}} – {{pickup_location}}</p><p>Bitte seien Sie 15 Minuten vor Abfahrt am Treffpunkt.</p><p>Wir freuen uns auf Sie!<br>METROPOL TOURS</p>', 'reminder'),
('ticket_resend', 'Ticket erneut senden', 'Ihre Tickets – {{booking_number}}', '<p>Sehr geehrte/r {{first_name}} {{last_name}},</p><p>Anbei erhalten Sie erneut Ihre Reiseunterlagen für Buchung <strong>{{booking_number}}</strong>.</p><p>METROPOL TOURS</p>', 'ticket'),
('cancellation', 'Stornierung', 'Stornierungsbestätigung – {{booking_number}}', '<p>Sehr geehrte/r {{first_name}} {{last_name}},</p><p>Hiermit bestätigen wir die Stornierung Ihrer Buchung <strong>{{booking_number}}</strong>.</p><p>Falls eine Rückerstattung vereinbart wurde, wird diese innerhalb von 7 Werktagen auf Ihr Konto überwiesen.</p><p>METROPOL TOURS</p>', 'cancellation');

-- Storage bucket for insurance policies and legal docs
INSERT INTO storage.buckets (id, name, public) VALUES ('tour-documents', 'tour-documents', false);

CREATE POLICY "Admins can upload tour documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tour-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read tour documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'tour-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tour documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tour-documents' AND public.has_role(auth.uid(), 'admin'));
