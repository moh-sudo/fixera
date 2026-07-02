-- ============================================================
-- FIXERA: Push Notification Tokens (FCM-ready)
-- Stores each user's device push token so the server can send
-- Firebase Cloud Messaging (FCM) pushes when the app is closed.
-- DORMANT until you create a Firebase project (see FCM-SETUP.md).
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT DEFAULT 'web',        -- web | android | ios
  app        TEXT,                       -- 'customer' | 'partner'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_notif_tokens_user ON notification_tokens(user_id);

ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push tokens" ON notification_tokens;
CREATE POLICY "Users manage own push tokens"
  ON notification_tokens FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
