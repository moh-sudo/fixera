-- ============================================================
--  Fixera — Service Areas v2 Production Upgrade
--  Self-contained — run after create_service_areas.sql only.
--  Safe to re-run.
-- ============================================================

-- ── 0. Ensure UNIQUE constraint exists (required for ON CONFLICT) ─
-- Safe whether or not seed_kenya_service_areas.sql was run first.
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

-- ── 1. Schema additions ──────────────────────────────────────────
ALTER TABLE service_areas
  ADD COLUMN IF NOT EXISTS launch_phase TEXT NOT NULL DEFAULT 'future'
    CONSTRAINT chk_launch_phase CHECK (launch_phase IN ('launch', 'expansion', 'future')),
  ADD COLUMN IF NOT EXISTS service_radius_km NUMERIC(4,1) NOT NULL DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS available_services TEXT[] NOT NULL
    DEFAULT ARRAY['cleaning','moving','plumbing','electrical','painting','fumigation','laundry','groceries','water','workforce'],
  ADD COLUMN IF NOT EXISTS expansion_readiness INTEGER NOT NULL DEFAULT 0
    CONSTRAINT chk_expansion_readiness CHECK (expansion_readiness BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS metro TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 999,
  ADD COLUMN IF NOT EXISTS seed_batch TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_service_areas_metro        ON service_areas(metro);
CREATE INDEX IF NOT EXISTS idx_service_areas_launch_phase ON service_areas(launch_phase);
CREATE INDEX IF NOT EXISTS idx_service_areas_metro_active ON service_areas(metro, is_active);

-- ── 2. Fix RLS — admin writes only, authenticated reads ──────────
-- Drop old all-access policy
DROP POLICY IF EXISTS "Admin full access to service_areas" ON service_areas;
DROP POLICY IF EXISTS "Read service_areas"                 ON service_areas;
DROP POLICY IF EXISTS "Admin insert service_areas"         ON service_areas;
DROP POLICY IF EXISTS "Admin update service_areas"         ON service_areas;
DROP POLICY IF EXISTS "Admin delete service_areas"         ON service_areas;

-- Anyone logged in can read (booking form validates area; partners see coverage)
CREATE POLICY "Read service_areas" ON service_areas
  FOR SELECT TO authenticated USING (true);

-- Only admins can create areas
CREATE POLICY "Admin insert service_areas" ON service_areas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Only admins can update (covers activate/deactivate/edit)
CREATE POLICY "Admin update service_areas" ON service_areas
  FOR UPDATE TO authenticated
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Only admins can delete
CREATE POLICY "Admin delete service_areas" ON service_areas
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ── 3. Safe reseed ───────────────────────────────────────────────
-- Deletes ONLY system-seeded rows (seed_batch IS NOT NULL).
-- Admin-created areas (seed_batch = NULL) are never touched.
-- On first run: also removes old rows that have notes IS NULL (original v1 seed).
DELETE FROM service_areas
  WHERE seed_batch IS NOT NULL
     OR notes IS NULL;   -- covers v1 seed rows that predate seed_batch column

-- ── 4. Nairobi Metro — Phase 1 LAUNCH (active) ──────────────────
-- 32 urban neighbourhoods across Nairobi, Kiambu, Kajiado, Machakos
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, expansion_readiness, seed_batch)
VALUES
-- Core Nairobi neighbourhoods
('Nairobi','Westlands',     'Westlands, Nairobi',     true,'launch','Nairobi Metro', 1,4.0,90,'v2_nairobi_metro'),
('Nairobi','Kilimani',      'Kilimani, Nairobi',      true,'launch','Nairobi Metro', 2,3.0,92,'v2_nairobi_metro'),
('Nairobi','Lavington',     'Lavington, Nairobi',     true,'launch','Nairobi Metro', 3,3.0,88,'v2_nairobi_metro'),
('Nairobi','Kileleshwa',    'Kileleshwa, Nairobi',    true,'launch','Nairobi Metro', 4,3.0,87,'v2_nairobi_metro'),
('Nairobi','Karen',         'Karen, Nairobi',          true,'launch','Nairobi Metro', 5,6.0,80,'v2_nairobi_metro'),
('Nairobi','Runda',         'Runda, Nairobi',          true,'launch','Nairobi Metro', 6,4.0,78,'v2_nairobi_metro'),
('Nairobi','Gigiri',        'Gigiri, Nairobi',         true,'launch','Nairobi Metro', 7,3.0,82,'v2_nairobi_metro'),
('Nairobi','Muthaiga',      'Muthaiga, Nairobi',       true,'launch','Nairobi Metro', 8,3.0,84,'v2_nairobi_metro'),
('Nairobi','Parklands',     'Parklands, Nairobi',      true,'launch','Nairobi Metro', 9,3.0,86,'v2_nairobi_metro'),
('Nairobi','Upperhill',     'Upperhill, Nairobi',      true,'launch','Nairobi Metro',10,3.0,85,'v2_nairobi_metro'),
('Nairobi','CBD',           'CBD, Nairobi',            true,'launch','Nairobi Metro',11,2.0,95,'v2_nairobi_metro'),
('Nairobi','Eastleigh',     'Eastleigh, Nairobi',      true,'launch','Nairobi Metro',12,3.0,83,'v2_nairobi_metro'),
('Nairobi','South B',       'South B, Nairobi',        true,'launch','Nairobi Metro',13,3.0,81,'v2_nairobi_metro'),
('Nairobi','South C',       'South C, Nairobi',        true,'launch','Nairobi Metro',14,3.0,80,'v2_nairobi_metro'),
('Nairobi','Buruburu',      'Buruburu, Nairobi',       true,'launch','Nairobi Metro',15,4.0,79,'v2_nairobi_metro'),
('Nairobi','Donholm',       'Donholm, Nairobi',        true,'launch','Nairobi Metro',16,3.0,76,'v2_nairobi_metro'),
('Nairobi','Umoja',         'Umoja, Nairobi',          true,'launch','Nairobi Metro',17,4.0,75,'v2_nairobi_metro'),
('Nairobi','Zimmerman',     'Zimmerman, Nairobi',      true,'launch','Nairobi Metro',18,3.0,72,'v2_nairobi_metro'),
('Nairobi','Kahawa West',   'Kahawa West, Nairobi',    true,'launch','Nairobi Metro',19,4.0,70,'v2_nairobi_metro'),
('Nairobi','Kahawa Sukari', 'Kahawa Sukari, Nairobi',  true,'launch','Nairobi Metro',20,4.0,68,'v2_nairobi_metro'),
('Nairobi','Githurai',      'Githurai, Nairobi',       true,'launch','Nairobi Metro',21,4.0,67,'v2_nairobi_metro'),
('Nairobi','Kasarani',      'Kasarani, Nairobi',       true,'launch','Nairobi Metro',22,5.0,74,'v2_nairobi_metro'),
('Nairobi','Roysambu',      'Roysambu, Nairobi',       true,'launch','Nairobi Metro',23,4.0,73,'v2_nairobi_metro'),
('Nairobi','Langata',       'Langata, Nairobi',        true,'launch','Nairobi Metro',24,5.0,71,'v2_nairobi_metro'),
('Nairobi','Embakasi',      'Embakasi, Nairobi',       true,'launch','Nairobi Metro',25,5.0,69,'v2_nairobi_metro'),
-- Nairobi Metro extended (adjacent counties, same metro zone)
('Kiambu', 'Ruaka',         'Ruaka, Kiambu',           true,'launch','Nairobi Metro',26,4.0,65,'v2_nairobi_metro'),
('Kiambu', 'Ruiru',         'Ruiru, Kiambu',           true,'launch','Nairobi Metro',27,5.0,60,'v2_nairobi_metro'),
('Kiambu', 'Kikuyu',        'Kikuyu, Kiambu',          true,'launch','Nairobi Metro',28,5.0,58,'v2_nairobi_metro'),
('Kajiado','Rongai',        'Rongai, Kajiado',         true,'launch','Nairobi Metro',29,5.0,55,'v2_nairobi_metro'),
('Kajiado','Ngong',         'Ngong, Kajiado',          true,'launch','Nairobi Metro',30,6.0,52,'v2_nairobi_metro'),
('Kajiado','Kitengela',     'Kitengela, Kajiado',      true,'launch','Nairobi Metro',31,6.0,50,'v2_nairobi_metro'),
('Machakos','Syokimau',     'Syokimau, Machakos',      true,'launch','Nairobi Metro',32,4.0,62,'v2_nairobi_metro')
ON CONFLICT (county, sub_county) DO UPDATE SET
  is_active          = EXCLUDED.is_active,
  launch_phase       = EXCLUDED.launch_phase,
  metro              = EXCLUDED.metro,
  sort_order         = EXCLUDED.sort_order,
  service_radius_km  = EXCLUDED.service_radius_km,
  expansion_readiness= EXCLUDED.expansion_readiness,
  seed_batch         = EXCLUDED.seed_batch,
  updated_at         = now();

