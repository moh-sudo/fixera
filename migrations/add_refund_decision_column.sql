-- ============================================================
--  Support Tickets — Add refund_decision column
--  Run once in Supabase SQL Editor
-- ============================================================

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS refund_decision TEXT;

-- Values: 'approved' | 'declined' | NULL (not yet actioned)
CREATE INDEX IF NOT EXISTS idx_tickets_refund_decision ON support_tickets(refund_decision);
