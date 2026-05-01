-- ==========================================
-- PHASE 1: DB-FOUNDATION FOR ADMIN EXPANSION
-- ==========================================

-- ===== FLEET COMPLIANCE =====

CREATE TABLE IF NOT EXISTS public.fleet_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL,
  compliance_type TEXT NOT NULL, -- 'tuv', 'uvv', 'sp', 'tachograph', 'au', 'feuerloescher', 'erste_hilfe'
  last_check_date DATE,
  due_date DATE NOT NULL,
  reminder_days INT NOT NULL DEFAULT 30,
  inspector TEXT,
  certificate_number TEXT,
  document_url TEXT,
  cost NUMERIC(10,2),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'valid', -- 'valid', 'due_soon', 'expired'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fleet_compliance_bus ON public.fleet_compliance(bus_id);
CREATE INDEX idx_fleet_compliance_due ON public.fleet_compliance(due_date);
ALTER TABLE public.fleet_compliance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins office manage compliance" ON public.fleet_compliance
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

CREATE POLICY "Drivers view compliance" ON public.fleet_compliance
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'driver'));

-- ===== FUEL LOG =====

CREATE TABLE IF NOT EXISTS public.fuel_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL,
  driver_id UUID,
  trip_id UUID,
  refuel_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  liters NUMERIC(10,2) NOT NULL,
  price_per_liter NUMERIC(10,3) NOT NULL,
  total_cost NUMERIC(10,2) NOT NULL,
  odometer_km INT,
  fuel_type TEXT NOT NULL DEFAULT 'diesel',
  station_name TEXT,
  country TEXT DEFAULT 'DE',
  fuel_card TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fuel_bus ON public.fuel_log(bus_id);
CREATE INDEX idx_fuel_date ON public.fuel_log(refuel_date DESC);
ALTER TABLE public.fuel_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage fuel log" ON public.fuel_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office') OR public.has_role(auth.uid(), 'driver'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office') OR public.has_role(auth.uid(), 'driver'));

-- ===== DAMAGE / INCIDENTS ON VEHICLES =====

CREATE TABLE IF NOT EXISTS public.vehicle_damages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL,
  damage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reported_by UUID,
  driver_id UUID,
  trip_id UUID,
  severity TEXT NOT NULL DEFAULT 'minor', -- 'minor', 'moderate', 'major', 'totaled'
  damage_type TEXT NOT NULL, -- 'collision', 'glass', 'tire', 'mechanical', 'vandalism', 'weather', 'other'
  description TEXT NOT NULL,
  location TEXT,
  third_party_involved BOOLEAN DEFAULT false,
  police_report_number TEXT,
  insurance_claim_number TEXT,
  insurance_reported_at TIMESTAMPTZ,
  workshop_id UUID,
  estimated_cost NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  photos JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'reported', -- 'reported', 'in_repair', 'resolved', 'closed'
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_damage_bus ON public.vehicle_damages(bus_id);
CREATE INDEX idx_damage_status ON public.vehicle_damages(status);
ALTER TABLE public.vehicle_damages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage damages" ON public.vehicle_damages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

CREATE POLICY "Drivers report damages" ON public.vehicle_damages
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'driver') AND auth.uid() = reported_by);

CREATE POLICY "Drivers view own damages" ON public.vehicle_damages
  FOR SELECT TO authenticated
  USING (auth.uid() = reported_by OR auth.uid() = driver_id);

-- ===== WORKSHOPS / SUPPLIERS =====

CREATE TABLE IF NOT EXISTS public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'DE',
  specializations TEXT[] DEFAULT '{}', -- 'engine','electrical','body','tires','glass','wheel_alignment'
  is_certified BOOLEAN DEFAULT false,
  contract_start DATE,
  contract_end DATE,
  hourly_rate NUMERIC(10,2),
  rating NUMERIC(2,1),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins office manage workshops" ON public.workshops
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

-- ===== TOLL ACCOUNTS =====

CREATE TABLE IF NOT EXISTS public.toll_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'toll_collect','asfinag','telepass','viatoll','dartford','sanef'
  account_number TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'DE',
  bus_id UUID,
  device_id TEXT, -- OBU number
  current_balance NUMERIC(12,2) DEFAULT 0,
  low_balance_threshold NUMERIC(12,2) DEFAULT 100,
  contract_start DATE,
  contract_end DATE,
  monthly_fee NUMERIC(10,2),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.toll_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins office manage toll" ON public.toll_accounts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

