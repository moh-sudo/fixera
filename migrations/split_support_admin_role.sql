-- ─────────────────────────────────────────────────────────────
--  Split the 'support' admin_role into two dedicated agents,
--  matching the two existing Zoho groups (support@ / partner@):
--    support           → customer-facing tickets only
--    partner_support    → partner-facing tickets only
--  'support' is kept in the constraint (not removed) so any
--  existing agent account on that role keeps working — the app
--  now scopes it to user_type='customer' rows only.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_admin_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_admin_role_check
  CHECK (admin_role IN (
    'super_admin',
    'support',
    'finance',
    'operations',
    'verification',
    'trust_safety',
    'service_delivery',
    'platform_governance',
    'marketplace_intelligence',
    'partner_support'
  ));
