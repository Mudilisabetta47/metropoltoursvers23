
-- 1. admin_mailbox: restrict public INSERT to known inquiry source types
DROP POLICY IF EXISTS "System can insert into mailbox" ON public.admin_mailbox;
CREATE POLICY "Public can submit inquiries to mailbox"
ON public.admin_mailbox
FOR INSERT
TO anon, authenticated
WITH CHECK (
  source_type IN ('newsletter', 'group_inquiry', 'job_application', 'contact', 'business_inquiry')
  AND folder = 'inbox'
);

-- 2. operations_metrics: drop public insert; service role bypasses RLS
DROP POLICY IF EXISTS "System can insert metrics" ON public.operations_metrics;
CREATE POLICY "Admins can insert metrics"
ON public.operations_metrics
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. webhook_logs: restrict insert to admin (edge functions use service role)
DROP POLICY IF EXISTS "Anyone can insert webhook logs" ON public.webhook_logs;
CREATE POLICY "Admins can insert webhook logs"
ON public.webhook_logs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. coupons: restrict SELECT to admins; provide validation RPC for everyone
DROP POLICY IF EXISTS "Authenticated can read active coupons" ON public.coupons;

CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _subtotal numeric)
RETURNS TABLE (
  code text,
  description text,
  percent_off numeric,
  amount_off numeric,
  valid boolean,
  error text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c record;
BEGIN
  SELECT * INTO c FROM public.coupons
  WHERE coupons.code = upper(trim(_code)) AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::numeric, NULL::numeric, false, 'invalid'::text;
    RETURN;
  END IF;

  IF c.valid_until IS NOT NULL AND c.valid_until < now() THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::numeric, NULL::numeric, false, 'expired'::text;
    RETURN;
  END IF;

  IF c.max_redemptions IS NOT NULL AND c.times_redeemed >= c.max_redemptions THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::numeric, NULL::numeric, false, 'redeemed'::text;
    RETURN;
  END IF;

  IF c.min_amount IS NOT NULL AND _subtotal < c.min_amount THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::numeric, NULL::numeric, false, ('min_amount:' || c.min_amount)::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT c.code, c.description, c.percent_off, c.amount_off, true, NULL::text;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_coupon(text, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO anon, authenticated;

-- 5. tour_bookings: drop dangerous policies
DROP POLICY IF EXISTS "Anon can view own pending bookings" ON public.tour_bookings;
DROP POLICY IF EXISTS "Users can view tour bookings by email" ON public.tour_bookings;

-- Replace with verified-email match using JWT claim (not editable profile)
CREATE POLICY "Users can view bookings matching verified email"
ON public.tour_bookings
FOR SELECT
TO authenticated
USING (
  contact_email IS NOT NULL
  AND lower(contact_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);

-- 6. tour_document_sends: restrict insert to staff
DROP POLICY IF EXISTS "Anyone can insert document sends" ON public.tour_document_sends;
CREATE POLICY "Staff can insert document sends"
ON public.tour_document_sends
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'office'::app_role)
  OR has_role(auth.uid(), 'agent'::app_role)
);

-- 7. buses: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Buses are viewable by everyone" ON public.buses;
CREATE POLICY "Authenticated users can view buses"
ON public.buses
FOR SELECT
TO authenticated
USING (true);

-- 8. review-photos storage: restrict uploads to user-owned folder
DROP POLICY IF EXISTS "Auth upload review photos" ON storage.objects;
CREATE POLICY "Users upload own review photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 9. Fix mutable search_path on trigger functions
CREATE OR REPLACE FUNCTION public.set_waitlist_position()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.position IS NULL THEN
    SELECT COALESCE(MAX(position), 0) + 1 INTO NEW.position
    FROM public.waitlist_entries
    WHERE COALESCE(tour_date_id, gen_random_uuid()) = COALESCE(NEW.tour_date_id, gen_random_uuid())
       OR COALESCE(trip_id, gen_random_uuid()) = COALESCE(NEW.trip_id, gen_random_uuid());
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.update_compliance_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSIF NEW.due_date <= CURRENT_DATE + (NEW.reminder_days || ' days')::interval THEN
    NEW.status := 'due_soon';
  ELSE
    NEW.status := 'valid';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;
