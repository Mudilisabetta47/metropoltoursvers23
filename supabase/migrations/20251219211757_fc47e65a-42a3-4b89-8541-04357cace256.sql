-- Fix search_path for functions that don't have it set
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_part TEXT;
  seq_part TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  seq_part := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  new_number := 'TKT-' || year_part || '-' || seq_part;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.bookings WHERE ticket_number = new_number) LOOP
    seq_part := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    new_number := 'TKT-' || year_part || '-' || seq_part;
  END LOOP;
  
  RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;