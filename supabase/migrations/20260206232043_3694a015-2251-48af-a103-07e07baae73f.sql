-- =====================================================
-- REISE-BUILDER: Vollständiges Datenmodell
-- =====================================================

-- 1. TARIFE - Die 4 Tarifkategorien mit Regeln
CREATE TABLE public.tour_tariffs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES public.package_tours(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'Basic', 'Smart', 'Flex', 'Business'
  slug TEXT NOT NULL, -- 'basic', 'smart', 'flex', 'business'
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Preisaufschlag oder eigener Preis
  price_modifier NUMERIC(10,2) NOT NULL DEFAULT 0, -- z.B. +15€ für Smart
  
  -- Inklusivleistungen als Flags
  hand_luggage_only BOOLEAN NOT NULL DEFAULT true,
  suitcase_included BOOLEAN NOT NULL DEFAULT false,
  suitcase_weight_kg INTEGER, -- z.B. 20 oder 23
  seat_reservation BOOLEAN NOT NULL DEFAULT false,
  
  -- Storno-Regeln
  is_refundable BOOLEAN NOT NULL DEFAULT false,
  cancellation_days INTEGER, -- Tage vor Abreise für kostenlose Stornierung
  cancellation_fee_percent INTEGER, -- Gebühr bei Stornierung
  
  -- Features als Liste
  included_features TEXT[] DEFAULT '{}',
  
  is_recommended BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. TERMINE - Konkrete Reisedaten mit Preisen und Kontingent
CREATE TABLE public.tour_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES public.package_tours(id) ON DELETE CASCADE,
  
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  duration_days INTEGER GENERATED ALWAYS AS (return_date - departure_date + 1) STORED,
  
  -- Preis pro Tarif (eigener Preis pro Tarif)
  price_basic NUMERIC(10,2) NOT NULL,
  price_smart NUMERIC(10,2),
  price_flex NUMERIC(10,2),
  price_business NUMERIC(10,2),
  
  -- Kontingent
  total_seats INTEGER NOT NULL DEFAULT 50,
  booked_seats INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'limited', 'soldout', 'on_request', 'cancelled')),
  
  -- Frühbucher & Aktionen
  early_bird_discount_percent INTEGER DEFAULT 0,
  early_bird_deadline DATE,
  promo_code TEXT,
  promo_discount_percent INTEGER DEFAULT 0,
  
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. ABHOLROUTEN - Flexible Routen pro Reise
CREATE TABLE public.tour_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES public.package_tours(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL, -- z.B. "Route Nord", "Route Mitte"
  code TEXT NOT NULL, -- z.B. "A", "B", "C"
  description TEXT,
  
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. ZUSTIEGE - Einzelne Haltestellen pro Route
CREATE TABLE public.tour_pickup_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES public.tour_routes(id) ON DELETE CASCADE,
  
  city TEXT NOT NULL,
  location_name TEXT NOT NULL, -- z.B. "ZOB Hamburg"
  address TEXT,
  meeting_point TEXT, -- z.B. "Bussteig 5, Eingang Süd"
  
  departure_time TIME NOT NULL,
  arrival_offset_minutes INTEGER DEFAULT 0, -- Für Rückfahrt
  
  -- Aufpreis
  surcharge NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Optional: Kontingent pro Zustieg
  max_passengers INTEGER,
  
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. GEPÄCK ADD-ONS
CREATE TABLE public.tour_luggage_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES public.package_tours(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL, -- z.B. "Zusatzkoffer"
  description TEXT,
  
  price NUMERIC(10,2) NOT NULL,
  max_per_booking INTEGER NOT NULL DEFAULT 2,
  weight_limit_kg INTEGER, -- z.B. 23kg
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. INKLUSIVLEISTUNGEN (für die Checkliste)
CREATE TABLE public.tour_inclusions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES public.package_tours(id) ON DELETE CASCADE,
  
  icon TEXT NOT NULL DEFAULT 'Check', -- Lucide icon name
  title TEXT NOT NULL,
  description TEXT,
  
  category TEXT NOT NULL DEFAULT 'included' CHECK (category IN ('included', 'excluded', 'hint')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. RECHTLICHES & STORNO-INFOS
CREATE TABLE public.tour_legal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES public.package_tours(id) ON DELETE CASCADE,
  
  section_key TEXT NOT NULL, -- 'insurance', 'cancellation', 'documents', 'general'
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown erlaubt
  
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. TOUR BOOKINGS (erweitert für Hybrid-System)
CREATE TABLE public.tour_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_number TEXT NOT NULL UNIQUE DEFAULT ('TRB-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')),
  
  tour_id UUID NOT NULL REFERENCES public.package_tours(id),
  tour_date_id UUID NOT NULL REFERENCES public.tour_dates(id),
  tariff_id UUID NOT NULL REFERENCES public.tour_tariffs(id),
  pickup_stop_id UUID REFERENCES public.tour_pickup_stops(id),
  
  user_id UUID REFERENCES auth.users(id),
  
  -- Reisende
  participants INTEGER NOT NULL DEFAULT 1,
  passenger_details JSONB NOT NULL DEFAULT '[]', -- Array von {firstName, lastName, birthDate}
  
  -- Kontaktdaten
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  
  -- Preisberechnung
  base_price NUMERIC(10,2) NOT NULL,
  pickup_surcharge NUMERIC(10,2) NOT NULL DEFAULT 0,
  luggage_addons JSONB DEFAULT '[]', -- [{addonId, quantity, price}]
  total_price NUMERIC(10,2) NOT NULL,
  
  -- Rabatte
  discount_code TEXT,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled', 'completed', 'refunded')),
  booking_type TEXT NOT NULL DEFAULT 'request' CHECK (booking_type IN ('direct', 'request')),
  
  -- Zahlungsinfos
  payment_method TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Notizen
  customer_notes TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Erweiterung der package_tours Tabelle für SEO & Status
ALTER TABLE public.package_tours 
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Strandurlaub',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS insurance_info TEXT,
  ADD COLUMN IF NOT EXISTS documents_required TEXT,
  ADD COLUMN IF NOT EXISTS min_participants INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS publish_status TEXT DEFAULT 'draft' CHECK (publish_status IN ('draft', 'published', 'archived'));

-- Unique constraint für slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_package_tours_slug ON public.package_tours(slug) WHERE slug IS NOT NULL;

-- Indexes für Performance
CREATE INDEX idx_tour_tariffs_tour_id ON public.tour_tariffs(tour_id);
CREATE INDEX idx_tour_dates_tour_id ON public.tour_dates(tour_id);
CREATE INDEX idx_tour_dates_departure ON public.tour_dates(departure_date);
CREATE INDEX idx_tour_routes_tour_id ON public.tour_routes(tour_id);
CREATE INDEX idx_tour_pickup_stops_route_id ON public.tour_pickup_stops(route_id);
CREATE INDEX idx_tour_bookings_tour_id ON public.tour_bookings(tour_id);
CREATE INDEX idx_tour_bookings_status ON public.tour_bookings(status);
CREATE INDEX idx_tour_bookings_user_id ON public.tour_bookings(user_id);

-- RLS aktivieren
ALTER TABLE public.tour_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_pickup_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_luggage_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_inclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_legal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Öffentliche Lesbarkeit für aktive Daten
CREATE POLICY "Tour tariffs are viewable by everyone" ON public.tour_tariffs FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage tour tariffs" ON public.tour_tariffs FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Tour dates are viewable by everyone" ON public.tour_dates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage tour dates" ON public.tour_dates FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Tour routes are viewable by everyone" ON public.tour_routes FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage tour routes" ON public.tour_routes FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Tour pickup stops are viewable by everyone" ON public.tour_pickup_stops FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage tour pickup stops" ON public.tour_pickup_stops FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Tour luggage addons are viewable by everyone" ON public.tour_luggage_addons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage tour luggage addons" ON public.tour_luggage_addons FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Tour inclusions are viewable by everyone" ON public.tour_inclusions FOR SELECT USING (true);
CREATE POLICY "Admins can manage tour inclusions" ON public.tour_inclusions FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Tour legal is viewable by everyone" ON public.tour_legal FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage tour legal" ON public.tour_legal FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Tour Bookings: User kann eigene sehen, Admins alle
CREATE POLICY "Users can view own tour bookings" ON public.tour_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tour bookings" ON public.tour_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Agents and admins can view all tour bookings" ON public.tour_bookings FOR SELECT USING (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents and admins can update tour bookings" ON public.tour_bookings FOR UPDATE USING (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'));

-- Trigger für updated_at
CREATE TRIGGER update_tour_tariffs_updated_at BEFORE UPDATE ON public.tour_tariffs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tour_dates_updated_at BEFORE UPDATE ON public.tour_dates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tour_bookings_updated_at BEFORE UPDATE ON public.tour_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();