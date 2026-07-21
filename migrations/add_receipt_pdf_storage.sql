-- ============================================================
-- FIXERA: Receipt PDF storage (plan item 4.4 — invoice PDF generation)
-- The worker app already generates+uploads a receipt PDF on job
-- completion (utils/receiptPDF.js) but the `pdf_url` column and the
-- `receipts` storage bucket were never captured in a tracked
-- migration — this makes both idempotent so they're guaranteed to
-- exist regardless of what was set up manually before.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE receipts ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Bucket: public read (so a receipt link can be opened/downloaded
-- directly), authenticated users write only inside their own folder.
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "receipts_public_read" ON storage.objects;
CREATE POLICY "receipts_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "receipts_self_insert" ON storage.objects;
CREATE POLICY "receipts_self_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "receipts_self_update" ON storage.objects;
CREATE POLICY "receipts_self_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
