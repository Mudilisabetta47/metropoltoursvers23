-- Tighten waitlist_entries INSERT policy: prevent spoofing user_id
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist_entries;
CREATE POLICY "Anonymous can join waitlist without user_id"
  ON public.waitlist_entries FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);
CREATE POLICY "Authenticated can join waitlist as themselves"
  ON public.waitlist_entries FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Scope job-applications uploads so users can't write into arbitrary paths.
-- Files must be uploaded into a folder named after a session/application id
-- (first path segment), preventing overwrites of other applications.
DROP POLICY IF EXISTS "Public can upload job applications" ON storage.objects;
CREATE POLICY "Public can upload job applications scoped"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'job-applications'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND length((storage.foldername(name))[1]) >= 8
  );

-- Add UPDATE policy on review-photos so users can only modify files in their own folder
DROP POLICY IF EXISTS "Users can update own review photos" ON storage.objects;
CREATE POLICY "Users can update own review photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'review-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'review-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );