-- ── Secure profiles table RLS ─────────────────────────────────────
-- Prevents any authenticated user from elevating their own is_admin flag.
-- The profiles table is created by Supabase auth triggers; we add
-- hardened policies here.

-- 1. Enable RLS (idempotent)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Users can read their own profile
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 3. Admins can read all profiles
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
CREATE POLICY "Admins read all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));

-- 4. Users can update their own profile BUT cannot change is_admin or id
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Prevent self-elevation: is_admin must remain unchanged
    AND is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );

-- 5. Only admins can update is_admin (grant/revoke)
DROP POLICY IF EXISTS "Admins update any profile" ON profiles;
CREATE POLICY "Admins update any profile" ON profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));

-- 6. Admins cannot delete profiles directly (use Supabase auth admin API)
DROP POLICY IF EXISTS "No direct profile delete" ON profiles;
CREATE POLICY "No direct profile delete" ON profiles
  FOR DELETE TO authenticated
  USING (false);
