
-- ============ CUSTOMER TAGS ============
CREATE TABLE public.customer_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id UUID NOT NULL,
  tag TEXT NOT NULL,
  color TEXT DEFAULT '#00CC36',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_user_id, tag)
);
CREATE INDEX idx_customer_tags_user ON public.customer_tags(customer_user_id);
ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Office view tags" ON public.customer_tags FOR SELECT
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE POLICY "Admin/Office insert tags" ON public.customer_tags FOR INSERT
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE POLICY "Admin/Office delete tags" ON public.customer_tags FOR DELETE
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- ============ CUSTOMER NOTES ============
CREATE TABLE public.customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id UUID NOT NULL,
  author_id UUID,
  body TEXT NOT NULL,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customer_notes_user ON public.customer_notes(customer_user_id, created_at DESC);
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Office view notes" ON public.customer_notes FOR SELECT
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE POLICY "Admin/Office insert notes" ON public.customer_notes FOR INSERT
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office')) AND author_id = auth.uid());
CREATE POLICY "Admin/Office update notes" ON public.customer_notes FOR UPDATE
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE POLICY "Admin/Office delete notes" ON public.customer_notes FOR DELETE
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

CREATE TRIGGER trg_customer_notes_updated
  BEFORE UPDATE ON public.customer_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FLEET MAINTENANCE ============
CREATE TABLE public.fleet_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL UNIQUE REFERENCES public.buses(id) ON DELETE CASCADE,
  current_km INTEGER DEFAULT 0,
  tuev_date DATE,
  uvv_date DATE,
  next_inspection_date DATE,
  next_inspection_km INTEGER,
  oil_change_date DATE,
  oil_change_km INTEGER,
  tachograph_date DATE,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fleet_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Office manage maintenance" ON public.fleet_maintenance FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

CREATE TRIGGER trg_fleet_maintenance_updated
  BEFORE UPDATE ON public.fleet_maintenance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FLEET INSPECTIONS (history) ============
CREATE TABLE public.fleet_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL,
  performed_at DATE NOT NULL,
  km_at_service INTEGER,
  workshop TEXT,
  cost_eur NUMERIC(10,2) DEFAULT 0,
  description TEXT,
  document_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fleet_inspections_bus ON public.fleet_inspections(bus_id, performed_at DESC);
ALTER TABLE public.fleet_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Office manage inspections" ON public.fleet_inspections FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- ============ WALLBOARD TOKENS ============
CREATE TABLE public.wallboard_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallboard_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage wallboard tokens" ON public.wallboard_tokens FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
