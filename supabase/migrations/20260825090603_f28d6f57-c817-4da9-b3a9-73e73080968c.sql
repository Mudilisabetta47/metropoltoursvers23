DROP POLICY IF EXISTS "Agents and admins can view metrics" ON public.operations_metrics;
CREATE POLICY "Agents and admins can view metrics"
ON public.operations_metrics
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
REVOKE ALL ON public.operations_metrics FROM anon;