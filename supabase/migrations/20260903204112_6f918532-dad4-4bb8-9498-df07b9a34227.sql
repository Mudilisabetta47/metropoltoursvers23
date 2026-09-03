
-- 1) Verspätung aus dem Fahrauftrag in die öffentliche Fahrten-Registry spiegeln
CREATE OR REPLACE FUNCTION public.sync_order_delay_to_registry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.trip_id IS NOT NULL AND (
       TG_OP = 'INSERT'
       OR NEW.delay_minutes IS DISTINCT FROM OLD.delay_minutes
       OR NEW.delay_reason IS DISTINCT FROM OLD.delay_reason
     ) THEN
    UPDATE public.trip_registry
       SET current_delay_min = COALESCE(NEW.delay_minutes, 0),
           delay_reason = NEW.delay_reason,
           delay_updated_at = now(),
           updated_at = now()
     WHERE source_id = NEW.trip_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_order_delay_to_registry ON public.dispatch_orders;
CREATE TRIGGER trg_sync_order_delay_to_registry
AFTER INSERT OR UPDATE ON public.dispatch_orders
FOR EACH ROW EXECUTE FUNCTION public.sync_order_delay_to_registry();

-- 2) Öffentliche Live-Halte (inkl. außerplanmäßiger Halte) für die Verfolgungsseite
CREATE OR REPLACE FUNCTION public.get_public_trip_live_stops(p_trip_id uuid)
RETURNS TABLE(
  id uuid,
  sort_order integer,
  name text,
  stop_type text,
  lat numeric,
  lng numeric,
  planned_arrival timestamptz,
  planned_departure timestamptz,
  actual_arrival timestamptz,
  actual_departure timestamptz,
  notes text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.sort_order, s.name, s.stop_type,
         s.lat::numeric, s.lng::numeric,
         s.planned_arrival, s.planned_departure,
         s.actual_arrival, s.actual_departure,
         s.notes
  FROM public.dispatch_order_stops s
  JOIN public.dispatch_orders o ON o.id = s.order_id
  WHERE o.trip_id = p_trip_id
  ORDER BY s.sort_order;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_trip_live_stops(uuid) TO anon, authenticated;
