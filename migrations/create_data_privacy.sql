-- ============================================================
-- FIXERA: Data privacy (Kenya DPA 2019) — erasure + audit trail
-- Right to erasure: anonymize PII, keep financial/booking records
-- (receipts, reviews, bookings) for tax/dispute retention — the
-- auth.users row is never deleted so those FKs stay intact.
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE workers  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS data_erasure_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role         TEXT NOT NULL,           -- 'customer' | 'partner'
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_data_erasure_log_user ON data_erasure_log(user_id);
