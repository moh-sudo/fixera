-- ─────────────────────────────────────────────────────────────
--  FIX: infinite recursion in profiles RLS (hangs admin logins)
--
--  The admin policies in secure_profiles_rls.sql queried `profiles`
--  from WITHIN a `profiles` policy:
--      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin))
--  For a NON-admin this resolves false instantly. For an ADMIN it
--  recurses profiles→profiles→… and the query hangs — so the moment
--  an account is set is_admin=true, its profile reads (and therefore
--  the admin login) hang forever. Confirmed 2026-07-04: login went
--  from "Admin profile not found" (pre-admin) to an infinite spinner
--  (post-admin), on every device.
--
--  Fix: a SECURITY DEFINER helper that reads is_admin WITHOUT RLS
--  (so no recursion), and rewrite the three recursive policies to use it.
-- ─────────────────────────────────────────────────────────────

-- SECURITY DEFINER runs as the function owner, bypassing RLS on its
-- internal SELECT — this is what breaks the recursion.
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- 3. Admins can read all profiles (was recursive)
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
CREATE POLICY "Admins read all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (public.is_admin_user());

-- 4. Users update own profile, cannot self-elevate is_admin (was recursive in WITH CHECK)
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND is_admin = public.is_admin_user());

-- 5. Admins update any profile (was recursive)
DROP POLICY IF EXISTS "Admins update any profile" ON profiles;
CREATE POLICY "Admins update any profile" ON profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());
