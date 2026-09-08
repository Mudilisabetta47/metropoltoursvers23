DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;

CREATE POLICY "Users can create bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  (
    has_role(auth.uid(), 'agent'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'office'::app_role)
  )
  OR (
    auth.uid() = user_id
    AND coalesce(payment_status, 'pending') IN ('pending', 'open', 'unpaid')
    AND coalesce(price_paid, 0) = 0
    AND paid_at IS NULL
    AND payment_reference IS NULL
    AND stripe_session_id IS NULL
    AND paypal_order_id IS NULL
    AND paypal_capture_id IS NULL
  )
);