-- ── 5. Mombasa Metro — Phase 2 EXPANSION (inactive) ─────────────
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, expansion_readiness, seed_batch)
VALUES
('Mombasa','Nyali',       'Nyali, Mombasa',      false,'expansion','Mombasa Metro', 1,4.0,30,'v2_mombasa_metro'),
('Mombasa','Bamburi',     'Bamburi, Mombasa',    false,'expansion','Mombasa Metro', 2,4.0,28,'v2_mombasa_metro'),
('Mombasa','Shanzu',      'Shanzu, Mombasa',     false,'expansion','Mombasa Metro', 3,4.0,22,'v2_mombasa_metro'),
('Mombasa','Mtwapa',      'Mtwapa, Mombasa',     false,'expansion','Mombasa Metro', 4,4.0,20,'v2_mombasa_metro'),
('Mombasa','Mkomani',     'Mkomani, Mombasa',    false,'expansion','Mombasa Metro', 5,3.0,25,'v2_mombasa_metro'),
('Mombasa','Tudor',       'Tudor, Mombasa',      false,'expansion','Mombasa Metro', 6,3.0,24,'v2_mombasa_metro'),
('Mombasa','Kizingo',     'Kizingo, Mombasa',    false,'expansion','Mombasa Metro', 7,2.0,32,'v2_mombasa_metro'),
('Mombasa','Mvita',       'Mvita, Mombasa',      false,'expansion','Mombasa Metro', 8,2.0,35,'v2_mombasa_metro'),
('Mombasa','Changamwe',   'Changamwe, Mombasa',  false,'expansion','Mombasa Metro', 9,4.0,18,'v2_mombasa_metro'),
('Mombasa','Jomvu',       'Jomvu, Mombasa',      false,'expansion','Mombasa Metro',10,4.0,15,'v2_mombasa_metro'),
('Mombasa','Kisauni',     'Kisauni, Mombasa',    false,'expansion','Mombasa Metro',11,4.0,17,'v2_mombasa_metro'),
('Mombasa','Likoni',      'Likoni, Mombasa',     false,'expansion','Mombasa Metro',12,4.0,19,'v2_mombasa_metro'),
('Kwale',  'Diani',       'Diani, Kwale',         false,'expansion','Mombasa Metro',13,6.0,12,'v2_mombasa_metro'),
('Kwale',  'Ukunda',      'Ukunda, Kwale',        false,'expansion','Mombasa Metro',14,5.0,10,'v2_mombasa_metro'),
('Kwale',  'Msambweni',   'Msambweni, Kwale',     false,'expansion','Mombasa Metro',15,6.0, 8,'v2_mombasa_metro'),
('Kilifi', 'Kilifi Town', 'Kilifi Town, Kilifi',  false,'expansion','Mombasa Metro',16,5.0,10,'v2_mombasa_metro'),
('Kilifi', 'Malindi',     'Malindi, Kilifi',      false,'expansion','Mombasa Metro',17,6.0,12,'v2_mombasa_metro')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase        = EXCLUDED.launch_phase,
  metro               = EXCLUDED.metro,
  sort_order          = EXCLUDED.sort_order,
  service_radius_km   = EXCLUDED.service_radius_km,
  expansion_readiness = EXCLUDED.expansion_readiness,
  seed_batch          = EXCLUDED.seed_batch,
  updated_at          = now();

