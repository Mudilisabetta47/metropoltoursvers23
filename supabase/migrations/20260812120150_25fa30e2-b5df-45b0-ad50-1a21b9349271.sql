CREATE TABLE IF NOT EXISTS public.ops_hazards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hazard_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_m INTEGER NOT NULL DEFAULT 300,
  speed_limit_kmh INTEGER,
  severity TEXT NOT NULL DEFAULT 'medium',
  source TEXT NOT NULL DEFAULT 'manual',
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ops_hazards TO authenticated;
GRANT ALL ON public.ops_hazards TO service_role;

ALTER TABLE public.ops_hazards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view hazards" ON public.ops_hazards FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office')
  OR public.has_role(auth.uid(),'agent') OR public.has_role(auth.uid(),'driver')
);

CREATE POLICY "Ops staff can create hazards" ON public.ops_hazards FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office') OR public.has_role(auth.uid(),'agent')
);

CREATE POLICY "Ops staff can update hazards" ON public.ops_hazards FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office') OR public.has_role(auth.uid(),'agent')
)
WITH CHECK (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office') OR public.has_role(auth.uid(),'agent')
);

CREATE POLICY "Admins can delete hazards" ON public.ops_hazards FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_ops_hazards_updated
BEFORE UPDATE ON public.ops_hazards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_ops_hazards_active ON public.ops_hazards (is_active, hazard_type);

ALTER TABLE public.dispatch_orders
  ADD COLUMN IF NOT EXISTS route_geometry JSONB,
  ADD COLUMN IF NOT EXISTS route_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS route_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS route_note TEXT;

ALTER TABLE public.ops_hazards REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ops_hazards;