ALTER VIEW public.seat_hold_availability SET (security_invoker = false);
GRANT SELECT ON public.seat_hold_availability TO anon, authenticated;
GRANT ALL ON public.seat_hold_availability TO service_role;