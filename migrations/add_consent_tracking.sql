-- Consent version tracking for customers (profiles table)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_version      TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_version    TEXT,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

-- Privacy consent tracking for partners (workers table)
-- Note: MPA consent already tracked via agreement_version + agreement_accepted_at
ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS terms_version      TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_version    TEXT,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;
