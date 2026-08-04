ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS internal_note text;
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_status_check;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_status_check CHECK (status IN ('offen','in_bearbeitung','wartet_auf_kunde','geloest','geschlossen','erledigt'));
ALTER TABLE public.advisor_monthly_reports DROP CONSTRAINT IF EXISTS advisor_monthly_reports_period_key;
ALTER TABLE public.advisor_monthly_reports ADD CONSTRAINT advisor_monthly_reports_period_key UNIQUE (period_start, period_end);