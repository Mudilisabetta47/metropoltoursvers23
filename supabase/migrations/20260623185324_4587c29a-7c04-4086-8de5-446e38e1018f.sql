
CREATE TABLE public.payment_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID,
  user_id UUID,
  provider TEXT NOT NULL DEFAULT 'paypal',
  operation TEXT NOT NULL,
  order_id TEXT,
  capture_id TEXT,
  expected_amount NUMERIC(12,2),
  actual_amount NUMERIC(12,2),
  currency TEXT,
  paypal_status TEXT,
  result_status TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_audit_log TO authenticated;
GRANT ALL ON public.payment_audit_log TO service_role;

ALTER TABLE public.payment_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payment audit log"
ON public.payment_audit_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_payment_audit_booking ON public.payment_audit_log(booking_id, created_at DESC);
CREATE INDEX idx_payment_audit_order ON public.payment_audit_log(order_id);
CREATE INDEX idx_payment_audit_result ON public.payment_audit_log(result_status, created_at DESC);
