-- ============================================================
-- FIXERA: Painting-style Materials Estimate (multi-partner chain)
-- A service worker on an active job estimates materials from a
-- supplier's catalog → creates a supplier_order in 'estimate'
-- state linked to the parent job. Customer confirms → it enters
-- the normal supplier → rider → delivery → payment flow.
-- Run in: Supabase Dashboard → SQL Editor → New query
--   (AFTER create_supplier_orders.sql)
-- ============================================================

ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS parent_booking_id UUID;
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS estimated_by_worker UUID;

COMMENT ON COLUMN supplier_orders.parent_booking_id   IS 'The service job (bookings.id) this materials order belongs to';
COMMENT ON COLUMN supplier_orders.estimated_by_worker IS 'Service worker who created the materials estimate';

-- 'estimate' is a new status BEFORE 'pending':
--   estimate (worker proposed) → pending (customer confirmed) → confirmed → ... → delivered
CREATE INDEX IF NOT EXISTS idx_sup_orders_parent ON supplier_orders(parent_booking_id) WHERE parent_booking_id IS NOT NULL;

-- ── RLS: let the assigned service worker create an estimate ──
-- A worker may insert a supplier_order when it is an estimate tied to a
-- booking they are assigned to.
DROP POLICY IF EXISTS "Workers create material estimates" ON supplier_orders;
CREATE POLICY "Workers create material estimates"
  ON supplier_orders FOR INSERT TO authenticated
  WITH CHECK (
    estimated_by_worker = auth.uid()
    AND status = 'estimate'
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = supplier_orders.parent_booking_id
        AND b.worker_id = auth.uid()
    )
  );

-- Worker can read estimates they created (to see confirmation status)
DROP POLICY IF EXISTS "Workers read their estimates" ON supplier_orders;
CREATE POLICY "Workers read their estimates"
  ON supplier_orders FOR SELECT TO authenticated
  USING (estimated_by_worker = auth.uid());

-- Customer already can read/update their own supplier_orders (customer_id),
-- but estimates are created by the worker with customer_id = the job's customer,
-- so customers can confirm them via the existing "Customers manage own" policy.
