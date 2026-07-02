-- ============================================================
--  Fixera — Service Area Management
--  Run once in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS service_areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county      TEXT NOT NULL,
  sub_county  TEXT,
  label       TEXT NOT NULL,       -- display name, e.g. "Westlands, Nairobi"
  is_active   BOOLEAN NOT NULL DEFAULT true,
  partner_roles JSONB DEFAULT '["worker","vendor","rider","supplier","mover","water_carrier"]',
  -- which partner roles operate here
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_areas_active ON service_areas(is_active);
CREATE INDEX IF NOT EXISTS idx_service_areas_county ON service_areas(county);

-- Unique constraint required for ON CONFLICT deduplication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_county_subcounty'
      AND conrelid = 'service_areas'::regclass
  ) THEN
    ALTER TABLE service_areas
      ADD CONSTRAINT uq_county_subcounty UNIQUE (county, sub_county);
  END IF;
END $$;

ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to service_areas" ON service_areas;
CREATE POLICY "Admin full access to service_areas" ON service_areas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed initial Nairobi coverage areas
INSERT INTO service_areas (county, sub_county, label) VALUES
  ('Nairobi', 'Westlands',    'Westlands, Nairobi'),
  ('Nairobi', 'Kilimani',     'Kilimani, Nairobi'),
  ('Nairobi', 'Karen',        'Karen, Nairobi'),
  ('Nairobi', 'Lavington',    'Lavington, Nairobi'),
  ('Nairobi', 'Parklands',    'Parklands, Nairobi'),
  ('Nairobi', 'Kasarani',     'Kasarani, Nairobi'),
  ('Nairobi', 'Kileleshwa',   'Kileleshwa, Nairobi'),
  ('Nairobi', 'Gigiri',       'Gigiri, Nairobi'),
  ('Nairobi', 'Runda',        'Runda, Nairobi'),
  ('Nairobi', 'Muthaiga',     'Muthaiga, Nairobi'),
  ('Nairobi', 'Upperhill',    'Upperhill, Nairobi'),
  ('Nairobi', 'Eastleigh',    'Eastleigh, Nairobi'),
  ('Nairobi', 'South B',      'South B, Nairobi'),
  ('Nairobi', 'South C',      'South C, Nairobi'),
  ('Nairobi', 'Langata',      'Langata, Nairobi'),
  ('Nairobi', 'Embakasi',     'Embakasi, Nairobi'),
  ('Nairobi', 'Buruburu',     'Buruburu, Nairobi'),
  ('Nairobi', 'Roysambu',     'Roysambu, Nairobi'),
  ('Nairobi', 'CBD',          'CBD, Nairobi'),
  ('Kiambu',  'Ruaka',        'Ruaka, Kiambu'),
  ('Kiambu',  'Ruiru',        'Ruiru, Kiambu'),
  ('Kiambu',  'Kikuyu',       'Kikuyu, Kiambu'),
  ('Kajiado', 'Rongai',       'Rongai, Kajiado'),
  ('Kajiado', 'Ngong',        'Ngong, Kajiado'),
  ('Kajiado', 'Kitengela',    'Kitengela, Kajiado'),
  ('Machakos','Syokimau',     'Syokimau, Machakos')
ON CONFLICT (county, sub_county) DO NOTHING;
