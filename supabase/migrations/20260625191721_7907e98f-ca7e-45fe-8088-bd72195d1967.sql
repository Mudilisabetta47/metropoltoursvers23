
-- ============ bus_lines ============
CREATE TABLE public.bus_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#00CC36',
  line_type TEXT NOT NULL DEFAULT 'line' CHECK (line_type IN ('line','longdistance','shuttle')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bus_lines TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bus_lines TO authenticated;
GRANT ALL ON public.bus_lines TO service_role;
ALTER TABLE public.bus_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active lines" ON public.bus_lines FOR SELECT USING (is_active = true);
CREATE POLICY "Staff manage lines" ON public.bus_lines FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- ============ line_stops ============
CREATE TABLE public.line_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  line_id UUID NOT NULL REFERENCES public.bus_lines(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  platform TEXT,
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  arrival_offset_min INTEGER NOT NULL DEFAULT 0,
  departure_offset_min INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (line_id, stop_order)
);
GRANT SELECT ON public.line_stops TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.line_stops TO authenticated;
GRANT ALL ON public.line_stops TO service_role;
ALTER TABLE public.line_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read stops" ON public.line_stops FOR SELECT USING (true);
CREATE POLICY "Staff manage stops" ON public.line_stops FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- ============ line_schedules ============
CREATE TABLE public.line_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  line_id UUID NOT NULL REFERENCES public.bus_lines(id) ON DELETE CASCADE,
  departure_time TIME NOT NULL,
  weekdays SMALLINT NOT NULL DEFAULT 127, -- bitmask Mo=1,Di=2,...,So=64
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  base_price NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.line_schedules TO authenticated;
GRANT ALL ON public.line_schedules TO service_role;
ALTER TABLE public.line_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage schedules" ON public.line_schedules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- ============ line_trips ============
CREATE TABLE public.line_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_number TEXT NOT NULL UNIQUE,
  line_id UUID NOT NULL REFERENCES public.bus_lines(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.line_schedules(id) ON DELETE SET NULL,
  service_date DATE NOT NULL,
  planned_departure TIMESTAMPTZ NOT NULL,
  planned_arrival TIMESTAMPTZ NOT NULL,
  actual_departure TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','boarding','in_transit','arrived','cancelled','delayed')),
  bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_line_trips_date ON public.line_trips(service_date);
CREATE INDEX idx_line_trips_line ON public.line_trips(line_id);
GRANT SELECT ON public.line_trips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.line_trips TO authenticated;
GRANT ALL ON public.line_trips TO service_role;
ALTER TABLE public.line_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read trips" ON public.line_trips FOR SELECT USING (true);
CREATE POLICY "Staff manage trips" ON public.line_trips FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE POLICY "Driver updates own trip" ON public.line_trips FOR UPDATE TO authenticated
  USING (driver_id = auth.uid()) WITH CHECK (driver_id = auth.uid());

-- ============ line_trip_stops ============
CREATE TABLE public.line_trip_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.line_trips(id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES public.line_stops(id) ON DELETE CASCADE,
  planned_arrival TIMESTAMPTZ,
  planned_departure TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  actual_departure TIMESTAMPTZ,
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','arrived','departed','skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, stop_id)
);
GRANT SELECT ON public.line_trip_stops TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.line_trip_stops TO authenticated;
GRANT ALL ON public.line_trip_stops TO service_role;
ALTER TABLE public.line_trip_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read trip stops" ON public.line_trip_stops FOR SELECT USING (true);
CREATE POLICY "Staff manage trip stops" ON public.line_trip_stops FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE POLICY "Driver updates own trip stops" ON public.line_trip_stops FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.line_trips lt WHERE lt.id = trip_id AND lt.driver_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.line_trips lt WHERE lt.id = trip_id AND lt.driver_id = auth.uid()));

