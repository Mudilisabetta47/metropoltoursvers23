-- 1. Routes: Fahrtart
ALTER TABLE public.routes
  ADD COLUMN IF NOT EXISTS trip_category text NOT NULL DEFAULT 'line',
  ADD COLUMN IF NOT EXISTS is_charter boolean NOT NULL DEFAULT false;

-- 2. Trips: vollwertige Fahrtdaten
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS trip_category text NOT NULL DEFAULT 'line',
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS guide_user_id uuid,
  ADD COLUMN IF NOT EXISTS driver_user_id uuid,
  ADD COLUMN IF NOT EXISTS return_trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'outbound',
  ADD COLUMN IF NOT EXISTS seat_capacity integer,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_trips_category ON public.trips(trip_category);

-- 3. Fahrplan-Halte pro Fahrt
CREATE TABLE IF NOT EXISTS public.trip_schedule_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  stop_id uuid REFERENCES public.stops(id) ON DELETE SET NULL,
  label text NOT NULL,
  location text,
  stop_type text NOT NULL DEFAULT 'stop',
  planned_arrival timestamptz,
  planned_departure timestamptz,
  actual_arrival timestamptz,
  actual_departure timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.trip_schedule_stops TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_schedule_stops TO authenticated;
GRANT ALL ON public.trip_schedule_stops TO service_role;

ALTER TABLE public.trip_schedule_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schedule stops are viewable by everyone"
  ON public.trip_schedule_stops FOR SELECT USING (true);

CREATE POLICY "Staff manage schedule stops"
  ON public.trip_schedule_stops FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

CREATE POLICY "Drivers update actual times of assigned trips"
  ON public.trip_schedule_stops FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'driver') AND EXISTS (
      SELECT 1 FROM public.employee_shifts s
      WHERE s.assigned_trip_id = trip_schedule_stops.trip_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'driver') AND EXISTS (
      SELECT 1 FROM public.employee_shifts s
      WHERE s.assigned_trip_id = trip_schedule_stops.trip_id AND s.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_trip_schedule_stops_trip ON public.trip_schedule_stops(trip_id, sort_order);

CREATE TRIGGER update_trip_schedule_stops_updated_at
  BEFORE UPDATE ON public.trip_schedule_stops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Fahrer dürfen zugewiesene Fahrten starten/beenden
CREATE POLICY "Drivers update assigned trips"
  ON public.trips FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'driver') AND (
      trips.driver_user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.employee_shifts s
        WHERE s.assigned_trip_id = trips.id AND s.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'driver') AND (
      trips.driver_user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.employee_shifts s
        WHERE s.assigned_trip_id = trips.id AND s.user_id = auth.uid()
      )
    )
  );

-- 5. Registry-Sync für individuelle Fahrten
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
BEGIN
  IF COALESCE(NEW.trip_category, 'line') = 'line' THEN
    RETURN NEW;
  END IF;

  SELECT s.name INTO v_origin FROM public.stops s
    WHERE s.route_id = NEW.route_id ORDER BY s.stop_order ASC LIMIT 1;
  SELECT s.name INTO v_destination FROM public.stops s
    WHERE s.route_id = NEW.route_id ORDER BY s.stop_order DESC LIMIT 1;

  v_departure := (NEW.departure_date::text || ' ' || NEW.departure_time::text)::timestamptz;

  INSERT INTO public.trip_registry (trip_uid, source_type, source_id, departure_at, origin, destination, status)
  VALUES (
    public.generate_trip_uid(),
    'charter_trip',
    NEW.id,
    v_departure,
    COALESCE(v_origin, NEW.title),
    COALESCE(v_destination, NEW.title),
    COALESCE(NEW.status, 'planned')
  )
  ON CONFLICT (source_type, source_id) DO UPDATE
    SET departure_at = EXCLUDED.departure_at,
        origin = EXCLUDED.origin,
        destination = EXCLUDED.destination,
        status = EXCLUDED.status,
        updated_at = now();

  RETURN NEW;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trip_registry_source ON public.trip_registry(source_type, source_id);

DROP TRIGGER IF EXISTS trg_sync_trip_to_registry ON public.trips;
CREATE TRIGGER trg_sync_trip_to_registry
  AFTER INSERT OR UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.sync_trip_to_registry();

-- 6. Fahrgäste (einzeln oder gesammelt) für eine Fahrt anlegen
CREATE OR REPLACE FUNCTION public.create_charter_passengers(
  p_trip_id uuid,
  p_passengers jsonb
)
RETURNS TABLE(booking_id uuid, ticket_number text, booking_number text, seat_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip public.trips%ROWTYPE;
  v_origin uuid;
  v_destination uuid;
  v_p jsonb;
  v_seat uuid;
  v_seat_number text;
  v_booking public.bookings%ROWTYPE;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id;
  IF v_trip.id IS NULL THEN
    RAISE EXCEPTION 'trip not found';
  END IF;

  SELECT s.id INTO v_origin FROM public.stops s
    WHERE s.route_id = v_trip.route_id ORDER BY s.stop_order ASC LIMIT 1;
  SELECT s.id INTO v_destination FROM public.stops s
    WHERE s.route_id = v_trip.route_id ORDER BY s.stop_order DESC LIMIT 1;

  IF v_origin IS NULL OR v_destination IS NULL THEN
    RAISE EXCEPTION 'route has no stops';
  END IF;

  FOR v_p IN SELECT * FROM jsonb_array_elements(p_passengers)
  LOOP
    v_seat := NULLIF(v_p->>'seat_id', '')::uuid;

    IF v_seat IS NULL THEN
      SELECT se.id INTO v_seat
      FROM public.seats se
      WHERE se.bus_id = v_trip.bus_id
        AND se.is_active
        AND se.seat_type <> 'crew'
        AND NOT EXISTS (
          SELECT 1 FROM public.bookings b
          WHERE b.trip_id = p_trip_id AND b.seat_id = se.id
            AND b.status <> 'cancelled'
        )
      ORDER BY se.row_number, se.column_number
      LIMIT 1;
    END IF;

    IF v_seat IS NULL THEN
      RAISE EXCEPTION 'no free seat available';
    END IF;

    INSERT INTO public.bookings (
      trip_id, origin_stop_id, destination_stop_id, seat_id,
      passenger_first_name, passenger_last_name, passenger_email, passenger_phone,
      price_paid, status, payment_status, payment_method, booked_by_agent_id
    ) VALUES (
      p_trip_id, v_origin, v_destination, v_seat,
      COALESCE(v_p->>'first_name', 'Fahrgast'),
      COALESCE(v_p->>'last_name', ''),
      COALESCE(NULLIF(v_p->>'email', ''), 'no-reply@metours.de'),
      NULLIF(v_p->>'phone', ''),
      COALESCE((v_p->>'price')::numeric, 0),
      'confirmed',
      COALESCE(NULLIF(v_p->>'payment_status', ''), 'paid'),
      COALESCE(NULLIF(v_p->>'payment_method', ''), 'invoice'),
      auth.uid()
    )
    RETURNING * INTO v_booking;

    INSERT INTO public.tickets (booking_id, trip_id, qr_payload, status)
    VALUES (v_booking.id, p_trip_id, v_booking.ticket_number, 'valid');

    SELECT se.seat_number INTO v_seat_number FROM public.seats se WHERE se.id = v_seat;

    booking_id := v_booking.id;
    ticket_number := v_booking.ticket_number;
    booking_number := v_booking.booking_number;
    seat_number := v_seat_number;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.create_charter_passengers(uuid, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_charter_passengers(uuid, jsonb) TO authenticated;