-- ── 6. Kisumu Metro — Phase 2 EXPANSION (inactive) ──────────────
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, expansion_readiness, seed_batch)
VALUES
('Kisumu','Kisumu Central',  'Kisumu Central, Kisumu',   false,'expansion','Kisumu Metro', 1,3.0,25,'v2_kisumu_metro'),
('Kisumu','Milimani',        'Milimani, Kisumu',         false,'expansion','Kisumu Metro', 2,3.0,22,'v2_kisumu_metro'),
('Kisumu','Kondele',         'Kondele, Kisumu',          false,'expansion','Kisumu Metro', 3,3.0,18,'v2_kisumu_metro'),
('Kisumu','Nyalenda',        'Nyalenda, Kisumu',         false,'expansion','Kisumu Metro', 4,3.0,16,'v2_kisumu_metro'),
('Kisumu','Mamboleo',        'Mamboleo, Kisumu',         false,'expansion','Kisumu Metro', 5,4.0,14,'v2_kisumu_metro'),
('Kisumu','Riat',            'Riat, Kisumu',             false,'expansion','Kisumu Metro', 6,4.0,12,'v2_kisumu_metro'),
('Kisumu','Tom Mboya Estate','Tom Mboya Estate, Kisumu', false,'expansion','Kisumu Metro', 7,3.0,15,'v2_kisumu_metro'),
('Kisumu','Migosi',          'Migosi, Kisumu',           false,'expansion','Kisumu Metro', 8,3.0,14,'v2_kisumu_metro'),
('Kisumu','Nyamasaria',      'Nyamasaria, Kisumu',       false,'expansion','Kisumu Metro', 9,4.0,11,'v2_kisumu_metro'),
('Kisumu','Manyatta',        'Manyatta, Kisumu',         false,'expansion','Kisumu Metro',10,4.0,10,'v2_kisumu_metro'),
('Kisumu','Airport Area',    'Airport Area, Kisumu',     false,'expansion','Kisumu Metro',11,4.0, 9,'v2_kisumu_metro'),
('Kisumu','Nyawita',         'Nyawita, Kisumu',          false,'expansion','Kisumu Metro',12,3.0,13,'v2_kisumu_metro')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase        = EXCLUDED.launch_phase,
  metro               = EXCLUDED.metro,
  sort_order          = EXCLUDED.sort_order,
  service_radius_km   = EXCLUDED.service_radius_km,
  expansion_readiness = EXCLUDED.expansion_readiness,
  seed_batch          = EXCLUDED.seed_batch,
  updated_at          = now();

-- ── 7. Nakuru Metro — Phase 3 EXPANSION (inactive) ──────────────
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, expansion_readiness, seed_batch)
VALUES
('Nakuru','Nakuru CBD',    'Nakuru CBD, Nakuru',     false,'expansion','Nakuru Metro', 1,3.0,20,'v2_nakuru_metro'),
('Nakuru','Milimani',      'Milimani, Nakuru',       false,'expansion','Nakuru Metro', 2,3.0,18,'v2_nakuru_metro'),
('Nakuru','Section 58',    'Section 58, Nakuru',     false,'expansion','Nakuru Metro', 3,3.0,16,'v2_nakuru_metro'),
('Nakuru','Lanet',         'Lanet, Nakuru',          false,'expansion','Nakuru Metro', 4,4.0,14,'v2_nakuru_metro'),
('Nakuru','Naka',          'Naka, Nakuru',           false,'expansion','Nakuru Metro', 5,3.0,13,'v2_nakuru_metro'),
('Nakuru','Kiamunyi',      'Kiamunyi, Nakuru',       false,'expansion','Nakuru Metro', 6,3.0,12,'v2_nakuru_metro'),
('Nakuru','Pipeline',      'Pipeline, Nakuru',       false,'expansion','Nakuru Metro', 7,3.0,11,'v2_nakuru_metro'),
('Nakuru','Free Area',     'Free Area, Nakuru',      false,'expansion','Nakuru Metro', 8,3.0,10,'v2_nakuru_metro'),
('Nakuru','London Estate', 'London Estate, Nakuru',  false,'expansion','Nakuru Metro', 9,3.0, 9,'v2_nakuru_metro'),
('Nakuru','White House',   'White House, Nakuru',    false,'expansion','Nakuru Metro',10,3.0, 8,'v2_nakuru_metro'),
('Nakuru','Bahati',        'Bahati, Nakuru',         false,'expansion','Nakuru Metro',11,5.0, 7,'v2_nakuru_metro'),
('Nakuru','Naivasha',      'Naivasha, Nakuru',       false,'expansion','Nakuru Metro',12,5.0,10,'v2_nakuru_metro')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase        = EXCLUDED.launch_phase,
  metro               = EXCLUDED.metro,
  sort_order          = EXCLUDED.sort_order,
  service_radius_km   = EXCLUDED.service_radius_km,
  expansion_readiness = EXCLUDED.expansion_readiness,
  seed_batch          = EXCLUDED.seed_batch,
  updated_at          = now();

-- ── 8. Eldoret Metro — Phase 3 EXPANSION (inactive) ─────────────
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, expansion_readiness, seed_batch)
VALUES
('Uasin Gishu','Eldoret CBD',  'Eldoret CBD, Uasin Gishu',  false,'expansion','Eldoret Metro', 1,3.0,18,'v2_eldoret_metro'),
('Uasin Gishu','Elgon View',   'Elgon View, Uasin Gishu',   false,'expansion','Eldoret Metro', 2,3.0,16,'v2_eldoret_metro'),
('Uasin Gishu','Kapsoya',      'Kapsoya, Uasin Gishu',      false,'expansion','Eldoret Metro', 3,4.0,14,'v2_eldoret_metro'),
('Uasin Gishu','Pioneer',      'Pioneer, Uasin Gishu',      false,'expansion','Eldoret Metro', 4,3.0,13,'v2_eldoret_metro'),
('Uasin Gishu','Huruma',       'Huruma, Uasin Gishu',       false,'expansion','Eldoret Metro', 5,3.0,12,'v2_eldoret_metro'),
('Uasin Gishu','Annex',        'Annex, Uasin Gishu',        false,'expansion','Eldoret Metro', 6,3.0,11,'v2_eldoret_metro'),
('Uasin Gishu','Langas',       'Langas, Uasin Gishu',       false,'expansion','Eldoret Metro', 7,4.0,10,'v2_eldoret_metro'),
('Uasin Gishu','Action Area',  'Action Area, Uasin Gishu',  false,'expansion','Eldoret Metro', 8,3.0, 9,'v2_eldoret_metro'),
('Uasin Gishu','Mwanzo',       'Mwanzo, Uasin Gishu',       false,'expansion','Eldoret Metro', 9,3.0, 8,'v2_eldoret_metro'),
('Uasin Gishu','Racecourse',   'Racecourse, Uasin Gishu',   false,'expansion','Eldoret Metro',10,3.0, 8,'v2_eldoret_metro'),
('Uasin Gishu','Maili Nne',    'Maili Nne, Uasin Gishu',    false,'expansion','Eldoret Metro',11,4.0, 7,'v2_eldoret_metro'),
('Uasin Gishu','Kimumu',       'Kimumu, Uasin Gishu',       false,'expansion','Eldoret Metro',12,5.0, 6,'v2_eldoret_metro')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase        = EXCLUDED.launch_phase,
  metro               = EXCLUDED.metro,
  sort_order          = EXCLUDED.sort_order,
  service_radius_km   = EXCLUDED.service_radius_km,
  expansion_readiness = EXCLUDED.expansion_readiness,
  seed_batch          = EXCLUDED.seed_batch,
  updated_at          = now();

