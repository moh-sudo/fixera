-- ============================================================
-- FIXERA: Refunds table + execution function
-- Admin sets refund_decision = 'approved' on a support ticket →
-- admin then calls execute_refund() which credits the customer.
-- Initial method: wallet_credit (customer Fixera wallet balance).
-- B2C M-Pesa payout to be added in Phase 4.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Customer wallet balance (separate from partner wallet) ──
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12,2) DEFAULT 0;
COMMENT ON COLUMN profiles.wallet_balance IS 'Customer Fixera wallet credit (e.g. from refunds). Applied to future bookings.';

-- ── Refunds table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refunds (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id      UUID REFERENCES support_tickets(id) ON DELETE SET NULL,
  payment_id     UUID REFERENCES payments(id)        ON DELETE SET NULL,
  booking_id     UUID,
  customer_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount         NUMERIC(12,2) NOT NULL,
  reason         TEXT,
  method         TEXT DEFAULT 'wallet_credit',
  -- wallet_credit | mpesa_b2c (future)
  status         TEXT DEFAULT 'pending',
  -- pending | processing | completed | failed
  mpesa_ref      TEXT,
  admin_id       UUID REFERENCES auth.users(id),
  approved_at    TIMESTAMPTZ,
  executed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refunds_customer ON refunds(customer_id);
CREATE INDEX IF NOT EXISTS idx_refunds_ticket   ON refunds(ticket_id)   WHERE ticket_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_refunds_payment  ON refunds(payment_id)  WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_refunds_status   ON refunds(status);

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers read own refunds" ON refunds;
CREATE POLICY "Customers read own refunds"
  ON refunds FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all refunds" ON refunds;
CREATE POLICY "Admins manage all refunds"
  ON refunds FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ── execute_refund(): credits customer wallet, marks refund done ─
CREATE OR REPLACE FUNCTION execute_refund(p_refund_id UUID, p_admin_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_refund refunds%ROWTYPE;
BEGIN
  SELECT * INTO v_refund FROM refunds WHERE id = p_refund_id FOR UPDATE;

  IF v_refund.id IS NULL THEN
    RAISE EXCEPTION 'Refund % not found', p_refund_id;
  END IF;

  IF v_refund.status <> 'pending' THEN
    RAISE EXCEPTION 'Refund % is already %', p_refund_id, v_refund.status;
  END IF;

  -- Credit customer wallet
  UPDATE profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + v_refund.amount
  WHERE id = v_refund.customer_id;

  -- Mark refund completed
  UPDATE refunds SET
    status      = 'completed',
    method      = 'wallet_credit',
    admin_id    = p_admin_id,
    executed_at = now()
  WHERE id = p_refund_id;
END;
$$;
