
ALTER TABLE public.driver_duty_log
  ADD COLUMN IF NOT EXISTS block_seconds integer NOT NULL DEFAULT 0;

DELETE FROM public.driver_duty_log a
USING public.driver_duty_log b
WHERE a.driver_user_id = b.driver_user_id
  AND a.log_date = b.log_date
  AND a.ctid > b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS driver_duty_log_driver_date_key
  ON public.driver_duty_log(driver_user_id, log_date);
