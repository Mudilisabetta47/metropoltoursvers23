
-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create tour bookings" ON public.tour_bookings;

-- Recreate as PERMISSIVE (default) so inserts actually work
CREATE POLICY "Users can create tour bookings"
ON public.tour_bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
