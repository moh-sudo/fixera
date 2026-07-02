-- ============================================================
-- FIXERA: Partner Wallet + Commission Auto-Deduction
-- Workers & Riders keep a deposit wallet. When a customer pays
-- CASH, the partner holds Fixera's commission, so it is deducted
-- from their wallet automatically (DB trigger — bypasses RLS).
-- Vendors/Suppliers/Movers/Water use settlement instead (no wallet).
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE workers ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12,2) DEFAULT 0;
COMMENT ON COLUMN workers.wallet_balance IS 'Worker/Rider deposit wallet; commission on cash jobs is deducted from here';

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,            -- topup | commission | payout | adjustment
  amount         NUMERIC(12,2) NOT NULL,   -- + credit, - debit
  balance_after  NUMERIC(12,2),
  ref_payment_id UUID,
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_worker ON wallet_transactions(worker_id, created_at DESC);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workers read own wallet tx" ON wallet_transactions;
CREATE POLICY "Workers read own wallet tx"
  ON wallet_transactions FOR SELECT TO authenticated
  USING (worker_id = auth.uid());

-- ── Trigger: deduct commission from wallet on cash payment ──
CREATE OR REPLACE FUNCTION fixera_wallet_on_cash_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_balance NUMERIC(12,2);
BEGIN
  -- Only when a payment first becomes paid, cash, for a worker/rider
  IF NEW.status = 'paid'
     AND NEW.method = 'cash'
     AND (OLD.status IS DISTINCT FROM 'paid')
     AND NEW.payee_role IN ('worker','rider')
     AND NEW.payee_id IS NOT NULL
     AND COALESCE(NEW.commission_amount,0) > 0
  THEN
    UPDATE workers
      SET wallet_balance = COALESCE(wallet_balance,0) - NEW.commission_amount
      WHERE id = NEW.payee_id
      RETURNING wallet_balance INTO new_balance;

    INSERT INTO wallet_transactions (worker_id, type, amount, balance_after, ref_payment_id, note)
    VALUES (NEW.payee_id, 'commission', -NEW.commission_amount, new_balance, NEW.id,
            'Commission on cash job');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wallet_on_cash_payment ON payments;
CREATE TRIGGER trg_wallet_on_cash_payment
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION fixera_wallet_on_cash_payment();
