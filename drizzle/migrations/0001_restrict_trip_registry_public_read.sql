DROP POLICY IF EXISTS trip_registry_public_read ON public.trip_registry;
CREATE POLICY trip_registry_public_read_current ON public.trip_registry
FOR SELECT TO anon, authenticated
USING (
  status IS DISTINCT FROM 'cancelled'
  AND departure_at IS NOT NULL
  AND departure_at BETWEEN now() - interval '3 days' AND now() + interval '90 days'
);
CREATE POLICY trip_registry_staff_read ON public.trip_registry
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office') OR public.has_role(auth.uid(),'agent') OR public.has_role(auth.uid(),'driver'));