-- ============================================================
-- FIXERA: Supplier Marketplace Orders
-- Customers browse supplier products and place multi-item orders.
-- Suppliers fulfill (pack → ready → dispatch via Fixera rider).
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS supplier_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Cart line items: [{ product_id, name, price, qty }]
  items        JSONB NOT NULL DEFAULT '[]',
  total        NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Delivery
  customer_name    TEXT,
  customer_phone   TEXT,
  delivery_address TEXT,
  delivery_lat     NUMERIC(10,7),
  delivery_lng     NUMERIC(10,7),
  notes            TEXT,

  -- Lifecycle
  status            TEXT DEFAULT 'pending',
  -- pending | confirmed | packing | ready | out_for_delivery | delivered | cancelled
  fulfillment_stage TEXT,
  assigned_rider_id UUID,

  confirmed_at TIMESTAMPTZ,
  packed_at    TIMESTAMPTZ,
  ready_at     TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sup_orders_customer ON supplier_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sup_orders_supplier ON supplier_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sup_orders_status   ON supplier_orders(status);

-- Link delivery legs to supplier orders (in addition to bookings)
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS supplier_order_id UUID;
CREATE INDEX IF NOT EXISTS idx_dt_supplier_order ON delivery_tracking(supplier_order_id) WHERE supplier_order_id IS NOT NULL;

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers manage own supplier orders" ON supplier_orders;
CREATE POLICY "Customers manage own supplier orders"
  ON supplier_orders FOR ALL TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Suppliers read their orders" ON supplier_orders;
CREATE POLICY "Suppliers read their orders"
  ON supplier_orders FOR SELECT TO authenticated
  USING (supplier_id = auth.uid());

DROP POLICY IF EXISTS "Suppliers update their orders" ON supplier_orders;
CREATE POLICY "Suppliers update their orders"
  ON supplier_orders FOR UPDATE TO authenticated
  USING (supplier_id = auth.uid());

-- Riders need to read supplier orders attached to their delivery legs
DROP POLICY IF EXISTS "Riders read assigned supplier orders" ON supplier_orders;
CREATE POLICY "Riders read assigned supplier orders"
  ON supplier_orders FOR SELECT TO authenticated
  USING (assigned_rider_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all supplier orders" ON supplier_orders;
CREATE POLICY "Admins read all supplier orders"
  ON supplier_orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Customers also need to read products to shop (vendor_products is the catalog)
DROP POLICY IF EXISTS "Anyone can read in-stock products" ON vendor_products;
CREATE POLICY "Anyone can read in-stock products"
  ON vendor_products FOR SELECT TO authenticated
  USING (true);
