DROP POLICY IF EXISTS "Seat hold active availability rows" ON public.seat_holds;
REVOKE SELECT ON public.seat_holds FROM anon;