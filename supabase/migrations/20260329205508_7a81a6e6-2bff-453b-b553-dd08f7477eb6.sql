-- 1. Fix package_tour_inquiries: remove OR user_id IS NULL from SELECT
DROP POLICY "Users can view their own inquiries" ON public.package_tour_inquiries;
CREATE POLICY "Users can view their own inquiries"
ON public.package_tour_inquiries
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 2. Fix tour_bookings INSERT policy - restrict manipulation
DROP POLICY "Users can create tour bookings" ON public.tour_bookings;
CREATE POLICY "Authenticated users can create tour bookings"
ON public.tour_bookings
FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid() OR user_id IS NULL)
  AND status = 'pending'
  AND paid_at IS NULL
  AND payment_reference IS NULL
  AND stripe_session_id IS NULL
  AND stripe_payment_intent_id IS NULL
);

CREATE POLICY "Anonymous users can create tour bookings"
ON public.tour_bookings
FOR INSERT TO anon
WITH CHECK (
  user_id IS NULL
  AND status = 'pending'
  AND paid_at IS NULL
  AND payment_reference IS NULL
  AND stripe_session_id IS NULL
  AND stripe_payment_intent_id IS NULL
);

-- 3. Audit log immutability
CREATE POLICY "Audit logs are immutable"
ON public.audit_log FOR UPDATE
USING (false);

CREATE POLICY "Audit logs cannot be deleted"
ON public.audit_log FOR DELETE
USING (false);