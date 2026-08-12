DROP POLICY IF EXISTS "Public can submit complaints" ON public.complaints;
CREATE POLICY "Public can submit complaints" ON public.complaints
FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'open'
  AND assigned_to IS NULL
  AND (refund_amount IS NULL OR refund_amount = 0)
  AND internal_notes IS NULL
);