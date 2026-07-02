import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function requireAuth(req, res) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  const supabase = getAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }
  return { user, supabase };
}
