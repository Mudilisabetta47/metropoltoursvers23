CREATE OR REPLACE FUNCTION public.protect_tour_booking_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Zahlungsprozess (Service Role / Edge Functions) und Backoffice duerfen alles
  IF auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'office') THEN
    RETURN NEW;
  END IF;

  -- Agenten duerfen operative Felder pflegen, aber keine Zahlungs-/Preisfelder
  IF public.has_role(auth.uid(), 'agent') THEN
    IF NEW.total_price IS DISTINCT FROM OLD.total_price
       OR NEW.base_price IS DISTINCT FROM OLD.base_price
       OR NEW.discount_amount IS DISTINCT FROM OLD.discount_amount
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
      RAISE EXCEPTION 'Preis- und Zahlungsfelder koennen nur vom Zahlungsprozess oder von Administration/Buero geaendert werden.';
    END IF;
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
$function$;