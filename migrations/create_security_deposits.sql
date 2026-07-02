-- ─────────────────────────────────────────────────────────────────────────────
-- SECURITY DEPOSITS
-- Fixera collects a one-time refundable deposit from vendors, movers,
-- water carriers, and suppliers before they can go live on the platform.
-- Workers and riders use the wallet system instead (minimum KSh 500 topup).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add deposit columns to workers
ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS security_deposit        NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS security_deposit_status TEXT NOT NULL DEFAULT 'not_paid'
    CONSTRAINT deposit_status_check CHECK (
      security_deposit_status IN ('not_paid','pending','held','refunded','forfeited')
    ),
  ADD COLUMN IF NOT EXISTS security_deposit_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS security_deposit_ref     TEXT;

-- 2. Required deposit amount per partner role (stored in platform_settings)
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS deposit_requirements JSONB;

INSERT INTO platform_settings (id, deposit_requirements)
VALUES (1, '{
  "worker":        500,
  "rider":         500,
  "vendor":        5000,
  "supplier":      5000,
  "mover":         10000,
  "water_carrier": 3000
}'::jsonb)
ON CONFLICT (id) DO UPDATE
  SET deposit_requirements = COALESCE(
        platform_settings.deposit_requirements,
        EXCLUDED.deposit_requirements
      );

-- 3. Full deposit transaction ledger
CREATE TABLE IF NOT EXISTS deposit_transactions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID        NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN ('received','refund','forfeiture','adjustment')),
  amount     NUMERIC(10,2) NOT NULL,
  method     TEXT        NOT NULL DEFAULT 'mpesa',
  mpesa_ref  TEXT,
  admin_id   UUID        REFERENCES profiles(id),
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deposit_transactions_partner ON deposit_transactions(partner_id);

-- RLS: admins can read/write; partners can read their own
ALTER TABLE deposit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage deposit transactions" ON deposit_transactions
  FOR ALL TO authenticated
  USING   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Partners view own deposit transactions" ON deposit_transactions
  FOR SELECT TO authenticated
  USING (partner_id = auth.uid());

-- 4. When a deposit is marked 'received', automatically update
--    workers.security_deposit and security_deposit_status = 'held'
CREATE OR REPLACE FUNCTION trg_deposit_received_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.type = 'received' THEN
    UPDATE workers
    SET
      security_deposit        = security_deposit + NEW.amount,
      security_deposit_status = 'held',
      security_deposit_paid_at = COALESCE(security_deposit_paid_at, now()),
      security_deposit_ref    = COALESCE(security_deposit_ref, NEW.mpesa_ref)
    WHERE id = NEW.partner_id;
  ELSIF NEW.type = 'refund' THEN
    UPDATE workers
    SET
      security_deposit        = GREATEST(0, security_deposit - NEW.amount),
      security_deposit_status = CASE
        WHEN (security_deposit - NEW.amount) <= 0 THEN 'refunded'
        ELSE 'held'
      END
    WHERE id = NEW.partner_id;
  ELSIF NEW.type = 'forfeiture' THEN
    UPDATE workers
    SET
      security_deposit        = 0,
      security_deposit_status = 'forfeited'
    WHERE id = NEW.partner_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deposit_received ON deposit_transactions;
CREATE TRIGGER trg_deposit_received
  AFTER INSERT ON deposit_transactions
  FOR EACH ROW EXECUTE FUNCTION trg_deposit_received_fn();
