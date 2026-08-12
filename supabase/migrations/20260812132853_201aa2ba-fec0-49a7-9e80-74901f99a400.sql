CREATE POLICY "shop_products_images_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'shop-products');
CREATE POLICY "shop_products_images_staff_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shop-products' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office')));
CREATE POLICY "shop_products_images_staff_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'shop-products' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office')));
CREATE POLICY "shop_products_images_staff_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'shop-products' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office')));