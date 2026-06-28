
-- Add postal code to line_stops for trip-access verification
ALTER TABLE public.line_stops ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Anonymous verification RPC: checks trip exists AND PLZ matches the trip's first stop PLZ.
-- Returns the trip_number on success, NULL otherwise. Designed to throttle by always
-- returning the same shape, avoiding enumeration leaks.
CREATE OR REPLACE FUNCTION public.verify_line_trip_access(p_trip_number TEXT, p_postal_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_number TEXT;
  v_expected_plz TEXT;
  v_input_plz TEXT;
BEGIN
  IF p_trip_number IS NULL OR p_postal_code IS NULL THEN
    RETURN NULL;
  END IF;

  -- Normalize: trip number digits only, PLZ digits only
  v_trip_number := regexp_replace(p_trip_number, '\D', '', 'g');
  v_input_plz := regexp_replace(p_postal_code, '\D', '', 'g');

  IF length(v_trip_number) < 6 OR length(v_input_plz) <> 5 THEN
    RETURN NULL;
  END IF;

  -- Look up expected PLZ from the first stop of the trip's line
  SELECT ls.postal_code
    INTO v_expected_plz
  FROM public.line_trips lt
  JOIN public.line_stops ls ON ls.line_id = lt.line_id
  WHERE lt.trip_number = v_trip_number
  ORDER BY ls.stop_order ASC
  LIMIT 1;

  IF v_expected_plz IS NULL THEN
    RETURN NULL;
  END IF;

  IF regexp_replace(v_expected_plz, '\D', '', 'g') = v_input_plz THEN
    RETURN v_trip_number;
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_line_trip_access(TEXT, TEXT) TO anon, authenticated;
