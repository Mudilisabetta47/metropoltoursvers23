DROP POLICY IF EXISTS "Published package tours are viewable by everyone" ON public.package_tours;

CREATE POLICY "Non archived package tours are viewable by everyone"
ON public.package_tours
FOR SELECT
USING (COALESCE(publish_status, 'draft') <> 'archived');