-- updated_at triggers
CREATE TRIGGER trg_bus_lines_updated BEFORE UPDATE ON public.bus_lines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_line_stops_updated BEFORE UPDATE ON public.line_stops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_line_schedules_updated BEFORE UPDATE ON public.line_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_line_trips_updated BEFORE UPDATE ON public.line_trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_line_trip_stops_updated BEFORE UPDATE ON public.line_trip_stops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trip number generator
CREATE OR REPLACE FUNCTION public.generate_line_trip_number()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n TEXT;
BEGIN
  LOOP
    n := LPAD(FLOOR(RANDOM() * 9000000000 + 1000000000)::TEXT, 10, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.line_trips WHERE trip_number = n);
  END LOOP;
  RETURN n;
END $$;

-- Demo seed: 3 lines
INSERT INTO public.bus_lines (code, name, description, color, line_type) VALUES
  ('X810','Hannover → Amsterdam','Tägliche Direktverbindung','#00CC36','longdistance'),
  ('X220','Hannover → Berlin','Mehrfach täglich','#1e88e5','line'),
  ('X505','Hannover → Prag','Wochenend-Express','#e94560','longdistance');

-- Stops for X810 (Hannover→Amsterdam)
INSERT INTO public.line_stops (line_id, stop_order, name, city, country, platform, lat, lng, arrival_offset_min, departure_offset_min)
SELECT id, 1, 'Hannover ZOB', 'Hannover', 'DE', 'A', 52.3759, 9.7320, 0, 0 FROM public.bus_lines WHERE code='X810';
INSERT INTO public.line_stops (line_id, stop_order, name, city, country, platform, lat, lng, arrival_offset_min, departure_offset_min)
SELECT id, 2, 'Osnabrück Hbf', 'Osnabrück', 'DE', 'B', 52.2719, 8.0608, 75, 80 FROM public.bus_lines WHERE code='X810';
INSERT INTO public.line_stops (line_id, stop_order, name, city, country, platform, lat, lng, arrival_offset_min, departure_offset_min)
SELECT id, 3, 'Enschede Bus Station', 'Enschede', 'NL', 'C', 52.2215, 6.8937, 150, 155 FROM public.bus_lines WHERE code='X810';
INSERT INTO public.line_stops (line_id, stop_order, name, city, country, platform, lat, lng, arrival_offset_min, departure_offset_min)
SELECT id, 4, 'Amsterdam Sloterdijk', 'Amsterdam', 'NL', 'H', 52.3892, 4.8369, 285, 285 FROM public.bus_lines WHERE code='X810';

-- Stops for X220 (Hannover→Berlin)
INSERT INTO public.line_stops (line_id, stop_order, name, city, country, platform, lat, lng, arrival_offset_min, departure_offset_min)
SELECT id, 1, 'Hannover ZOB', 'Hannover', 'DE', 'A', 52.3759, 9.7320, 0, 0 FROM public.bus_lines WHERE code='X220';
INSERT INTO public.line_stops (line_id, stop_order, name, city, country, platform, lat, lng, arrival_offset_min, departure_offset_min)
SELECT id, 2, 'Braunschweig Hbf', 'Braunschweig', 'DE', 'B', 52.2528, 10.5408, 60, 65 FROM public.bus_lines WHERE code='X220';
INSERT INTO public.line_stops (line_id, stop_order, name, city, country, platform, lat, lng, arrival_offset_min, departure_offset_min)
SELECT id, 3, 'Magdeburg ZOB', 'Magdeburg', 'DE', 'C', 52.1300, 11.6263, 130, 135 FROM public.bus_lines WHERE code='X220';
INSERT INTO public.line_stops (line_id, stop_order, name, city, country, platform, lat, lng, arrival_offset_min, departure_offset_min)
SELECT id, 4, 'Berlin ZOB', 'Berlin', 'DE', 'D', 52.5054, 13.2837, 230, 230 FROM public.bus_lines WHERE code='X220';

