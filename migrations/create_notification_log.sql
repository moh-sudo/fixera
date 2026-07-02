-- ============================================================
-- FIXERA: notification_log — audit trail for all sent notifications
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  channel      TEXT NOT NULL CHECK (channel IN ('push', 'email', 'sms')),
  type         TEXT NOT NULL,        -- e.g. 'booking_confirmed', 'ticket_update', 'announcement'
  title        TEXT,
  body         TEXT,
  ref_type     TEXT,                 -- 'booking' | 'ticket' | 'announcement' | etc.
  ref_id       UUID,
  status       TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
  error        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_log_user    ON notification_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_log_type    ON notification_log(type);
CREATE INDEX IF NOT EXISTS idx_notif_log_ref     ON notification_log(ref_type, ref_id);

-- RLS: admins can read all; users can read their own
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read notification_log" ON notification_log;
CREATE POLICY "Admins read notification_log"
  ON notification_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "Users read own notification_log" ON notification_log;
CREATE POLICY "Users read own notification_log"
  ON notification_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role insert notification_log" ON notification_log;
CREATE POLICY "Service role insert notification_log"
  ON notification_log FOR INSERT TO authenticated
  WITH CHECK (true);
