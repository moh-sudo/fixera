-- ============================================================
-- FIXERA: Secure sensitive storage buckets
--
-- Problem: worker-documents (ID scans), receipts (PDF with PII),
-- and inspection-photos were either public or had no RLS policies.
--
-- Fix:
--   1. Create buckets as private (public=false) if not exist
--   2. Switch any existing public bucket to private
--   3. Add RLS policies: only the owner or admins can access
--   4. Use signed URLs in app code (not public URLs) — see notes below
-- ============================================================

-- ── worker-documents (National IDs, business permits) ────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('worker-documents', 'worker-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Workers upload own documents"     ON storage.objects;
DROP POLICY IF EXISTS "Workers read own documents"       ON storage.objects;
DROP POLICY IF EXISTS "Admins read worker documents"     ON storage.objects;

CREATE POLICY "Workers upload own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'worker-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Workers read own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'worker-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins read worker documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'worker-documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ── receipts (PDF receipts with customer PII) ─────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Users upload own receipts"   ON storage.objects;
DROP POLICY IF EXISTS "Users read own receipts"     ON storage.objects;
DROP POLICY IF EXISTS "Admins read receipts"        ON storage.objects;

CREATE POLICY "Users upload own receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read own receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins read receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ── inspection-photos (customer property photos) ──────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Users upload inspection photos"  ON storage.objects;
DROP POLICY IF EXISTS "Users read inspection photos"    ON storage.objects;
DROP POLICY IF EXISTS "Admins read inspection photos"   ON storage.objects;

CREATE POLICY "Users upload inspection photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'inspection-photos'
    AND (storage.foldername(name))[1] = 'inspections'
  );

CREATE POLICY "Users read inspection photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'inspection-photos'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Admins read inspection photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'inspection-photos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ── mover-vehicles: make private (contains logbook scans) ─────────
-- Vehicle reg numbers in logbooks are sensitive
UPDATE storage.buckets SET public = false WHERE id = 'mover-vehicles';

DROP POLICY IF EXISTS "Public read vehicle files"   ON storage.objects;

CREATE POLICY "Owners read own vehicle files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'mover-vehicles'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins read vehicle files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'mover-vehicles'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
