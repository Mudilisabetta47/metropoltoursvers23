CREATE TABLE IF NOT EXISTS public.tour_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES public.package_tours(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'accommodation',
  icon text NOT NULL DEFAULT 'Star',
  price numeric NOT NULL DEFAULT 0,
  price_type text NOT NULL DEFAULT 'per_person',
  max_per_booking integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tour_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tour extras are viewable by everyone" ON public.tour_extras
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage tour extras" ON public.tour_extras
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));