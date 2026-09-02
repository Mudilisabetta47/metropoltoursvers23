CREATE POLICY "Assigned driver adds unscheduled stops"
ON public.dispatch_order_stops
FOR INSERT TO authenticated
WITH CHECK (
  stop_type = 'unscheduled'
  AND EXISTS (
    SELECT 1 FROM public.dispatch_orders o
    WHERE o.id = dispatch_order_stops.order_id
      AND o.driver_user_id = auth.uid()
  )
);

CREATE POLICY "Assigned driver deletes own unscheduled stops"
ON public.dispatch_order_stops
FOR DELETE TO authenticated
USING (
  stop_type = 'unscheduled'
  AND EXISTS (
    SELECT 1 FROM public.dispatch_orders o
    WHERE o.id = dispatch_order_stops.order_id
      AND o.driver_user_id = auth.uid()
  )
);