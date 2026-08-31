DROP POLICY IF EXISTS "Staff can subscribe to operational channels" ON realtime.messages;

CREATE POLICY "Staff topic scoped realtime subscribe"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'office'::app_role)
  OR (
    public.has_role(auth.uid(), 'agent'::app_role)
    AND realtime.topic() !~ '^(driver|fis|dispatch)'
  )
  OR (
    public.has_role(auth.uid(), 'driver'::app_role)
    AND (
      realtime.topic() = 'driver-radio'
      OR realtime.topic() LIKE '%' || auth.uid()::text
    )
  )
);