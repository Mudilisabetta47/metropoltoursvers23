CREATE POLICY "Anyone can update booked_seats during checkout"
ON public.tour_dates
FOR UPDATE
TO anon, authenticated
USING (is_active = true)
WITH CHECK (is_active = true);