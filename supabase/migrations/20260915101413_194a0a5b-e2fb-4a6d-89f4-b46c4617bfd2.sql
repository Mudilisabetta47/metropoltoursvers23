CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.email
  FROM public.profiles p
  WHERE p.user_id = _user_id
    AND (
      _user_id = auth.uid()
      OR auth.role() = 'service_role'
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'office')
    )
  LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_email(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "invoices_staff_read" ON storage.objects;
CREATE POLICY "invoices_staff_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'invoices'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'office')
    OR public.has_role(auth.uid(), 'agent')
  )
);

DROP POLICY IF EXISTS "invoices_owner_read" ON storage.objects;
CREATE POLICY "invoices_owner_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM public.tour_bookings tb
    WHERE tb.booking_number = split_part(storage.objects.name, '/', 1)
      AND (
        tb.user_id = auth.uid()
        OR lower(tb.contact_email) = lower((SELECT p.email FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1))
      )
  )
);