
-- 1. Haltestellen je Fahrauftrag
CREATE TABLE public.dispatch_order_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.dispatch_orders(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  address text,
  lat numeric,
  lng numeric,
  stop_type text NOT NULL DEFAULT 'stop',
  planned_arrival timestamptz,
  planned_departure timestamptz,
  actual_arrival timestamptz,
  actual_departure timestamptz,
  dwell_minutes integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dos_order ON public.dispatch_order_stops(order_id, sort_order);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispatch_order_stops TO authenticated;
GRANT ALL ON public.dispatch_order_stops TO service_role;
ALTER TABLE public.dispatch_order_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage order stops" ON public.dispatch_order_stops FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

CREATE POLICY "Assigned driver reads order stops" ON public.dispatch_order_stops FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.dispatch_orders o WHERE o.id = order_id AND o.driver_user_id = auth.uid()));

CREATE POLICY "Assigned driver updates order stops" ON public.dispatch_order_stops FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.dispatch_orders o WHERE o.id = order_id AND o.driver_user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.dispatch_orders o WHERE o.id = order_id AND o.driver_user_id = auth.uid()));

CREATE TRIGGER trg_dos_updated BEFORE UPDATE ON public.dispatch_order_stops
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Mautstellen / Mautabschnitte
CREATE TABLE public.dispatch_order_tolls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.dispatch_orders(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  country_code text,
  lat numeric,
  lng numeric,
  distance_from_start_km numeric,
  expected_cost numeric,
  currency text,
  requires_transponder boolean,
  data_source text NOT NULL DEFAULT 'mapbox_directions',
  is_estimated boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dot_order ON public.dispatch_order_tolls(order_id, sort_order);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispatch_order_tolls TO authenticated;
GRANT ALL ON public.dispatch_order_tolls TO service_role;
ALTER TABLE public.dispatch_order_tolls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage order tolls" ON public.dispatch_order_tolls FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

CREATE POLICY "Assigned driver reads tolls" ON public.dispatch_order_tolls FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.dispatch_orders o WHERE o.id = order_id AND o.driver_user_id = auth.uid()));

CREATE POLICY "Assigned driver writes tolls" ON public.dispatch_order_tolls FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.dispatch_orders o WHERE o.id = order_id AND o.driver_user_id = auth.uid()));

CREATE POLICY "Assigned driver clears tolls" ON public.dispatch_order_tolls FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.dispatch_orders o WHERE o.id = order_id AND o.driver_user_id = auth.uid()));

-- 3. Fahrer-Ereignisse
CREATE TABLE public.driver_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_user_id uuid NOT NULL,
  order_id uuid REFERENCES public.dispatch_orders(id) ON DELETE SET NULL,
  stop_id uuid REFERENCES public.dispatch_order_stops(id) ON DELETE SET NULL,
  trip_uid text,
  event_type text NOT NULL,
  delay_minutes integer,
  reason text,
  note text,
  lat numeric,
  lng numeric,
  speed_kmh numeric,
  is_test boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_driver_events_driver ON public.driver_events(driver_user_id, created_at DESC);
CREATE INDEX idx_driver_events_order ON public.driver_events(order_id, created_at DESC);
GRANT SELECT, INSERT ON public.driver_events TO authenticated;
GRANT ALL ON public.driver_events TO service_role;
ALTER TABLE public.driver_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver inserts own events" ON public.driver_events FOR INSERT TO authenticated
WITH CHECK (driver_user_id = auth.uid());

CREATE POLICY "Driver reads own events" ON public.driver_events FOR SELECT TO authenticated
USING (driver_user_id = auth.uid());

CREATE POLICY "Staff reads driver events" ON public.driver_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- 4. Fahrauftrag erweitern
ALTER TABLE public.dispatch_orders
  ADD COLUMN IF NOT EXISTS delay_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delay_reason text,
  ADD COLUMN IF NOT EXISTS current_stop_id uuid,
  ADD COLUMN IF NOT EXISTS second_driver_user_id uuid,
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS toll_data_available boolean;

-- 5. Lenkzeit-Journal erweitern
ALTER TABLE public.driver_duty_log
  ADD COLUMN IF NOT EXISTS last_break_end timestamptz,
  ADD COLUMN IF NOT EXISTS driving_since timestamptz,
  ADD COLUMN IF NOT EXISTS rest_start timestamptz,
  ADD COLUMN IF NOT EXISTS multi_driver boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

-- 6. Sicherheit: Zahlungsfelder beim Anlegen einer Buchung erzwingen
CREATE OR REPLACE FUNCTION public.enforce_booking_insert_payment_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_price numeric;
BEGIN
  IF auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'office')
     OR public.has_role(auth.uid(), 'agent') THEN
    RETURN NEW;
  END IF;

  NEW.payment_status := 'pending';
  NEW.payment_reference := NULL;
  NEW.stripe_session_id := NULL;
  NEW.paypal_order_id := NULL;
  NEW.paypal_capture_id := NULL;
  NEW.paid_at := NULL;
  NEW.status := 'pending';
  NEW.is_test := false;
  NEW.booked_by_agent_id := NULL;

  IF NEW.trip_id IS NOT NULL AND NEW.origin_stop_id IS NOT NULL AND NEW.destination_stop_id IS NOT NULL THEN
    base_price := public.calculate_trip_price(NEW.trip_id, NEW.origin_stop_id, NEW.destination_stop_id);
    IF base_price IS NOT NULL AND (NEW.price_paid IS NULL OR NEW.price_paid < base_price) THEN
      NEW.price_paid := base_price;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_insert_guard ON public.bookings;
CREATE TRIGGER trg_bookings_insert_guard BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_insert_payment_fields();
