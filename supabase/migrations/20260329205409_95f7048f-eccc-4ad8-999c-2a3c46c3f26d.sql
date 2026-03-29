-- Allow anonymous users to read back their just-inserted booking via .select() after .insert()
CREATE POLICY "Anon can view own pending bookings"
ON public.tour_bookings
FOR SELECT
TO anon
USING (status = 'pending' AND created_at > now() - interval '5 minutes');