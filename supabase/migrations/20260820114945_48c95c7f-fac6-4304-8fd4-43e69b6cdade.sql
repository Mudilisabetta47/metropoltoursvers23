ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_number text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS luggage jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_booking_number_key ON public.bookings(booking_number);

ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS arrival_date date;

CREATE OR REPLACE FUNCTION public.generate_booking_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
BEGIN
  LOOP
    candidate := 'MT-';
    FOR i IN 1..6 LOOP
      candidate := candidate || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings WHERE booking_number = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_booking_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
    NEW.booking_number := public.generate_booking_number();
  END IF;
  -- Only staff may flag a booking as an internal test booking
  IF COALESCE(NEW.is_test, false) THEN
    IF auth.uid() IS NULL OR NOT (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'office') OR
      public.has_role(auth.uid(), 'agent')
    ) THEN
      NEW.is_test := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_booking_number ON public.bookings;
CREATE TRIGGER trg_set_booking_number
BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_booking_number();

UPDATE public.bookings SET booking_number = public.generate_booking_number() WHERE booking_number IS NULL;