-- Per-user announcement read tracking
-- Replaces localStorage-based dismissal with persistent DB records

CREATE TABLE IF NOT EXISTS announcement_reads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, announcement_id)
);

CREATE INDEX IF NOT EXISTS idx_ann_reads_user ON announcement_reads (user_id);

ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own reads" ON announcement_reads;
CREATE POLICY "Users manage own reads"
  ON announcement_reads FOR ALL
  USING (auth.uid() = user_id);