-- ── 9. Nyeri — Phase 4 FUTURE (inactive) ────────────────────────
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, seed_batch)
VALUES
('Nyeri','Nyeri Town',  'Nyeri Town, Nyeri',   false,'future','Nyeri', 1,4.0,'v2_nyeri'),
('Nyeri','Ruring''u',   'Ruringu, Nyeri',       false,'future','Nyeri', 2,4.0,'v2_nyeri'),
('Nyeri','King''ong''o','Kingongo, Nyeri',       false,'future','Nyeri', 3,3.0,'v2_nyeri'),
('Nyeri','Kamakwa',     'Kamakwa, Nyeri',       false,'future','Nyeri', 4,3.0,'v2_nyeri'),
('Nyeri','Tetu',        'Tetu, Nyeri',          false,'future','Nyeri', 5,5.0,'v2_nyeri'),
('Nyeri','Othaya',      'Othaya, Nyeri',        false,'future','Nyeri', 6,5.0,'v2_nyeri'),
('Nyeri','Karatina',    'Karatina, Nyeri',      false,'future','Nyeri', 7,4.0,'v2_nyeri'),
('Nyeri','Mathira',     'Mathira, Nyeri',       false,'future','Nyeri', 8,5.0,'v2_nyeri')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase = EXCLUDED.launch_phase, metro = EXCLUDED.metro,
  sort_order = EXCLUDED.sort_order, seed_batch = EXCLUDED.seed_batch, updated_at = now();

-- ── 10. Meru — Phase 4 FUTURE (inactive) ────────────────────────
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, seed_batch)
VALUES
('Meru','Meru Town',  'Meru Town, Meru',   false,'future','Meru', 1,4.0,'v2_meru'),
('Meru','Makutano',   'Makutano, Meru',    false,'future','Meru', 2,4.0,'v2_meru'),
('Meru','Nkubu',      'Nkubu, Meru',       false,'future','Meru', 3,4.0,'v2_meru'),
('Meru','Timau',      'Timau, Meru',       false,'future','Meru', 4,5.0,'v2_meru'),
('Meru','Maua',       'Maua, Meru',        false,'future','Meru', 5,5.0,'v2_meru'),
('Meru','Kanyakine',  'Kanyakine, Meru',   false,'future','Meru', 6,4.0,'v2_meru'),
('Meru','Abogeta',    'Abogeta, Meru',     false,'future','Meru', 7,4.0,'v2_meru'),
('Meru','Imenti',     'Imenti, Meru',      false,'future','Meru', 8,4.0,'v2_meru')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase = EXCLUDED.launch_phase, metro = EXCLUDED.metro,
  sort_order = EXCLUDED.sort_order, seed_batch = EXCLUDED.seed_batch, updated_at = now();

-- ── 11. Thika — Phase 4 FUTURE (inactive) ───────────────────────
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, seed_batch)
VALUES
('Kiambu','Thika Town',   'Thika Town, Kiambu',  false,'future','Thika', 1,4.0,'v2_thika'),
('Kiambu','Makongeni',    'Makongeni, Kiambu',   false,'future','Thika', 2,3.0,'v2_thika'),
('Kiambu','Section 9',    'Section 9, Kiambu',   false,'future','Thika', 3,3.0,'v2_thika'),
('Kiambu','Section 3',    'Section 3, Kiambu',   false,'future','Thika', 4,3.0,'v2_thika'),
('Kiambu','Landless',     'Landless, Kiambu',    false,'future','Thika', 5,3.0,'v2_thika'),
('Kiambu','Blue Post',    'Blue Post, Kiambu',   false,'future','Thika', 6,4.0,'v2_thika'),
('Kiambu','Ngoigwa',      'Ngoigwa, Kiambu',     false,'future','Thika', 7,4.0,'v2_thika'),
('Kiambu','Juja',         'Juja, Kiambu',        false,'future','Thika', 8,5.0,'v2_thika')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase = EXCLUDED.launch_phase, metro = EXCLUDED.metro,
  sort_order = EXCLUDED.sort_order, seed_batch = EXCLUDED.seed_batch, updated_at = now();

-- ── 12. Kakamega — Phase 4 FUTURE (inactive) ────────────────────
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, seed_batch)
VALUES
('Kakamega','Kakamega Town', 'Kakamega Town, Kakamega', false,'future','Kakamega', 1,4.0,'v2_kakamega'),
('Kakamega','Amalemba',      'Amalemba, Kakamega',      false,'future','Kakamega', 2,3.0,'v2_kakamega'),
('Kakamega','Shinyalu',      'Shinyalu, Kakamega',      false,'future','Kakamega', 3,4.0,'v2_kakamega'),
('Kakamega','Lurambi',       'Lurambi, Kakamega',       false,'future','Kakamega', 4,4.0,'v2_kakamega'),
('Kakamega','Mumias',        'Mumias, Kakamega',        false,'future','Kakamega', 5,5.0,'v2_kakamega'),
('Kakamega','Malava',        'Malava, Kakamega',        false,'future','Kakamega', 6,5.0,'v2_kakamega'),
('Kakamega','Butere',        'Butere, Kakamega',        false,'future','Kakamega', 7,5.0,'v2_kakamega'),
('Kakamega','Navakholo',     'Navakholo, Kakamega',     false,'future','Kakamega', 8,5.0,'v2_kakamega')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase = EXCLUDED.launch_phase, metro = EXCLUDED.metro,
  sort_order = EXCLUDED.sort_order, seed_batch = EXCLUDED.seed_batch, updated_at = now();

