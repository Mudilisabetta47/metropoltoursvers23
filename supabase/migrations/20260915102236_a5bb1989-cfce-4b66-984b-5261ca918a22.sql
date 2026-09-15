DROP POLICY IF EXISTS "shop_products_images_read" ON storage.objects;
CREATE POLICY "shop_products_images_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'shop-products'
  AND lower(storage.objects.name) ~ '\.(jpg|jpeg|png|webp|gif|avif|svg)$'
);