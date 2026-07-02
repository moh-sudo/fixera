-- ============================================================
-- FIXERA: Add assigned_to + SLA deadline to support_tickets
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS assigned_to      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_name    TEXT,
  ADD COLUMN IF NOT EXISTS sla_deadline     TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON support_tickets(assigned_to) WHERE assigned_to IS NOT NULL;
