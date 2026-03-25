
-- Depots / Betriebshöfe table
CREATE TABLE public.depots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  capacity_buses INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.depots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage depots" ON public.depots
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Depots viewable by authenticated" ON public.depots
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Add depot and dispatch columns to employee_shifts
ALTER TABLE public.employee_shifts
  ADD COLUMN IF NOT EXISTS depot_id UUID REFERENCES public.depots(id),
  ADD COLUMN IF NOT EXISTS dispatch_location TEXT,
  ADD COLUMN IF NOT EXISTS break_start TEXT,
  ADD COLUMN IF NOT EXISTS break_duration_minutes INTEGER DEFAULT 0;

-- Drop old status check and recreate with more values
ALTER TABLE public.employee_shifts DROP CONSTRAINT IF EXISTS employee_shifts_status_check;
ALTER TABLE public.employee_shifts ADD CONSTRAINT employee_shifts_status_check
  CHECK (status IN ('scheduled', 'active', 'break', 'completed', 'absent', 'cancelled'));
