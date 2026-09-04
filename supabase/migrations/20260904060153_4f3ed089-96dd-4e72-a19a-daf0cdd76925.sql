CREATE OR REPLACE FUNCTION public.protect_booking_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
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
     OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
     OR NEW.payment_reference IS DISTINCT FROM OLD.payment_reference
     OR NEW.paypal_order_id IS DISTINCT FROM OLD.paypal_order_id
     OR NEW.paypal_capture_id IS DISTINCT FROM OLD.paypal_capture_id
     OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id
     OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
     OR NEW.is_test IS DISTINCT FROM OLD.is_test
     OR NEW.extras IS DISTINCT FROM OLD.extras
     OR NEW.luggage IS DISTINCT FROM OLD.luggage
  THEN
    RAISE EXCEPTION 'Zahlungs- und Statusfelder koennen nur vom Metropol-Tours-Team bzw. vom Zahlungsprozess geaendert werden.';
  END IF;

  RETURN NEW;
END;
$$;