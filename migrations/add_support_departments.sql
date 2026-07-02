-- ============================================================
-- FIXERA: Support Departments & Priority
-- Adds department routing + priority to support tickets so each
-- partner type's issues route to the right Fixera department:
--   finance | operations | trust_safety | accounts | technical | partner_success
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'partner_success';
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS priority   TEXT DEFAULT 'normal';
-- priority: 'urgent' | 'high' | 'normal'

COMMENT ON COLUMN support_tickets.department IS 'Routing department: finance | operations | trust_safety | accounts | technical | partner_success';
COMMENT ON COLUMN support_tickets.priority   IS 'Ticket priority: urgent (1h SLA) | high | normal';

-- Backfill old tickets from their legacy category names
UPDATE support_tickets SET department = 'finance',      priority = 'high'
  WHERE department = 'partner_success' AND category IN ('payment');
UPDATE support_tickets SET department = 'operations',   priority = 'high'
  WHERE department = 'partner_success' AND category IN ('booking');
UPDATE support_tickets SET department = 'trust_safety', priority = 'urgent'
  WHERE department = 'partner_success' AND category IN ('customer');
UPDATE support_tickets SET department = 'accounts'
  WHERE department = 'partner_success' AND category IN ('account');
UPDATE support_tickets SET department = 'technical'
  WHERE department = 'partner_success' AND category IN ('app');

CREATE INDEX IF NOT EXISTS idx_tickets_department ON support_tickets(department);
CREATE INDEX IF NOT EXISTS idx_tickets_priority   ON support_tickets(priority);
