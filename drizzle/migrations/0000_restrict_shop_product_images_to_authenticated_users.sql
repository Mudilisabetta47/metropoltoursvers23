DROP POLICY IF EXISTS shop_products_images_read ON storage.objects;

CREATE POLICY shop_products_images_read
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'shop-products'
  AND owner_id = (SELECT auth.uid()::text)
);