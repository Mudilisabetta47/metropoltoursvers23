
-- 1. bookings: remove raw PII access for agents; keep admin only
DROP POLICY IF EXISTS "Agents can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. coupons: add explicit admin-only SELECT policy for clarity
DROP POLICY IF EXISTS "Admins can view coupons" ON public.coupons;
CREATE POLICY "Admins can view coupons"
  ON public.coupons FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. employee_shifts: scope own-shifts policy to authenticated only
DROP POLICY IF EXISTS "Users can view own shifts" ON public.employee_shifts;
CREATE POLICY "Users can view own shifts"
  ON public.employee_shifts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 4. tour_bookings: restrict raw SELECT to admins only (remove agent raw PII access)
DROP POLICY IF EXISTS "Agents and admins can view all tour bookings" ON public.tour_bookings;
CREATE POLICY "Admins can view all tour bookings"
  ON public.tour_bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Storage: remove unrestricted job-applications upload policy
DROP POLICY IF EXISTS "Anyone can upload application files" ON storage.objects;

-- 6. Storage: allow booking owners to read their own tour-documents
--    (path convention: '{booking_id}/...' where booking_id maps to tour_bookings.id)
DROP POLICY IF EXISTS "Users can read own tour documents" ON storage.objects;
CREATE POLICY "Users can read own tour documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'tour-documents'
    AND EXISTS (
      SELECT 1 FROM public.tour_bookings tb
      WHERE tb.user_id = auth.uid()
        AND (storage.foldername(name))[1] = tb.id::text
    )
  );
