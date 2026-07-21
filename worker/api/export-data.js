// ============================================================
//  Fixera — Partner data export (Kenya DPA 2019 right to portability)
//  Bundles everything tied to the requesting partner into one JSON
//  payload for the client to download.
// ============================================================
import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;
  const { user, supabase } = auth;

  try {
    const [{ data: profile }, { data: jobs }, { data: wallet }, { data: reviews }, { data: tickets }] = await Promise.all([
      supabase.from('workers').select('full_name,email,phone,business_name,partner_role,city,rating,total_jobs,created_at').eq('id', user.id).maybeSingle(),
      supabase.from('bookings').select('id,service,sub_service,address,booking_date,booking_time,status,amount,created_at,completed_at').eq('worker_id', user.id),
      supabase.from('wallet_transactions').select('id,type,amount,description,created_at').eq('worker_id', user.id),
      supabase.from('reviews').select('id,rating,comment,created_at').eq('reviewee_id', user.id),
      supabase.from('support_tickets').select('id,subject,category,status,priority,created_at,resolved_at').eq('user_id', user.id),
    ]);

    const bundle = {
      exported_at: new Date().toISOString(),
      account: { id: user.id, email: user.email, ...profile },
      jobs: jobs || [],
      wallet_transactions: wallet || [],
      reviews: reviews || [],
      support_tickets: tickets || [],
    };

    return res.status(200).json(bundle);
  } catch (e) {
    console.error('export-data error:', e.message);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
