
-- Shift handover protocols
CREATE TABLE public.shift_handovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL,
  to_user_id uuid,
  shift_date date NOT NULL DEFAULT CURRENT_DATE,
  summary text NOT NULL,
  open_issues text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.shift_handovers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and office manage handovers" ON public.shift_handovers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

-- Driver messages
CREATE TABLE public.driver_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid,
  recipient_role text DEFAULT 'driver',
  subject text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  is_broadcast boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.driver_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and office manage driver messages" ON public.driver_messages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));
CREATE POLICY "Drivers can view own messages" ON public.driver_messages FOR SELECT TO authenticated
  USING (auth.uid() = recipient_id);

-- Bus maintenance records
CREATE TABLE public.bus_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL DEFAULT 'inspection',
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  completed_date date,
  status text NOT NULL DEFAULT 'scheduled',
  cost numeric,
  vendor text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.bus_maintenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and office manage maintenance" ON public.bus_maintenance FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_handovers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_maintenance;
