-- ============================================================
-- FIXERA: Fix overly-permissive RLS on disputes + service_areas
--
-- Problem: "FOR ALL TO authenticated USING (true)" let ANY
-- logged-in user read, edit, or delete other users' disputes
-- and modify service area coverage.
--
-- Fix: customers see only their own disputes; service_areas
-- become read-only for all authenticated users (admin writes
-- go through the service role key in API routes).
-- ============================================================

-- ── disputes ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin full access to disputes" ON disputes;

-- Customers can create disputes for their own bookings
CREATE POLICY "Customers insert own disputes" ON disputes
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Customers can read only their own disputes
CREATE POLICY "Customers read own disputes" ON disputes
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

-- Admins (is_admin = true in profiles) get full access
CREATE POLICY "Admins full access to disputes" ON disputes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ── service_areas ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin full access to service_areas" ON service_areas;

-- All authenticated users can read service areas (needed for booking validation)
CREATE POLICY "Authenticated users read service_areas" ON service_areas
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can write service areas (insert/update/delete go via service role in API)
CREATE POLICY "Admins manage service_areas" ON service_areas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
