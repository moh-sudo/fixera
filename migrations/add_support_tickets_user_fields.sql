-- ============================================================
--  Support Tickets — Add user identity + resolved_at columns
--  Run once in Supabase SQL Editor
-- ============================================================

-- Who submitted the ticket
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_type  TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_name  TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_email TEXT;

-- When the ticket was resolved (for SLA reporting)
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Backfill user_type for old tickets that came from the partner app
-- (partner app sets user_type in code, so only legacy rows need this)
UPDATE support_tickets SET user_type = 'customer'
  WHERE user_type IS NULL AND category IN ('Report an Issue','Request a Refund');

-- Index for filtering by user type in admin
CREATE INDEX IF NOT EXISTS idx_tickets_user_type ON support_tickets(user_type);
