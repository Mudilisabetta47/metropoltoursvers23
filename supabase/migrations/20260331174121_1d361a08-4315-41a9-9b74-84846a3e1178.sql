
-- Drop the header-based policies we just created and replace with admin-only
DROP POLICY IF EXISTS "View own token by value" ON public.passenger_data_tokens;
DROP POLICY IF EXISTS "Update own token by value" ON public.passenger_data_tokens;

-- Admin-only direct table access
CREATE POLICY "Admins manage tokens directly"
ON public.passenger_data_tokens FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Keep existing admin policy if it exists (no-op if already there)

-- Security definer function to look up a token by value
CREATE OR REPLACE FUNCTION public.get_passenger_token(p_token text)
RETURNS TABLE(
  id uuid,
  booking_id uuid,
  token text,
  expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_token IS NULL OR length(p_token) < 10 THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;
  
  RETURN QUERY
  SELECT t.id, t.booking_id, t.token, t.expires_at, t.completed_at, t.created_at
  FROM public.passenger_data_tokens t
  WHERE t.token = p_token
  LIMIT 1;
END;
$$;

-- Security definer function to complete a token
CREATE OR REPLACE FUNCTION public.complete_passenger_token(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_affected integer;
BEGIN
  IF p_token IS NULL OR length(p_token) < 10 THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;
  
  UPDATE public.passenger_data_tokens
  SET completed_at = now()
  WHERE token = p_token
    AND completed_at IS NULL
    AND expires_at > now();
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;
