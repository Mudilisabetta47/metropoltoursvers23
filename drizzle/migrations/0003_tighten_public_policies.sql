DROP POLICY IF EXISTS "Surroundings cache is public readable" ON public.surroundings_cache;
DROP POLICY IF EXISTS "shop_settings_public_read" ON public.shop_settings;
DROP POLICY IF EXISTS "cms_media_public_read" ON public.cms_media;

DROP POLICY IF EXISTS "Seats are viewable by everyone" ON public.seats;
CREATE POLICY "Active seats are viewable by everyone" ON public.seats
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Combination members viewable by everyone" ON public.tour_combination_members;
CREATE POLICY "Members of active combinations viewable by everyone" ON public.tour_combination_members
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.tour_combinations c WHERE c.id = combination_id AND c.is_active = true));

DROP POLICY IF EXISTS "Anyone can create inquiries" ON public.package_tour_inquiries;
CREATE POLICY "Anyone can create valid pending inquiries" ON public.package_tour_inquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND (user_id IS NULL OR user_id = auth.uid())
    AND char_length(btrim(first_name)) BETWEEN 1 AND 100
    AND char_length(btrim(last_name)) BETWEEN 1 AND 100
    AND char_length(email) BETWEEN 5 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (phone IS NULL OR char_length(phone) <= 50)
    AND (message IS NULL OR char_length(message) <= 5000)
    AND participants BETWEEN 1 AND 100
    AND (total_price IS NULL OR total_price >= 0)
  );