DROP POLICY IF EXISTS "Seat hold active availability rows" ON public.seat_holds;
CREATE POLICY "Seat hold active availability rows"
ON public.seat_holds
FOR SELECT
TO public
USING (expires_at > now());

CREATE OR REPLACE VIEW public.seat_hold_availability
WITH (security_barrier = true)
AS
SELECT
  sh.id,
  sh.trip_id,
  sh.seat_id,
  sh.origin_stop_id,
  sh.destination_stop_id,
  sh.expires_at,
  (sh.user_id = auth.uid()) AS is_own_hold,
  origin.stop_order AS origin_stop_order,
  origin.name AS origin_stop_name,
  destination.stop_order AS destination_stop_order,
  destination.name AS destination_stop_name
FROM public.seat_holds sh
LEFT JOIN public.stops origin ON origin.id = sh.origin_stop_id
LEFT JOIN public.stops destination ON destination.id = sh.destination_stop_id
WHERE sh.expires_at > now();

GRANT SELECT ON public.seat_hold_availability TO anon;
GRANT SELECT ON public.seat_hold_availability TO authenticated;
GRANT SELECT ON public.seat_hold_availability TO service_role;

REVOKE SELECT ON public.seat_holds FROM anon;
REVOKE SELECT ON public.seat_holds FROM authenticated;
GRANT SELECT (id, trip_id, seat_id, origin_stop_id, destination_stop_id, expires_at) ON public.seat_holds TO anon;
GRANT SELECT (id, trip_id, seat_id, origin_stop_id, destination_stop_id, expires_at) ON public.seat_holds TO authenticated;
GRANT ALL ON public.seat_holds TO service_role;