-- ===== VIGNETTES =====

CREATE TABLE IF NOT EXISTS public.vignettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL,
  country TEXT NOT NULL, -- 'AT','CH','SK','HU','SI','CZ','RO','BG'
  vignette_type TEXT, -- 'annual','10_day','2_month'
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  price NUMERIC(10,2),
  serial_number TEXT,
  reminder_days INT DEFAULT 14,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vignettes_bus ON public.vignettes(bus_id);
CREATE INDEX idx_vignettes_until ON public.vignettes(valid_until);
ALTER TABLE public.vignettes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage vignettes" ON public.vignettes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

CREATE POLICY "Drivers view vignettes" ON public.vignettes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'driver'));

-- ===== DRIVER LICENSES & QUALIFICATIONS =====

CREATE TABLE IF NOT EXISTS public.driver_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  license_class TEXT NOT NULL, -- 'B','C','CE','D','DE','D1'
  license_number TEXT NOT NULL,
  issued_date DATE,
  issued_by TEXT,
  expires_at DATE NOT NULL,
  module_95_number TEXT, -- BKrFQG Schlüsselzahl 95
  module_95_expires DATE,
  adr_certificate BOOLEAN DEFAULT false,
  document_url TEXT,
  reminder_days INT DEFAULT 60,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_licenses_driver ON public.driver_licenses(driver_id);
CREATE INDEX idx_licenses_expires ON public.driver_licenses(expires_at);
ALTER TABLE public.driver_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins office manage licenses" ON public.driver_licenses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

CREATE POLICY "Drivers view own license" ON public.driver_licenses
  FOR SELECT TO authenticated
  USING (auth.uid() = driver_id);

-- ===== DRIVER TRAININGS =====

CREATE TABLE IF NOT EXISTS public.driver_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  training_type TEXT NOT NULL, -- 'module_95','first_aid','adr','eco_driving','customer_service'
  title TEXT NOT NULL,
  provider TEXT,
  completed_at DATE,
  expires_at DATE,
  hours NUMERIC(5,1),
  cost NUMERIC(10,2),
  certificate_url TEXT,
  passed BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_trainings_driver ON public.driver_trainings(driver_id);
ALTER TABLE public.driver_trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage trainings" ON public.driver_trainings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

CREATE POLICY "Drivers view own trainings" ON public.driver_trainings
  FOR SELECT TO authenticated
  USING (auth.uid() = driver_id);

-- ===== PAYROLL ENTRIES =====

CREATE TABLE IF NOT EXISTS public.payroll_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL, -- 'hours','overtime','allowance','overnight','expense','bonus','deduction'
  description TEXT,
  hours NUMERIC(5,2),
  amount NUMERIC(10,2) NOT NULL,
  trip_id UUID,
  shift_id UUID,
  receipt_url TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  exported_at TIMESTAMPTZ,
  export_batch TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft','approved','exported','paid'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payroll_driver ON public.payroll_entries(driver_id);
CREATE INDEX idx_payroll_date ON public.payroll_entries(entry_date DESC);
CREATE INDEX idx_payroll_status ON public.payroll_entries(status);
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payroll" ON public.payroll_entries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers view own payroll" ON public.payroll_entries
  FOR SELECT TO authenticated
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers create own expense entries" ON public.payroll_entries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = driver_id AND category IN ('expense','allowance','overnight'));

-- ===== B2B CUSTOMERS =====

CREATE TABLE IF NOT EXISTS public.b2b_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  vat_id TEXT,
  customer_number TEXT UNIQUE,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'DE',
  discount_percent NUMERIC(5,2) DEFAULT 0,
  payment_terms_days INT DEFAULT 14,
  credit_limit NUMERIC(12,2),
  invoice_frequency TEXT DEFAULT 'per_booking', -- 'per_booking','weekly','monthly'
  iban TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  account_manager UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.b2b_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage b2b" ON public.b2b_customers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office') OR public.has_role(auth.uid(), 'agent'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

-- ===== B2B CONTRACTS =====

