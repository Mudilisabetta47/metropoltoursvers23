CREATE TABLE public.dispo_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  customer_id uuid REFERENCES public.dispo_customers(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.dispo_orders(id) ON DELETE SET NULL,
  customer_name text NOT NULL DEFAULT '',
  company text,
  address text,
  email text,
  subject text,
  intro_text text,
  outro_text text,
  vat_rate numeric NOT NULL DEFAULT 19,
  net_amount numeric NOT NULL DEFAULT 0,
  vat_amount numeric NOT NULL DEFAULT 0,
  gross_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'entwurf',
  paid_at date,
  payment_method text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.dispo_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.dispo_invoices(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 1,
  description text NOT NULL DEFAULT '',
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'Stk.',
  unit_price numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispo_invoices TO authenticated;
GRANT ALL ON public.dispo_invoices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispo_invoice_items TO authenticated;
GRANT ALL ON public.dispo_invoice_items TO service_role;

ALTER TABLE public.dispo_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispo_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dispo staff manage invoices" ON public.dispo_invoices
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Dispo staff manage invoice items" ON public.dispo_invoice_items
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'office'::app_role));

CREATE INDEX idx_dispo_invoices_status ON public.dispo_invoices(status);
CREATE INDEX idx_dispo_invoices_date ON public.dispo_invoices(invoice_date DESC);
CREATE INDEX idx_dispo_invoice_items_invoice ON public.dispo_invoice_items(invoice_id);

CREATE OR REPLACE FUNCTION public.generate_dispo_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  y text := to_char(now(), 'YYYY');
  n int;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(invoice_number, '^RE-\d{4}-', ''), '')::int), 0) + 1
    INTO n
  FROM public.dispo_invoices
  WHERE invoice_number LIKE 'RE-' || y || '-%';
  RETURN 'RE-' || y || '-' || lpad(n::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_dispo_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.generate_dispo_invoice_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_dispo_invoice_number
BEFORE INSERT ON public.dispo_invoices
FOR EACH ROW EXECUTE FUNCTION public.set_dispo_invoice_number();

CREATE TRIGGER trg_dispo_invoices_updated_at
BEFORE UPDATE ON public.dispo_invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();