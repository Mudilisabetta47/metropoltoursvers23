
ALTER TABLE public.admin_bookings
  ADD COLUMN IF NOT EXISTS pretrip_checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dispatch_status text NOT NULL DEFAULT 'ungeplant';

CREATE INDEX IF NOT EXISTS admin_bookings_departure_at_idx ON public.admin_bookings (departure_at);
CREATE INDEX IF NOT EXISTS admin_bookings_dispatch_status_idx ON public.admin_bookings (dispatch_status);
