-- =============================================
-- METROPOL TOURS - COMPLETE DATABASE SCHEMA
-- =============================================

-- 1. ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('customer', 'agent', 'admin');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.seat_status AS ENUM ('available', 'reserved', 'booked');

-- 2. ROUTES TABLE (Bus lines)
-- =============================================
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. STOPS TABLE (Stops on routes with order)
-- =============================================
CREATE TABLE public.stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  stop_order INTEGER NOT NULL,
  price_from_start DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(route_id, stop_order)
);

-- 4. BUSES TABLE
-- =============================================
CREATE TABLE public.buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  license_plate TEXT UNIQUE NOT NULL,
  total_seats INTEGER NOT NULL DEFAULT 50,
  layout JSONB NOT NULL DEFAULT '{"rows": 12, "seatsPerRow": 4, "aisle": 2}',
  amenities TEXT[] DEFAULT ARRAY['wifi', 'power', 'wc'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. SEATS TABLE (Physical seats in buses)
-- =============================================
CREATE TABLE public.seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  column_number INTEGER NOT NULL,
  seat_type TEXT NOT NULL DEFAULT 'standard',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bus_id, seat_number)
);

-- 6. TRIPS TABLE (Specific departures)
-- =============================================
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(route_id, bus_id, departure_date, departure_time)
);

-- 7. PROFILES TABLE (User profiles)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. USER_ROLES TABLE (RBAC)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 9. BOOKINGS TABLE (Main booking records)
-- =============================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  origin_stop_id UUID NOT NULL REFERENCES public.stops(id),
  destination_stop_id UUID NOT NULL REFERENCES public.stops(id),
  seat_id UUID NOT NULL REFERENCES public.seats(id),
  passenger_first_name TEXT NOT NULL,
  passenger_last_name TEXT NOT NULL,
  passenger_email TEXT NOT NULL,
  passenger_phone TEXT,
  price_paid DECIMAL(10,2) NOT NULL,
  status booking_status NOT NULL DEFAULT 'confirmed',
  booked_by_agent_id UUID REFERENCES auth.users(id),
  extras JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. SEAT_HOLDS TABLE (Temporary reservations)
-- =============================================
CREATE TABLE public.seat_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES public.seats(id) ON DELETE CASCADE,
  origin_stop_id UUID NOT NULL REFERENCES public.stops(id),
  destination_stop_id UUID NOT NULL REFERENCES public.stops(id),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. PRICE_TIERS TABLE (Dynamic pricing configuration)
-- =============================================
CREATE TABLE public.price_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
  occupancy_min INTEGER NOT NULL,
  occupancy_max INTEGER NOT NULL,
  price_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. COOKIE_CONSENTS TABLE (GDPR)
-- =============================================
CREATE TABLE public.cookie_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  necessary BOOLEAN NOT NULL DEFAULT true,
  analytics BOOLEAN NOT NULL DEFAULT false,
  marketing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_stops_route ON public.stops(route_id);
CREATE INDEX idx_stops_order ON public.stops(route_id, stop_order);
CREATE INDEX idx_seats_bus ON public.seats(bus_id);
CREATE INDEX idx_trips_route ON public.trips(route_id);
CREATE INDEX idx_trips_date ON public.trips(departure_date);
CREATE INDEX idx_bookings_trip ON public.bookings(trip_id);
CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_bookings_ticket ON public.bookings(ticket_number);
CREATE INDEX idx_bookings_seat_trip ON public.bookings(trip_id, seat_id);
CREATE INDEX idx_seat_holds_trip ON public.seat_holds(trip_id);
CREATE INDEX idx_seat_holds_expires ON public.seat_holds(expires_at);
CREATE INDEX idx_seat_holds_session ON public.seat_holds(session_id);

