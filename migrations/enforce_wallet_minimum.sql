-- ─────────────────────────────────────────────────────────────────────────────
-- WALLET MINIMUM ENFORCEMENT
-- Workers and riders must keep a minimum KSh 500 in their wallet to receive
-- job assignments. When balance falls below 500, can_receive_jobs is set to
-- false automatically by this trigger.
-- Vendors / movers / suppliers / water_carriers are NOT gated by wallet —
-- they are gated by security_deposit_status = 'held'.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add the flag column
ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS can_receive_jobs BOOLEAN NOT NULL DEFAULT true;

-- 2. Backfill current state
--    Workers/riders need MORE than KSh 500 — at exactly 500 they are blocked.
UPDATE workers
SET can_receive_jobs = CASE
  WHEN partner_role IN ('worker', 'rider') THEN (wallet_balance > 500)
  WHEN partner_role IN ('vendor', 'supplier', 'mover', 'water_carrier')
    THEN (security_deposit_status = 'held')
  ELSE true
END;

-- 3. Trigger: re-evaluate can_receive_jobs whenever wallet_balance OR
--    security_deposit_status changes
CREATE OR REPLACE FUNCTION trg_wallet_gate_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Only enforce for wallet-model partners
  IF NEW.partner_role IN ('worker', 'rider') THEN
    -- Blocked at KSh 500 and below; must top up to above 500 to resume
    NEW.can_receive_jobs := (NEW.wallet_balance > 500);
  ELSIF NEW.partner_role IN ('vendor', 'supplier', 'mover', 'water_carrier') THEN
    NEW.can_receive_jobs := (NEW.security_deposit_status = 'held');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wallet_gate ON workers;
CREATE TRIGGER trg_wallet_gate
  BEFORE UPDATE OF wallet_balance, security_deposit_status ON workers
  FOR EACH ROW EXECUTE FUNCTION trg_wallet_gate_fn();

-- 4. Admin dashboard view — shows every partner's gate status at a glance
CREATE OR REPLACE VIEW partner_wallet_status AS
SELECT
  w.id,
  w.full_name,
  w.partner_role,
  w.verification_status,
  w.can_receive_jobs,
  -- wallet fields (workers + riders)
  w.wallet_balance,
  CASE WHEN w.partner_role IN ('worker','rider')
    THEN (500 - LEAST(w.wallet_balance, 500))
    ELSE NULL
  END AS topup_needed,
  -- deposit fields (vendors, movers, suppliers, water carriers)
  w.security_deposit,
  w.security_deposit_status,
  w.security_deposit_paid_at
FROM workers w
WHERE w.verification_status != 'rejected';
