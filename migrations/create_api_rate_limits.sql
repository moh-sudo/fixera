-- ============================================================
--  API Rate Limiting — backs serverless function rate limits
--  (Vercel functions are stateless across invocations, so an
--  in-memory limiter is unreliable; this uses Postgres as the
--  shared, atomic counter store instead.)
-- ============================================================

CREATE TABLE IF NOT EXISTS api_rate_limits (
  key          TEXT PRIMARY KEY,
  count        INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Atomically check-and-increment a rate limit counter.
-- Returns TRUE if the request is allowed, FALSE if the caller
-- has exceeded p_max requests within the trailing p_window_seconds.
CREATE OR REPLACE FUNCTION check_rate_limit(p_key TEXT, p_max INT, p_window_seconds INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO api_rate_limits (key, count, window_start)
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
        WHEN api_rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
          THEN 1
        ELSE api_rate_limits.count + 1
      END,
      window_start = CASE
        WHEN api_rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
          THEN now()
        ELSE api_rate_limits.window_start
      END
  RETURNING count INTO v_count;

  RETURN v_count <= p_max;
END;
$$;

-- Periodic cleanup of stale rows (call from a cron or just let it grow —
-- one row per key, negligible size; safe to skip if no cron is set up).
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM api_rate_limits WHERE window_start < now() - interval '1 day';
$$;

ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
-- No direct client access — only the service-role key (via RPC) touches this table.
