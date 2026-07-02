-- ============================================================
-- FIXERA: Vendor Order Fulfillment + Business Hours
-- Adds the laundry/cleaning fulfillment lifecycle on top of the
-- coarse bookings.status, plus before/after proof photos and
-- vendor availability (open/closed + hours).
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Per-order fulfillment lifecycle (distinct from coarse status) ──
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS fulfillment_stage TEXT;
-- received | preparing | ready | out_for_delivery | delivered
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS prep_photos       JSONB DEFAULT '[]';
-- before/after photos of the items being cleaned
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS received_at       TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS prep_started_at   TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ready_at          TIMESTAMPTZ;

COMMENT ON COLUMN bookings.fulfillment_stage IS 'Vendor order lifecycle: received | preparing | ready | out_for_delivery | delivered';
COMMENT ON COLUMN bookings.prep_photos       IS 'Vendor before/after proof photos of items';
COMMENT ON COLUMN bookings.received_at        IS 'Vendor received the items';
COMMENT ON COLUMN bookings.prep_started_at    IS 'Vendor started processing';
COMMENT ON COLUMN bookings.ready_at           IS 'Items ready for return delivery';

CREATE INDEX IF NOT EXISTS idx_bookings_fulfillment ON bookings(fulfillment_stage) WHERE fulfillment_stage IS NOT NULL;

-- ── Vendor availability ─────────────────────────────────────
ALTER TABLE workers ADD COLUMN IF NOT EXISTS is_open        BOOLEAN DEFAULT true;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS business_hours JSONB;
-- business_hours: { open: '08:00', close: '18:00', days: ['mon','tue',...] }

COMMENT ON COLUMN workers.is_open        IS 'Vendor/Supplier: currently accepting orders';
COMMENT ON COLUMN workers.business_hours IS 'Operating hours { open, close, days[] }';
