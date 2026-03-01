
-- Table for passenger data completion tokens
CREATE TABLE public.passenger_data_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.tour_bookings(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.passenger_data_tokens ENABLE ROW LEVEL SECURITY;

-- Public read/update by token (no auth needed)
CREATE POLICY "Anyone can view by token" ON public.passenger_data_tokens
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update by token" ON public.passenger_data_tokens
  FOR UPDATE USING (true);

-- Admins manage
CREATE POLICY "Admins manage tokens" ON public.passenger_data_tokens
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Table for automation email logs
CREATE TABLE public.automation_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.tour_bookings(id) ON DELETE CASCADE,
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.automation_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email logs" ON public.automation_email_log
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert email logs" ON public.automation_email_log
  FOR INSERT WITH CHECK (true);
