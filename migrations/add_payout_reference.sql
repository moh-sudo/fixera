-- ============================================================
-- FIXERA: Payout M-Pesa reference + settlement linkage
-- When admin marks a payout PAID, capture the M-Pesa/bank
-- transaction reference + the period it settles. The partner's
-- earnings statement then shows this reference.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- (payouts table already exists — these are additive columns)
-- ============================================================

ALTER TABLE payouts ADD COLUMN IF NOT EXISTS mpesa_ref      TEXT;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS settled_period TEXT;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS partner_id     UUID;
-- partner_id mirrors worker_id for clarity across partner types; harmless if unused.

COMMENT ON COLUMN payouts.mpesa_ref      IS 'M-Pesa B2C / bank transfer reference for this payout';
COMMENT ON COLUMN payouts.settled_period IS 'Human label of the settlement period (e.g. "Week of 9 Jun 2026")';

CREATE INDEX IF NOT EXISTS idx_payouts_worker ON payouts(worker_id);

-- Latest paid payout reference per worker — read by the partner statement
-- (no view needed; the app queries payouts directly)
