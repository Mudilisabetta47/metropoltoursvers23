DO $$
BEGIN
  -- Only add tables not yet in publication
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'vehicle_positions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_positions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'incidents') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'employee_shifts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_shifts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'scanner_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scanner_events;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'command_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.command_logs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'audit_log') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_log;
  END IF;
END $$;