-- =============================================
-- ENABLE RLS
-- =============================================
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECK
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Routes: Public read, admin write
CREATE POLICY "Routes are viewable by everyone" ON public.routes FOR SELECT USING (true);
CREATE POLICY "Admins can manage routes" ON public.routes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Stops: Public read
CREATE POLICY "Stops are viewable by everyone" ON public.stops FOR SELECT USING (true);
CREATE POLICY "Admins can manage stops" ON public.stops FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Buses: Public read
CREATE POLICY "Buses are viewable by everyone" ON public.buses FOR SELECT USING (true);
CREATE POLICY "Admins can manage buses" ON public.buses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seats: Public read
CREATE POLICY "Seats are viewable by everyone" ON public.seats FOR SELECT USING (true);
CREATE POLICY "Admins can manage seats" ON public.seats FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Trips: Public read
CREATE POLICY "Trips are viewable by everyone" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Admins can manage trips" ON public.trips FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Price tiers: Public read
CREATE POLICY "Price tiers are viewable by everyone" ON public.price_tiers FOR SELECT USING (true);
CREATE POLICY "Admins can manage price tiers" ON public.price_tiers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: Users can view/edit own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Agents and admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'admin'));

-- User roles: Only admins can manage
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Bookings: Users see own, agents/admins see all
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Agents can view all bookings" ON public.bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents can update bookings" ON public.bookings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'admin'));

-- Anonymous bookings read policy (for guest checkout)
CREATE POLICY "Anyone can view bookings by ticket" ON public.bookings FOR SELECT USING (true);

-- Seat holds: Session-based
CREATE POLICY "Anyone can view seat holds" ON public.seat_holds FOR SELECT USING (true);
CREATE POLICY "Anyone can create seat holds" ON public.seat_holds FOR INSERT WITH CHECK (true);
CREATE POLICY "Session owners can delete holds" ON public.seat_holds FOR DELETE USING (true);

-- Cookie consents: Session-based
CREATE POLICY "Anyone can manage cookie consents" ON public.cookie_consents FOR ALL USING (true);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  -- Assign default customer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
  year_part TEXT;
  seq_part TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  seq_part := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  new_number := 'TKT-' || year_part || '-' || seq_part;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.bookings WHERE ticket_number = new_number) LOOP
    seq_part := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    new_number := 'TKT-' || year_part || '-' || seq_part;
  END LOOP;
  
  RETURN new_number;
END;
$$;

