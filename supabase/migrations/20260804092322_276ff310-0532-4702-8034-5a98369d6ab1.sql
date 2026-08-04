
-- Fahrer/Office duerfen Vorfaelle melden (SOS)
CREATE POLICY "Drivers and office can report incidents"
ON public.incidents
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'driver')
  OR public.has_role(auth.uid(), 'office')
  OR public.has_role(auth.uid(), 'agent')
  OR public.has_role(auth.uid(), 'admin')
);

-- Office darf Vorfaelle sehen/bearbeiten (Disposition)
CREATE POLICY "Office can view incidents"
ON public.incidents
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'office') OR public.has_role(auth.uid(), 'driver'));

CREATE POLICY "Office can update incidents"
ON public.incidents
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'office'))
WITH CHECK (public.has_role(auth.uid(), 'office'));

-- Fahrer duerfen Nachrichten an die Disposition senden
CREATE POLICY "Drivers can send messages"
ON public.driver_messages
FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid() AND public.has_role(auth.uid(), 'driver'));

-- Fahrer sehen eigene, an sie gerichtete und Rundnachrichten
DROP POLICY IF EXISTS "Drivers can view own messages" ON public.driver_messages;
CREATE POLICY "Drivers can view own messages"
ON public.driver_messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = recipient_id
  OR auth.uid() = sender_id
  OR (is_broadcast = true AND public.has_role(auth.uid(), 'driver'))
);
