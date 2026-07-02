// Shared auth utility for Vercel serverless functions.
// Files starting with _ are NOT exposed as API routes by Vercel.
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

// Verify a Supabase JWT from the Authorization header.
// Returns { user, supabase } on success, or sends 401 and returns null.
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

// Like requireAuth, but also checks profiles.is_admin = true.
export async function requireAdmin(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) return null;
  const { data: profile } = await auth.supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', auth.user.id)
    .single();
  if (!profile?.is_admin) {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }
  return auth;
}
