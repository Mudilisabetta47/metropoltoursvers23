
-- Extend b2b_contracts with bus-business specific fields
ALTER TABLE public.b2b_contracts
  ADD COLUMN IF NOT EXISTS contract_type text DEFAULT 'framework',
  ADD COLUMN IF NOT EXISTS contact_person text,
  ADD COLUMN IF NOT EXISTS payment_terms_days integer DEFAULT 14,
  ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pickup_locations jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS destination_locations jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS vehicle_class text,
  ADD COLUMN IF NOT EXISTS services_scope text,
  ADD COLUMN IF NOT EXISTS billing_mode text DEFAULT 'per_trip',
  ADD COLUMN IF NOT EXISTS invoice_address text,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS planned_trips integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_ytd numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'open';

-- Audit log table for B2B contracts
CREATE TABLE IF NOT EXISTS public.b2b_contract_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.b2b_contracts(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  field_name text,
  old_value text,
  new_value text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.b2b_contract_audit TO authenticated;
GRANT ALL ON public.b2b_contract_audit TO service_role;

ALTER TABLE public.b2b_contract_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view audit"
  ON public.b2b_contract_audit FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office') OR public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Staff can insert audit"
  ON public.b2b_contract_audit FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office') OR public.has_role(auth.uid(), 'agent'));

CREATE INDEX IF NOT EXISTS idx_b2b_contract_audit_contract ON public.b2b_contract_audit(contract_id, created_at DESC);
