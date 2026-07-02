-- ============================================================
-- FIXERA: Receipts table + auto-generation trigger
-- Auto-inserts a receipt whenever payments.status → 'paid'
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Drop old table if it exists with wrong schema
DROP TABLE IF EXISTS receipts CASCADE;

CREATE TABLE receipts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID,
  supplier_order_id UUID,
  moving_request_id UUID,
  payment_id      UUID REFERENCES payments(id) ON DELETE SET NULL,
  customer_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id       UUID,
  amount          NUMERIC(12,2) NOT NULL,
  commission      NUMERIC(12,2),
  partner_amount  NUMERIC(12,2),
  method          TEXT,
  mpesa_ref       TEXT,
  service         TEXT,
  address         TEXT,
  generated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipts_customer ON receipts(customer_id);
CREATE INDEX IF NOT EXISTS idx_receipts_worker   ON receipts(worker_id)    WHERE worker_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_payment  ON receipts(payment_id)   WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_booking  ON receipts(booking_id)   WHERE booking_id IS NOT NULL;

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers read own receipts" ON receipts;
CREATE POLICY "Customers read own receipts"
  ON receipts FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Workers read own receipts" ON receipts;
CREATE POLICY "Workers read own receipts"
  ON receipts FOR SELECT TO authenticated
  USING (worker_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all receipts" ON receipts;
CREATE POLICY "Admins read all receipts"
  ON receipts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Allow the trigger (runs as SECURITY DEFINER) to insert
DROP POLICY IF EXISTS "System inserts receipts" ON receipts;
CREATE POLICY "System inserts receipts"
  ON receipts FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── Auto-generate receipt when payment is marked paid ───────
CREATE OR REPLACE FUNCTION generate_receipt_on_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_service TEXT;
  v_address TEXT;
BEGIN
  -- Only fire when transitioning TO 'paid'
  IF NEW.status <> 'paid' OR OLD.status = 'paid' THEN
    RETURN NEW;
  END IF;

  -- Avoid duplicate receipts for the same payment
  IF EXISTS (SELECT 1 FROM receipts WHERE payment_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Try to get service + address from the referenced booking
  IF NEW.ref_type = 'booking' AND NEW.ref_id IS NOT NULL THEN
    SELECT service, address INTO v_service, v_address
    FROM bookings WHERE id = NEW.ref_id;
  END IF;

  INSERT INTO receipts (
    booking_id,
    supplier_order_id,
    moving_request_id,
    payment_id,
    customer_id,
    worker_id,
    amount,
    commission,
    partner_amount,
    method,
    mpesa_ref,
    service,
    address,
    generated_at
  ) VALUES (
    CASE WHEN NEW.ref_type = 'booking'          THEN NEW.ref_id ELSE NULL END,
    CASE WHEN NEW.ref_type = 'supplier_order'   THEN NEW.ref_id ELSE NULL END,
    CASE WHEN NEW.ref_type = 'moving_request'   THEN NEW.ref_id ELSE NULL END,
    NEW.id,
    NEW.customer_id,
    NEW.payee_id,
    NEW.amount,
    NEW.commission_amount,
    NEW.partner_amount,
    NEW.method,
    NEW.mpesa_ref,
    v_service,
    v_address,
    now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_receipt ON payments;
CREATE TRIGGER trg_generate_receipt
  AFTER UPDATE OF status ON payments
  FOR EACH ROW EXECUTE FUNCTION generate_receipt_on_payment();
