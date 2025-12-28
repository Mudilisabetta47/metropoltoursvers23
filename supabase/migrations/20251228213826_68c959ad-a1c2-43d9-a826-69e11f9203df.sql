
-- Fix security linter warnings - drop dependencies first

-- 1. Drop the function that depends on the view
DROP FUNCTION IF EXISTS public.get_bookings_for_agent(INT, INT, TEXT);

-- 2. Drop views
DROP VIEW IF EXISTS public.bookings_agent_view CASCADE;
DROP VIEW IF EXISTS public.profiles_agent_view CASCADE;

-- 3. Set search_path on masking functions
CREATE OR REPLACE FUNCTION public.mask_email(email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  at_pos INT;
  local_part TEXT;
  domain_part TEXT;
BEGIN
  IF email IS NULL THEN RETURN NULL; END IF;
  at_pos := POSITION('@' IN email);
  IF at_pos = 0 THEN RETURN '***@***.***'; END IF;
  
  local_part := LEFT(email, at_pos - 1);
  domain_part := SUBSTRING(email FROM at_pos);
  
  IF LENGTH(local_part) <= 2 THEN
    RETURN '*' || domain_part;
  ELSE
    RETURN LEFT(local_part, 2) || REPEAT('*', LEAST(LENGTH(local_part) - 2, 6)) || domain_part;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_phone(phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF phone IS NULL THEN RETURN NULL; END IF;
  IF LENGTH(phone) <= 4 THEN RETURN '****'; END IF;
  RETURN REPEAT('*', LENGTH(phone) - 4) || RIGHT(phone, 4);
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_name(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF name IS NULL THEN RETURN NULL; END IF;
  IF LENGTH(name) <= 1 THEN RETURN '*'; END IF;
  RETURN LEFT(name, 1) || REPEAT('*', LEAST(LENGTH(name) - 1, 8));
END;
$$;

-- 4. Recreate views with SECURITY INVOKER
CREATE VIEW public.bookings_agent_view 
WITH (security_invoker = true)
AS
SELECT 
  b.id,
  b.ticket_number,
  b.user_id,
  b.trip_id,
  b.origin_stop_id,
  b.destination_stop_id,
  b.seat_id,
  public.mask_name(b.passenger_first_name) AS passenger_first_name,
  public.mask_name(b.passenger_last_name) AS passenger_last_name,
  public.mask_email(b.passenger_email) AS passenger_email,
  public.mask_phone(b.passenger_phone) AS passenger_phone,
  b.price_paid,
  b.status,
  b.booked_by_agent_id,
  b.extras,
  b.created_at,
  b.updated_at
FROM public.bookings b;

CREATE VIEW public.profiles_agent_view 
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.user_id,
  public.mask_email(p.email) AS email,
  public.mask_name(p.first_name) AS first_name,
  public.mask_name(p.last_name) AS last_name,
  public.mask_phone(p.phone) AS phone,
  p.created_at,
  p.updated_at
FROM public.profiles p;

-- 5. Grant SELECT on views
GRANT SELECT ON public.bookings_agent_view TO authenticated;
GRANT SELECT ON public.profiles_agent_view TO authenticated;

-- 6. Recreate rate-limited bulk query function with explicit return type
CREATE OR REPLACE FUNCTION public.get_bookings_for_agent(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  ticket_number TEXT,
  user_id UUID,
  trip_id UUID,
  origin_stop_id UUID,
  destination_stop_id UUID,
  seat_id UUID,
  passenger_first_name TEXT,
  passenger_last_name TEXT,
  passenger_email TEXT,
  passenger_phone TEXT,
  price_paid NUMERIC,
  status TEXT,
  booked_by_agent_id UUID,
  extras JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_limit INT := 50;
  v_actual_limit INT;
BEGIN
  -- Verify agent or admin role
  IF NOT (public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Unauthorized: Agent or Admin role required';
  END IF;
  
  -- Enforce maximum limit to prevent bulk exports
  v_actual_limit := LEAST(p_limit, v_max_limit);
  
  -- Log the access
  PERFORM public.log_pii_access(
    'QUERY_BOOKINGS_MASKED',
    'bookings',
    NULL,
    NULL,
    jsonb_build_object('limit', v_actual_limit, 'offset', p_offset, 'status_filter', p_status)
  );
  
  -- Return masked data with limit
  RETURN QUERY
  SELECT 
    bav.id,
    bav.ticket_number,
    bav.user_id,
    bav.trip_id,
    bav.origin_stop_id,
    bav.destination_stop_id,
    bav.seat_id,
    bav.passenger_first_name,
    bav.passenger_last_name,
    bav.passenger_email,
    bav.passenger_phone,
    bav.price_paid,
    bav.status::TEXT,
    bav.booked_by_agent_id,
    bav.extras,
    bav.created_at,
    bav.updated_at
  FROM public.bookings_agent_view bav
  WHERE (p_status IS NULL OR bav.status::TEXT = p_status)
  ORDER BY bav.created_at DESC
  LIMIT v_actual_limit
  OFFSET p_offset;
END;
$$;
