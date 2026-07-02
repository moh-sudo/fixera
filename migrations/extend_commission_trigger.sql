-- ============================================================
-- FIXERA: Extend commission trigger to all 6 partner types
-- Original trigger only handled worker + rider (wallet deduction).
-- This extension adds vendor, mover, supplier, water_carrier —
-- for these, commission is recorded as 'commission_due' in
-- wallet_transactions so admin can track settlement obligations.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE OR REPLACE FUNCTION fixera_wallet_on_cash_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only fire on cash payments transitioning to 'paid'
  IF NEW.status <> 'paid' OR OLD.status = 'paid' THEN
    RETURN NEW;
  END IF;
  IF NEW.method <> 'cash' THEN
    RETURN NEW;
  END IF;
  IF NEW.commission_amount IS NULL OR NEW.commission_amount <= 0 THEN
    RETURN NEW;
  END IF;

  -- ── Workers & Riders: deduct commission from wallet ──────
  IF NEW.payee_role IN ('worker', 'rider') THEN
    UPDATE workers
      SET wallet_balance = wallet_balance - NEW.commission_amount
    WHERE id = NEW.payee_id;

    INSERT INTO wallet_transactions (
      worker_id, type, amount, description, payment_id, created_at
    ) VALUES (
      NEW.payee_id,
      'commission',
      -NEW.commission_amount,
      'Commission on cash payment',
      NEW.id,
      now()
    );

  -- ── Vendors, Movers, Suppliers, Water Carriers: record commission due ──
  ELSIF NEW.payee_role IN ('vendor', 'mover', 'supplier', 'water_carrier') THEN
    INSERT INTO wallet_transactions (
      worker_id, type, amount, description, payment_id, created_at
    ) VALUES (
      NEW.payee_id,
      'commission_due',
      NEW.commission_amount,
      'Commission owed to Fixera (settlement)',
      NEW.id,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Replace the old trigger (same name — DROP + CREATE)
DROP TRIGGER IF EXISTS trg_commission_on_cash ON payments;
CREATE TRIGGER trg_commission_on_cash
  AFTER UPDATE OF status ON payments
  FOR EACH ROW EXECUTE FUNCTION fixera_wallet_on_cash_payment();
