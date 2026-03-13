
-- Expenses table for tracking business costs (fuel, supplies, etc.)
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'fuel',
  description text NOT NULL,
  amount numeric NOT NULL,
  tax_rate numeric NOT NULL DEFAULT 19,
  tax_amount numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  receipt_url text,
  receipt_filename text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'cash',
  vendor text,
  bus_id uuid REFERENCES public.buses(id),
  trip_id uuid REFERENCES public.trips(id),
  recorded_by uuid,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins manage expenses"
ON public.expenses FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Agents can view
CREATE POLICY "Agents view expenses"
ON public.expenses FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'agent'::app_role));

-- Office can insert/update
CREATE POLICY "Office manage expenses"
ON public.expenses FOR ALL TO authenticated
USING (has_role(auth.uid(), 'office'::app_role));