-- Stops for X505 (Hannover→Prag)
INSERT INTO public.line_stops (line_id, stop_order, name, city, country, platform, lat, lng, arrival_offset_min, departure_offset_min)
SELECT id, 1, 'Hannover ZOB', 'Hannover', 'DE', 'A', 52.3759, 9.7320, 0, 0 FROM public.bus_lines WHERE code='X505';
INSERT INTO public.line_stops (line_id, stop_order, name, city, country, platform, lat, lng, arrival_offset_min, departure_offset_min)
SELECT id, 2, 'Leipzig Hbf', 'Leipzig', 'DE', 'B', 51.3441, 12.3811, 240, 250 FROM public.bus_lines WHERE code='X505';
INSERT INTO public.line_stops (line_id, stop_order, name, city, country, platform, lat, lng, arrival_offset_min, departure_offset_min)
SELECT id, 3, 'Dresden Hbf', 'Dresden', 'DE', 'C', 51.0407, 13.7322, 350, 360 FROM public.bus_lines WHERE code='X505';
INSERT INTO public.line_stops (line_id, stop_order, name, city, country, platform, lat, lng, arrival_offset_min, departure_offset_min)
SELECT id, 4, 'Prag ÚAN Florenc', 'Prag', 'CZ', 'D', 50.0894, 14.4406, 530, 530 FROM public.bus_lines WHERE code='X505';

-- Schedules
INSERT INTO public.line_schedules (line_id, departure_time, weekdays, base_price)
SELECT id, '08:00'::time, 127, 49.00 FROM public.bus_lines WHERE code='X810';
INSERT INTO public.line_schedules (line_id, departure_time, weekdays, base_price)
SELECT id, '14:30'::time, 127, 49.00 FROM public.bus_lines WHERE code='X810';
INSERT INTO public.line_schedules (line_id, departure_time, weekdays, base_price)
SELECT id, '07:00'::time, 127, 19.00 FROM public.bus_lines WHERE code='X220';
INSERT INTO public.line_schedules (line_id, departure_time, weekdays, base_price)
SELECT id, '21:00'::time, 80, 39.00 FROM public.bus_lines WHERE code='X505';

-- Generate today + next 7 days trips
DO $$
DECLARE
  d DATE;
  s RECORD;
  trip UUID;
  stop_rec RECORD;
  dep TIMESTAMPTZ;
  arr TIMESTAMPTZ;
  max_offset INT;
BEGIN
  FOR d IN SELECT generate_series(CURRENT_DATE, CURRENT_DATE + 7, '1 day')::DATE LOOP
    FOR s IN SELECT sc.*, l.code FROM public.line_schedules sc JOIN public.bus_lines l ON l.id=sc.line_id WHERE sc.is_active LOOP
      dep := (d::TEXT || ' ' || s.departure_time::TEXT)::TIMESTAMPTZ;
      SELECT COALESCE(MAX(arrival_offset_min), 0) INTO max_offset FROM public.line_stops WHERE line_id = s.line_id;
      arr := dep + (max_offset || ' minutes')::INTERVAL;
      INSERT INTO public.line_trips (trip_number, line_id, schedule_id, service_date, planned_departure, planned_arrival, status, bus_id, driver_id)
      VALUES (public.generate_line_trip_number(), s.line_id, s.id, d, dep, arr, 'scheduled', s.bus_id, s.driver_id)
      RETURNING id INTO trip;

      FOR stop_rec IN SELECT * FROM public.line_stops WHERE line_id = s.line_id ORDER BY stop_order LOOP
        INSERT INTO public.line_trip_stops (trip_id, stop_id, planned_arrival, planned_departure)
        VALUES (trip, stop_rec.id,
                dep + (stop_rec.arrival_offset_min || ' minutes')::INTERVAL,
                dep + (stop_rec.departure_offset_min || ' minutes')::INTERVAL);
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.line_trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.line_trip_stops;
