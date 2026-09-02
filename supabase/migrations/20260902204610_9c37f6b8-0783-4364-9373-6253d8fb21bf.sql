GRANT SELECT ON public.trips TO authenticated;
REVOKE SELECT ON public.trips FROM anon;
GRANT SELECT (id, route_id, bus_id, departure_date, departure_time, arrival_time, base_price, is_active, created_at, updated_at, arrival_date, title, trip_category, guide_user_id, driver_user_id, return_trip_id, direction, seat_capacity, status, started_at, ended_at)
  ON public.trips TO anon;