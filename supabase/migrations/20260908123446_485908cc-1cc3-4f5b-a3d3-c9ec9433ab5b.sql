ALTER TABLE public.weekend_trips
  ADD COLUMN IF NOT EXISTS accommodation_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accommodation_nights integer,
  ADD COLUMN IF NOT EXISTS hotel_name text,
  ADD COLUMN IF NOT EXISTS hotel_stars integer,
  ADD COLUMN IF NOT EXISTS hotel_description text,
  ADD COLUMN IF NOT EXISTS price_double_room numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_single_room numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS departure_time text,
  ADD COLUMN IF NOT EXISTS return_info text,
  ADD COLUMN IF NOT EXISTS layout_variant text NOT NULL DEFAULT 'classic';