-- Add distance and duration fields to tour_routes
ALTER TABLE public.tour_routes 
ADD COLUMN IF NOT EXISTS distance_km integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS duration_hours numeric DEFAULT NULL;

-- Update tour_pickup_stops to allow notes/placeholder text
ALTER TABLE public.tour_pickup_stops
ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;