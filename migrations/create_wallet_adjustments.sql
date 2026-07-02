-- Admin wallet adjustment log
-- Tracks manual top-ups and corrections made by admins

CREATE TABLE IF NOT EXISTS wallet_adjustments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,   -- nullable: survives admin account deletion
  amount      NUMERIC NOT NULL,   -- positive = top-up, negative = deduction
  reason      TEXT NOT NULL,
  balance_before NUMERIC,
  balance_after  NUMERIC,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_adj_partner ON wallet_adjustments (partner_id);

ALTER TABLE wallet_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners read own adjustments" ON wallet_adjustments;
CREATE POLICY "Partners read own adjustments"
  ON wallet_adjustments FOR SELECT USING (auth.uid() = partner_id);

DROP POLICY IF EXISTS "Admins manage adjustments" ON wallet_adjustments;
CREATE POLICY "Admins manage adjustments"
  ON wallet_adjustments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
