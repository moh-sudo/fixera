-- Add Daraja STK Push tracking columns to payments
-- mpesa_checkout_id — the CheckoutRequestID returned by Daraja STK Push
-- This lets the callback and polling logic map back to the right payment row.
-- mpesa_ref already exists for the receipt (M-Pesa transaction ID).

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS mpesa_checkout_id TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_mpesa_checkout
  ON payments (mpesa_checkout_id)
  WHERE mpesa_checkout_id IS NOT NULL;
