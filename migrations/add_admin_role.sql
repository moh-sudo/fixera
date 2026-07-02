-- ============================================================
-- FIXERA: Admin RBAC sub-roles
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_role TEXT DEFAULT 'super_admin'
    CHECK (admin_role IN ('super_admin', 'support', 'finance', 'operations'));

-- Existing admins stay as super_admin (default)
-- To downgrade an admin: UPDATE profiles SET admin_role = 'support' WHERE id = '<uuid>';
