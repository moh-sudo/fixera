// ============================================================
//  Fixera — Partner account erasure (Kenya DPA 2019 right to erasure)
//  Anonymizes PII on the workers row and disables login. Does NOT
//  delete the auth.users row — wallet_transactions/reviews/bookings
//  FK to it and must be retained for tax/dispute records, so deleting
//  it would cascade and destroy financial history for the other side.
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
    const { data: partner, error: wErr } = await supabase
      .from('workers')
      .select('wallet_balance, security_deposit_status')
      .eq('id', user.id)
      .maybeSingle();
    if (wErr) throw wErr;

    const blockers = [];

    const { data: activeJobs, error: bErr } = await supabase
      .from('bookings')
      .select('id')
      .eq('worker_id', user.id)
      .not('status', 'in', '(completed,cancelled)');
    if (bErr) throw bErr;
    if ((activeJobs || []).length > 0) {
      blockers.push(`${activeJobs.length} active job${activeJobs.length !== 1 ? 's' : ''} in progress`);
    }

    if (Number(partner?.wallet_balance) > 0) {
      blockers.push(`a wallet balance of KSh ${Number(partner.wallet_balance).toLocaleString()} — withdraw it first`);
    }

    if (partner?.security_deposit_status === 'held') {
      blockers.push('a security deposit still held — contact support to resolve it first');
    }

    if (blockers.length > 0) {
      return res.status(409).json({ error: `You can't delete your account yet: ${blockers.join('; ')}.` });
    }

    const placeholder = `deleted-${user.id.slice(0, 8)}@erased.fixera.africa`;

    const { error: pErr } = await supabase
      .from('workers')
      .update({
        full_name: 'Deleted Partner',
        email: placeholder,
        phone: null,
        business_name: null,
        profile_picture_url: null,
        national_id_number: null,
        owner_national_id: null,
        current_lat: null,
        current_lng: null,
        can_receive_jobs: false,
        status: 'offline',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    if (pErr) throw pErr;

    // Scrub PII snapshot on past support tickets — the ticket itself stays for record-keeping.
    await supabase
      .from('support_tickets')
      .update({ user_name: 'Deleted Partner', user_email: placeholder })
      .eq('user_id', user.id);

    // Disable login: random password + placeholder email. Keep the auth.users row
    // (see file header) so FK-linked financial/review records stay intact.
    const { error: aErr } = await supabase.auth.admin.updateUserById(user.id, {
      email: placeholder,
      password: crypto.randomBytes(32).toString('hex'),
      email_confirm: true,
      user_metadata: {},
    });
    if (aErr) throw aErr;

    await supabase.from('data_erasure_log').insert({ user_id: user.id, role: 'partner' });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('delete-account error:', e.message);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
