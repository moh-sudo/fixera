-- ============================================================
-- FIXERA: Add is_available toggle to workers table
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;

-- Partners default to available; admin can also flip this
