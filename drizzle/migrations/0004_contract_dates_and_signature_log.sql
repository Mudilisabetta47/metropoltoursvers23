ALTER TABLE public.employment_contracts
  ADD COLUMN IF NOT EXISTS document_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS contract_date date,
  ADD COLUMN IF NOT EXISTS planned_sign_date_employer date,
  ADD COLUMN IF NOT EXISTS planned_sign_date_employee date;

UPDATE public.employment_contracts SET document_date = (created_at AT TIME ZONE 'Europe/Berlin')::date WHERE document_date IS NULL OR document_date = CURRENT_DATE;

COMMENT ON COLUMN public.employment_contracts.planned_sign_date_employer IS 'Manually chosen/planned signature date (employer). Not proof of an actual signature.';
COMMENT ON COLUMN public.employment_contracts.planned_sign_date_employee IS 'Manually chosen/planned signature date (employee). Not proof of an actual signature.';
COMMENT ON COLUMN public.employment_contracts.signed_employer_at IS 'Actual electronic signature time, set server-side only.';
COMMENT ON COLUMN public.employment_contracts.signed_employee_at IS 'Actual electronic signature time, set server-side only.';

CREATE TABLE public.employment_contract_signature_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.employment_contracts(id) ON DELETE CASCADE,
  party text NOT NULL CHECK (party IN ('employer', 'employee')),
  event text NOT NULL CHECK (event IN ('signed', 'cleared')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid
);
CREATE INDEX ON public.employment_contract_signature_events (contract_id, occurred_at);

GRANT SELECT ON public.employment_contract_signature_events TO authenticated;
GRANT ALL ON public.employment_contract_signature_events TO service_role;
ALTER TABLE public.employment_contract_signature_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read contract signature events" ON public.employment_contract_signature_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'office'::app_role));

CREATE OR REPLACE FUNCTION public.enforce_contract_signature_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  emp_signed boolean := coalesce(btrim(NEW.signature_employee), '') <> '';
  er_signed boolean := coalesce(btrim(NEW.signature_employer), '') <> '';
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.signed_employee_at := CASE WHEN emp_signed THEN now() END;
    NEW.signed_employer_at := CASE WHEN er_signed THEN now() END;
    IF emp_signed THEN INSERT INTO employment_contract_signature_events (contract_id, party, event, actor_id) VALUES (NEW.id, 'employee', 'signed', auth.uid()); END IF;
    IF er_signed THEN INSERT INTO employment_contract_signature_events (contract_id, party, event, actor_id) VALUES (NEW.id, 'employer', 'signed', auth.uid()); END IF;
    RETURN NEW;
  END IF;

  IF NEW.signature_employee IS DISTINCT FROM OLD.signature_employee THEN
    NEW.signed_employee_at := CASE WHEN emp_signed THEN now() END;
    INSERT INTO employment_contract_signature_events (contract_id, party, event, actor_id)
      VALUES (NEW.id, 'employee', CASE WHEN emp_signed THEN 'signed' ELSE 'cleared' END, auth.uid());
  ELSE
    NEW.signed_employee_at := OLD.signed_employee_at;
  END IF;

  IF NEW.signature_employer IS DISTINCT FROM OLD.signature_employer THEN
    NEW.signed_employer_at := CASE WHEN er_signed THEN now() END;
    INSERT INTO employment_contract_signature_events (contract_id, party, event, actor_id)
      VALUES (NEW.id, 'employer', CASE WHEN er_signed THEN 'signed' ELSE 'cleared' END, auth.uid());
  ELSE
    NEW.signed_employer_at := OLD.signed_employer_at;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_employment_contracts_signature_timestamps
  BEFORE INSERT ON public.employment_contracts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_contract_signature_timestamps();
CREATE TRIGGER trg_employment_contracts_signature_timestamps_upd
  BEFORE UPDATE ON public.employment_contracts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_contract_signature_timestamps();