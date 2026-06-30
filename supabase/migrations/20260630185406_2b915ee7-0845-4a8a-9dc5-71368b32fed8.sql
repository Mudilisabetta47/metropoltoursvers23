DROP POLICY IF EXISTS "Agents and admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can view bookings matching verified email" ON public.tour_bookings;