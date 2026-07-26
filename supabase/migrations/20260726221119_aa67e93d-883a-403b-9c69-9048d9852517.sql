
-- driver_status: one row per driver, live status
CREATE TABLE public.driver_status (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'off_duty' CHECK (status IN ('ready','on_route','at_destination','break','breakdown','accident','off_duty')),
  note TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_status TO authenticated;
GRANT ALL ON public.driver_status TO service_role;
ALTER TABLE public.driver_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "driver_status_self_all" ON public.driver_status
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "driver_status_staff_select" ON public.driver_status
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office') OR public.has_role(auth.uid(),'agent'));

-- driver_checklists
CREATE TABLE public.driver_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  signature_data TEXT,
  notes TEXT,
  all_ok BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_driver_checklists_driver_date ON public.driver_checklists(driver_user_id, shift_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_checklists TO authenticated;
GRANT ALL ON public.driver_checklists TO service_role;
ALTER TABLE public.driver_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "driver_checklists_self_all" ON public.driver_checklists
  FOR ALL TO authenticated
  USING (driver_user_id = auth.uid())
  WITH CHECK (driver_user_id = auth.uid());

CREATE POLICY "driver_checklists_staff_select" ON public.driver_checklists
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office') OR public.has_role(auth.uid(),'agent'));

CREATE TRIGGER trg_driver_checklists_updated
  BEFORE UPDATE ON public.driver_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- driver_duty_log
CREATE TABLE public.driver_duty_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  driving_seconds INTEGER NOT NULL DEFAULT 0,
  break_seconds INTEGER NOT NULL DEFAULT 0,
  km_start INTEGER,
  km_end INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(driver_user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_duty_log TO authenticated;
GRANT ALL ON public.driver_duty_log TO service_role;
ALTER TABLE public.driver_duty_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "driver_duty_self_all" ON public.driver_duty_log
  FOR ALL TO authenticated
  USING (driver_user_id = auth.uid())
  WITH CHECK (driver_user_id = auth.uid());

CREATE POLICY "driver_duty_staff_select" ON public.driver_duty_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office') OR public.has_role(auth.uid(),'agent'));

CREATE TRIGGER trg_driver_duty_updated
  BEFORE UPDATE ON public.driver_duty_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_checklists;
