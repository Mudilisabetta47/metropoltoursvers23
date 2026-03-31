
-- Fix 1: passenger_data_tokens - restrict SELECT and UPDATE to token-based access
DROP POLICY IF EXISTS "Anyone can view by token" ON public.passenger_data_tokens;
DROP POLICY IF EXISTS "Anyone can update by token" ON public.passenger_data_tokens;

CREATE POLICY "View own token by value"
ON public.passenger_data_tokens FOR SELECT
TO public
USING (
  token = current_setting('request.headers', true)::json->>'x-token'
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Update own token by value"
ON public.passenger_data_tokens FOR UPDATE
TO public
USING (
  token = current_setting('request.headers', true)::json->>'x-token'
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  token = current_setting('request.headers', true)::json->>'x-token'
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 2: seat_holds - fix tautology in SELECT policy
DROP POLICY IF EXISTS "Users can view own seat holds" ON public.seat_holds;

CREATE POLICY "Users can view own seat holds"
ON public.seat_holds FOR SELECT
TO public
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'agent'::app_role)
);

-- Also need to allow anonymous seat availability checks via trip_id for the seat map
-- The seat map needs to see which seats are held for a given trip
CREATE POLICY "Anyone can view seat holds for trip availability"
ON public.seat_holds FOR SELECT
TO public
USING (
  expires_at > now()
);
