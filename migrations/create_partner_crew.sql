-- ============================================================
-- FIXERA: Partner Crew Registry (universal)
-- Permanent Fixera record of every worker a partner employs.
-- Even when a partner "temporarily" assigns a worker to a job,
-- their identity + photo lives here for safety / accountability.
--
-- Applies to: Movers, Vendors, Water Carriers, Suppliers.
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_crew_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The partner company that owns / employs this worker
  partner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_type    VARCHAR(20) NOT NULL,
  -- partner_type: 'mover' | 'vendor' | 'water_carrier' | 'supplier'

  -- Identity (ALWAYS required — this is the safety guarantee)
  full_name   VARCHAR(150) NOT NULL,
  national_id VARCHAR(30)  NOT NULL,
  phone       VARCHAR(20),
  photo_url   TEXT,

  -- Role / position within this partner's operations
  default_position VARCHAR(40) NOT NULL,
  -- Movers:        driver | team_leader | loader | packer
  -- Vendors:       washer | ironer | technician | delivery | supervisor
  -- Water carriers: driver | loader | delivery_attendant | supervisor
  -- Suppliers:     warehouse | driver | loader | supervisor

  -- Status & verification
  status          VARCHAR(20) DEFAULT 'active',
  -- active | inactive | suspended
  fixera_verified BOOLEAN     DEFAULT false,
  -- Set true after Fixera admin reviews ID + photo

  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Each partner can't register the same national ID twice
  UNIQUE(partner_user_id, national_id)
);

CREATE INDEX IF NOT EXISTS idx_crew_partner   ON partner_crew_members(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_crew_type      ON partner_crew_members(partner_type);
CREATE INDEX IF NOT EXISTS idx_crew_status    ON partner_crew_members(status);
CREATE INDEX IF NOT EXISTS idx_crew_verified  ON partner_crew_members(fixera_verified);

-- ── Storage bucket for crew photos ──────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('crew-photos', 'crew-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Partners upload crew photos" ON storage.objects;
CREATE POLICY "Partners upload crew photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'crew-photos');

DROP POLICY IF EXISTS "Public read crew photos" ON storage.objects;
CREATE POLICY "Public read crew photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'crew-photos');

DROP POLICY IF EXISTS "Partners replace own crew photos" ON storage.objects;
CREATE POLICY "Partners replace own crew photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'crew-photos');

DROP POLICY IF EXISTS "Partners delete own crew photos" ON storage.objects;
CREATE POLICY "Partners delete own crew photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'crew-photos');

-- ── Row Level Security ─────────────────────────────────────
ALTER TABLE partner_crew_members ENABLE ROW LEVEL SECURITY;

-- Partners manage only their own crew
DROP POLICY IF EXISTS "Partners insert own crew" ON partner_crew_members;
CREATE POLICY "Partners insert own crew"
  ON partner_crew_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = partner_user_id);

DROP POLICY IF EXISTS "Partners read own crew" ON partner_crew_members;
CREATE POLICY "Partners read own crew"
  ON partner_crew_members FOR SELECT TO authenticated
  USING (auth.uid() = partner_user_id);

DROP POLICY IF EXISTS "Partners update own crew" ON partner_crew_members;
CREATE POLICY "Partners update own crew"
  ON partner_crew_members FOR UPDATE TO authenticated
  USING (auth.uid() = partner_user_id);

DROP POLICY IF EXISTS "Partners delete own crew" ON partner_crew_members;
CREATE POLICY "Partners delete own crew"
  ON partner_crew_members FOR DELETE TO authenticated
  USING (auth.uid() = partner_user_id);

-- Fixera admins see ALL crew across the platform (safety / verification)
DROP POLICY IF EXISTS "Admins read all crew" ON partner_crew_members;
CREATE POLICY "Admins read all crew"
  ON partner_crew_members FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));

DROP POLICY IF EXISTS "Admins update all crew" ON partner_crew_members;
CREATE POLICY "Admins update all crew"
  ON partner_crew_members FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));

-- Customers viewing an accepted move can read crew photos/names assigned
-- to their job (read-only via the moving_requests.assigned_crew JSONB,
-- which already contains snapshotted name + role + photo_url).
-- No direct customer access to partner_crew_members rows is needed.
