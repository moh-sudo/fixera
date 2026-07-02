-- ============================================================
-- FIXERA: Rider Dispatch Engine + Live Location
-- Connects Vendors → Riders. When a vendor marks an order "Ready",
-- a return delivery leg is auto-created and offered to the ORIGINAL
-- rider first (15-min exclusive window), then to the nearest
-- available rider. Online riders broadcast their location so the
-- system can rank by distance.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── delivery_tracking: support two legs + dispatch metadata ──
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS leg_type          TEXT DEFAULT 'pickup';
-- 'pickup' (customer → vendor) | 'return' (vendor → customer)
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS dropoff_address   TEXT;
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS pickup_lat        NUMERIC(10,7);
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS pickup_lng        NUMERIC(10,7);
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS dropoff_lat       NUMERIC(10,7);
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS dropoff_lng       NUMERIC(10,7);
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS vendor_id         UUID;
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS customer_name     TEXT;
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS preferred_rider_id UUID;
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS offered_at        TIMESTAMPTZ;
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS amount            NUMERIC(10,2);

COMMENT ON COLUMN delivery_tracking.leg_type           IS 'pickup (customer→vendor) or return (vendor→customer)';
COMMENT ON COLUMN delivery_tracking.preferred_rider_id IS 'Rider who owns this order — offered the return leg first';
COMMENT ON COLUMN delivery_tracking.offered_at         IS 'When the preferred rider was offered the leg (15-min exclusive window)';

CREATE INDEX IF NOT EXISTS idx_dt_pending   ON delivery_tracking(status) WHERE rider_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_dt_preferred ON delivery_tracking(preferred_rider_id) WHERE preferred_rider_id IS NOT NULL;

-- ── Rider live location (for distance ranking) ──────────────
ALTER TABLE workers ADD COLUMN IF NOT EXISTS last_lat         NUMERIC(10,7);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS last_lng         NUMERIC(10,7);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ;

COMMENT ON COLUMN workers.last_lat IS 'Rider last known latitude (broadcast while online)';
COMMENT ON COLUMN workers.last_lng IS 'Rider last known longitude (broadcast while online)';

-- ── Order ownership: which rider owns this booking's logistics ──
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assigned_rider_id UUID;
COMMENT ON COLUMN bookings.assigned_rider_id IS 'Rider who did pickup — preferred for return leg';

-- ── RLS: riders read pending + own legs, claim open ones ────
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Riders read available + own legs" ON delivery_tracking;
CREATE POLICY "Riders read available + own legs"
  ON delivery_tracking FOR SELECT TO authenticated
  USING (
    rider_id IS NULL            -- open jobs (queue)
    OR rider_id = auth.uid()    -- my jobs
  );

DROP POLICY IF EXISTS "Riders claim + update legs" ON delivery_tracking;
CREATE POLICY "Riders claim + update legs"
  ON delivery_tracking FOR UPDATE TO authenticated
  USING (rider_id IS NULL OR rider_id = auth.uid());

DROP POLICY IF EXISTS "System inserts legs" ON delivery_tracking;
CREATE POLICY "System inserts legs"
  ON delivery_tracking FOR INSERT TO authenticated
  WITH CHECK (true);
