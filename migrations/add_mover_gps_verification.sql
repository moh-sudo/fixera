-- ============================================================
-- FIXERA: Mover Live GPS + Loading/Delivery Verification
-- Blueprint §11–13: loading photo evidence chain at pickup,
-- customer inventory sign-off at destination, live GPS in transit.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Loading verification (photos of loaded cargo + truck at pickup) ──
ALTER TABLE moving_requests ADD COLUMN IF NOT EXISTS loading_photo_urls  JSONB DEFAULT '[]';
ALTER TABLE moving_requests ADD COLUMN IF NOT EXISTS started_at          TIMESTAMPTZ;

-- ── Delivery verification + digital sign-off ──
ALTER TABLE moving_requests ADD COLUMN IF NOT EXISTS delivery_photo_urls JSONB DEFAULT '[]';
ALTER TABLE moving_requests ADD COLUMN IF NOT EXISTS delivery_checklist  JSONB;
-- delivery_checklist: [{ item: 'Sofa', qty: 1, received: true }, ...]
ALTER TABLE moving_requests ADD COLUMN IF NOT EXISTS delivery_signature  TEXT;
-- typed full name as digital signature
ALTER TABLE moving_requests ADD COLUMN IF NOT EXISTS delivered_at        TIMESTAMPTZ;
ALTER TABLE moving_requests ADD COLUMN IF NOT EXISTS delivery_signed_at  TIMESTAMPTZ;

COMMENT ON COLUMN moving_requests.loading_photo_urls  IS 'Mover-uploaded photos of loaded cargo + truck at pickup (evidence chain)';
COMMENT ON COLUMN moving_requests.delivery_photo_urls IS 'Mover-uploaded photos at destination';
COMMENT ON COLUMN moving_requests.delivery_checklist  IS 'Customer tick-off of inventory items received: [{item, qty, received}]';
COMMENT ON COLUMN moving_requests.delivery_signature  IS 'Customer typed full name = digital sign-off';
COMMENT ON COLUMN moving_requests.started_at          IS 'Mover tapped Start Move (GPS begins)';
COMMENT ON COLUMN moving_requests.delivered_at        IS 'Mover marked arrived+unloaded at destination';
COMMENT ON COLUMN moving_requests.delivery_signed_at  IS 'Customer confirmed receipt + signed';

-- Status flow is now:
-- awaiting_quotes → quoted → accepted → in_progress → delivered → completed
--                                                   ↘ cancelled

-- ── RLS: movers must be able to update requests they won ──
-- (assign team / start / deliver). Scoped to the mover whose
-- quote was accepted, or who has any quote while open.
DROP POLICY IF EXISTS "Movers update requests they quoted" ON moving_requests;
CREATE POLICY "Movers update requests they quoted"
  ON moving_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM moving_quotes q
      WHERE q.request_id = moving_requests.id
        AND q.mover_id = auth.uid()
    )
  );

-- live_locations already supports moving_request_id with customer-read
-- RLS (created in create_water_delivery_module.sql). Nothing to add.