-- Function to check segment overlap (CRITICAL for seat booking)
CREATE OR REPLACE FUNCTION public.check_seat_availability(
  p_trip_id UUID,
  p_seat_id UUID,
  p_origin_stop_order INTEGER,
  p_destination_stop_order INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_count INTEGER;
  hold_count INTEGER;
BEGIN
  -- Check for overlapping confirmed bookings
  SELECT COUNT(*) INTO booking_count
  FROM public.bookings b
  JOIN public.stops origin ON b.origin_stop_id = origin.id
  JOIN public.stops dest ON b.destination_stop_id = dest.id
  WHERE b.trip_id = p_trip_id
    AND b.seat_id = p_seat_id
    AND b.status IN ('pending', 'confirmed')
    AND NOT (dest.stop_order <= p_origin_stop_order OR origin.stop_order >= p_destination_stop_order);
  
  -- Check for overlapping active holds
  SELECT COUNT(*) INTO hold_count
  FROM public.seat_holds sh
  JOIN public.stops origin ON sh.origin_stop_id = origin.id
  JOIN public.stops dest ON sh.destination_stop_id = dest.id
  WHERE sh.trip_id = p_trip_id
    AND sh.seat_id = p_seat_id
    AND sh.expires_at > NOW()
    AND NOT (dest.stop_order <= p_origin_stop_order OR origin.stop_order >= p_destination_stop_order);
  
  RETURN (booking_count = 0 AND hold_count = 0);
END;
$$;

-- Function to calculate dynamic price
CREATE OR REPLACE FUNCTION public.calculate_trip_price(
  p_trip_id UUID,
  p_origin_stop_id UUID,
  p_destination_stop_id UUID
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_price DECIMAL(10,2);
  v_total_seats INTEGER;
  v_booked_seats INTEGER;
  v_occupancy_percent INTEGER;
  v_multiplier DECIMAL(4,2);
  v_route_id UUID;
  v_origin_price DECIMAL(10,2);
  v_dest_price DECIMAL(10,2);
BEGIN
  -- Get trip info
  SELECT t.base_price, t.route_id, b.total_seats
  INTO v_base_price, v_route_id, v_total_seats
  FROM public.trips t
  JOIN public.buses b ON t.bus_id = b.id
  WHERE t.id = p_trip_id;
  
  -- Get segment prices
  SELECT price_from_start INTO v_origin_price FROM public.stops WHERE id = p_origin_stop_id;
  SELECT price_from_start INTO v_dest_price FROM public.stops WHERE id = p_destination_stop_id;
  
  -- Calculate base segment price
  v_base_price := v_dest_price - v_origin_price;
  IF v_base_price < 10 THEN
    v_base_price := 10; -- Minimum price
  END IF;
  
  -- Count booked seats for maximum segment in route
  SELECT COUNT(DISTINCT b.seat_id) INTO v_booked_seats
  FROM public.bookings b
  WHERE b.trip_id = p_trip_id
    AND b.status IN ('pending', 'confirmed');
  
  -- Calculate occupancy
  v_occupancy_percent := COALESCE((v_booked_seats * 100) / NULLIF(v_total_seats, 0), 0);
  
  -- Get price multiplier from tiers
  SELECT COALESCE(price_multiplier, 1.00) INTO v_multiplier
  FROM public.price_tiers
  WHERE (route_id = v_route_id OR route_id IS NULL)
    AND v_occupancy_percent >= occupancy_min
    AND v_occupancy_percent <= occupancy_max
  ORDER BY route_id NULLS LAST
  LIMIT 1;
  
  IF v_multiplier IS NULL THEN
    v_multiplier := 1.00;
  END IF;
  
  RETURN ROUND(v_base_price * v_multiplier, 2);
END;
$$;

-- Function to clean expired seat holds
CREATE OR REPLACE FUNCTION public.cleanup_expired_holds()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.seat_holds
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Update triggers
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cookie_consents_updated_at BEFORE UPDATE ON public.cookie_consents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED DATA: Hamburg -> Kroatien Route
-- =============================================

-- Insert route
INSERT INTO public.routes (id, name, description, base_price, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Hamburg - Kroatien',
  'Fernbuslinie von Hamburg ZOB über Bremen und Hannover nach Kroatien',
  89.99,
  true
);

-- Insert stops
INSERT INTO public.stops (route_id, name, city, stop_order, price_from_start) VALUES
('11111111-1111-1111-1111-111111111111', 'Hamburg ZOB', 'Hamburg', 1, 0),
('11111111-1111-1111-1111-111111111111', 'Bremen Hbf', 'Bremen', 2, 15),
('11111111-1111-1111-1111-111111111111', 'Hannover ZOB', 'Hannover', 3, 35),
('11111111-1111-1111-1111-111111111111', 'Zagreb', 'Kroatien', 4, 89);

-- Insert bus
INSERT INTO public.buses (id, name, license_plate, total_seats, layout, amenities)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'METROPOL 001',
  'HH-MT-001',
  48,
  '{"rows": 12, "seatsPerRow": 4, "aisle": 2, "wcRow": 12}',
  ARRAY['wifi', 'power', 'wc', 'aircon']
);

-- Insert seats for the bus (12 rows x 4 seats = 48 seats)
INSERT INTO public.seats (bus_id, seat_number, row_number, column_number, seat_type)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  row_num || CASE 
    WHEN col = 1 THEN 'A'
    WHEN col = 2 THEN 'B'
    WHEN col = 3 THEN 'C'
    WHEN col = 4 THEN 'D'
  END,
  row_num,
  col,
  CASE WHEN row_num = 1 THEN 'premium' ELSE 'standard' END
FROM generate_series(1, 12) AS row_num,
     generate_series(1, 4) AS col;

-- Insert sample trips for the next 30 days
INSERT INTO public.trips (route_id, bus_id, departure_date, departure_time, arrival_time, base_price)
SELECT 
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  (CURRENT_DATE + (day_offset || ' days')::interval)::date,
  '08:00:00'::time,
  '22:00:00'::time,
  89.99
FROM generate_series(1, 30) AS day_offset;

-- Insert evening trips
INSERT INTO public.trips (route_id, bus_id, departure_date, departure_time, arrival_time, base_price)
SELECT 
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  (CURRENT_DATE + (day_offset || ' days')::interval)::date,
  '20:00:00'::time,
  '10:00:00'::time,
  79.99
FROM generate_series(1, 30) AS day_offset;

-- Insert price tiers
INSERT INTO public.price_tiers (route_id, occupancy_min, occupancy_max, price_multiplier) VALUES
(NULL, 0, 50, 1.00),
(NULL, 51, 75, 1.10),
(NULL, 76, 90, 1.20),
(NULL, 91, 100, 1.30);