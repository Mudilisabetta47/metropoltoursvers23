-- ============ 1. Fortlaufende Buchungsnummer MT-YYYY-NNNNNN ============
CREATE SEQUENCE IF NOT EXISTS public.booking_number_seq START WITH 1000 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.next_booking_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  candidate text;
BEGIN
  LOOP
    candidate := 'MT-' || to_char(now(), 'YYYY') || '-' ||
                 lpad(nextval('public.booking_number_seq')::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings WHERE booking_number = candidate)
          AND NOT EXISTS (SELECT 1 FROM public.tour_bookings WHERE booking_number = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_booking_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN public.next_booking_number();
END;
$$;

-- ============ 2. Rechnungs-/Kontaktdaten ============
ALTER TABLE public.tour_bookings
  ADD COLUMN IF NOT EXISTS contact_date_of_birth date,
  ADD COLUMN IF NOT EXISTS billing_company text,
  ADD COLUMN IF NOT EXISTS billing_first_name text,
  ADD COLUMN IF NOT EXISTS billing_last_name text,
  ADD COLUMN IF NOT EXISTS billing_street text,
  ADD COLUMN IF NOT EXISTS billing_house_number text,
  ADD COLUMN IF NOT EXISTS billing_zip text,
  ADD COLUMN IF NOT EXISTS billing_city text,
  ADD COLUMN IF NOT EXISTS billing_country text DEFAULT 'Deutschland',
  ADD COLUMN IF NOT EXISTS invoice_address jsonb,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS paypal_order_id text,
  ADD COLUMN IF NOT EXISTS paypal_capture_id text;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS contact_date_of_birth date,
  ADD COLUMN IF NOT EXISTS billing_company text,
  ADD COLUMN IF NOT EXISTS billing_first_name text,
  ADD COLUMN IF NOT EXISTS billing_last_name text,
  ADD COLUMN IF NOT EXISTS billing_street text,
  ADD COLUMN IF NOT EXISTS billing_house_number text,
  ADD COLUMN IF NOT EXISTS billing_zip text,
  ADD COLUMN IF NOT EXISTS billing_city text,
  ADD COLUMN IF NOT EXISTS billing_country text DEFAULT 'Deutschland',
  ADD COLUMN IF NOT EXISTS invoice_address jsonb,
  ADD COLUMN IF NOT EXISTS paypal_order_id text,
  ADD COLUMN IF NOT EXISTS paypal_capture_id text;

-- Zahlungsstatus-Werte vereinheitlichen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tour_bookings_payment_status_check') THEN
    ALTER TABLE public.tour_bookings
      ADD CONSTRAINT tour_bookings_payment_status_check
      CHECK (payment_status IN ('open','pending','paid','failed','refunded','cancelled'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_payment_status_check') THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_payment_status_check
      CHECK (payment_status IN ('open','unpaid','pending','paid','failed','refunded','cancelled'));
  END IF;
END $$;

UPDATE public.tour_bookings SET payment_status = 'paid' WHERE paid_at IS NOT NULL AND payment_status = 'open';

-- Default-Buchungsnummer für Reise-Buchungen
CREATE OR REPLACE FUNCTION public.set_tour_booking_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.booking_number IS NULL OR NEW.booking_number = '' OR NEW.booking_number LIKE 'TRB-%' THEN
    NEW.booking_number := public.next_booking_number();
  END IF;
  RETURN NEW;
END;
$$;

ALTER TABLE public.tour_bookings ALTER COLUMN booking_number DROP DEFAULT;

DROP TRIGGER IF EXISTS trg_set_tour_booking_number ON public.tour_bookings;
CREATE TRIGGER trg_set_tour_booking_number
  BEFORE INSERT ON public.tour_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_tour_booking_number();

-- ============ 3. Schutz der Zahlungsfelder ============
CREATE OR REPLACE FUNCTION public.protect_booking_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Service-Role / Edge Functions und Team duerfen alles
  IF auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'office') THEN
    RETURN NEW;
  END IF;

  IF NEW.price_paid IS DISTINCT FROM OLD.price_paid
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.ticket_number IS DISTINCT FROM OLD.ticket_number
     OR NEW.booking_number IS DISTINCT FROM OLD.booking_number
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.trip_id IS DISTINCT FROM OLD.trip_id
     OR NEW.seat_id IS DISTINCT FROM OLD.seat_id
     OR NEW.origin_stop_id IS DISTINCT FROM OLD.origin_stop_id
     OR NEW.destination_stop_id IS DISTINCT FROM OLD.destination_stop_id
     OR NEW.booked_by_agent_id IS DISTINCT FROM OLD.booked_by_agent_id
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.payment_reference IS DISTINCT FROM OLD.payment_reference
     OR NEW.paypal_order_id IS DISTINCT FROM OLD.paypal_order_id
     OR NEW.paypal_capture_id IS DISTINCT FROM OLD.paypal_capture_id
     OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id
     OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
     OR NEW.is_test IS DISTINCT FROM OLD.is_test
  THEN
    RAISE EXCEPTION 'Zahlungs- und Statusfelder koennen nur vom Metropol-Tours-Team bzw. vom Zahlungsprozess geaendert werden.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_booking_sensitive_fields ON public.bookings;
CREATE TRIGGER trg_protect_booking_sensitive_fields
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.protect_booking_sensitive_fields();

CREATE OR REPLACE FUNCTION public.protect_tour_booking_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'office')
     OR public.has_role(auth.uid(), 'agent') THEN
    RETURN NEW;
  END IF;

  IF NEW.total_price IS DISTINCT FROM OLD.total_price
     OR NEW.base_price IS DISTINCT FROM OLD.base_price
     OR NEW.discount_amount IS DISTINCT FROM OLD.discount_amount
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.payment_reference IS DISTINCT FROM OLD.payment_reference
     OR NEW.paypal_order_id IS DISTINCT FROM OLD.paypal_order_id
     OR NEW.paypal_capture_id IS DISTINCT FROM OLD.paypal_capture_id
     OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id
     OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
     OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
     OR NEW.booking_number IS DISTINCT FROM OLD.booking_number
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'Zahlungs- und Statusfelder koennen nur vom Metropol-Tours-Team bzw. vom Zahlungsprozess geaendert werden.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_tour_booking_sensitive_fields ON public.tour_bookings;
CREATE TRIGGER trg_protect_tour_booking_sensitive_fields
  BEFORE UPDATE ON public.tour_bookings
  FOR EACH ROW EXECUTE FUNCTION public.protect_tour_booking_sensitive_fields();

CREATE INDEX IF NOT EXISTS idx_tour_bookings_paypal_order ON public.tour_bookings (paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_paypal_order ON public.bookings (paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_tour_bookings_booking_number ON public.tour_bookings (booking_number);