
-- Tour combinations: links tours that can share recommendations but keep independent seat pools
CREATE TABLE public.tour_combinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  country text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Junction table: which tours belong to which combination group
CREATE TABLE public.tour_combination_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combination_id uuid NOT NULL REFERENCES public.tour_combinations(id) ON DELETE CASCADE,
  tour_id uuid NOT NULL REFERENCES public.package_tours(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(combination_id, tour_id)
);

-- Enable RLS
ALTER TABLE public.tour_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_combination_members ENABLE ROW LEVEL SECURITY;

-- Admins manage combinations
CREATE POLICY "Admins manage tour combinations" ON public.tour_combinations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tour combinations viewable by everyone" ON public.tour_combinations
  FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "Admins manage combination members" ON public.tour_combination_members
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Combination members viewable by everyone" ON public.tour_combination_members
  FOR SELECT TO public
  USING (true);
