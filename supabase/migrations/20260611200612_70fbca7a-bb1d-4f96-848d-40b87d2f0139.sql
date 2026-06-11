-- Tighten bus_positions_live: only authenticated users with own booking or staff
DROP POLICY IF EXISTS "Public read bus positions" ON public.bus_positions_live;

CREATE POLICY "Owners and staff can read bus positions"
ON public.bus_positions_live
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'office')
  OR public.has_role(auth.uid(), 'agent')
  OR public.has_role(auth.uid(), 'driver')
  OR EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.trip_id = bus_positions_live.trip_id
      AND b.user_id = auth.uid()
      AND b.status IN ('confirmed', 'pending', 'completed')
  )
);