
CREATE TABLE public.trip_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_uid TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL CHECK (source_type IN ('line_trip','package_tour_date')),
  source_id UUID NOT NULL,
  departure_at TIMESTAMPTZ,
  origin TEXT,
  destination TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  current_delay_min INTEGER NOT NULL DEFAULT 0,
  delay_reason TEXT,
  delay_updated_at TIMESTAMPTZ,
  delay_updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id)
);
GRANT SELECT ON public.trip_registry TO anon, authenticated;
GRANT ALL ON public.trip_registry TO service_role;
ALTER TABLE public.trip_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trip_registry_public_read" ON public.trip_registry FOR SELECT USING (true);
CREATE POLICY "trip_registry_staff_write" ON public.trip_registry FOR ALL USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office')
  OR public.has_role(auth.uid(),'agent') OR public.has_role(auth.uid(),'driver')
) WITH CHECK (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office')
  OR public.has_role(auth.uid(),'agent') OR public.has_role(auth.uid(),'driver')
);
CREATE INDEX idx_trip_registry_source ON public.trip_registry(source_type, source_id);
CREATE INDEX idx_trip_registry_departure ON public.trip_registry(departure_at);
CREATE TRIGGER trip_registry_updated_at BEFORE UPDATE ON public.trip_registry
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.trip_delay_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_uid TEXT NOT NULL,
  delay_min INTEGER NOT NULL,
  reason TEXT,
  reported_by UUID,
  notified_count INTEGER DEFAULT 0,
  notify_requested BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.trip_delay_events TO authenticated;
GRANT ALL ON public.trip_delay_events TO service_role;
ALTER TABLE public.trip_delay_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trip_delay_events_staff_read" ON public.trip_delay_events FOR SELECT USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office')
  OR public.has_role(auth.uid(),'agent') OR public.has_role(auth.uid(),'driver')
);
CREATE INDEX idx_trip_delay_events_uid ON public.trip_delay_events(trip_uid, created_at DESC);

CREATE OR REPLACE FUNCTION public.generate_trip_uid()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  yr TEXT := TO_CHAR(now(),'YYYY'); rnd TEXT; candidate TEXT; i INT;
BEGIN
  LOOP
    rnd := '';
    FOR i IN 1..6 LOOP rnd := rnd || substr(alphabet,(floor(random()*32)::int)+1,1); END LOOP;
    candidate := 'MT-' || yr || '-' || rnd;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.trip_registry WHERE trip_uid = candidate);
  END LOOP;
  RETURN candidate;
END $$;

CREATE OR REPLACE FUNCTION public.sync_line_trip_to_registry()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_origin TEXT; v_dest TEXT;
BEGIN
  SELECT name INTO v_origin FROM public.line_stops WHERE line_id = NEW.line_id ORDER BY stop_order ASC LIMIT 1;
  SELECT name INTO v_dest FROM public.line_stops WHERE line_id = NEW.line_id ORDER BY stop_order DESC LIMIT 1;
  INSERT INTO public.trip_registry (trip_uid, source_type, source_id, departure_at, origin, destination, status, current_delay_min)
  VALUES (public.generate_trip_uid(), 'line_trip', NEW.id, NEW.planned_departure, v_origin, v_dest, COALESCE(NEW.status,'scheduled'), COALESCE(NEW.delay_minutes,0))
  ON CONFLICT (source_type, source_id) DO UPDATE SET
    departure_at = EXCLUDED.departure_at, origin = EXCLUDED.origin, destination = EXCLUDED.destination,
    status = EXCLUDED.status, current_delay_min = EXCLUDED.current_delay_min, updated_at = now();
  RETURN NEW;
END $$;
CREATE TRIGGER trg_sync_line_trip AFTER INSERT OR UPDATE ON public.line_trips
FOR EACH ROW EXECUTE FUNCTION public.sync_line_trip_to_registry();

CREATE OR REPLACE FUNCTION public.sync_tour_date_to_registry()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_dest TEXT;
BEGIN
  SELECT COALESCE(destination, meta_title, location, 'Pauschalreise') INTO v_dest FROM public.package_tours WHERE id = NEW.tour_id;
  INSERT INTO public.trip_registry (trip_uid, source_type, source_id, departure_at, origin, destination, status)
  VALUES (public.generate_trip_uid(), 'package_tour_date', NEW.id, NEW.departure_date::timestamptz, 'Deutschland', v_dest, COALESCE(NEW.status,'scheduled'))
  ON CONFLICT (source_type, source_id) DO UPDATE SET
    departure_at = EXCLUDED.departure_at, destination = EXCLUDED.destination,
    status = EXCLUDED.status, updated_at = now();
  RETURN NEW;
END $$;
CREATE TRIGGER trg_sync_tour_date AFTER INSERT OR UPDATE ON public.tour_dates
FOR EACH ROW EXECUTE FUNCTION public.sync_tour_date_to_registry();

INSERT INTO public.trip_registry (trip_uid, source_type, source_id, departure_at, origin, destination, status, current_delay_min)
SELECT public.generate_trip_uid(), 'line_trip', lt.id, lt.planned_departure,
  (SELECT name FROM public.line_stops WHERE line_id=lt.line_id ORDER BY stop_order ASC LIMIT 1),
  (SELECT name FROM public.line_stops WHERE line_id=lt.line_id ORDER BY stop_order DESC LIMIT 1),
  COALESCE(lt.status,'scheduled'), COALESCE(lt.delay_minutes,0)
FROM public.line_trips lt
ON CONFLICT (source_type, source_id) DO NOTHING;

INSERT INTO public.trip_registry (trip_uid, source_type, source_id, departure_at, origin, destination, status)
SELECT public.generate_trip_uid(), 'package_tour_date', td.id, td.departure_date::timestamptz, 'Deutschland',
  (SELECT COALESCE(destination, meta_title, location, 'Pauschalreise') FROM public.package_tours WHERE id = td.tour_id),
  COALESCE(td.status,'scheduled')
FROM public.tour_dates td
ON CONFLICT (source_type, source_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.report_trip_delay(p_trip_uid TEXT, p_delay_min INTEGER, p_reason TEXT, p_notify BOOLEAN DEFAULT true)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event_id UUID; v_reg RECORD;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office')
       OR public.has_role(auth.uid(),'agent') OR public.has_role(auth.uid(),'driver')) THEN
    RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_delay_min < 0 OR p_delay_min > 1440 THEN RAISE EXCEPTION 'Invalid delay'; END IF;
  SELECT * INTO v_reg FROM public.trip_registry WHERE trip_uid = p_trip_uid;
  IF v_reg IS NULL THEN RAISE EXCEPTION 'Trip not found'; END IF;
  UPDATE public.trip_registry SET
    current_delay_min = p_delay_min, delay_reason = p_reason,
    delay_updated_at = now(), delay_updated_by = auth.uid(),
    status = CASE WHEN p_delay_min > 0 THEN 'delayed' ELSE 'scheduled' END
  WHERE trip_uid = p_trip_uid;
  IF v_reg.source_type = 'line_trip' THEN
    UPDATE public.line_trips SET delay_minutes = p_delay_min,
      status = CASE WHEN p_delay_min > 0 THEN 'delayed' ELSE status END
    WHERE id = v_reg.source_id;
  END IF;
  INSERT INTO public.trip_delay_events (trip_uid, delay_min, reason, reported_by, notify_requested)
  VALUES (p_trip_uid, p_delay_min, p_reason, auth.uid(), p_notify)
  RETURNING id INTO v_event_id;
  RETURN v_event_id;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_registry;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_delay_events;
