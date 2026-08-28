CREATE POLICY "Users can view tickets of own bookings"
ON public.tickets
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.bookings b
  WHERE b.id = tickets.booking_id AND b.user_id = auth.uid()
));