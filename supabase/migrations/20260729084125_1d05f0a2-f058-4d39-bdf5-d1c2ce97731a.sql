DROP POLICY IF EXISTS "Seat hold active availability rows" ON public.seat_holds;

REVOKE SELECT ON public.seat_holds FROM anon;
REVOKE SELECT ON public.seat_holds FROM authenticated;
GRANT SELECT ON public.seat_hold_availability TO anon;
GRANT SELECT ON public.seat_hold_availability TO authenticated;
GRANT SELECT ON public.seat_hold_availability TO service_role;
GRANT ALL ON public.seat_holds TO service_role;