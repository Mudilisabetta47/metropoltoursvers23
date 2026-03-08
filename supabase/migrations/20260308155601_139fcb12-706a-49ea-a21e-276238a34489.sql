
-- Allow authenticated users to view tour_bookings that match their email
-- We use a security definer function to safely look up the user's email
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT email FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- Add policy: users can view tour bookings matching their email
CREATE POLICY "Users can view tour bookings by email"
ON public.tour_bookings
FOR SELECT
TO authenticated
USING (
  lower(contact_email) = lower(public.get_user_email(auth.uid()))
);
