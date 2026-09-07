-- ============ DISPO COCKPIT ============

CREATE TABLE public.dispo_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  contact_person text,
  email text,
  phone text,
  address text,
  city text,
  postal_code text,
  notes text,
  last_contact_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispo_customers TO authenticated;
GRANT ALL ON public.dispo_customers TO service_role;
ALTER TABLE public.dispo_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dispo staff manage customers" ON public.dispo_customers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

CREATE TABLE public.dispo_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES public.dispo_customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  company text,
  email text,
  phone text,
  passengers integer NOT NULL DEFAULT 0,
  origin text,
  destination text,
  waypoints jsonb NOT NULL DEFAULT '[]'::jsonb,
  departure_date date,
  departure_time time,
  return_date date,
  return_time time,
  distance_km numeric,
  duration_min integer,
  bus_id uuid,
  driver_user_id uuid,
  second_driver_user_id uuid,
  price_net numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 19,
  price_gross numeric NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0,
  payout numeric NOT NULL DEFAULT 0,
  estimated_cost numeric NOT NULL DEFAULT 0,
  margin numeric NOT NULL DEFAULT 0,
  calculation jsonb NOT NULL DEFAULT '{}'::jsonb,
  luggage text,
  requirements text,
  notes text,
  status text NOT NULL DEFAULT 'anfrage',
  source text NOT NULL DEFAULT 'manuell',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispo_orders TO authenticated;
GRANT ALL ON public.dispo_orders TO service_role;
ALTER TABLE public.dispo_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dispo staff manage orders" ON public.dispo_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE INDEX idx_dispo_orders_departure ON public.dispo_orders(departure_date);
CREATE INDEX idx_dispo_orders_status ON public.dispo_orders(status);

CREATE TABLE public.dispo_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_number text NOT NULL UNIQUE,
  order_id uuid NOT NULL REFERENCES public.dispo_orders(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  inclusions text,
  discount_percent numeric NOT NULL DEFAULT 0,
  price_net numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 19,
  price_gross numeric NOT NULL DEFAULT 0,
  valid_until date,
  notes text,
  status text NOT NULL DEFAULT 'entwurf',
  pdf_url text,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispo_offers TO authenticated;
GRANT ALL ON public.dispo_offers TO service_role;
ALTER TABLE public.dispo_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dispo staff manage offers" ON public.dispo_offers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

CREATE TABLE public.dispo_email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  email_address text NOT NULL,
  provider text NOT NULL DEFAULT 'imap',
  imap_host text,
  imap_port integer,
  imap_secure boolean NOT NULL DEFAULT true,
  smtp_host text,
  smtp_port integer,
  username text,
  secret_name text,
  is_active boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  last_sync_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispo_email_accounts TO authenticated;
GRANT ALL ON public.dispo_email_accounts TO service_role;
ALTER TABLE public.dispo_email_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dispo staff manage mail accounts" ON public.dispo_email_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

CREATE TABLE public.dispo_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.dispo_email_accounts(id) ON DELETE SET NULL,
  message_uid text,
  folder text NOT NULL DEFAULT 'inbox',
  direction text NOT NULL DEFAULT 'incoming',
  from_name text,
  from_email text,
  to_email text,
  subject text,
  body_text text,
  body_html text,
  received_at timestamptz NOT NULL DEFAULT now(),
  is_read boolean NOT NULL DEFAULT false,
  is_inquiry boolean NOT NULL DEFAULT false,
  ai_status text NOT NULL DEFAULT 'pending',
  ai_confidence numeric,
  extracted jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_id uuid REFERENCES public.dispo_orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispo_emails TO authenticated;
GRANT ALL ON public.dispo_emails TO service_role;
ALTER TABLE public.dispo_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dispo staff manage emails" ON public.dispo_emails FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE INDEX idx_dispo_emails_folder ON public.dispo_emails(folder, received_at DESC);

-- Nummernkreise
CREATE OR REPLACE FUNCTION public.generate_dispo_order_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_year text := to_char(now(),'YYYY'); v_seq int;
BEGIN
  SELECT COALESCE(MAX((regexp_replace(order_number,'^DP-\d{4}-','' ))::int),0)+1
    INTO v_seq FROM public.dispo_orders WHERE order_number LIKE 'DP-'||v_year||'-%';
  RETURN 'DP-'||v_year||'-'||lpad(v_seq::text,5,'0');
END; $$;

CREATE OR REPLACE FUNCTION public.set_dispo_order_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_dispo_order_number();
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_dispo_order_number BEFORE INSERT ON public.dispo_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_dispo_order_number();

CREATE OR REPLACE FUNCTION public.generate_dispo_offer_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_year text := to_char(now(),'YYYY'); v_seq int;
BEGIN
  SELECT COALESCE(MAX((regexp_replace(offer_number,'^AN-\d{4}-','' ))::int),0)+1
    INTO v_seq FROM public.dispo_offers WHERE offer_number LIKE 'AN-'||v_year||'-%';
  RETURN 'AN-'||v_year||'-'||lpad(v_seq::text,5,'0');
END; $$;

CREATE OR REPLACE FUNCTION public.set_dispo_offer_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.offer_number IS NULL OR NEW.offer_number = '' THEN
    NEW.offer_number := public.generate_dispo_offer_number();
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_dispo_offer_number BEFORE INSERT ON public.dispo_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_dispo_offer_number();

CREATE TRIGGER trg_dispo_customers_updated BEFORE UPDATE ON public.dispo_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_dispo_orders_updated BEFORE UPDATE ON public.dispo_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_dispo_offers_updated BEFORE UPDATE ON public.dispo_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_dispo_emails_updated BEFORE UPDATE ON public.dispo_emails
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_dispo_mailacc_updated BEFORE UPDATE ON public.dispo_email_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();