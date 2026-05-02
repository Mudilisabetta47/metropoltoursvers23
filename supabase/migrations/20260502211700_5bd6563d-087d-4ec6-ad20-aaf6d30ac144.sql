
-- Dynamic Pricing Rules
CREATE TABLE public.dynamic_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 100,
  
  -- Scope
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
  tour_id UUID,
  applies_to_all BOOLEAN NOT NULL DEFAULT false,
  
  -- Conditions (all optional, AND-combined)
  weekdays INTEGER[],
  hour_from INTEGER,
  hour_to INTEGER,
  days_before_min INTEGER,
  days_before_max INTEGER,
  occupancy_min INTEGER,
  occupancy_max INTEGER,
  date_from DATE,
  date_to DATE,
  
  -- Action
  adjustment_type TEXT NOT NULL DEFAULT 'percent',
  adjustment_value NUMERIC(8,2) NOT NULL DEFAULT 0,
  min_price NUMERIC(10,2),
  max_price NUMERIC(10,2),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  
  CONSTRAINT chk_adjustment_type CHECK (adjustment_type IN ('percent','absolute','set'))
);

ALTER TABLE public.dynamic_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Office manage pricing rules"
  ON public.dynamic_pricing_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

-- Competitor Prices
CREATE TABLE public.competitor_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_name TEXT NOT NULL,
  origin_city TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  travel_date DATE NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  notes TEXT,
  source_url TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  captured_by UUID
);

CREATE INDEX idx_competitor_prices_route ON public.competitor_prices(origin_city, destination_city, travel_date);
ALTER TABLE public.competitor_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Office manage competitor prices"
  ON public.competitor_prices FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

-- Pricing Log
CREATE TABLE public.pricing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.dynamic_pricing_rules(id) ON DELETE SET NULL,
  rule_name TEXT,
  trip_id UUID,
  tour_date_id UUID,
  old_price NUMERIC(10,2),
  new_price NUMERIC(10,2),
  reason TEXT,
  applied_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pricing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Office view pricing log"
  ON public.pricing_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

CREATE POLICY "System inserts pricing log"
  ON public.pricing_log FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

CREATE TRIGGER update_dynamic_pricing_rules_updated_at
  BEFORE UPDATE ON public.dynamic_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
