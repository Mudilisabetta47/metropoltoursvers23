CREATE TABLE IF NOT EXISTS public.trip_source_types (
  code text PRIMARY KEY,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.trip_source_types TO anon;
GRANT SELECT ON public.trip_source_types TO authenticated;
GRANT ALL ON public.trip_source_types TO service_role;

ALTER TABLE public.trip_source_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip source types are viewable by everyone"
  ON public.trip_source_types FOR SELECT USING (true);

CREATE POLICY "Admins manage trip source types"
  ON public.trip_source_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.trip_source_types (code, label) VALUES
  ('line_trip', 'Linienfahrt'),
  ('package_tour_date', 'Pauschalreise'),
  ('charter_trip', 'Individuelle Busreise'),
  ('private_trip', 'Private Fahrt'),
  ('group_trip', 'Gruppenfahrt'),
  ('special_trip', 'Sonderfahrt'),
  ('maiden_trip', 'Jungfernfahrt')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.trip_source_types (code, label)
SELECT DISTINCT source_type, source_type FROM public.trip_registry
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.trip_registry DROP CONSTRAINT IF EXISTS trip_registry_source_type_check;

ALTER TABLE public.trip_registry
  ADD CONSTRAINT trip_registry_source_type_fkey
  FOREIGN KEY (source_type) REFERENCES public.trip_source_types(code)
  ON UPDATE CASCADE;

ALTER TABLE public.trip_registry ADD COLUMN IF NOT EXISTS trip_category text;

CREATE OR REPLACE FUNCTION public.sync_trip_to_registry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_origin text;
  v_destination text;
  v_departure timestamptz;
  v_category text;
  v_source_type text;
BEGIN
  v_category := COALESCE(NEW.trip_category, 'line');
  IF v_category = 'line' THEN
    RETURN NEW;
  END IF;

  v_source_type := CASE v_category
    WHEN 'charter' THEN 'charter_trip'
    WHEN 'private' THEN 'private_trip'
    WHEN 'group' THEN 'group_trip'
    WHEN 'special' THEN 'special_trip'
    WHEN 'maiden' THEN 'maiden_trip'
    WHEN 'package' THEN 'package_tour_date'
    ELSE v_category || '_trip'
  END;

  INSERT INTO public.trip_source_types (code, label)
  VALUES (v_source_type, v_source_type)
  ON CONFLICT (code) DO NOTHING;

  SELECT s.name INTO v_origin FROM public.stops s
    WHERE s.route_id = NEW.route_id ORDER BY s.stop_order ASC LIMIT 1;
  SELECT s.name INTO v_destination FROM public.stops s
    WHERE s.route_id = NEW.route_id ORDER BY s.stop_order DESC LIMIT 1;

  v_departure := (NEW.departure_date::text || ' ' || NEW.departure_time::text)::timestamptz;

  INSERT INTO public.trip_registry (trip_uid, source_type, source_id, departure_at, origin, destination, status, trip_category)
  VALUES (
    public.generate_trip_uid(),
    v_source_type,
    NEW.id,
    v_departure,
    COALESCE(v_origin, NEW.title),
    COALESCE(v_destination, NEW.title),
    COALESCE(NEW.status, 'planned'),
    v_category
  )
  ON CONFLICT (source_type, source_id) DO UPDATE
    SET departure_at = EXCLUDED.departure_at,
        origin = EXCLUDED.origin,
        destination = EXCLUDED.destination,
        status = EXCLUDED.status,
        trip_category = EXCLUDED.trip_category,
        updated_at = now();

  RETURN NEW;
END;
$$;