-- ============================================================
-- FIXERA: Guest Contacts table (Bolt-model lead capture)
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS guest_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(100),
  source VARCHAR(50) DEFAULT 'guest_login',
  visited_at TIMESTAMPTZ DEFAULT now(),
  converted_to_user BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_contacts_phone ON guest_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_guest_contacts_email ON guest_contacts(email);
CREATE INDEX IF NOT EXISTS idx_guest_contacts_converted ON guest_contacts(converted_to_user);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE guest_contacts ENABLE ROW LEVEL SECURITY;

-- Anonymous visitors (guests) must be able to register their contact
DROP POLICY IF EXISTS "Guests can insert their contact" ON guest_contacts;
CREATE POLICY "Guests can insert their contact"
  ON guest_contacts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow upsert (update own row by phone) for re-visits + conversion marking
DROP POLICY IF EXISTS "Guests can update contact rows" ON guest_contacts;
CREATE POLICY "Guests can update contact rows"
  ON guest_contacts FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Only admins can read the leads list (via service role or is_admin profile)
DROP POLICY IF EXISTS "Admins can read guest contacts" ON guest_contacts;
CREATE POLICY "Admins can read guest contacts"
  ON guest_contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
