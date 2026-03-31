-- Add more fields to job_applications
ALTER TABLE public.job_applications
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS earliest_start_date date,
ADD COLUMN IF NOT EXISTS resume_url text,
ADD COLUMN IF NOT EXISTS resume_filename text,
ADD COLUMN IF NOT EXISTS experience_years text,
ADD COLUMN IF NOT EXISTS desired_salary text,
ADD COLUMN IF NOT EXISTS how_found_us text;

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-applications', 'job-applications', false)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to job-applications bucket (public applicants)
CREATE POLICY "Anyone can upload application files"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'job-applications');

-- Only admins can view/download application files
CREATE POLICY "Admins can view application files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'job-applications' AND has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete application files
CREATE POLICY "Admins can delete application files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'job-applications' AND has_role(auth.uid(), 'admin'::app_role));