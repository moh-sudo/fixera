-- ============================================================
-- FIXERA: Mover Fleet Registration
-- Per FIXERA-LEGAL-DOCUMENTATION §1007 §2: movers must register all
-- vehicles with insurance + condition certificates before going live.
-- Quotes pull plate # from this table (not free-typed).
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS mover_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Vehicle identity
  vehicle_type  VARCHAR(30) NOT NULL,
  -- pickup | van | truck-3t | truck-5t | truck-10t
  plate_number  VARCHAR(20) NOT NULL,
  make          VARCHAR(100),
  model         VARCHAR(100),
  year          INT,
  color         VARCHAR(50),
  capacity_tons NUMERIC(4,1),

  -- Documents (photos array + logbook + insurance docs)
  photo_urls   JSONB DEFAULT '[]',
  logbook_url  TEXT,

  -- Insurance (legal §1031: liability ≥ KSh 10M; §1081: lapse = suspension)
  insurance_provider      VARCHAR(150),
  insurance_policy_number VARCHAR(100),
  insurance_expiry        DATE,
  insurance_doc_url       TEXT,

  -- Status & verification
  status          VARCHAR(20) DEFAULT 'active',
  -- active | inactive | maintenance | suspended
  fixera_verified BOOLEAN     DEFAULT false,

  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Each mover can't register the same plate twice
  UNIQUE(mover_user_id, plate_number)
);

CREATE INDEX IF NOT EXISTS idx_fleet_mover    ON mover_vehicles(mover_user_id);
CREATE INDEX IF NOT EXISTS idx_fleet_status   ON mover_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_fleet_verified ON mover_vehicles(fixera_verified);

-- ── Storage bucket for vehicle photos + insurance docs ───────
INSERT INTO storage.buckets (id, name, public)
VALUES ('mover-vehicles', 'mover-vehicles', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Movers upload vehicle files" ON storage.objects;
CREATE POLICY "Movers upload vehicle files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mover-vehicles');

DROP POLICY IF EXISTS "Public read vehicle files" ON storage.objects;
CREATE POLICY "Public read vehicle files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'mover-vehicles');

DROP POLICY IF EXISTS "Movers update vehicle files" ON storage.objects;
CREATE POLICY "Movers update vehicle files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'mover-vehicles');

DROP POLICY IF EXISTS "Movers delete vehicle files" ON storage.objects;
CREATE POLICY "Movers delete vehicle files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'mover-vehicles');

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE mover_vehicles ENABLE ROW LEVEL SECURITY;

-- Movers manage only their own vehicles
DROP POLICY IF EXISTS "Movers insert own vehicles" ON mover_vehicles;
CREATE POLICY "Movers insert own vehicles"
  ON mover_vehicles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = mover_user_id);

DROP POLICY IF EXISTS "Movers read own vehicles" ON mover_vehicles;
CREATE POLICY "Movers read own vehicles"
  ON mover_vehicles FOR SELECT TO authenticated
  USING (auth.uid() = mover_user_id);

DROP POLICY IF EXISTS "Movers update own vehicles" ON mover_vehicles;
CREATE POLICY "Movers update own vehicles"
  ON mover_vehicles FOR UPDATE TO authenticated
  USING (auth.uid() = mover_user_id);

DROP POLICY IF EXISTS "Movers delete own vehicles" ON mover_vehicles;
CREATE POLICY "Movers delete own vehicles"
  ON mover_vehicles FOR DELETE TO authenticated
  USING (auth.uid() = mover_user_id);

-- Fixera admins see + manage ALL vehicles across the platform
DROP POLICY IF EXISTS "Admins read all vehicles" ON mover_vehicles;
CREATE POLICY "Admins read all vehicles"
  ON mover_vehicles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));

DROP POLICY IF EXISTS "Admins update all vehicles" ON mover_vehicles;
CREATE POLICY "Admins update all vehicles"
  ON mover_vehicles FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));
