
DROP POLICY IF EXISTS "Anon push insert by booking" ON public.push_subscriptions;

DROP POLICY IF EXISTS "Public can view tour images" ON storage.objects;
DROP POLICY IF EXISTS "Public read review photos" ON storage.objects;
