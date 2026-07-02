-- ============================================================
--  Fixera — Two-sided Dispute Resolution
--  Run once in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Linked booking
  booking_id       UUID REFERENCES bookings(id) ON DELETE SET NULL,
  booking_ref      TEXT,      -- human-readable booking description
  service          TEXT,
  booking_date     DATE,

  -- Customer side
  customer_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name    TEXT,
  customer_email   TEXT,
  customer_statement       TEXT,
  customer_evidence_urls   JSONB  DEFAULT '[]',
  customer_submitted_at    TIMESTAMPTZ,

  -- Partner side
  partner_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_name     TEXT,
  partner_role     TEXT,
  partner_statement        TEXT,
  partner_evidence_urls    JSONB  DEFAULT '[]',
  partner_submitted_at     TIMESTAMPTZ,

  -- Admin ruling
  status           TEXT NOT NULL DEFAULT 'pending',
  -- pending | awaiting_customer | awaiting_partner | under_review | resolved

  ruling           TEXT,
  -- customer_wins | partner_wins | split | dismissed | no_fault

  admin_ruling_note TEXT,
  compensation_action TEXT,   -- 'full_refund' | 'partial_refund' | 'payout_held' | 'none'
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disputes_booking   ON disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_customer  ON disputes(customer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_partner   ON disputes(partner_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status    ON disputes(status);

-- RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to disputes" ON disputes;
CREATE POLICY "Admin full access to disputes" ON disputes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
