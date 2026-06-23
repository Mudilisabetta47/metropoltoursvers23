
-- 1. booking_changes: restrict INSERT to staff
DROP POLICY IF EXISTS "System write booking changes" ON public.booking_changes;
CREATE POLICY "Staff write booking changes"
ON public.booking_changes
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'office')
  OR public.has_role(auth.uid(), 'agent')
);

-- 2. job_applications: lock down public submission columns
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.job_applications;
CREATE POLICY "Anyone can submit applications"
ON public.job_applications
FOR INSERT
TO public
WITH CHECK (
  status = 'new'
  AND is_read = false
  AND internal_notes IS NULL
);

-- 3. seat_holds: require authenticated user matching auth.uid()
DROP POLICY IF EXISTS "Users can create seat holds with valid session" ON public.seat_holds;
CREATE POLICY "Authenticated users create own seat holds"
ON public.seat_holds
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND session_id IS NOT NULL
  AND length(session_id) > 10
);
