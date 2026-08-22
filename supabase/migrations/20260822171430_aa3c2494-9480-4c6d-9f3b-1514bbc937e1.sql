ALTER TABLE public.package_tours
  ADD COLUMN IF NOT EXISTS hotel_name text,
  ADD COLUMN IF NOT EXISTS hotel_address text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;