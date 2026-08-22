CREATE TABLE IF NOT EXISTS public.surroundings_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  lat double precision NOT NULL,
  lon double precision NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.surroundings_cache TO anon, authenticated;
GRANT ALL ON public.surroundings_cache TO service_role;
ALTER TABLE public.surroundings_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Surroundings cache is public readable" ON public.surroundings_cache FOR SELECT USING (true);