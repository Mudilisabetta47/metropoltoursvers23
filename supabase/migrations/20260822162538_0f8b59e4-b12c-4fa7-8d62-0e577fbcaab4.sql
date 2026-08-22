ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS bookings_stripe_session_id_idx ON public.bookings (stripe_session_id);

UPDATE public.bookings SET payment_status = 'paid', paid_at = COALESCE(paid_at, created_at) WHERE status = 'confirmed' AND payment_status = 'unpaid';