-- ============================================================
-- FIXERA: Partner Agreement Acceptance Tracking
-- Records which version of the Fixera Partner Terms each partner
-- accepted and when (audit trail for legal compliance).
-- When the advocate-verified terms ship, bump AGREEMENT_VERSION
-- in worker/src/data/partnerAgreements.js — partners re-accept.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE workers ADD COLUMN IF NOT EXISTS agreement_version     TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS agreement_accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN workers.agreement_version     IS 'Version of Fixera Partner Terms accepted (e.g. v0.9-draft)';
COMMENT ON COLUMN workers.agreement_accepted_at IS 'Timestamp when the partner accepted the terms';
