-- Spalten-Level: internal_notes für öffentliche Rollen sperren
REVOKE SELECT ON public.trips FROM anon, authenticated;
GRANT SELECT (id, route_id, bus_id, departure_date, departure_time, arrival_time, base_price, is_active, created_at, updated_at, arrival_date, title, trip_category, guide_user_id, driver_user_id, return_trip_id, direction, seat_capacity, status, started_at, ended_at)
  ON public.trips TO anon, authenticated;
GRANT ALL ON public.trips TO service_role;

-- Staff-Sicht inkl. internal_notes über Security-Definer-Funktion
CREATE OR REPLACE FUNCTION public.get_trip_internal_notes(p_trip_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.internal_notes
  FROM public.trips t
  WHERE t.id = p_trip_id
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'office')
      OR (public.has_role(auth.uid(), 'driver') AND t.driver_user_id = auth.uid())
    )
$$;

REVOKE ALL ON FUNCTION public.get_trip_internal_notes(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_trip_internal_notes(uuid) TO authenticated, service_role;