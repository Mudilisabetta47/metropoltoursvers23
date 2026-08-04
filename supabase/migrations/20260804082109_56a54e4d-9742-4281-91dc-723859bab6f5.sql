DROP POLICY "Package tours are viewable by everyone" ON public.package_tours;
CREATE POLICY "Published package tours are viewable by everyone"
ON public.package_tours FOR SELECT
USING (is_active = true AND coalesce(publish_status, 'draft') = 'published');