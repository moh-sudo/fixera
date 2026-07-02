-- ============================================================
--  Fixera — Add service_area_id to bookings
--  Enables area-based partner routing and analytics
-- ============================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS service_area_id UUID REFERENCES service_areas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_service_area ON bookings(service_area_id);
CREATE INDEX IF NOT EXISTS idx_bookings_area_status  ON bookings(service_area_id, status);
