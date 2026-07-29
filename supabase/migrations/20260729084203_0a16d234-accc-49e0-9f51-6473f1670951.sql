GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.seat_hold_availability TO anon;
GRANT SELECT ON public.seat_hold_availability TO authenticated;
GRANT SELECT ON public.seat_hold_availability TO service_role;