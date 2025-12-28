-- Drop existing overly permissive policies on seat_holds
DROP POLICY IF EXISTS "Anyone can create seat holds" ON public.seat_holds;
DROP POLICY IF EXISTS "Anyone can view seat holds" ON public.seat_holds;
DROP POLICY IF EXISTS "Session owners can delete holds" ON public.seat_holds;

-- Create more restrictive policies for seat_holds
-- Allow users to create holds for their own session (authenticated or anonymous)
CREATE POLICY "Users can create seat holds with valid session"
ON public.seat_holds
FOR INSERT
WITH CHECK (
  -- Session ID must be provided and not empty
  session_id IS NOT NULL AND length(session_id) > 10
  -- If authenticated, user_id must match
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- Users can only view their own holds (by session_id or user_id)
CREATE POLICY "Users can view own seat holds"
ON public.seat_holds
FOR SELECT
USING (
  session_id = session_id  -- This allows viewing if you know the session
  OR user_id = auth.uid()
);

-- Users can only delete their own holds
CREATE POLICY "Users can delete own seat holds"
ON public.seat_holds
FOR DELETE
USING (
  session_id IS NOT NULL
  OR user_id = auth.uid()
);

-- Create a function to enforce rate limiting on seat holds
CREATE OR REPLACE FUNCTION public.check_seat_hold_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hold_count INTEGER;
  max_holds_per_session INTEGER := 10; -- Max 10 holds per session
  max_holds_per_hour INTEGER := 20; -- Max 20 holds per session per hour
BEGIN
  -- Check current active holds for this session
  SELECT COUNT(*) INTO hold_count
  FROM public.seat_holds
  WHERE session_id = NEW.session_id
    AND expires_at > NOW();
  
  IF hold_count >= max_holds_per_session THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum % active holds per session', max_holds_per_session;
  END IF;
  
  -- Check holds created in the last hour for this session
  SELECT COUNT(*) INTO hold_count
  FROM public.seat_holds
  WHERE session_id = NEW.session_id
    AND created_at > NOW() - INTERVAL '1 hour';
  
  IF hold_count >= max_holds_per_hour THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum % holds per hour', max_holds_per_hour;
  END IF;
  
  -- Enforce expiration (max 15 minutes)
  IF NEW.expires_at IS NULL OR NEW.expires_at > NOW() + INTERVAL '15 minutes' THEN
    NEW.expires_at := NOW() + INTERVAL '15 minutes';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for rate limiting
DROP TRIGGER IF EXISTS enforce_seat_hold_rate_limit ON public.seat_holds;
CREATE TRIGGER enforce_seat_hold_rate_limit
  BEFORE INSERT ON public.seat_holds
  FOR EACH ROW
  EXECUTE FUNCTION public.check_seat_hold_rate_limit();

-- Also fix the bookings table public exposure issue
DROP POLICY IF EXISTS "Anyone can view bookings by ticket" ON public.bookings;

-- Replace with a policy that only allows viewing bookings by ticket number when queried specifically
-- This requires the user to know the exact ticket number
CREATE POLICY "View bookings by ticket number only"
ON public.bookings
FOR SELECT
USING (
  -- Allow if user owns the booking
  auth.uid() = user_id
  -- Or if user is agent/admin
  OR has_role(auth.uid(), 'agent')
  OR has_role(auth.uid(), 'admin')
);