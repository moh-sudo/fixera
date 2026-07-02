-- Announcements table
-- Supports targeting: 'all', 'customers', 'workers', 'riders', 'vendors',
--                     'suppliers', 'movers', 'water_carriers', 'partners' (all partner roles)

CREATE TABLE IF NOT EXISTS announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'info',  -- info | warning | promotion | maintenance
  target          TEXT NOT NULL DEFAULT 'all',   -- all | customers | partners | worker | rider | vendor | supplier | mover | water_carrier
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  publish_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast active-announcement queries
CREATE INDEX IF NOT EXISTS idx_announcements_publish ON announcements (publish_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_target  ON announcements (target);

-- RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read active announcements" ON announcements;
CREATE POLICY "Read active announcements"
  ON announcements FOR SELECT
  USING (
    publish_at <= NOW()
    AND (expires_at IS NULL OR expires_at > NOW())
  );

DROP POLICY IF EXISTS "Admins manage announcements" ON announcements;
CREATE POLICY "Admins manage announcements"
  ON announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );
