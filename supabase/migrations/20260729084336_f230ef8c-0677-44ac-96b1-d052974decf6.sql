ALTER VIEW public.seat_hold_availability SET (security_invoker = true);

DROP POLICY IF EXISTS "Seat hold active availability rows" ON public.seat_holds;
CREATE POLICY "Seat hold active availability rows"
ON public.seat_holds
FOR SELECT
TO public
USING (expires_at > now());

REVOKE SELECT ON public.seat_holds FROM PUBLIC;
REVOKE SELECT ON public.seat_holds FROM anon;
REVOKE SELECT ON public.seat_holds FROM authenticated;
GRANT SELECT (id, trip_id, seat_id, origin_stop_id, destination_stop_id, expires_at) ON public.seat_holds TO anon;
GRANT SELECT (id, trip_id, seat_id, origin_stop_id, destination_stop_id, expires_at) ON public.seat_holds TO authenticated;
GRANT SELECT ON public.seat_hold_availability TO anon;
GRANT SELECT ON public.seat_hold_availability TO authenticated;
GRANT SELECT ON public.seat_hold_availability TO service_role;
GRANT ALL ON public.seat_holds TO service_role;