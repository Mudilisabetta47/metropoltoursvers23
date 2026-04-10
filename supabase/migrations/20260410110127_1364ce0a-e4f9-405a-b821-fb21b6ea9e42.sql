ALTER TABLE public.tour_dates DROP COLUMN duration_days;
ALTER TABLE public.tour_dates ADD COLUMN duration_days integer GENERATED ALWAYS AS (return_date - departure_date) STORED;