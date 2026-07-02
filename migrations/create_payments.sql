-- ============================================================
-- FIXERA: Payments Layer (M-Pesa-ready, cash-capable now)
-- Records every payment a customer makes to a partner, the
-- Fixera commission, and the settlement status. M-Pesa is a
-- 'method' that is stubbed today and wired to Daraja later —
-- this table does not change when M-Pesa goes live.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  customer_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payee_id     UUID,                 -- partner receiving the money
  payee_role   TEXT,                 -- worker | rider | vendor | supplier | mover | water_carrier

  -- What this payment is for
  ref_type     TEXT,                 -- booking | moving_request | supplier_order
  ref_id       UUID,
  purpose      TEXT,                 -- service | materials | delivery | move | water
  description  TEXT,

  -- Money (commission split per legal doc)
  amount           NUMERIC(12,2) NOT NULL,
  commission_rate  NUMERIC(5,2),     -- e.g. 15.00 or 20.00
  commission_amount NUMERIC(12,2),
  partner_amount   NUMERIC(12,2),

  -- How it was paid
  method   TEXT DEFAULT 'cash',      -- cash | mpesa
  status   TEXT DEFAULT 'pending',   -- pending | paid | failed
  mpesa_ref TEXT,                     -- M-Pesa transaction id (when live)

  -- Settlement (cash collected by partner → Fixera reconciles commission)
  settlement_status TEXT DEFAULT 'unsettled', -- unsettled | settled
  paid_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee    ON payments(payee_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref      ON payments(ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_payments_status   ON payments(status);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers manage own payments" ON payments;
CREATE POLICY "Customers manage own payments"
  ON payments FOR ALL TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Payees read their payments" ON payments;
CREATE POLICY "Payees read their payments"
  ON payments FOR SELECT TO authenticated
  USING (payee_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all payments" ON payments;
CREATE POLICY "Admins read all payments"
  ON payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
