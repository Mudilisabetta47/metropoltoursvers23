-- ============ CATEGORIES ============
CREATE TABLE public.shop_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.shop_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shop_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_categories TO authenticated;
GRANT ALL ON public.shop_categories TO service_role;
ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_categories_public_read" ON public.shop_categories FOR SELECT USING (is_active = true);
CREATE POLICY "shop_categories_staff_all" ON public.shop_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- ============ PRODUCTS ============
CREATE TABLE public.shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.shop_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sku text,
  short_description text,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  compare_at_price numeric(10,2),
  tax_rate numeric(5,2) NOT NULL DEFAULT 19,
  stock integer NOT NULL DEFAULT 0,
  track_stock boolean NOT NULL DEFAULT true,
  weight_grams integer,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_new boolean NOT NULL DEFAULT false,
  is_bestseller boolean NOT NULL DEFAULT false,
  is_sale boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_shop_products_category ON public.shop_products(category_id);
CREATE INDEX idx_shop_products_published ON public.shop_products(is_published);
GRANT SELECT ON public.shop_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_products TO authenticated;
GRANT ALL ON public.shop_products TO service_role;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_products_public_read" ON public.shop_products FOR SELECT USING (is_published = true);
CREATE POLICY "shop_products_staff_all" ON public.shop_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- ============ VARIANTS ============
CREATE TABLE public.shop_product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  option_name text NOT NULL DEFAULT 'Variante',
  option_value text NOT NULL,
  sku text,
  price_modifier numeric(10,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_shop_variants_product ON public.shop_product_variants(product_id);
GRANT SELECT ON public.shop_product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_product_variants TO authenticated;
GRANT ALL ON public.shop_product_variants TO service_role;
ALTER TABLE public.shop_product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_variants_public_read" ON public.shop_product_variants FOR SELECT
  USING (is_active = true AND EXISTS (SELECT 1 FROM public.shop_products p WHERE p.id = product_id AND p.is_published = true));
CREATE POLICY "shop_variants_staff_all" ON public.shop_product_variants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- ============ SHIPPING METHODS ============
CREATE TABLE public.shop_shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  free_above numeric(10,2),
  delivery_time text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shop_shipping_methods TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_shipping_methods TO authenticated;
GRANT ALL ON public.shop_shipping_methods TO service_role;
ALTER TABLE public.shop_shipping_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_shipping_public_read" ON public.shop_shipping_methods FOR SELECT USING (is_active = true);
CREATE POLICY "shop_shipping_staff_all" ON public.shop_shipping_methods FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- ============ PAYMENT METHODS ============
CREATE TABLE public.shop_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT false,
  surcharge numeric(10,2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shop_payment_methods TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_payment_methods TO authenticated;
GRANT ALL ON public.shop_payment_methods TO service_role;
ALTER TABLE public.shop_payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_payments_public_read" ON public.shop_payment_methods FOR SELECT USING (is_active = true);
CREATE POLICY "shop_payments_staff_all" ON public.shop_payment_methods FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- ============ COUPONS ============
CREATE TABLE public.shop_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  percent_off numeric(5,2),
  amount_off numeric(10,2),
  min_order_value numeric(10,2) NOT NULL DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  max_redemptions integer,
  redemptions integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_coupons TO authenticated;
GRANT ALL ON public.shop_coupons TO service_role;
ALTER TABLE public.shop_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_coupons_staff_all" ON public.shop_coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

CREATE OR REPLACE FUNCTION public.validate_shop_coupon(_code text, _subtotal numeric)
RETURNS TABLE(code text, description text, percent_off numeric, amount_off numeric, valid boolean, error text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.shop_coupons%ROWTYPE;
BEGIN
  SELECT * INTO c FROM public.shop_coupons WHERE lower(shop_coupons.code) = lower(_code) LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT _code, NULL::text, NULL::numeric, NULL::numeric, false, 'Gutscheincode ungültig'::text; RETURN;
  END IF;
  IF NOT c.is_active THEN
    RETURN QUERY SELECT c.code, c.description, NULL::numeric, NULL::numeric, false, 'Gutschein inaktiv'::text; RETURN;
  END IF;
  IF c.valid_from IS NOT NULL AND now() < c.valid_from THEN
    RETURN QUERY SELECT c.code, c.description, NULL::numeric, NULL::numeric, false, 'Gutschein noch nicht gültig'::text; RETURN;
  END IF;
  IF c.valid_until IS NOT NULL AND now() > c.valid_until THEN
    RETURN QUERY SELECT c.code, c.description, NULL::numeric, NULL::numeric, false, 'Gutschein abgelaufen'::text; RETURN;
  END IF;
  IF c.max_redemptions IS NOT NULL AND c.redemptions >= c.max_redemptions THEN
    RETURN QUERY SELECT c.code, c.description, NULL::numeric, NULL::numeric, false, 'Gutschein bereits ausgeschöpft'::text; RETURN;
  END IF;
  IF _subtotal < c.min_order_value THEN
    RETURN QUERY SELECT c.code, c.description, NULL::numeric, NULL::numeric, false, ('Mindestbestellwert ' || c.min_order_value || ' € nicht erreicht')::text; RETURN;
  END IF;
  RETURN QUERY SELECT c.code, c.description, c.percent_off, c.amount_off, true, NULL::text;
END; $$;
GRANT EXECUTE ON FUNCTION public.validate_shop_coupon(text, numeric) TO anon, authenticated;

-- ============ ORDERS ============
CREATE TABLE public.shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  phone text,
  billing_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  shipping_method_id uuid REFERENCES public.shop_shipping_methods(id) ON DELETE SET NULL,
  shipping_method_name text,
  shipping_cost numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  coupon_code text,
  total numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text,
  payment_status text NOT NULL DEFAULT 'pending',
  status text NOT NULL DEFAULT 'new',
  tracking_number text,
  customer_note text,
  internal_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_shop_orders_user ON public.shop_orders(user_id);
CREATE INDEX idx_shop_orders_created ON public.shop_orders(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_orders TO authenticated;
GRANT ALL ON public.shop_orders TO service_role;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_orders_own_read" ON public.shop_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE POLICY "shop_orders_staff_write" ON public.shop_orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));
CREATE POLICY "shop_orders_staff_delete" ON public.shop_orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.shop_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.shop_products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.shop_product_variants(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  variant_label text,
  sku text,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  line_total numeric(10,2) NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_shop_order_items_order ON public.shop_order_items(order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_order_items TO authenticated;
GRANT ALL ON public.shop_order_items TO service_role;
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_order_items_read" ON public.shop_order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shop_orders o WHERE o.id = order_id
    AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))));
CREATE POLICY "shop_order_items_staff_all" ON public.shop_order_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

CREATE OR REPLACE FUNCTION public.generate_shop_order_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v text;
BEGIN
  LOOP
    v := 'SH-' || to_char(now(),'YYYY') || '-' || upper(substr(md5(random()::text),1,6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.shop_orders WHERE order_number = v);
  END LOOP;
  RETURN v;
END; $$;

-- ============ REVIEWS ============
CREATE TABLE public.shop_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  comment text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_shop_reviews_product ON public.shop_reviews(product_id);
GRANT SELECT ON public.shop_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_reviews TO authenticated;
GRANT ALL ON public.shop_reviews TO service_role;
ALTER TABLE public.shop_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_reviews_public_read" ON public.shop_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "shop_reviews_own_read" ON public.shop_reviews FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "shop_reviews_own_insert" ON public.shop_reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_approved = false);
CREATE POLICY "shop_reviews_staff_all" ON public.shop_reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- ============ WISHLIST ============
CREATE TABLE public.shop_wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.shop_wishlist TO authenticated;
GRANT ALL ON public.shop_wishlist TO service_role;
ALTER TABLE public.shop_wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_wishlist_own" ON public.shop_wishlist FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ SETTINGS ============
CREATE TABLE public.shop_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shop_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_settings TO authenticated;
GRANT ALL ON public.shop_settings TO service_role;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_settings_public_read" ON public.shop_settings FOR SELECT USING (true);
CREATE POLICY "shop_settings_staff_all" ON public.shop_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office'));

-- ============ TRIGGERS ============
CREATE TRIGGER trg_shop_categories_updated BEFORE UPDATE ON public.shop_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_shop_products_updated BEFORE UPDATE ON public.shop_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_shop_variants_updated BEFORE UPDATE ON public.shop_product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_shop_shipping_updated BEFORE UPDATE ON public.shop_shipping_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_shop_payments_updated BEFORE UPDATE ON public.shop_payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_shop_coupons_updated BEFORE UPDATE ON public.shop_coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_shop_orders_updated BEFORE UPDATE ON public.shop_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_shop_reviews_updated BEFORE UPDATE ON public.shop_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();