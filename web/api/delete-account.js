// ============================================================
//  Fixera — Customer account erasure (Kenya DPA 2019 right to erasure)
//  Anonymizes PII on the profile and disables login. Does NOT delete
//  the auth.users row — receipts/reviews/bookings FK to it and must
//  be retained for tax/dispute records, so deleting it would cascade
//  and destroy financial history for the other party too.
// ============================================================
import crypto from 'crypto';
import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;
  const { user, supabase } = auth;

  try {
    // Block if there's an unfinished booking — can't erase identity mid-service.
    const { data: activeBookings, error: bErr } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', user.id)
      .not('status', 'in', '(completed,cancelled)');
    if (bErr) throw bErr;
    if ((activeBookings || []).length > 0) {
      return res.status(409).json({
        error: `You have ${activeBookings.length} active booking${activeBookings.length !== 1 ? 's' : ''}. Please wait for ${activeBookings.length !== 1 ? 'them' : 'it'} to complete or cancel before deleting your account.`,
      });
    }

    const placeholder = `deleted-${user.id.slice(0, 8)}@erased.fixera.africa`;

    const { error: pErr } = await supabase
      .from('profiles')
      .update({
        full_name: 'Deleted User',
        email: placeholder,
        phone: null,
        city: null,
        avatar_url: null,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    if (pErr) throw pErr;

    // Scrub PII snapshot on past support tickets — the ticket itself stays for record-keeping.
    await supabase
      .from('support_tickets')
      .update({ user_name: 'Deleted User', user_email: placeholder })
      .eq('user_id', user.id);

    // Disable login: random password + placeholder email. Keep the auth.users row
    // (see file header) so FK-linked financial records stay intact.
    const { error: aErr } = await supabase.auth.admin.updateUserById(user.id, {
      email: placeholder,
      password: crypto.randomBytes(32).toString('hex'),
      email_confirm: true,
      user_metadata: {},
    });
    if (aErr) throw aErr;

    await supabase.from('data_erasure_log').insert({ user_id: user.id, role: 'customer' });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('delete-account error:', e.message);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
