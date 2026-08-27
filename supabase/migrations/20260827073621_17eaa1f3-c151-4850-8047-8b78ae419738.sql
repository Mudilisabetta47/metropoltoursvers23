-- 1) bookings: keep trigger protection, remove duplicate trigger, extend guard
DROP TRIGGER IF EXISTS protect_booking_sensitive_fields_trg ON public.bookings;

CREATE OR REPLACE FUNCTION public.protect_booking_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'office')
     OR public.has_role(auth.uid(), 'agent') THEN
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
     OR NEW.extras IS DISTINCT FROM OLD.extras
  THEN
    RAISE EXCEPTION 'Zahlungs- und Statusfelder koennen nur vom Metropol-Tours-Team bzw. vom Zahlungsprozess geaendert werden.';
  END IF;

  RETURN NEW;
END;
$$;

-- 2) rebooking_requests: customers must not set financial fields
DROP POLICY IF EXISTS "Users create rebooks" ON public.rebooking_requests;
CREATE POLICY "Users create rebooks"
ON public.rebooking_requests
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'office'::app_role)
  OR (
    user_id = auth.uid()
    AND COALESCE(price_difference, 0) = 0
    AND COALESCE(rebooking_fee, 0) = 0
    AND COALESCE(status, 'pending') IN ('pending', 'pending_payment')
    AND processed_at IS NULL
    AND processed_by IS NULL
  )
);

-- 3) customer_reviews: no self-publishing / self-verification
DROP POLICY IF EXISTS "Users create own reviews" ON public.customer_reviews;
CREATE POLICY "Users create own reviews"
ON public.customer_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND COALESCE(is_published, false) = false
  AND COALESCE(is_verified, false) = false
);
