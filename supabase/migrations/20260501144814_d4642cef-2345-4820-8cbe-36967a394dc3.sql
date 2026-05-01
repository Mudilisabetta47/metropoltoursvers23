ALTER TABLE public.wallet_passes
  ADD COLUMN IF NOT EXISTS booking_type TEXT NOT NULL DEFAULT 'bus',
  ADD COLUMN IF NOT EXISTS tour_booking_id UUID REFERENCES public.tour_bookings(id) ON DELETE CASCADE;

ALTER TABLE public.wallet_passes
  ALTER COLUMN booking_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'wallet_passes_booking_type_check'
      AND conrelid = 'public.wallet_passes'::regclass
  ) THEN
    ALTER TABLE public.wallet_passes
      ADD CONSTRAINT wallet_passes_booking_type_check
      CHECK (booking_type IN ('bus', 'tour'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'wallet_passes_booking_reference_check'
      AND conrelid = 'public.wallet_passes'::regclass
  ) THEN
    ALTER TABLE public.wallet_passes
      ADD CONSTRAINT wallet_passes_booking_reference_check
      CHECK (
        (booking_type = 'bus' AND booking_id IS NOT NULL AND tour_booking_id IS NULL)
        OR
        (booking_type = 'tour' AND tour_booking_id IS NOT NULL AND booking_id IS NULL)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wallet_tour_booking ON public.wallet_passes(tour_booking_id);
CREATE INDEX IF NOT EXISTS idx_wallet_booking_type ON public.wallet_passes(booking_type);

DROP POLICY IF EXISTS "Users see own passes" ON public.wallet_passes;
DROP POLICY IF EXISTS "System manage passes" ON public.wallet_passes;

CREATE POLICY "Users see own wallet passes"
ON public.wallet_passes
FOR SELECT
TO authenticated
USING (
  (
    booking_type = 'bus'
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = wallet_passes.booking_id
        AND b.user_id = auth.uid()
    )
  )
  OR
  (
    booking_type = 'tour'
    AND EXISTS (
      SELECT 1 FROM public.tour_bookings tb
      WHERE tb.id = wallet_passes.tour_booking_id
        AND tb.user_id = auth.uid()
    )
  )
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'office')
  OR public.has_role(auth.uid(), 'agent')
);

CREATE POLICY "Staff manage wallet passes"
ON public.wallet_passes
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'office')
  OR public.has_role(auth.uid(), 'agent')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'office')
  OR public.has_role(auth.uid(), 'agent')
);