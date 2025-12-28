
-- =====================================================
-- CMS DATA PROTECTION: Masked Views + Audit Logging
-- =====================================================

-- 1. Create audit_log table for PII access tracking
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  record_identifier TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert audit logs (via security definer functions)
CREATE POLICY "System can insert audit logs"
ON public.audit_log FOR INSERT
WITH CHECK (true);

-- Create index for efficient querying
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_table_record ON public.audit_log(table_name, record_id);

-- 2. Create masking functions
CREATE OR REPLACE FUNCTION public.mask_email(email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
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
AS $$
BEGIN
  IF name IS NULL THEN RETURN NULL; END IF;
  IF LENGTH(name) <= 1 THEN RETURN '*'; END IF;
  RETURN LEFT(name, 1) || REPEAT('*', LEAST(LENGTH(name) - 1, 8));
END;
$$;

-- 3. Create masked views for agents
CREATE OR REPLACE VIEW public.bookings_agent_view AS
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

CREATE OR REPLACE VIEW public.profiles_agent_view AS
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

-- 4. Create audit logging function
CREATE OR REPLACE FUNCTION public.log_pii_access(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_record_identifier TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_log (
    user_id,
    action,
    table_name,
    record_id,
    record_identifier,
    details
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_record_identifier,
    p_details
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 5. Create secure reveal function for admins only
CREATE OR REPLACE FUNCTION public.reveal_booking_pii(p_booking_id UUID)
RETURNS TABLE (
  id UUID,
  ticket_number TEXT,
  passenger_first_name TEXT,
  passenger_last_name TEXT,
  passenger_email TEXT,
  passenger_phone TEXT,
  trip_id UUID,
  origin_stop_id UUID,
  destination_stop_id UUID,
  seat_id UUID,
  price_paid NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can reveal PII
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required to reveal PII';
  END IF;
  
  -- Log the access
  PERFORM public.log_pii_access(
    'REVEAL_BOOKING_PII',
    'bookings',
    p_booking_id,
    NULL,
    jsonb_build_object('revealed_fields', ARRAY['passenger_first_name', 'passenger_last_name', 'passenger_email', 'passenger_phone'])
  );
  
  -- Return unmasked data
  RETURN QUERY
  SELECT 
    b.id,
    b.ticket_number,
    b.passenger_first_name,
    b.passenger_last_name,
    b.passenger_email,
    b.passenger_phone,
    b.trip_id,
    b.origin_stop_id,
    b.destination_stop_id,
    b.seat_id,
    b.price_paid,
    b.status::TEXT,
    b.created_at
  FROM public.bookings b
  WHERE b.id = p_booking_id;
END;
$$;

-- 6. Create secure reveal function for profiles
CREATE OR REPLACE FUNCTION public.reveal_profile_pii(p_profile_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can reveal PII
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required to reveal PII';
  END IF;
  
  -- Log the access
  PERFORM public.log_pii_access(
    'REVEAL_PROFILE_PII',
    'profiles',
    p_profile_id,
    NULL,
    jsonb_build_object('revealed_fields', ARRAY['email', 'first_name', 'last_name', 'phone'])
  );
  
  -- Return unmasked data
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.phone,
    p.created_at
  FROM public.profiles p
  WHERE p.id = p_profile_id;
END;
$$;

-- 7. Create rate-limited bulk query function for agents
CREATE OR REPLACE FUNCTION public.get_bookings_for_agent(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_status TEXT DEFAULT NULL
)
RETURNS SETOF public.bookings_agent_view
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
  SELECT * FROM public.bookings_agent_view bav
  WHERE (p_status IS NULL OR bav.status::TEXT = p_status)
  ORDER BY bav.created_at DESC
  LIMIT v_actual_limit
  OFFSET p_offset;
END;
$$;

-- 8. Create function to get audit logs for admins
CREATE OR REPLACE FUNCTION public.get_audit_logs(
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_user_id UUID DEFAULT NULL,
  p_table_name TEXT DEFAULT NULL,
  p_action TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  action TEXT,
  table_name TEXT,
  record_id UUID,
  record_identifier TEXT,
  details JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can view audit logs
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    al.id,
    al.user_id,
    p.email AS user_email,
    al.action,
    al.table_name,
    al.record_id,
    al.record_identifier,
    al.details,
    al.created_at
  FROM public.audit_log al
  LEFT JOIN public.profiles p ON al.user_id = p.user_id
  WHERE (p_user_id IS NULL OR al.user_id = p_user_id)
    AND (p_table_name IS NULL OR al.table_name = p_table_name)
    AND (p_action IS NULL OR al.action = p_action)
  ORDER BY al.created_at DESC
  LIMIT LEAST(p_limit, 500)
  OFFSET p_offset;
END;
$$;
