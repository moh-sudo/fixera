// ============================================================
//  Fixera Admin — Team / Agent management (super_admin only)
//  Create, list, update, and revoke staff/agent accounts.
//  Creating an auth user needs the service role, so this must
//  run server-side. Requires a super_admin Supabase JWT.
// ============================================================
import { requireAdmin } from './_auth.js';

const VALID_ROLES = [
  'super_admin', 'support', 'partner_support', 'finance', 'operations', 'verification', 'trust_safety',
  'service_delivery', 'platform_governance', 'marketplace_intelligence',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Must be an admin at minimum...
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const { user, supabase } = auth; // supabase = service-role client

  // ...and specifically a super_admin to manage the team
  const { data: me } = await supabase.from('profiles').select('admin_role').eq('id', user.id).single();
  if (me?.admin_role && me.admin_role !== 'super_admin') {
    return res.status(403).json({ error: 'Only a super admin can manage the team' });
  }

  const { action } = req.body || {};

  try {
    // ── LIST ────────────────────────────────────────────────
    if (action === 'list') {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, admin_role, created_at')
        .eq('is_admin', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return res.status(200).json({ agents: data || [] });
    }

    // ── CREATE ──────────────────────────────────────────────
    if (action === 'create') {
      const { email, password, full_name, admin_role } = req.body || {};
      if (!email || !password || !full_name || !admin_role) {
        return res.status(400).json({ error: 'Missing email, password, full_name or admin_role' });
      }
      if (!VALID_ROLES.includes(admin_role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      // Create the auth user (email pre-confirmed so they can log in immediately)
      const { data: created, error: cErr } = await supabase.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });
      if (cErr) {
        return res.status(400).json({ error: cErr.message || 'Could not create account' });
      }
      const newId = created.user.id;

      // Upsert the profile as a staff account
      const { error: pErr } = await supabase.from('profiles').upsert({
        id: newId,
        full_name,
        email: email.trim().toLowerCase(),
        role: 'admin',
        is_admin: true,
        admin_role,
      });
      if (pErr) {
        // Roll back the auth user so we don't leave an orphan
        await supabase.auth.admin.deleteUser(newId).catch(() => {});
        throw pErr;
      }

      return res.status(200).json({ success: true, id: newId });
    }

    // ── UPDATE ROLE ─────────────────────────────────────────
    if (action === 'update_role') {
      const { id, admin_role } = req.body || {};
      if (!id || !admin_role) return res.status(400).json({ error: 'Missing id or admin_role' });
      if (!VALID_ROLES.includes(admin_role)) return res.status(400).json({ error: 'Invalid role' });
      if (id === user.id) return res.status(400).json({ error: 'You cannot change your own role' });

      const { error } = await supabase.from('profiles').update({ admin_role }).eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    // ── REVOKE (remove staff access; keeps the login but strips admin) ──
    if (action === 'revoke') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing id' });
      if (id === user.id) return res.status(400).json({ error: 'You cannot revoke your own access' });

      const { error } = await supabase.from('profiles')
        .update({ is_admin: false, admin_role: null })
        .eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    console.error('admin-team error:', e.message);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
