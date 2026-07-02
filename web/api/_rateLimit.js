// Shared rate-limit utility for Vercel serverless functions.
// Files starting with _ are NOT exposed as API routes by Vercel.
//
// Backed by a Postgres counter (see migrations/create_api_rate_limits.sql)
// rather than in-memory state, since Vercel functions are stateless and
// may run on a different instance on every invocation.

// Checks and increments a rate-limit counter. Returns true if the request
// is allowed, sends a 429 and returns false if the caller is over the limit.
// Fails open (allows the request) if the rate-limit check itself errors,
// so a Supabase hiccup never blocks real traffic.
export async function rateLimit(req, res, supabase, key, { max = 5, windowSeconds = 60 } = {}) {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error('[rateLimit]', error.message);
      return true;
    }
    if (data === false) {
      res.status(429).json({ error: 'Too many requests — please wait a moment and try again.' });
      return false;
    }
    return true;
  } catch (err) {
    console.error('[rateLimit]', err.message);
    return true;
  }
}
