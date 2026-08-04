
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;

CREATE POLICY "Users can update own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Zusaetzlicher Schutz: Kunden duerfen keine finanz-/statusrelevanten Felder aendern
-- (Trigger protect_booking_sensitive_fields erzwingt dies bereits fuer Nicht-Staff).
DROP TRIGGER IF EXISTS protect_booking_sensitive_fields_trg ON public.bookings;
CREATE TRIGGER protect_booking_sensitive_fields_trg
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.protect_booking_sensitive_fields();
