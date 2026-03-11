
-- Create public storage bucket for tour images
INSERT INTO storage.buckets (id, name, public) VALUES ('tour-images', 'tour-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view tour images (public bucket)
CREATE POLICY "Public can view tour images" ON storage.objects
  FOR SELECT USING (bucket_id = 'tour-images');

-- Allow authenticated admins to upload tour images
CREATE POLICY "Admins can upload tour images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tour-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow authenticated admins to update tour images
CREATE POLICY "Admins can update tour images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'tour-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow authenticated admins to delete tour images
CREATE POLICY "Admins can delete tour images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'tour-images' AND public.has_role(auth.uid(), 'admin'));
