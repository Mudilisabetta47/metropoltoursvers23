REVOKE SELECT ON public.seat_holds FROM PUBLIC;
REVOKE SELECT (id, trip_id, seat_id, origin_stop_id, destination_stop_id, expires_at) ON public.seat_holds FROM PUBLIC;
GRANT SELECT ON public.seat_hold_availability TO anon;
GRANT SELECT ON public.seat_hold_availability TO authenticated;
GRANT SELECT ON public.seat_hold_availability TO service_role;