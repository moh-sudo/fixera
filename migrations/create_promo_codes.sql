-- Promo Codes / Discount Codes

CREATE TABLE IF NOT EXISTS promo_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,  -- e.g. 'FIXERA1', 'CLEAN20'
  description     TEXT,
  discount_type   TEXT NOT NULL DEFAULT 'percent', -- percent | fixed
  discount_value  NUMERIC NOT NULL,                -- % or KSh amount
  min_order       NUMERIC NOT NULL DEFAULT 0,      -- minimum order value to apply
  max_discount    NUMERIC,                         -- cap on percent discounts (KSh)
  max_uses        INT,                             -- NULL = unlimited
  used_count      INT NOT NULL DEFAULT 0,
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until     TIMESTAMPTZ,                     -- NULL = no expiry
  target_service  TEXT,                            -- NULL = all services
  target_role     TEXT,                            -- NULL = all users (new | returning | vip)
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Track which user used which code on which payment
CREATE TABLE IF NOT EXISTS promo_code_uses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id     UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id  UUID,
  discount_applied NUMERIC NOT NULL,
  used_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (code_id, user_id)  -- one use per user per code
);

CREATE INDEX IF NOT EXISTS idx_promo_code       ON promo_codes (code);
CREATE INDEX IF NOT EXISTS idx_promo_active     ON promo_codes (is_active);
CREATE INDEX IF NOT EXISTS idx_promo_uses_user  ON promo_code_uses (user_id);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active promo_codes" ON promo_codes;
CREATE POLICY "Public read active promo_codes"
  ON promo_codes FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Users read own uses" ON promo_code_uses;
CREATE POLICY "Users read own uses"
  ON promo_code_uses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own uses" ON promo_code_uses;
CREATE POLICY "Users insert own uses"
  ON promo_code_uses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage promo_codes" ON promo_codes;
CREATE POLICY "Admins manage promo_codes"
  ON promo_codes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Admins read all uses" ON promo_code_uses;
CREATE POLICY "Admins read all uses"
  ON promo_code_uses FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