-- ── 13. Machakos Metro — Phase 4 FUTURE (inactive) ──────────────
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, seed_batch)
VALUES
('Machakos','Machakos Town',   'Machakos Town, Machakos',   false,'future','Machakos Metro', 1,4.0,'v2_machakos_metro'),
('Machakos','Mlolongo',        'Mlolongo, Machakos',        false,'future','Machakos Metro', 2,4.0,'v2_machakos_metro'),
('Machakos','Athi River',      'Athi River, Machakos',      false,'future','Machakos Metro', 3,5.0,'v2_machakos_metro'),
('Machakos','Mavoko',          'Mavoko, Machakos',          false,'future','Machakos Metro', 4,5.0,'v2_machakos_metro'),
('Machakos','Joska',           'Joska, Machakos',           false,'future','Machakos Metro', 5,5.0,'v2_machakos_metro'),
('Machakos','Katani',          'Katani, Machakos',          false,'future','Machakos Metro', 6,5.0,'v2_machakos_metro'),
('Machakos','Kangundo Road',   'Kangundo Road, Machakos',   false,'future','Machakos Metro', 7,5.0,'v2_machakos_metro')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase = EXCLUDED.launch_phase, metro = EXCLUDED.metro,
  sort_order = EXCLUDED.sort_order, seed_batch = EXCLUDED.seed_batch, updated_at = now();

-- ── 14. Kiambu Metro — Phase 4 FUTURE (inactive) ────────────────
-- (Ruiru, Kikuyu, Juja already in Nairobi Metro above)
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, seed_batch)
VALUES
('Kiambu','Kiambu Town', 'Kiambu Town, Kiambu', false,'future','Kiambu Metro', 1,4.0,'v2_kiambu_metro'),
('Kiambu','Limuru',      'Limuru, Kiambu',      false,'future','Kiambu Metro', 2,5.0,'v2_kiambu_metro'),
('Kiambu','Githunguri',  'Githunguri, Kiambu',  false,'future','Kiambu Metro', 3,5.0,'v2_kiambu_metro'),
('Kiambu','Kabete',      'Kabete, Kiambu',      false,'future','Kiambu Metro', 4,4.0,'v2_kiambu_metro'),
('Kiambu','Kiambaa',     'Kiambaa, Kiambu',     false,'future','Kiambu Metro', 5,4.0,'v2_kiambu_metro')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase = EXCLUDED.launch_phase, metro = EXCLUDED.metro,
  sort_order = EXCLUDED.sort_order, seed_batch = EXCLUDED.seed_batch, updated_at = now();

