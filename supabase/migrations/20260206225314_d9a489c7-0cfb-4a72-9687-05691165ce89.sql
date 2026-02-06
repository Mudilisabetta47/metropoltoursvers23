-- =====================================================
-- OPERATIONS CONTROL CENTER - FULL SCHEMA
-- =====================================================

-- 1. VEHICLE POSITIONS (GPS Tracking / Simulation)
CREATE TABLE public.vehicle_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  heading DECIMAL(5, 2) DEFAULT 0,
  speed_kmh DECIMAL(5, 1) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'on_time' CHECK (status IN ('on_time', 'delayed', 'stopped', 'offline', 'incident')),
  delay_minutes INTEGER DEFAULT 0,
  last_stop_id UUID REFERENCES public.stops(id),
  next_stop_id UUID REFERENCES public.stops(id),
  eta_next_stop TIMESTAMP WITH TIME ZONE,
  driver_name TEXT,
  passenger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable realtime for live tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_positions;

-- 2. SYSTEM STATUS
CREATE TABLE public.system_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'degraded', 'offline', 'maintenance')),
  latency_ms INTEGER DEFAULT 0,
  last_check TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable realtime for system status
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_status;

-- 3. INCIDENTS & ALERTS
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('critical', 'warning', 'info')),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT, -- 'vehicle', 'system', 'scanner', 'manual'
  source_id UUID,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved')),
  assigned_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable realtime for incidents
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;

-- 4. EMPLOYEE SHIFTS
CREATE TABLE public.employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_end TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'break', 'completed', 'absent')),
  role TEXT NOT NULL DEFAULT 'driver' CHECK (role IN ('driver', 'scanner', 'dispatcher', 'support')),
  assigned_bus_id UUID REFERENCES public.buses(id),
  assigned_trip_id UUID REFERENCES public.trips(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable realtime for shifts
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_shifts;

-- 5. SCANNER EVENTS (Ticket Validations)
CREATE TABLE public.scanner_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scanner_user_id UUID NOT NULL REFERENCES auth.users(id),
  booking_id UUID REFERENCES public.bookings(id),
  trip_id UUID REFERENCES public.trips(id),
  bus_id UUID REFERENCES public.buses(id),
  stop_id UUID REFERENCES public.stops(id),
  scan_type TEXT NOT NULL DEFAULT 'check_in' CHECK (scan_type IN ('check_in', 'check_out', 'verification')),
  result TEXT NOT NULL DEFAULT 'valid' CHECK (result IN ('valid', 'invalid', 'expired', 'duplicate', 'fraud_suspected')),
  ticket_number TEXT,
  error_reason TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable realtime for scanner events
ALTER PUBLICATION supabase_realtime ADD TABLE public.scanner_events;

-- 6. OPERATIONS METRICS (Aggregated KPIs)
CREATE TABLE public.operations_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_hour INTEGER DEFAULT EXTRACT(HOUR FROM now()),
  value DECIMAL(12, 2) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. COMMAND LOGS (Quick Actions Audit)
CREATE TABLE public.command_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  command_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  parameters JSONB DEFAULT '{}'::jsonb,
  result TEXT NOT NULL DEFAULT 'success' CHECK (result IN ('success', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Vehicle Positions
ALTER TABLE public.vehicle_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vehicle positions"
ON public.vehicle_positions FOR SELECT USING (true);

CREATE POLICY "Admins can manage vehicle positions"
ON public.vehicle_positions FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- System Status
ALTER TABLE public.system_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system status"
ON public.system_status FOR SELECT USING (true);

CREATE POLICY "Admins can manage system status"
ON public.system_status FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Incidents
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents and admins can view incidents"
ON public.incidents FOR SELECT
USING (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents and admins can manage incidents"
ON public.incidents FOR ALL
USING (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'));

-- Employee Shifts
ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shifts"
ON public.employee_shifts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all shifts"
ON public.employee_shifts FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Scanner Events
ALTER TABLE public.scanner_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scanners can create events"
ON public.scanner_events FOR INSERT
WITH CHECK (auth.uid() = scanner_user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents and admins can view scanner events"
ON public.scanner_events FOR SELECT
USING (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'));

-- Operations Metrics
ALTER TABLE public.operations_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents and admins can view metrics"
ON public.operations_metrics FOR SELECT
USING (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert metrics"
ON public.operations_metrics FOR INSERT
WITH CHECK (true);

-- Command Logs
ALTER TABLE public.command_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view command logs"
ON public.command_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents and admins can create command logs"
ON public.command_logs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'));

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_vehicle_positions_updated_at
BEFORE UPDATE ON public.vehicle_positions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
BEFORE UPDATE ON public.incidents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_shifts_updated_at
BEFORE UPDATE ON public.employee_shifts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SEED INITIAL SYSTEM STATUS
-- =====================================================

INSERT INTO public.system_status (service_name, status, latency_ms) VALUES
('api', 'online', 45),
('booking', 'online', 62),
('tracking', 'online', 38),
('scanner', 'online', 55),
('notifications', 'online', 120),
('database', 'online', 12);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get active incidents count by severity
CREATE OR REPLACE FUNCTION public.get_incident_counts()
RETURNS TABLE(severity TEXT, count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT severity, COUNT(*)::BIGINT
  FROM public.incidents
  WHERE status != 'resolved'
  GROUP BY severity;
$$;

-- Function to get scanner stats for last hour
CREATE OR REPLACE FUNCTION public.get_scanner_stats_hourly()
RETURNS TABLE(
  total_scans BIGINT,
  valid_scans BIGINT,
  invalid_scans BIGINT,
  fraud_suspected BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::BIGINT as total_scans,
    COUNT(*) FILTER (WHERE result = 'valid')::BIGINT as valid_scans,
    COUNT(*) FILTER (WHERE result IN ('invalid', 'expired'))::BIGINT as invalid_scans,
    COUNT(*) FILTER (WHERE result = 'fraud_suspected')::BIGINT as fraud_suspected
  FROM public.scanner_events
  WHERE created_at > NOW() - INTERVAL '1 hour';
$$;