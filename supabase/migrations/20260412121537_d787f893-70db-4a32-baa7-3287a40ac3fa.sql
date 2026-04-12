
-- 1. FIX: tour_dates - Remove broad UPDATE policy, add secure function
DROP POLICY IF EXISTS "Anyone can update booked_seats during checkout" ON public.tour_dates;

CREATE OR REPLACE FUNCTION public.reserve_tour_seats(p_tour_date_id uuid, p_seats int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated boolean;
BEGIN
  IF p_seats < 1 OR p_seats > 20 THEN
    RAISE EXCEPTION 'Invalid seat count';
  END IF;
  
  UPDATE tour_dates
  SET booked_seats = booked_seats + p_seats,
      updated_at = now()
  WHERE id = p_tour_date_id
    AND is_active = true
    AND status = 'available'
    AND (booked_seats + p_seats) <= total_seats;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- Grant execute to anon and authenticated for checkout flow
GRANT EXECUTE ON FUNCTION public.reserve_tour_seats(uuid, int) TO anon, authenticated;

-- 2. FIX: coupons - Remove public SELECT, restrict to authenticated
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;

CREATE POLICY "Authenticated can read active coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (is_active = true);

-- 3. FIX: seat_holds DELETE - Restrict to owner only
DROP POLICY IF EXISTS "Users can delete own seat holds" ON public.seat_holds;

CREATE POLICY "Users can delete own seat holds"
ON public.seat_holds
FOR DELETE
USING (user_id = auth.uid());

-- Also allow admins/agents to delete seat holds
CREATE POLICY "Staff can delete seat holds"
ON public.seat_holds
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- 4. FIX: Audit log tables - Restrict INSERT to service_role
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;
CREATE POLICY "Service role inserts audit logs"
ON public.audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert email logs" ON public.automation_email_log;
CREATE POLICY "Service role inserts email logs"
ON public.automation_email_log
FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert booking audit" ON public.tour_booking_audit;
CREATE POLICY "Service role inserts booking audit"
ON public.tour_booking_audit
FOR INSERT
TO service_role
WITH CHECK (true);

-- 5. FIX: Realtime messages - Add RLS policies
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can subscribe to operational channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'office'::app_role)
  OR has_role(auth.uid(), 'agent'::app_role)
  OR has_role(auth.uid(), 'driver'::app_role)
);

-- 6. FIX: Function search_path - Set on all functions missing it
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%'
    )
    AND p.proname NOT IN ('has_role') -- already has it
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = public',
        func_record.nspname,
        func_record.proname,
        func_record.args
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not alter function %.%: %', func_record.nspname, func_record.proname, SQLERRM;
    END;
  END LOOP;
END;
$$;
