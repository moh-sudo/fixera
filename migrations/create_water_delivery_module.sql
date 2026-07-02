-- ============================================================
-- FIXERA: Water Delivery Module + GPS Live Tracking
-- Reuses existing bookings table (water deliveries are fixed-price
-- and fit standard booking flow). Adds water-specific columns +
-- new live_locations table for real-time driver tracking.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Add stable service_id (the existing 'service' column is the
--    human-readable name like "Water Delivery"; we need a stable
--    machine identifier for RLS policies and service routing). ──
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_id TEXT;

COMMENT ON COLUMN bookings.service_id IS 'Stable service identifier (e.g. water-carriers, movers, plumbing). Distinct from the human-readable service name column.';

-- Backfill existing rows where service name contains 'water'
UPDATE bookings SET service_id = 'water-carriers'
WHERE service_id IS NULL AND lower(service) LIKE '%water%';

CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id) WHERE service_id IS NOT NULL;

-- ── Extend bookings with water delivery fields ───────────────
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS carrier_user_id     UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_snapshot     JSONB;
-- driver_snapshot: { name, phone, photo_url, plate, vehicle_id }
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_photo_urls JSONB DEFAULT '[]';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmed_at        TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS departed_at         TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS arrived_at          TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivered_at        TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_fee    NUMERIC(10,2);

COMMENT ON COLUMN bookings.carrier_user_id      IS 'Water Carrier: assigned partner';
COMMENT ON COLUMN bookings.driver_snapshot      IS 'Water Carrier: driver name, photo, plate (snapshotted from fleet/crew)';
COMMENT ON COLUMN bookings.delivery_photo_urls  IS 'Water Carrier: driver-uploaded delivery proof photos';
COMMENT ON COLUMN bookings.confirmed_at         IS 'Status timestamp: carrier accepted order';
COMMENT ON COLUMN bookings.departed_at          IS 'Status timestamp: truck left depot';
COMMENT ON COLUMN bookings.arrived_at           IS 'Status timestamp: truck at customer gate';
COMMENT ON COLUMN bookings.delivered_at         IS 'Status timestamp: customer signed off';

CREATE INDEX IF NOT EXISTS idx_bookings_carrier ON bookings(carrier_user_id) WHERE carrier_user_id IS NOT NULL;

-- ── Live locations (GPS streaming for movers + water carriers) ──
CREATE TABLE IF NOT EXISTS live_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What this location relates to
  booking_id UUID,                              -- water delivery
  moving_request_id UUID,                       -- moving request (future Phase 2)
  partner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Coordinates
  lat       NUMERIC(10, 7) NOT NULL,
  lng       NUMERIC(10, 7) NOT NULL,
  accuracy  NUMERIC(8, 2),                       -- meters
  heading   NUMERIC(5, 2),                       -- degrees 0-360
  speed     NUMERIC(8, 2),                       -- m/s

  recorded_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT live_locations_target_check
    CHECK (booking_id IS NOT NULL OR moving_request_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_live_loc_booking         ON live_locations(booking_id, recorded_at DESC)         WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_loc_moving          ON live_locations(moving_request_id, recorded_at DESC)  WHERE moving_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_loc_partner_recent  ON live_locations(partner_user_id, recorded_at DESC);

-- Enable Realtime so customer can subscribe
ALTER TABLE live_locations REPLICA IDENTITY FULL;

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE live_locations ENABLE ROW LEVEL SECURITY;

-- Partners insert their own location pings
DROP POLICY IF EXISTS "Partners insert own location" ON live_locations;
CREATE POLICY "Partners insert own location"
  ON live_locations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = partner_user_id);

-- Customer can read locations for their own bookings
DROP POLICY IF EXISTS "Customer reads own booking locations" ON live_locations;
CREATE POLICY "Customer reads own booking locations"
  ON live_locations FOR SELECT TO authenticated
  USING (
    booking_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = live_locations.booking_id AND b.user_id = auth.uid()
    )
    OR
    moving_request_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM moving_requests m
      WHERE m.id = live_locations.moving_request_id AND m.user_id = auth.uid()
    )
  );

-- Partners can read their own location history
DROP POLICY IF EXISTS "Partners read own location" ON live_locations;
CREATE POLICY "Partners read own location"
  ON live_locations FOR SELECT TO authenticated
  USING (auth.uid() = partner_user_id);

-- Admins read all
DROP POLICY IF EXISTS "Admins read all locations" ON live_locations;
CREATE POLICY "Admins read all locations"
  ON live_locations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
  ));

-- ── Water Carriers: extra RLS on bookings ──────────────────
-- Online water carriers can see open water orders (broadcast queue)
DROP POLICY IF EXISTS "Water carriers read open water orders" ON bookings;
CREATE POLICY "Water carriers read open water orders"
  ON bookings FOR SELECT TO authenticated
  USING (
    service_id = 'water-carriers'
    AND (
      -- Open (not yet assigned) — any water carrier sees it
      (status = 'pending' AND carrier_user_id IS NULL)
      -- Assigned to me — I see it
      OR carrier_user_id = auth.uid()
    )
  );

-- Water carriers can claim open orders (set carrier_user_id = self)
DROP POLICY IF EXISTS "Water carriers claim open orders" ON bookings;
CREATE POLICY "Water carriers claim open orders"
  ON bookings FOR UPDATE TO authenticated
  USING (
    service_id = 'water-carriers' AND (
      (status = 'pending' AND carrier_user_id IS NULL)
      OR carrier_user_id = auth.uid()
    )
  );

-- ── Add live_locations to the realtime publication (for Supabase Realtime) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_locations;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If publication doesn't exist or insert fails, ignore — realtime can be enabled
  -- manually in Supabase Dashboard → Database → Replication
  NULL;
END $$;
