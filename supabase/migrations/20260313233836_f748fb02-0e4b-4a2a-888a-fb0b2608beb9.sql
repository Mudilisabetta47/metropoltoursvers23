
-- Weekend trips table for managing short city trips (Kopenhagen, Amsterdam, etc.)
CREATE TABLE public.weekend_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination text NOT NULL,
  slug text NOT NULL UNIQUE,
  country text NOT NULL DEFAULT 'Europa',
  image_url text,
  hero_image_url text,
  gallery_images text[] DEFAULT '{}',
  short_description text,
  full_description text,
  highlights text[] DEFAULT '{}',
  inclusions text[] DEFAULT '{}',
  not_included text[] DEFAULT '{}',
  duration text,
  distance text,
  base_price numeric NOT NULL DEFAULT 0,
  route_id uuid REFERENCES public.routes(id),
  departure_city text NOT NULL DEFAULT 'Hamburg',
  departure_point text DEFAULT 'ZOB',
  via_stops jsonb DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  meta_title text,
  meta_description text,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekend_trips ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins manage weekend trips"
ON public.weekend_trips FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can view active
CREATE POLICY "Weekend trips viewable by everyone"
ON public.weekend_trips FOR SELECT TO public
USING (is_active = true);
