
-- Tickets table
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  qr_payload text NOT NULL,
  status text NOT NULL DEFAULT 'valid',
  checked_in_at timestamptz,
  checked_in_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(qr_payload)
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'agent'::app_role) OR
    has_role(auth.uid(), 'driver'::app_role)
  );

CREATE POLICY "Staff can update tickets" ON public.tickets
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'agent'::app_role) OR
    has_role(auth.uid(), 'driver'::app_role)
  );

CREATE POLICY "Admins can manage tickets" ON public.tickets
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Scan logs table
CREATE TABLE public.scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  scan_time timestamptz NOT NULL DEFAULT now(),
  result text NOT NULL DEFAULT 'unknown',
  message text,
  user_id uuid NOT NULL,
  qr_payload text
);

ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view scan logs" ON public.scan_logs
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'agent'::app_role) OR
    has_role(auth.uid(), 'driver'::app_role)
  );

CREATE POLICY "Staff can insert scan logs" ON public.scan_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'agent'::app_role) OR
    has_role(auth.uid(), 'driver'::app_role)
  );

-- Webhook logs table
CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  url text NOT NULL,
  status_code integer,
  response_body text,
  success boolean NOT NULL DEFAULT false,
  retry_count integer NOT NULL DEFAULT 0,
  payload jsonb,
  error_message text
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook logs" ON public.webhook_logs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert webhook logs" ON public.webhook_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins manage webhook logs" ON public.webhook_logs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
