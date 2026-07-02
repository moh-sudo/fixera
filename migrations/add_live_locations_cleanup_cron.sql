-- ============================================================
-- FIXERA: live_locations cleanup via pg_cron
-- GPS pings accumulate fast (10 active movers × 1 ping/5s =
-- 6,000 rows/hour). Purge rows older than 48 hours hourly.
--
-- PREREQUISITE: Enable pg_cron extension first:
--   Supabase Dashboard → Database → Extensions → pg_cron → Enable
--
-- Run this AFTER enabling the extension:
-- ============================================================

SELECT cron.schedule(
  'cleanup-live-locations',
  '0 * * * *',
  $$DELETE FROM live_locations WHERE recorded_at < now() - INTERVAL '48 hours'$$
);
