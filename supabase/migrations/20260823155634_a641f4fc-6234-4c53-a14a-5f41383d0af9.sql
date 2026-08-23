GRANT SELECT ON public.email_send_log TO authenticated;
DROP POLICY IF EXISTS "Staff can read send log" ON public.email_send_log;
CREATE POLICY "Staff can read send log" ON public.email_send_log
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

DROP POLICY IF EXISTS "Office can manage applications" ON public.job_applications;
CREATE POLICY "Office can manage applications" ON public.job_applications
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));