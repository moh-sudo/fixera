-- ============================================================
-- FIXERA: Job timeout + auto-reassignment
-- Workers who accept but go silent for 45 min get unassigned.
-- Requires pg_cron (already enabled from Phase 1).
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Add accepted_at timestamp to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS accepted_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timeout_count           INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_timed_out_worker   UUID;

-- 2. Auto-reassignment function
CREATE OR REPLACE FUNCTION auto_reassign_timed_out_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, worker_id
    FROM   bookings
    WHERE  status      = 'confirmed'
      AND  worker_id   IS NOT NULL
      AND  accepted_at IS NOT NULL
      AND  accepted_at < now() - interval '45 minutes'
  LOOP
    UPDATE bookings
    SET
      status                 = 'upcoming',
      worker_id              = NULL,
      worker_name            = NULL,
      accepted_at            = NULL,
      timeout_count          = timeout_count + 1,
      last_timed_out_worker  = r.worker_id
    WHERE id = r.id;

    INSERT INTO notification_log (user_id, channel, type, title, body, ref_type, ref_id, status)
    VALUES (
      r.worker_id, 'push', 'job_timeout',
      'Job auto-unassigned',
      'A booking was returned to the pool after 45 min of inactivity.',
      'booking', r.id, 'sent'
    );
  END LOOP;
END;
$$;

-- 3. Schedule every 5 minutes (safe unschedule — no error if not yet created)
DO $$
BEGIN
  PERFORM cron.unschedule('auto-reassign-timed-out-jobs');
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

SELECT cron.schedule(
  'auto-reassign-timed-out-jobs',
  '*/5 * * * *',
  $$ SELECT auto_reassign_timed_out_jobs(); $$
);
