-- 1. Invoice storage metadata
ALTER TABLE public.tour_invoices
  ADD COLUMN IF NOT EXISTS invoice_type text NOT NULL DEFAULT 'invoice',
  ADD COLUMN IF NOT EXISTS booking_number text,
  ADD COLUMN IF NOT EXISTS billing_address jsonb,
  ADD COLUMN IF NOT EXISTS pdf_path text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS tour_invoices_booking_type_uidx
  ON public.tour_invoices (booking_id, invoice_type);

-- 2. Status event history
CREATE TABLE IF NOT EXISTS public.booking_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.tour_bookings(id) ON DELETE CASCADE,
  booking_number text,
  source text NOT NULL DEFAULT 'booking',
  event_type text NOT NULL,
  old_status text,
  new_status text,
  provider text,
  reference text,
  amount numeric,
  currency text DEFAULT 'EUR',
  note text,
  actor_id uuid,
  actor_email text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_status_events_booking_idx
  ON public.booking_status_events (booking_id, created_at DESC);

GRANT SELECT ON public.booking_status_events TO authenticated;
GRANT ALL ON public.booking_status_events TO service_role;

ALTER TABLE public.booking_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_read_status_events"
ON public.booking_status_events FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'office')
  OR public.has_role(auth.uid(), 'agent')
);

CREATE POLICY "owner_read_status_events"
ON public.booking_status_events FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tour_bookings tb
    WHERE tb.id = booking_status_events.booking_id
      AND (
        tb.user_id = auth.uid()
        OR lower(tb.contact_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

-- 3. Automatic logging of booking/payment status transitions
CREATE OR REPLACE FUNCTION public.log_tour_booking_status_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.booking_status_events
      (booking_id, booking_number, source, event_type, old_status, new_status, provider, reference, amount, actor_id)
    VALUES
      (NEW.id, NEW.booking_number, 'booking', 'created', NULL, NEW.status, NEW.payment_method,
       NEW.payment_reference, NEW.total_price, auth.uid());
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.booking_status_events
      (booking_id, booking_number, source, event_type, old_status, new_status, provider, reference, amount, actor_id)
    VALUES
      (NEW.id, NEW.booking_number, 'booking', 'status_changed', OLD.status, NEW.status, NEW.payment_method,
       NEW.payment_reference, NEW.total_price, auth.uid());
  END IF;

  IF (NEW.paid_at IS DISTINCT FROM OLD.paid_at AND NEW.paid_at IS NOT NULL)
     OR NEW.payment_reference IS DISTINCT FROM OLD.payment_reference THEN
    INSERT INTO public.booking_status_events
      (booking_id, booking_number, source, event_type, old_status, new_status, provider, reference, amount, actor_id)
    VALUES
      (NEW.id, NEW.booking_number, 'payment', 'payment_updated',
       OLD.payment_reference, NEW.payment_reference, NEW.payment_method,
       NEW.payment_reference, NEW.total_price, auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_tour_booking_status_event ON public.tour_bookings;
CREATE TRIGGER trg_log_tour_booking_status_event
AFTER INSERT OR UPDATE ON public.tour_bookings
FOR EACH ROW EXECUTE FUNCTION public.log_tour_booking_status_event();

-- 4. Guest access tokens for "Meine Buchungen"
CREATE TABLE IF NOT EXISTS public.booking_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_access_tokens_email_idx ON public.booking_access_tokens (email);

GRANT ALL ON public.booking_access_tokens TO service_role;

ALTER TABLE public.booking_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no_client_access_booking_access_tokens"
ON public.booking_access_tokens FOR SELECT TO authenticated
USING (false);
