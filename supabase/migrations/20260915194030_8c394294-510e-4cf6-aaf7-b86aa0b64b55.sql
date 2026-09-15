REVOKE SELECT ON public.trips FROM anon;
GRANT SELECT (
  id, route_id, bus_id, departure_date, departure_time, arrival_time,
  base_price, is_active, created_at, updated_at, arrival_date, title,
  trip_category, return_trip_id, direction, seat_capacity, status,
  started_at, ended_at
) ON public.trips TO anon;
REVOKE SELECT (driver_user_id, guide_user_id, internal_notes) ON public.trips FROM anon;