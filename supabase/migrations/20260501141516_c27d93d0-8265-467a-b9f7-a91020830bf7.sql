
-- ============== WARTELISTE ==============
CREATE TABLE IF NOT EXISTS public.waitlist_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_date_id UUID,
  trip_id UUID,
  user_id UUID,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  pax INT NOT NULL DEFAULT 1,
  position INT,
  notify_email BOOLEAN NOT NULL DEFAULT true,
  notify_push BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'waiting',
  notified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_waitlist_tour ON public.waitlist_entries(tour_date_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_trip ON public.waitlist_entries(trip_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_user ON public.waitlist_entries(user_id);
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own waitlist" ON public.waitlist_entries FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office') OR public.has_role(auth.uid(),'agent'));
CREATE POLICY "Anyone can join waitlist" ON public.waitlist_entries FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Office manage waitlist" ON public.waitlist_entries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE POLICY "Office delete waitlist" ON public.waitlist_entries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- ============== BUCHUNGS-TIMELINE ==============
CREATE TABLE IF NOT EXISTS public.booking_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  actor_id UUID,
  actor_type TEXT NOT NULL DEFAULT 'system',
  event_type TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_booking_changes_booking ON public.booking_changes(booking_id, created_at DESC);
ALTER TABLE public.booking_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff see booking changes" ON public.booking_changes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office') OR public.has_role(auth.uid(),'agent'));
CREATE POLICY "System write booking changes" ON public.booking_changes FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============== STORNO-POLICY ==============
CREATE TABLE IF NOT EXISTS public.cancellation_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  applies_to TEXT NOT NULL DEFAULT 'all',
  tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cancellation_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read policies" ON public.cancellation_policies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage policies" ON public.cancellation_policies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.cancellation_policies (name, applies_to, tiers, is_default) VALUES
  ('Standard-Stornobedingungen', 'all',
   '[{"days_before":30,"refund_percent":90,"label":"Mehr als 30 Tage vor Abreise"},
     {"days_before":14,"refund_percent":50,"label":"14–30 Tage vor Abreise"},
     {"days_before":7,"refund_percent":25,"label":"7–14 Tage vor Abreise"},
     {"days_before":0,"refund_percent":0,"label":"Weniger als 7 Tage / No-Show"}]'::jsonb,
   true)
ON CONFLICT DO NOTHING;

-- ============== UMBUCHUNGEN ==============
CREATE TABLE IF NOT EXISTS public.rebooking_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID,
  current_trip_id UUID NOT NULL,
  new_trip_id UUID NOT NULL,
  new_seat_id UUID,
  price_difference NUMERIC(10,2) NOT NULL DEFAULT 0,
  rebooking_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_intent_id TEXT,
  notes TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rebooking_booking ON public.rebooking_requests(booking_id);
ALTER TABLE public.rebooking_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own rebooks" ON public.rebooking_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office') OR public.has_role(auth.uid(),'agent'));
CREATE POLICY "Users create rebooks" ON public.rebooking_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE POLICY "Office update rebooks" ON public.rebooking_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- ============== WALLET-PÄSSE ==============
CREATE TABLE IF NOT EXISTS public.wallet_passes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  pass_type TEXT NOT NULL,
  serial_number TEXT NOT NULL UNIQUE,
  auth_token TEXT NOT NULL,
  pass_url TEXT,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  update_tag TEXT,
  is_voided BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_booking ON public.wallet_passes(booking_id);
ALTER TABLE public.wallet_passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own passes" ON public.wallet_passes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id = auth.uid())
      OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE POLICY "System manage passes" ON public.wallet_passes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- ============== LIVE-BUS-POSITIONEN ==============
CREATE TABLE IF NOT EXISTS public.bus_positions_live (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL UNIQUE,
  bus_id UUID,
  driver_id UUID,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed_kmh DOUBLE PRECISION,
  next_stop_id UUID,
  eta_next_stop TIMESTAMPTZ,
  delay_minutes INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'on_route',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bus_pos_trip ON public.bus_positions_live(trip_id);
ALTER TABLE public.bus_positions_live ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read bus positions" ON public.bus_positions_live FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Driver/Office update positions" ON public.bus_positions_live FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'driver') OR public.has_role(auth.uid(),'office') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'driver') OR public.has_role(auth.uid(),'office') OR public.has_role(auth.uid(),'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_positions_live;

-- ============== PUSH-SUBSCRIPTIONS ==============
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  device_info TEXT,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_user ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_booking ON public.push_subscriptions(booking_id);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own push subs" ON public.push_subscriptions FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Anon push insert by booking" ON public.push_subscriptions FOR INSERT TO anon
  WITH CHECK (booking_id IS NOT NULL);

-- ============== KUNDEN-REVIEWS ==============
CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id UUID,
  trip_id UUID,
  tour_date_id UUID,
  stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  driver_rating INT CHECK (driver_rating BETWEEN 1 AND 5),
  comfort_rating INT CHECK (comfort_rating BETWEEN 1 AND 5),
  cleanliness_rating INT CHECK (cleanliness_rating BETWEEN 1 AND 5),
  punctuality_rating INT CHECK (punctuality_rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  reply_text TEXT,
  reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_trip ON public.customer_reviews(trip_id);
CREATE INDEX IF NOT EXISTS idx_reviews_published ON public.customer_reviews(is_published, created_at DESC);
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published reviews" ON public.customer_reviews FOR SELECT TO anon, authenticated
  USING (is_published = true OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE POLICY "Users create own reviews" ON public.customer_reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users edit own unpublished reviews" ON public.customer_reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND is_published = false)
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Office moderate reviews" ON public.customer_reviews FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- Storage-Bucket für Review-Fotos
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read review photos" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'review-photos');
CREATE POLICY "Auth upload review photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'review-photos');
CREATE POLICY "Owner delete review photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'review-photos' AND owner = auth.uid());

-- ============== HELPER-FUNKTIONEN ==============

-- Storno-Refund-Berechnung
CREATE OR REPLACE FUNCTION public.calculate_refund(
  p_booking_id UUID,
  p_departure_date TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE(refund_percent INT, refund_amount NUMERIC, days_before INT, tier_label TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_price NUMERIC;
  v_dep TIMESTAMPTZ;
  v_days INT;
  v_tiers JSONB;
  v_tier JSONB;
  v_chosen JSONB;
BEGIN
  SELECT b.price_paid INTO v_price FROM public.bookings b WHERE b.id = p_booking_id;
  IF v_price IS NULL THEN RETURN; END IF;

  IF p_departure_date IS NOT NULL THEN
    v_dep := p_departure_date;
  ELSE
    SELECT t.departure_date INTO v_dep FROM public.bookings b
      JOIN public.trips t ON t.id = b.trip_id WHERE b.id = p_booking_id;
  END IF;

  v_days := GREATEST(0, EXTRACT(DAY FROM (v_dep - now()))::INT);

  SELECT cp.tiers INTO v_tiers FROM public.cancellation_policies cp
    WHERE cp.is_active = true AND cp.is_default = true LIMIT 1;
  IF v_tiers IS NULL THEN v_tiers := '[]'::jsonb; END IF;

  v_chosen := NULL;
  FOR v_tier IN SELECT * FROM jsonb_array_elements(v_tiers) LOOP
    IF v_days >= (v_tier->>'days_before')::INT THEN
      IF v_chosen IS NULL OR (v_tier->>'days_before')::INT > (v_chosen->>'days_before')::INT THEN
        v_chosen := v_tier;
      END IF;
    END IF;
  END LOOP;

  IF v_chosen IS NULL THEN
    refund_percent := 0;
    tier_label := 'Keine Erstattung';
  ELSE
    refund_percent := (v_chosen->>'refund_percent')::INT;
    tier_label := v_chosen->>'label';
  END IF;
  refund_amount := ROUND(v_price * refund_percent / 100.0, 2);
  days_before := v_days;
  RETURN NEXT;
END; $$;

-- Wartelisten-Position automatisch vergeben
CREATE OR REPLACE FUNCTION public.set_waitlist_position()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.position IS NULL THEN
    SELECT COALESCE(MAX(position), 0) + 1 INTO NEW.position
    FROM public.waitlist_entries
    WHERE COALESCE(tour_date_id, gen_random_uuid()) = COALESCE(NEW.tour_date_id, gen_random_uuid())
       OR COALESCE(trip_id, gen_random_uuid()) = COALESCE(NEW.trip_id, gen_random_uuid());
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_waitlist_position ON public.waitlist_entries;
CREATE TRIGGER trg_waitlist_position BEFORE INSERT ON public.waitlist_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_waitlist_position();

-- Booking-Change-Logger
CREATE OR REPLACE FUNCTION public.log_booking_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.booking_changes (booking_id, actor_id, actor_type, event_type, field_name, old_value, new_value, description)
      VALUES (NEW.id, auth.uid(), 'staff', 'status_change', 'status', OLD.status::text, NEW.status::text,
              'Status: ' || OLD.status::text || ' → ' || NEW.status::text);
    END IF;
    IF NEW.trip_id IS DISTINCT FROM OLD.trip_id THEN
      INSERT INTO public.booking_changes (booking_id, actor_id, actor_type, event_type, field_name, old_value, new_value, description)
      VALUES (NEW.id, auth.uid(), 'staff', 'rebooking', 'trip_id', OLD.trip_id::text, NEW.trip_id::text, 'Reise umgebucht');
    END IF;
    IF NEW.seat_id IS DISTINCT FROM OLD.seat_id THEN
      INSERT INTO public.booking_changes (booking_id, actor_id, actor_type, event_type, field_name, old_value, new_value, description)
      VALUES (NEW.id, auth.uid(), 'staff', 'seat_change', 'seat_id', OLD.seat_id::text, NEW.seat_id::text, 'Sitzplatz geändert');
    END IF;
    IF NEW.price_paid IS DISTINCT FROM OLD.price_paid THEN
      INSERT INTO public.booking_changes (booking_id, actor_id, actor_type, event_type, field_name, old_value, new_value, description)
      VALUES (NEW.id, auth.uid(), 'staff', 'price_change', 'price_paid', OLD.price_paid::text, NEW.price_paid::text, 'Preis angepasst');
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.booking_changes (booking_id, actor_id, actor_type, event_type, description)
    VALUES (NEW.id, auth.uid(), CASE WHEN NEW.booked_by_agent_id IS NOT NULL THEN 'agent' ELSE 'customer' END,
            'created', 'Buchung erstellt: ' || NEW.ticket_number);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_log_booking_change ON public.bookings;
CREATE TRIGGER trg_log_booking_change AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_booking_change();

-- Kunden-360-View (Live-Kennzahlen)
CREATE OR REPLACE VIEW public.customer_360 AS
SELECT
  p.user_id,
  p.email,
  p.first_name,
  p.last_name,
  p.phone,
  p.created_at AS member_since,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status::text IN ('confirmed','completed')) AS total_bookings,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status::text = 'cancelled') AS cancelled_bookings,
  COALESCE(SUM(b.price_paid) FILTER (WHERE b.status::text IN ('confirmed','completed')), 0) AS lifetime_value,
  MAX(b.created_at) AS last_booking_at,
  COUNT(DISTINCT cr.id) AS review_count,
  AVG(cr.stars) AS avg_review_stars
FROM public.profiles p
LEFT JOIN public.bookings b ON b.user_id = p.user_id
LEFT JOIN public.customer_reviews cr ON cr.user_id = p.user_id
GROUP BY p.user_id, p.email, p.first_name, p.last_name, p.phone, p.created_at;

GRANT SELECT ON public.customer_360 TO authenticated;
