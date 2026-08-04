
-- 1. Bookings: prevent customers from changing server-controlled fields
CREATE OR REPLACE FUNCTION public.protect_booking_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office') THEN
    RETURN NEW;
  END IF;

  IF NEW.price_paid IS DISTINCT FROM OLD.price_paid
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.ticket_number IS DISTINCT FROM OLD.ticket_number
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.trip_id IS DISTINCT FROM OLD.trip_id
     OR NEW.seat_id IS DISTINCT FROM OLD.seat_id
     OR NEW.origin_stop_id IS DISTINCT FROM OLD.origin_stop_id
     OR NEW.destination_stop_id IS DISTINCT FROM OLD.destination_stop_id
     OR NEW.booked_by_agent_id IS DISTINCT FROM OLD.booked_by_agent_id
  THEN
    RAISE EXCEPTION 'Diese Buchungsfelder koennen nur vom Metropol-Tours-Team geaendert werden.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_booking_sensitive_fields_trg ON public.bookings;
CREATE TRIGGER protect_booking_sensitive_fields_trg
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.protect_booking_sensitive_fields();

-- 2. customer_reviews: customers cannot self-publish
DROP POLICY IF EXISTS "Users edit own unpublished reviews" ON public.customer_reviews;
CREATE POLICY "Users edit own unpublished reviews"
ON public.customer_reviews
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND is_published = false)
WITH CHECK (user_id = auth.uid() AND is_published = false);
