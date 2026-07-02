-- ============================================================
-- FIXERA: Payment idempotency constraint
-- Prevents duplicate payments for the same ref (e.g. double
-- M-Pesa callback or network retry). The app-layer check in
-- paymentService.getPaymentFor() is NOT race-condition safe —
-- this DB UNIQUE constraint is the real guarantee.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS mpesa_checkout_id TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_checkout
  ON payments(mpesa_checkout_id)
  WHERE mpesa_checkout_id IS NOT NULL;

-- The primary idempotency key: one payment per (ref, method)
-- Cash payments: one cash record per booking/order/request
-- M-Pesa payments: one mpesa record per booking/order/request
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS uq_payment_ref;

ALTER TABLE payments
  ADD CONSTRAINT uq_payment_ref
  UNIQUE (ref_type, ref_id, method);
