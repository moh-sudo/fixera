-- ============================================================
-- FIXERA: Rider snapshot on orders (both-sides connection)
-- When a rider accepts a delivery leg, their name/phone is written
-- onto the linked order so the VENDOR/SUPPLIER can see who is
-- collecting — without cross-RLS access to the workers table.
-- (The customer already sees the rider via live tracking.)
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS rider_name  TEXT;
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS rider_phone TEXT;
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS rider_vehicle TEXT;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rider_name  TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rider_phone TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rider_vehicle TEXT;

COMMENT ON COLUMN supplier_orders.rider_name IS 'Assigned rider name (snapshot for supplier visibility)';
COMMENT ON COLUMN bookings.rider_name        IS 'Assigned rider name (snapshot for vendor visibility)';
