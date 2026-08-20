CREATE OR REPLACE FUNCTION public.enforce_tour_published_for_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_active boolean;
BEGIN
  SELECT publish_status, is_active INTO v_status, v_active
  FROM public.package_tours WHERE id = NEW.tour_id;

  IF v_status IS DISTINCT FROM 'published' OR COALESCE(v_active, false) = false THEN
    -- Admins/Office duerfen weiterhin manuell buchen (Backoffice)
    IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office')) THEN
      RAISE EXCEPTION 'Diese Reise ist noch nicht veroeffentlicht und kann nicht gebucht werden.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_tour_published ON public.tour_bookings;
CREATE TRIGGER trg_enforce_tour_published
BEFORE INSERT ON public.tour_bookings
FOR EACH ROW EXECUTE FUNCTION public.enforce_tour_published_for_booking();