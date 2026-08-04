CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.unschedule('advisor-monthly-report') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'advisor-monthly-report');

SELECT cron.schedule(
  'advisor-monthly-report',
  '0 3 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://wberoibxqpffhnyvjnci.supabase.co/functions/v1/advisor-monthly-report',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZXJvaWJ4cXBmZmhueXZqbmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODM3MTQsImV4cCI6MjA4MTY1OTcxNH0.zuewaPGss4QfjvluAXhFFcftVzwnxW5kXsqwsWCESU4"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);