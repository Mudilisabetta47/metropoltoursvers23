CREATE OR REPLACE FUNCTION public.reserve_tour_seats(p_tour_date_id uuid, p_seats integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer;
BEGIN
  IF p_seats < 1 OR p_seats > 20 THEN
    RAISE EXCEPTION 'Invalid seat count';
  END IF;

  UPDATE tour_dates
  SET booked_seats = booked_seats + p_seats,
      updated_at = now()
  WHERE id = p_tour_date_id
    AND is_active = true
    AND status IN ('available','limited')
    AND (booked_seats + p_seats) <= total_seats;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;