DROP POLICY IF EXISTS "Authenticated users can view buses" ON public.buses;
CREATE POLICY "Staff can view buses" ON public.buses FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'office'::app_role)
  OR public.has_role(auth.uid(), 'agent'::app_role)
  OR public.has_role(auth.uid(), 'driver'::app_role)
);

DROP POLICY IF EXISTS "Depots viewable by authenticated" ON public.depots;
CREATE POLICY "Staff can view depots" ON public.depots FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'office'::app_role)
  OR public.has_role(auth.uid(), 'agent'::app_role)
  OR public.has_role(auth.uid(), 'driver'::app_role)
);

DROP POLICY IF EXISTS "nav_alert_rules_read" ON public.navigation_alert_rules;
CREATE POLICY "nav_alert_rules_staff_read" ON public.navigation_alert_rules FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'office'::app_role)
  OR public.has_role(auth.uid(), 'agent'::app_role)
  OR public.has_role(auth.uid(), 'driver'::app_role)
);

REVOKE SELECT (driver_id) ON public.bus_positions_live FROM authenticated;
REVOKE SELECT (driver_id) ON public.bus_positions_live FROM anon;
GRANT ALL ON public.bus_positions_live TO service_role;