CREATE TABLE IF NOT EXISTS public.b2b_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  b2b_customer_id UUID NOT NULL,
  contract_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  valid_from DATE NOT NULL,
  valid_until DATE,
  conditions JSONB DEFAULT '{}'::jsonb, -- routes, fixed prices, special terms
  document_url TEXT,
  signed_at DATE,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft','active','expired','terminated'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.b2b_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage contracts" ON public.b2b_contracts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

-- ===== COMPLAINTS / TICKETS =====

CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  booking_id UUID,
  tour_booking_id UUID,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  category TEXT NOT NULL, -- 'delay','cleanliness','staff','comfort','baggage','refund','other'
  severity TEXT NOT NULL DEFAULT 'normal', -- 'low','normal','high','critical'
  channel TEXT DEFAULT 'email', -- 'email','phone','form','social'
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open','in_progress','waiting_customer','resolved','closed','escalated'
  assigned_to UUID,
  sla_due_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '48 hours'),
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  refund_amount NUMERIC(10,2) DEFAULT 0,
  voucher_code TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_sla ON public.complaints(sla_due_at);
CREATE INDEX idx_complaints_assigned ON public.complaints(assigned_to);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage complaints" ON public.complaints
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office') OR public.has_role(auth.uid(), 'agent'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office') OR public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Public can submit complaints" ON public.complaints
  FOR INSERT TO public
  WITH CHECK (true);

-- ===== COMPLAINT MESSAGES (Thread) =====

CREATE TABLE IF NOT EXISTS public.complaint_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL,
  author_id UUID,
  author_type TEXT NOT NULL DEFAULT 'staff', -- 'staff','customer','system'
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_complaint_msg_complaint ON public.complaint_messages(complaint_id);
ALTER TABLE public.complaint_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage complaint messages" ON public.complaint_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office') OR public.has_role(auth.uid(), 'agent'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office') OR public.has_role(auth.uid(), 'agent'));

-- ===== NOTIFICATIONS =====

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID, -- NULL = broadcast to all admins
  recipient_role TEXT, -- 'admin','office','agent','driver'
  notification_type TEXT NOT NULL, -- 'booking','complaint','incident','compliance','payment','system'
  severity TEXT NOT NULL DEFAULT 'info', -- 'info','warning','error','success'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_recipient ON public.admin_notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_role ON public.admin_notifications(recipient_role, is_read);
CREATE INDEX idx_notifications_created ON public.admin_notifications(created_at DESC);
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.admin_notifications
  FOR SELECT TO authenticated
  USING (
    auth.uid() = recipient_id
    OR (recipient_role IS NOT NULL AND public.has_role(auth.uid(), recipient_role::app_role))
    OR (recipient_id IS NULL AND public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Users mark own notifications read" ON public.admin_notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins create notifications" ON public.admin_notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'office'));

-- ===== HELPER: GENERATE COMPLAINT TICKET NUMBER =====

CREATE OR REPLACE FUNCTION public.generate_complaint_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_number TEXT;
  year_part TEXT;
  seq_part TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  LOOP
    seq_part := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    new_number := 'BES-' || year_part || '-' || seq_part;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.complaints WHERE ticket_number = new_number);
  END LOOP;
  RETURN new_number;
END;
$$;

-- ===== HELPER: COMPLIANCE STATUS AUTO-UPDATE =====

CREATE OR REPLACE FUNCTION public.update_compliance_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSIF NEW.due_date <= CURRENT_DATE + (NEW.reminder_days || ' days')::interval THEN
    NEW.status := 'due_soon';
  ELSE
    NEW.status := 'valid';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_compliance_status
  BEFORE INSERT OR UPDATE ON public.fleet_compliance
  FOR EACH ROW EXECUTE FUNCTION public.update_compliance_status();

-- ===== UPDATED_AT TRIGGERS =====

CREATE TRIGGER trg_workshops_updated BEFORE UPDATE ON public.workshops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_toll_updated BEFORE UPDATE ON public.toll_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_licenses_updated BEFORE UPDATE ON public.driver_licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_payroll_updated BEFORE UPDATE ON public.payroll_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_b2b_updated BEFORE UPDATE ON public.b2b_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_b2b_contracts_updated BEFORE UPDATE ON public.b2b_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_complaints_updated BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_damages_updated BEFORE UPDATE ON public.vehicle_damages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== REALTIME FOR NOTIFICATIONS & COMPLAINTS =====

ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;