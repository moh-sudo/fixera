-- ============================================================
-- FIXERA: Payment failures log
-- Logs every failed STK Push response from Daraja so admin can
-- see failure trends, retry manually, and debug with customers.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_failures (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id           UUID REFERENCES payments(id) ON DELETE SET NULL,
  checkout_request_id  TEXT,
  result_code          TEXT,
  result_description   TEXT,
  phone                TEXT,
  amount               NUMERIC(12,2),
  raw_callback         JSONB,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pay_fail_payment  ON payment_failures(payment_id)          WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pay_fail_checkout ON payment_failures(checkout_request_id) WHERE checkout_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pay_fail_created  ON payment_failures(created_at DESC);

ALTER TABLE payment_failures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read all payment failures" ON payment_failures;
CREATE POLICY "Admins read all payment failures"
  ON payment_failures FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "System inserts payment failures" ON payment_failures;
CREATE POLICY "System inserts payment failures"
  ON payment_failures FOR INSERT TO authenticated
  WITH CHECK (true);
