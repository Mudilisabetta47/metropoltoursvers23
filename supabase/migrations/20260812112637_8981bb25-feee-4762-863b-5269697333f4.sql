-- 1) Bus-Fahrzeugprofile
ALTER TABLE public.buses
  ADD COLUMN IF NOT EXISTS bus_number TEXT,
  ADD COLUMN IF NOT EXISTS height_cm INTEGER,
  ADD COLUMN IF NOT EXISTS width_cm INTEGER,
  ADD COLUMN IF NOT EXISTS length_cm INTEGER,
  ADD COLUMN IF NOT EXISTS weight_kg INTEGER,
  ADD COLUMN IF NOT EXISTS axles INTEGER,
  ADD COLUMN IF NOT EXISTS emission_class TEXT,
  ADD COLUMN IF NOT EXISTS fuel_type TEXT,
  ADD COLUMN IF NOT EXISTS routing_notes TEXT;

-- 2) Fahraufträge
CREATE TABLE IF NOT EXISTS public.dispatch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  driver_user_id UUID,
  bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  origin_name TEXT,
  origin_address TEXT,
  origin_lat NUMERIC,
  origin_lng NUMERIC,
  destination_name TEXT,
  destination_address TEXT,
  destination_lat NUMERIC,
  destination_lng NUMERIC,
  waypoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  departure_at TIMESTAMPTZ,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  priority TEXT NOT NULL DEFAULT 'normal',
  eta TIMESTAMPTZ,
  distance_km NUMERIC,
  duration_min INTEGER,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  reject_reason TEXT,
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispatch_orders TO authenticated;
GRANT ALL ON public.dispatch_orders TO service_role;
ALTER TABLE public.dispatch_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dispatch_orders_staff_all" ON public.dispatch_orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

CREATE POLICY "dispatch_orders_driver_select" ON public.dispatch_orders
  FOR SELECT TO authenticated
  USING (driver_user_id = auth.uid());

CREATE POLICY "dispatch_orders_driver_update" ON public.dispatch_orders
  FOR UPDATE TO authenticated
  USING (driver_user_id = auth.uid())
  WITH CHECK (driver_user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_dispatch_orders_driver ON public.dispatch_orders(driver_user_id, status);
CREATE INDEX IF NOT EXISTS idx_dispatch_orders_created ON public.dispatch_orders(created_at DESC);

CREATE TRIGGER trg_dispatch_orders_updated
  BEFORE UPDATE ON public.dispatch_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auftragsnummer-Generator
CREATE OR REPLACE FUNCTION public.generate_dispatch_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n TEXT; y TEXT; s TEXT;
BEGIN
  y := TO_CHAR(now(),'YYYY');
  LOOP
    s := LPAD(FLOOR(RANDOM()*100000)::TEXT, 5, '0');
    n := 'FA-' || y || '-' || s;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.dispatch_orders WHERE order_number = n);
  END LOOP;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.set_dispatch_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_dispatch_order_number();
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_set_dispatch_order_number
  BEFORE INSERT ON public.dispatch_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_dispatch_order_number();

-- 3) Flotten-Live-Positionen (telematik-ready)
CREATE TABLE IF NOT EXISTS public.fleet_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_user_id UUID NOT NULL UNIQUE,
  bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.dispatch_orders(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION NOT NULL DEFAULT 0,
  speed_kmh DOUBLE PRECISION NOT NULL DEFAULT 0,
  accuracy_m DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'offline',
  source TEXT NOT NULL DEFAULT 'driver_app',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fleet_positions TO authenticated;
GRANT ALL ON public.fleet_positions TO service_role;
ALTER TABLE public.fleet_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fleet_positions_staff_all" ON public.fleet_positions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

CREATE POLICY "fleet_positions_driver_self" ON public.fleet_positions
  FOR ALL TO authenticated
  USING (driver_user_id = auth.uid())
  WITH CHECK (driver_user_id = auth.uid());

CREATE TRIGGER trg_fleet_positions_updated
  BEFORE UPDATE ON public.fleet_positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Auftrags-Nachrichten
CREATE TABLE IF NOT EXISTS public.dispatch_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.dispatch_orders(id) ON DELETE CASCADE,
  driver_user_id UUID NOT NULL,
  sender_id UUID,
  sender_role TEXT NOT NULL DEFAULT 'dispatcher',
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.dispatch_messages TO authenticated;
GRANT ALL ON public.dispatch_messages TO service_role;
ALTER TABLE public.dispatch_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dispatch_messages_staff_all" ON public.dispatch_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

CREATE POLICY "dispatch_messages_driver_select" ON public.dispatch_messages
  FOR SELECT TO authenticated
  USING (driver_user_id = auth.uid());

CREATE POLICY "dispatch_messages_driver_insert" ON public.dispatch_messages
  FOR INSERT TO authenticated
  WITH CHECK (driver_user_id = auth.uid() AND sender_id = auth.uid() AND sender_role = 'driver');

CREATE INDEX IF NOT EXISTS idx_dispatch_messages_driver ON public.dispatch_messages(driver_user_id, created_at DESC);

-- 5) Länderabhängige Warn-/Hinweisregeln (rechtlich konfigurierbar)
CREATE TABLE IF NOT EXISTS public.navigation_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (country_code, rule_key)
);
GRANT SELECT ON public.navigation_alert_rules TO authenticated;
GRANT ALL ON public.navigation_alert_rules TO service_role;
ALTER TABLE public.navigation_alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nav_alert_rules_read" ON public.navigation_alert_rules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "nav_alert_rules_admin_write" ON public.navigation_alert_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_nav_alert_rules_updated
  BEFORE UPDATE ON public.navigation_alert_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.dispatch_orders REPLICA IDENTITY FULL;
ALTER TABLE public.fleet_positions REPLICA IDENTITY FULL;
ALTER TABLE public.dispatch_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fleet_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_messages;