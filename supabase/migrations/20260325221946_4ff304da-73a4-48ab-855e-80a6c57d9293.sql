
-- Add driver_user_id column
ALTER TABLE public.vehicle_positions ADD COLUMN IF NOT EXISTS driver_user_id uuid;

-- Clear demo data
DELETE FROM public.vehicle_positions;

-- Create unique index for one position per driver
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_positions_driver ON public.vehicle_positions(driver_user_id);

-- Drop old permissive policies
DROP POLICY IF EXISTS "Anyone can view vehicle positions" ON public.vehicle_positions;
DROP POLICY IF EXISTS "Admins can manage vehicle positions" ON public.vehicle_positions;

-- New RLS policies
CREATE POLICY "Staff view positions"
  ON public.vehicle_positions FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'office'::app_role) OR
    has_role(auth.uid(), 'agent'::app_role) OR
    has_role(auth.uid(), 'driver'::app_role)
  );

CREATE POLICY "Drivers insert own position"
  ON public.vehicle_positions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_user_id);

CREATE POLICY "Drivers update own position"
  ON public.vehicle_positions FOR UPDATE
  TO authenticated
  USING (auth.uid() = driver_user_id);

CREATE POLICY "Admins manage all positions"
  ON public.vehicle_positions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
