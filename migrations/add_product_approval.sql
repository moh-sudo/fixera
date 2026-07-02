-- ============================================================
-- FIXERA: Supplier Product Approval Workflow
-- Suppliers update their own catalog (new products, price changes,
-- stock) from their dashboard. New products + price changes go to
-- 'pending' and only reach customers after Fixera approves.
-- Stock in/out toggles are instant. No more manual catalog entry.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS status         TEXT DEFAULT 'approved';
-- approved | pending | rejected
ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS pending_price  NUMERIC(12,2);
-- proposed new price awaiting approval (current `price` stays live until approved)
ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS submitted_at   TIMESTAMPTZ;

COMMENT ON COLUMN vendor_products.status         IS 'approved (live) | pending (awaiting Fixera) | rejected';
COMMENT ON COLUMN vendor_products.pending_price  IS 'Proposed price change awaiting approval; live price unchanged until approved';

-- Existing rows are already live
UPDATE vendor_products SET status = 'approved' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_status ON vendor_products(status);

-- ── RLS ─────────────────────────────────────────────────────
-- Suppliers manage their own products
DROP POLICY IF EXISTS "Suppliers manage own products" ON vendor_products;
CREATE POLICY "Suppliers manage own products"
  ON vendor_products FOR ALL TO authenticated
  USING (business_id = auth.uid())
  WITH CHECK (business_id = auth.uid());

-- Admins can update any product (approve / reject)
DROP POLICY IF EXISTS "Admins manage all products" ON vendor_products;
CREATE POLICY "Admins manage all products"
  ON vendor_products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Public read stays (the shop filters status='approved' in the query)
DROP POLICY IF EXISTS "Anyone can read in-stock products" ON vendor_products;
DROP POLICY IF EXISTS "Anyone can read products" ON vendor_products;
CREATE POLICY "Anyone can read products"
  ON vendor_products FOR SELECT TO authenticated
  USING (true);
