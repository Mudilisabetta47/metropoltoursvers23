CREATE OR REPLACE FUNCTION public.get_new_tour_booking_number(p_booking_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT booking_number FROM public.tour_bookings
  WHERE id = p_booking_id AND created_at > now() - interval '30 minutes'
$$;
GRANT EXECUTE ON FUNCTION public.get_new_tour_booking_number(uuid) TO anon, authenticated;