-- ============================================================
-- FIXERA: Admin Platform Settings + Audit Log
-- Single-row config the owner edits in Admin → Settings:
-- company details, support contacts, branding, commission rates,
-- wallet minimum, policies, and Fixera's own collection accounts.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id INT PRIMARY KEY DEFAULT 1,
  -- Company
  company_name     TEXT DEFAULT 'Fixera Company Limited',
  kra_pin          TEXT,
  reg_number       TEXT,
  address          TEXT,
  -- Support contacts (shown across both apps)
  support_phone    TEXT,
  support_whatsapp TEXT,
  support_email    TEXT DEFAULT 'support@fixera.co.ke',
  -- Branding
  logo_url         TEXT,
  brand_color      TEXT DEFAULT '#C9A020',
  -- Finance
  commission_rates JSONB DEFAULT '{"worker":15,"rider":15,"vendor":20,"supplier":20,"mover":20,"water_carrier":20}',
  wallet_minimum   NUMERIC(10,2) DEFAULT 500,
  -- Fixera's own collection accounts (where customer money lands)
  bank_name        TEXT,
  bank_account     TEXT,
  collection_mpesa TEXT,
  collection_paybill TEXT,
  -- Policies
  cancellation_policy JSONB DEFAULT '{"free_before":"confirmed","fee":100,"window_hours":2}',
  sla_hours        JSONB DEFAULT '{"operations":2,"trust_safety":1,"finance":24}',
  -- Notifications (admin prefs)
  notify_prefs     JSONB DEFAULT '{"new_partner":true,"new_dispute":true,"payout_request":true,"product_approval":true}',
  updated_at       TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);

-- Seed the single row
INSERT INTO platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ── Admin audit log ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   UUID,
  actor_name TEXT,
  action     TEXT NOT NULL,
  detail     TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at DESC);

-- ── Branding storage bucket (logo) ──────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read branding" ON storage.objects;
CREATE POLICY "Public read branding" ON storage.objects FOR SELECT USING (bucket_id = 'branding');
DROP POLICY IF EXISTS "Auth write branding" ON storage.objects;
CREATE POLICY "Auth write branding" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'branding');
DROP POLICY IF EXISTS "Auth update branding" ON storage.objects;
CREATE POLICY "Auth update branding" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'branding');

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log   ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can READ settings (apps need support contacts, logo,
-- commission rates). Only admins can WRITE.
DROP POLICY IF EXISTS "Anyone reads settings" ON platform_settings;
CREATE POLICY "Anyone reads settings" ON platform_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins write settings" ON platform_settings;
CREATE POLICY "Admins write settings" ON platform_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "Admins read audit" ON admin_audit_log;
CREATE POLICY "Admins read audit" ON admin_audit_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "Admins write audit" ON admin_audit_log;
CREATE POLICY "Admins write audit" ON admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