-- ── 15. Remaining 35 Kenya counties — constituency level (future) ─
-- Counties NOT covered by metro seeds above. Kept at constituency level for national data.
INSERT INTO service_areas (county, sub_county, label, is_active, launch_phase, seed_batch) VALUES
-- Makueni
('Makueni','Kaiti','Kaiti, Makueni',false,'future','v2_remaining'),
('Makueni','Kibwezi East','Kibwezi East, Makueni',false,'future','v2_remaining'),
('Makueni','Kibwezi West','Kibwezi West, Makueni',false,'future','v2_remaining'),
('Makueni','Kilome','Kilome, Makueni',false,'future','v2_remaining'),
('Makueni','Makueni Town','Makueni Town, Makueni',false,'future','v2_remaining'),
('Makueni','Mbooni','Mbooni, Makueni',false,'future','v2_remaining'),
-- Tana River
('Tana River','Bura','Bura, Tana River',false,'future','v2_remaining'),
('Tana River','Galole','Galole, Tana River',false,'future','v2_remaining'),
('Tana River','Garsen','Garsen, Tana River',false,'future','v2_remaining'),
-- Lamu
('Lamu','Lamu East','Lamu East, Lamu',false,'future','v2_remaining'),
('Lamu','Lamu West','Lamu West, Lamu',false,'future','v2_remaining'),
-- Taita-Taveta
('Taita-Taveta','Mwatate','Mwatate, Taita-Taveta',false,'future','v2_remaining'),
('Taita-Taveta','Taveta','Taveta, Taita-Taveta',false,'future','v2_remaining'),
('Taita-Taveta','Voi','Voi, Taita-Taveta',false,'future','v2_remaining'),
('Taita-Taveta','Wundanyi','Wundanyi, Taita-Taveta',false,'future','v2_remaining'),
-- Garissa
('Garissa','Balambala','Balambala, Garissa',false,'future','v2_remaining'),
('Garissa','Dadaab','Dadaab, Garissa',false,'future','v2_remaining'),
('Garissa','Fafi','Fafi, Garissa',false,'future','v2_remaining'),
('Garissa','Garissa Township','Garissa Township, Garissa',false,'future','v2_remaining'),
('Garissa','Hulugho','Hulugho, Garissa',false,'future','v2_remaining'),
('Garissa','Ijara','Ijara, Garissa',false,'future','v2_remaining'),
('Garissa','Lagdera','Lagdera, Garissa',false,'future','v2_remaining'),
-- Wajir
('Wajir','Eldas','Eldas, Wajir',false,'future','v2_remaining'),
('Wajir','Tarbaj','Tarbaj, Wajir',false,'future','v2_remaining'),
('Wajir','Wajir East','Wajir East, Wajir',false,'future','v2_remaining'),
('Wajir','Wajir North','Wajir North, Wajir',false,'future','v2_remaining'),
('Wajir','Wajir South','Wajir South, Wajir',false,'future','v2_remaining'),
('Wajir','Wajir West','Wajir West, Wajir',false,'future','v2_remaining'),
-- Mandera
('Mandera','Banissa','Banissa, Mandera',false,'future','v2_remaining'),
('Mandera','Lafey','Lafey, Mandera',false,'future','v2_remaining'),
('Mandera','Mandera East','Mandera East, Mandera',false,'future','v2_remaining'),
('Mandera','Mandera North','Mandera North, Mandera',false,'future','v2_remaining'),
('Mandera','Mandera South','Mandera South, Mandera',false,'future','v2_remaining'),
('Mandera','Mandera West','Mandera West, Mandera',false,'future','v2_remaining'),
-- Marsabit
('Marsabit','Laisamis','Laisamis, Marsabit',false,'future','v2_remaining'),
('Marsabit','Moyale','Moyale, Marsabit',false,'future','v2_remaining'),
('Marsabit','North Horr','North Horr, Marsabit',false,'future','v2_remaining'),
('Marsabit','Saku','Saku, Marsabit',false,'future','v2_remaining'),
-- Isiolo
('Isiolo','Garbatulla','Garbatulla, Isiolo',false,'future','v2_remaining'),
('Isiolo','Isiolo Town','Isiolo Town, Isiolo',false,'future','v2_remaining'),
('Isiolo','Merti','Merti, Isiolo',false,'future','v2_remaining'),
-- Tharaka-Nithi
('Tharaka-Nithi','Chuka','Chuka, Tharaka-Nithi',false,'future','v2_remaining'),
('Tharaka-Nithi','Maara','Maara, Tharaka-Nithi',false,'future','v2_remaining'),
('Tharaka-Nithi','Tharaka North','Tharaka North, Tharaka-Nithi',false,'future','v2_remaining'),
('Tharaka-Nithi','Tharaka South','Tharaka South, Tharaka-Nithi',false,'future','v2_remaining'),
-- Embu
('Embu','Embu East','Embu East, Embu',false,'future','v2_remaining'),
('Embu','Embu North','Embu North, Embu',false,'future','v2_remaining'),
('Embu','Embu West','Embu West, Embu',false,'future','v2_remaining'),
('Embu','Mbeere North','Mbeere North, Embu',false,'future','v2_remaining'),
('Embu','Mbeere South','Mbeere South, Embu',false,'future','v2_remaining'),
('Embu','Runyenjes','Runyenjes, Embu',false,'future','v2_remaining'),
-- Kitui
('Kitui','Kitui Central','Kitui Central, Kitui',false,'future','v2_remaining'),
('Kitui','Kitui East','Kitui East, Kitui',false,'future','v2_remaining'),
('Kitui','Kitui Rural','Kitui Rural, Kitui',false,'future','v2_remaining'),
('Kitui','Kitui South','Kitui South, Kitui',false,'future','v2_remaining'),
('Kitui','Kitui West','Kitui West, Kitui',false,'future','v2_remaining'),
('Kitui','Mwingi Central','Mwingi Central, Kitui',false,'future','v2_remaining'),
('Kitui','Mwingi North','Mwingi North, Kitui',false,'future','v2_remaining'),
('Kitui','Mwingi West','Mwingi West, Kitui',false,'future','v2_remaining'),
-- Nyandarua
('Nyandarua','Kinangop','Kinangop, Nyandarua',false,'future','v2_remaining'),
('Nyandarua','Kipipiri','Kipipiri, Nyandarua',false,'future','v2_remaining'),
('Nyandarua','Ndaragwa','Ndaragwa, Nyandarua',false,'future','v2_remaining'),
('Nyandarua','Ol Kalou','Ol Kalou, Nyandarua',false,'future','v2_remaining'),
('Nyandarua','Ol Joro Orok','Ol Joro Orok, Nyandarua',false,'future','v2_remaining'),
-- Kirinyaga
('Kirinyaga','Gichugu','Gichugu, Kirinyaga',false,'future','v2_remaining'),
('Kirinyaga','Kirinyaga Central','Kirinyaga Central, Kirinyaga',false,'future','v2_remaining'),
('Kirinyaga','Mwea East','Mwea East, Kirinyaga',false,'future','v2_remaining'),
('Kirinyaga','Mwea West','Mwea West, Kirinyaga',false,'future','v2_remaining'),
('Kirinyaga','Ndia','Ndia, Kirinyaga',false,'future','v2_remaining'),
-- Muranga
('Muranga','Gatanga','Gatanga, Muranga',false,'future','v2_remaining'),
('Muranga','Kahuro','Kahuro, Muranga',false,'future','v2_remaining'),
('Muranga','Kandara','Kandara, Muranga',false,'future','v2_remaining'),
('Muranga','Kangema','Kangema, Muranga',false,'future','v2_remaining'),
('Muranga','Kigumo','Kigumo, Muranga',false,'future','v2_remaining'),
('Muranga','Kiharu','Kiharu, Muranga',false,'future','v2_remaining'),
('Muranga','Mathioya','Mathioya, Muranga',false,'future','v2_remaining'),
('Muranga','Muranga South','Muranga South, Muranga',false,'future','v2_remaining'),
-- Narok
('Narok','Narok East','Narok East, Narok',false,'future','v2_remaining'),
('Narok','Narok North','Narok North, Narok',false,'future','v2_remaining'),
('Narok','Narok South','Narok South, Narok',false,'future','v2_remaining'),
('Narok','Narok West','Narok West, Narok',false,'future','v2_remaining'),
('Narok','Transmara East','Transmara East, Narok',false,'future','v2_remaining'),
('Narok','Transmara West','Transmara West, Narok',false,'future','v2_remaining'),
-- Laikipia
('Laikipia','Laikipia Central','Laikipia Central, Laikipia',false,'future','v2_remaining'),
('Laikipia','Laikipia East','Laikipia East, Laikipia',false,'future','v2_remaining'),
('Laikipia','Laikipia North','Laikipia North, Laikipia',false,'future','v2_remaining'),
('Laikipia','Laikipia West','Laikipia West, Laikipia',false,'future','v2_remaining'),
('Laikipia','Nyahururu','Nyahururu, Laikipia',false,'future','v2_remaining'),
-- Baringo
('Baringo','Baringo Central','Baringo Central, Baringo',false,'future','v2_remaining'),
('Baringo','Baringo North','Baringo North, Baringo',false,'future','v2_remaining'),
('Baringo','Baringo South','Baringo South, Baringo',false,'future','v2_remaining'),
('Baringo','Eldama Ravine','Eldama Ravine, Baringo',false,'future','v2_remaining'),
('Baringo','Mogotio','Mogotio, Baringo',false,'future','v2_remaining'),
('Baringo','Tiaty','Tiaty, Baringo',false,'future','v2_remaining'),
-- Elgeyo-Marakwet
('Elgeyo-Marakwet','Keiyo North','Keiyo North, Elgeyo-Marakwet',false,'future','v2_remaining'),
('Elgeyo-Marakwet','Keiyo South','Keiyo South, Elgeyo-Marakwet',false,'future','v2_remaining'),
('Elgeyo-Marakwet','Marakwet East','Marakwet East, Elgeyo-Marakwet',false,'future','v2_remaining'),
('Elgeyo-Marakwet','Marakwet West','Marakwet West, Elgeyo-Marakwet',false,'future','v2_remaining'),
-- Nandi
('Nandi','Aldai','Aldai, Nandi',false,'future','v2_remaining'),
('Nandi','Chesumei','Chesumei, Nandi',false,'future','v2_remaining'),
('Nandi','Emgwen','Emgwen, Nandi',false,'future','v2_remaining'),
('Nandi','Mosop','Mosop, Nandi',false,'future','v2_remaining'),
('Nandi','Nandi Hills','Nandi Hills, Nandi',false,'future','v2_remaining'),
('Nandi','Tindiret','Tindiret, Nandi',false,'future','v2_remaining'),
-- Trans-Nzoia
('Trans-Nzoia','Cherangany','Cherangany, Trans-Nzoia',false,'future','v2_remaining'),
('Trans-Nzoia','Endebess','Endebess, Trans-Nzoia',false,'future','v2_remaining'),
('Trans-Nzoia','Kiminini','Kiminini, Trans-Nzoia',false,'future','v2_remaining'),
('Trans-Nzoia','Kwanza','Kwanza, Trans-Nzoia',false,'future','v2_remaining'),
('Trans-Nzoia','Trans Nzoia East','Trans Nzoia East, Trans-Nzoia',false,'future','v2_remaining'),
('Trans-Nzoia','Trans Nzoia West','Trans Nzoia West, Trans-Nzoia',false,'future','v2_remaining'),
-- West Pokot
('West Pokot','Central Pokot','Central Pokot, West Pokot',false,'future','v2_remaining'),
('West Pokot','Kacheliba','Kacheliba, West Pokot',false,'future','v2_remaining'),
('West Pokot','Pokot South','Pokot South, West Pokot',false,'future','v2_remaining'),
('West Pokot','West Pokot','West Pokot Town, West Pokot',false,'future','v2_remaining'),
-- Samburu
('Samburu','Samburu East','Samburu East, Samburu',false,'future','v2_remaining'),
('Samburu','Samburu North','Samburu North, Samburu',false,'future','v2_remaining'),
('Samburu','Samburu West','Samburu West, Samburu',false,'future','v2_remaining'),
-- Turkana
('Turkana','Kibish','Kibish, Turkana',false,'future','v2_remaining'),
('Turkana','Loima','Loima, Turkana',false,'future','v2_remaining'),
('Turkana','Turkana Central','Turkana Central, Turkana',false,'future','v2_remaining'),
('Turkana','Turkana East','Turkana East, Turkana',false,'future','v2_remaining'),
('Turkana','Turkana North','Turkana North, Turkana',false,'future','v2_remaining'),
('Turkana','Turkana South','Turkana South, Turkana',false,'future','v2_remaining'),
('Turkana','Turkana West','Turkana West, Turkana',false,'future','v2_remaining'),
-- Kericho
('Kericho','Ainamoi','Ainamoi, Kericho',false,'future','v2_remaining'),
('Kericho','Belgut','Belgut, Kericho',false,'future','v2_remaining'),
('Kericho','Bureti','Bureti, Kericho',false,'future','v2_remaining'),
('Kericho','Kipkelion East','Kipkelion East, Kericho',false,'future','v2_remaining'),
('Kericho','Kipkelion West','Kipkelion West, Kericho',false,'future','v2_remaining'),
('Kericho','Soin/Sigowet','Soin/Sigowet, Kericho',false,'future','v2_remaining'),
-- Bomet
('Bomet','Bomet Central','Bomet Central, Bomet',false,'future','v2_remaining'),
('Bomet','Bomet East','Bomet East, Bomet',false,'future','v2_remaining'),
('Bomet','Chepalungu','Chepalungu, Bomet',false,'future','v2_remaining'),
('Bomet','Konoin','Konoin, Bomet',false,'future','v2_remaining'),
('Bomet','Sotik','Sotik, Bomet',false,'future','v2_remaining'),
-- Vihiga
('Vihiga','Emuhaya','Emuhaya, Vihiga',false,'future','v2_remaining'),
('Vihiga','Hamisi','Hamisi, Vihiga',false,'future','v2_remaining'),
('Vihiga','Luanda','Luanda, Vihiga',false,'future','v2_remaining'),
('Vihiga','Sabatia','Sabatia, Vihiga',false,'future','v2_remaining'),
('Vihiga','Vihiga','Vihiga Town, Vihiga',false,'future','v2_remaining'),
-- Bungoma
('Bungoma','Bumula','Bumula, Bungoma',false,'future','v2_remaining'),
('Bungoma','Kabuchai','Kabuchai, Bungoma',false,'future','v2_remaining'),
('Bungoma','Kanduyi','Kanduyi, Bungoma',false,'future','v2_remaining'),
('Bungoma','Kimilili','Kimilili, Bungoma',false,'future','v2_remaining'),
('Bungoma','Mt Elgon','Mt Elgon, Bungoma',false,'future','v2_remaining'),
('Bungoma','Sirisia','Sirisia, Bungoma',false,'future','v2_remaining'),
('Bungoma','Tongaren','Tongaren, Bungoma',false,'future','v2_remaining'),
('Bungoma','Webuye East','Webuye East, Bungoma',false,'future','v2_remaining'),
('Bungoma','Webuye West','Webuye West, Bungoma',false,'future','v2_remaining'),
-- Busia
('Busia','Budalangi','Budalangi, Busia',false,'future','v2_remaining'),
('Busia','Butula','Butula, Busia',false,'future','v2_remaining'),
('Busia','Funyula','Funyula, Busia',false,'future','v2_remaining'),
('Busia','Nambale','Nambale, Busia',false,'future','v2_remaining'),
('Busia','Teso North','Teso North, Busia',false,'future','v2_remaining'),
('Busia','Teso South','Teso South, Busia',false,'future','v2_remaining'),
-- Siaya
('Siaya','Alego Usonga','Alego Usonga, Siaya',false,'future','v2_remaining'),
('Siaya','Bondo','Bondo, Siaya',false,'future','v2_remaining'),
('Siaya','Gem','Gem, Siaya',false,'future','v2_remaining'),
('Siaya','Rarieda','Rarieda, Siaya',false,'future','v2_remaining'),
('Siaya','Ugenya','Ugenya, Siaya',false,'future','v2_remaining'),
('Siaya','Ugunja','Ugunja, Siaya',false,'future','v2_remaining'),
-- Homa Bay
('Homa Bay','Homabay Town','Homabay Town, Homa Bay',false,'future','v2_remaining'),
('Homa Bay','Kabondo Kasipul','Kabondo Kasipul, Homa Bay',false,'future','v2_remaining'),
('Homa Bay','Karachuonyo','Karachuonyo, Homa Bay',false,'future','v2_remaining'),
('Homa Bay','Kasipul','Kasipul, Homa Bay',false,'future','v2_remaining'),
('Homa Bay','Mbita','Mbita, Homa Bay',false,'future','v2_remaining'),
('Homa Bay','Ndhiwa','Ndhiwa, Homa Bay',false,'future','v2_remaining'),
('Homa Bay','Rangwe','Rangwe, Homa Bay',false,'future','v2_remaining'),
('Homa Bay','Suba North','Suba North, Homa Bay',false,'future','v2_remaining'),
('Homa Bay','Suba South','Suba South, Homa Bay',false,'future','v2_remaining'),
-- Migori
('Migori','Awendo','Awendo, Migori',false,'future','v2_remaining'),
('Migori','Kuria East','Kuria East, Migori',false,'future','v2_remaining'),
('Migori','Kuria West','Kuria West, Migori',false,'future','v2_remaining'),
('Migori','Mabera','Mabera, Migori',false,'future','v2_remaining'),
('Migori','Ntimaru','Ntimaru, Migori',false,'future','v2_remaining'),
('Migori','Rongo','Rongo, Migori',false,'future','v2_remaining'),
('Migori','Suna East','Suna East, Migori',false,'future','v2_remaining'),
('Migori','Suna West','Suna West, Migori',false,'future','v2_remaining'),
('Migori','Uriri','Uriri, Migori',false,'future','v2_remaining'),
-- Kisii
('Kisii','Bobasi','Bobasi, Kisii',false,'future','v2_remaining'),
('Kisii','Bomachoge Borabu','Bomachoge Borabu, Kisii',false,'future','v2_remaining'),
('Kisii','Bomachoge Chache','Bomachoge Chache, Kisii',false,'future','v2_remaining'),
('Kisii','Bonchari','Bonchari, Kisii',false,'future','v2_remaining'),
('Kisii','Kitutu Chache North','Kitutu Chache North, Kisii',false,'future','v2_remaining'),
('Kisii','Kitutu Chache South','Kitutu Chache South, Kisii',false,'future','v2_remaining'),
('Kisii','Nyaribari Chache','Nyaribari Chache, Kisii',false,'future','v2_remaining'),
('Kisii','Nyaribari Masaba','Nyaribari Masaba, Kisii',false,'future','v2_remaining'),
('Kisii','South Mugirango','South Mugirango, Kisii',false,'future','v2_remaining'),
-- Nyamira
('Nyamira','Borabu','Borabu, Nyamira',false,'future','v2_remaining'),
('Nyamira','Manga','Manga, Nyamira',false,'future','v2_remaining'),
('Nyamira','Masaba North','Masaba North, Nyamira',false,'future','v2_remaining'),
('Nyamira','Nyamira North','Nyamira North, Nyamira',false,'future','v2_remaining'),
('Nyamira','Nyamira South','Nyamira South, Nyamira',false,'future','v2_remaining'),
-- Remaining Kajiado (non-Nairobi-Metro)
('Kajiado','Kajiado Central','Kajiado Central, Kajiado',false,'future','v2_remaining'),
('Kajiado','Kajiado East','Kajiado East, Kajiado',false,'future','v2_remaining'),
('Kajiado','Kajiado North','Kajiado North, Kajiado',false,'future','v2_remaining'),
('Kajiado','Kajiado South','Kajiado South, Kajiado',false,'future','v2_remaining'),
('Kajiado','Kajiado West','Kajiado West, Kajiado',false,'future','v2_remaining'),
-- Remaining Machakos (non-Nairobi-Metro and non-Machakos-Metro)
('Machakos','Kathiani','Kathiani, Machakos',false,'future','v2_remaining'),
('Machakos','Masinga','Masinga, Machakos',false,'future','v2_remaining'),
('Machakos','Matungulu','Matungulu, Machakos',false,'future','v2_remaining'),
('Machakos','Mwala','Mwala, Machakos',false,'future','v2_remaining'),
('Machakos','Yatta','Yatta, Machakos',false,'future','v2_remaining'),
-- Remaining Kilifi (not in Mombasa Metro)
('Kilifi','Ganze','Ganze, Kilifi',false,'future','v2_remaining'),
('Kilifi','Kaloleni','Kaloleni, Kilifi',false,'future','v2_remaining'),
('Kilifi','Kilifi North','Kilifi North, Kilifi',false,'future','v2_remaining'),
('Kilifi','Kilifi South','Kilifi South, Kilifi',false,'future','v2_remaining'),
('Kilifi','Magarini','Magarini, Kilifi',false,'future','v2_remaining'),
('Kilifi','Rabai','Rabai, Kilifi',false,'future','v2_remaining'),
-- Remaining Kwale (not in Mombasa Metro)
('Kwale','Kinango','Kinango, Kwale',false,'future','v2_remaining'),
('Kwale','Lungalunga','Lungalunga, Kwale',false,'future','v2_remaining'),
('Kwale','Matuga','Matuga, Kwale',false,'future','v2_remaining')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase = EXCLUDED.launch_phase,
  seed_batch   = EXCLUDED.seed_batch,
  updated_at   = now();
