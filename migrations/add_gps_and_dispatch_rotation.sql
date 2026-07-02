-- ============================================================
-- FIXERA: Supplier-order GPS + Sequential rider offer rotation
-- Fix 3: live_locations can target a supplier_order (so customers
--        watch supplier deliveries on a live map).
-- Fix 5: delivery legs are offered to one rider at a time with a
--        countdown; decline/timeout re-targets the next nearest.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Fix 3: supplier-order live location ─────────────────────
ALTER TABLE live_locations ADD COLUMN IF NOT EXISTS supplier_order_id UUID;
CREATE INDEX IF NOT EXISTS idx_live_loc_supplier ON live_locations(supplier_order_id, recorded_at DESC) WHERE supplier_order_id IS NOT NULL;

-- Customer can read locations for their own supplier order
DROP POLICY IF EXISTS "Customer reads supplier order locations" ON live_locations;
CREATE POLICY "Customer reads supplier order locations"
  ON live_locations FOR SELECT TO authenticated
  USING (
    supplier_order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM supplier_orders so
      WHERE so.id = live_locations.supplier_order_id AND so.customer_id = auth.uid()
    )
  );

-- ── Fix 5: sequential offer rotation on delivery legs ───────
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS offered_to       UUID;
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS offer_expires_at TIMESTAMPTZ;
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS declined_by      JSONB DEFAULT '[]';

COMMENT ON COLUMN delivery_tracking.offered_to       IS 'Rider currently being offered this leg (exclusive until offer_expires_at)';
COMMENT ON COLUMN delivery_tracking.offer_expires_at IS 'When the current exclusive offer lapses → opens to nearby pool';
COMMENT ON COLUMN delivery_tracking.declined_by      IS 'Rider ids who declined — excluded from re-targeting';
