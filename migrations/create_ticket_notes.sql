-- ============================================================
-- FIXERA: ticket_notes table — internal admin notes on tickets
-- Agents can communicate internally without customer seeing
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS ticket_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  admin_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_name TEXT NOT NULL,
  note       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_notes_ticket ON ticket_notes(ticket_id);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE ticket_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage ticket notes" ON ticket_notes;
CREATE POLICY "Admins manage ticket notes"
  ON ticket_notes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
