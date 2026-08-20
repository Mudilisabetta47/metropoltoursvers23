CREATE OR REPLACE FUNCTION public.list_seat_hold_availability()
RETURNS TABLE(
  id uuid,
  trip_id uuid,
  seat_id uuid,
  origin_stop_id uuid,
  destination_stop_id uuid,
  expires_at timestamptz,
  is_own_hold boolean,
  origin_stop_order integer,
  origin_stop_name text,
  destination_stop_order integer,
  destination_stop_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sh.id, sh.trip_id, sh.seat_id, sh.origin_stop_id, sh.destination_stop_id, sh.expires_at,
         (sh.user_id IS NOT NULL AND sh.user_id = auth.uid()) AS is_own_hold,
         origin.stop_order, origin.name,
         destination.stop_order, destination.name
  FROM public.seat_holds sh
  LEFT JOIN public.stops origin ON origin.id = sh.origin_stop_id
  LEFT JOIN public.stops destination ON destination.id = sh.destination_stop_id
  WHERE sh.expires_at > now();
$$;

GRANT EXECUTE ON FUNCTION public.list_seat_hold_availability() TO anon, authenticated, service_role;

DROP VIEW IF EXISTS public.seat_hold_availability;
CREATE VIEW public.seat_hold_availability
WITH (security_invoker = true, security_barrier = true) AS
  SELECT * FROM public.list_seat_hold_availability();

GRANT SELECT ON public.seat_hold_availability TO anon, authenticated;
GRANT ALL ON public.seat_hold_availability TO service_role;

REVOKE EXECUTE ON FUNCTION public.generate_booking_number() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_booking_number() FROM anon, authenticated;