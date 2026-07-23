-- ─────────────────────────────────────────────────────────────
--  Split the 'operations' admin_role into three dedicated agents,
--  matching the Fixera AI Division org chart:
--    service_delivery         → booking lifecycle, dispatch, partner ops
--    platform_governance      → config integrity, security, team/roles
--    marketplace_intelligence → demand forecasting, utilization, pricing
--  'operations' is kept in the constraint (not removed) so any
--  existing agent account on that role keeps working unchanged —
--  only new agents are steered toward the three granular roles.
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
    'marketplace_intelligence'
  ));
