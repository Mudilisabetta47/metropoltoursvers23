-- 1. Chat sessions
CREATE TABLE public.advisor_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  page_url text,
  message_count integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  is_flagged boolean NOT NULL DEFAULT false,
  flag_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_advisor_sessions_last ON public.advisor_chat_sessions(last_activity_at DESC);
CREATE INDEX idx_advisor_sessions_ip ON public.advisor_chat_sessions(ip_address);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.advisor_chat_sessions TO authenticated;
GRANT ALL ON public.advisor_chat_sessions TO service_role;
ALTER TABLE public.advisor_chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view advisor sessions" ON public.advisor_chat_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE POLICY "Admins can manage advisor sessions" ON public.advisor_chat_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 2. Chat messages
CREATE TABLE public.advisor_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_advisor_messages_session ON public.advisor_chat_messages(session_id, created_at);
CREATE INDEX idx_advisor_messages_created ON public.advisor_chat_messages(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.advisor_chat_messages TO authenticated;
GRANT ALL ON public.advisor_chat_messages TO service_role;
ALTER TABLE public.advisor_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view advisor messages" ON public.advisor_chat_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE POLICY "Admins can manage advisor messages" ON public.advisor_chat_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 3. Security events
CREATE TABLE public.advisor_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  ip_address text,
  user_agent text,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_advisor_sec_created ON public.advisor_security_events(created_at DESC);

GRANT SELECT ON public.advisor_security_events TO authenticated;
GRANT ALL ON public.advisor_security_events TO service_role;
ALTER TABLE public.advisor_security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view security events" ON public.advisor_security_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 4. Monthly reports
CREATE TABLE public.advisor_monthly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_sessions integer NOT NULL DEFAULT 0,
  total_messages integer NOT NULL DEFAULT 0,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  report_markdown text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (period_start, period_end)
);
GRANT SELECT ON public.advisor_monthly_reports TO authenticated;
GRANT ALL ON public.advisor_monthly_reports TO service_role;
ALTER TABLE public.advisor_monthly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view advisor reports" ON public.advisor_monthly_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- 5. Support tickets
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE,
  subject text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'allgemein',
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('niedrig','normal','hoch','kritisch')),
  status text NOT NULL DEFAULT 'offen' CHECK (status IN ('offen','in_bearbeitung','erledigt')),
  source text NOT NULL DEFAULT 'chat',
  session_id text,
  chat_transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  customer_name text,
  customer_email text,
  ip_address text,
  user_agent text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  chat_started_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view tickets" ON public.support_tickets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office') OR public.has_role(auth.uid(),'agent'));
CREATE POLICY "Staff can create tickets" ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office') OR public.has_role(auth.uid(),'agent'));
CREATE POLICY "Staff can update tickets" ON public.support_tickets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office') OR public.has_role(auth.uid(),'agent'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office') OR public.has_role(auth.uid(),'agent'));
CREATE POLICY "Admins can delete tickets" ON public.support_tickets FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ticket number generator
CREATE OR REPLACE FUNCTION public.generate_support_ticket_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  n integer;
BEGIN
  SELECT COUNT(*) + 1 INTO n FROM public.support_tickets
    WHERE date_part('year', created_at) = date_part('year', now());
  RETURN 'SUP-' || to_char(now(),'YYYY') || '-' || lpad(n::text, 5, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_support_ticket_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := public.generate_support_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_support_ticket_number_trg BEFORE INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_support_ticket_number();