-- ============================================================
-- FIXERA: SLA auto-escalation cron (plan item 4.2)
-- Every 15 min, flags refund requests and disputes that have
-- blown past their SLA window (see AdminDashboard.jsx's
-- REFUND_SLA_HOURS=120 / DISPUTE_SLA_HOURS=168 — keep these in
-- sync if either changes) and logs one notification_log row per
-- escalation so it shows up in any admin-facing notification feed.
-- Requires pg_cron (already enabled from Phase 1).
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS sla_escalated_at TIMESTAMPTZ;
ALTER TABLE disputes        ADD COLUMN IF NOT EXISTS sla_escalated_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION escalate_overdue_slas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
BEGIN
  -- Refund requests past the 5-day SLA, still undecided, not yet escalated.
  -- Bumping priority to 'urgent' also surfaces them in the existing
  -- "Urgent Tickets" alert bucket, not just the refund-specific one.
  FOR r IN
    SELECT id, user_name, user_email
    FROM   support_tickets
    WHERE  category IN ('refund_request', 'payment_failed')
      AND  refund_decision IS NULL
      AND  status <> 'resolved'
      AND  sla_escalated_at IS NULL
      AND  created_at < now() - interval '5 days'
  LOOP
    UPDATE support_tickets
    SET priority = 'urgent', sla_escalated_at = now()
    WHERE id = r.id;

    INSERT INTO notification_log (channel, type, title, body, ref_type, ref_id, status)
    VALUES (
      'push', 'sla_escalation',
      'Refund request past SLA',
      format('Refund request from %s has been pending for over 5 days.', COALESCE(r.user_name, r.user_email, 'a customer')),
      'support_ticket', r.id, 'sent'
    );
  END LOOP;

  -- Disputes past the 7-day SLA, still unresolved, not yet escalated.
  FOR r IN
    SELECT id, booking_ref, customer_name, partner_name
    FROM   disputes
    WHERE  status <> 'resolved'
      AND  sla_escalated_at IS NULL
      AND  created_at < now() - interval '7 days'
  LOOP
    UPDATE disputes
    SET sla_escalated_at = now()
    WHERE id = r.id;

    INSERT INTO notification_log (channel, type, title, body, ref_type, ref_id, status)
    VALUES (
      'push', 'sla_escalation',
      'Dispute past SLA',
      format('Dispute %s (%s vs %s) has been unresolved for over 7 days.',
             COALESCE(r.booking_ref, r.id::text), COALESCE(r.customer_name,'customer'), COALESCE(r.partner_name,'partner')),
      'dispute', r.id, 'sent'
    );
  END LOOP;
END;
$$;

-- Schedule every 15 minutes (safe unschedule — no error if not yet created)
DO $$
BEGIN
  PERFORM cron.unschedule('escalate-overdue-slas');
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

SELECT cron.schedule(
  'escalate-overdue-slas',
  '*/15 * * * *',
  $$ SELECT escalate_overdue_slas(); $$
);
