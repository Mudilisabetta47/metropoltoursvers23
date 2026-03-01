
-- Payment entries for tour bookings
CREATE TABLE public.tour_payment_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.tour_bookings(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  method text NOT NULL DEFAULT 'bank_transfer',
  reference text,
  note text,
  recorded_by uuid,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tour_payment_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment entries"
  ON public.tour_payment_entries FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view payment entries"
  ON public.tour_payment_entries FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'agent'));

-- Booking audit log
CREATE TABLE public.tour_booking_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.tour_bookings(id) ON DELETE CASCADE,
  action text NOT NULL,
  field_name text,
  old_value text,
  new_value text,
  performed_by uuid,
  performed_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tour_booking_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage booking audit"
  ON public.tour_booking_audit FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert booking audit"
  ON public.tour_booking_audit FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Document send log
CREATE TABLE public.tour_document_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.tour_bookings(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  recipient_email text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  sent_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tour_document_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage document sends"
  ON public.tour_document_sends FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert document sends"
  ON public.tour_document_sends FOR INSERT
  TO authenticated
  WITH CHECK (true);
