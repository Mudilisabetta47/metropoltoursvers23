ALTER TABLE public.dispatch_orders ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL;
ALTER TABLE public.dispatch_orders ADD COLUMN IF NOT EXISTS live_tracking_from timestamptz;
CREATE INDEX IF NOT EXISTS dispatch_orders_trip_id_idx ON public.dispatch_orders(trip_id);