-- ─────────────────────────────────────────────────────────────
--  Extend admin_role to support the Agent/Team system
--  Adds two dedicated department roles:
--    verification  → vets & approves partner credentials (HR/Onboarding)
--    trust_safety  → handles safety incidents & disputes
--  (Previously only: super_admin, support, finance, operations)
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
    'trust_safety'
  ));

-- Notes:
-- • is_admin = true  → the account is a Fixera staff/agent account
-- • admin_role       → which department the agent belongs to (drives dashboard access)
-- • Manage agents from Admin Dashboard → Team (super_admin only), which calls
--   /api/admin-team (server-side, service-role) to create/revoke agents.
