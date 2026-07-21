// ============================================================
//  Fixera — Customer data export (Kenya DPA 2019 right to portability)
//  Bundles everything tied to the requesting user into one JSON
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
    const [{ data: profile }, { data: bookings }, { data: receipts }, { data: reviews }, { data: tickets }] = await Promise.all([
      supabase.from('profiles').select('full_name,email,phone,city,created_at').eq('id', user.id).maybeSingle(),
      supabase.from('bookings').select('id,service,sub_service,address,booking_date,booking_time,status,amount,price,method,notes,created_at,completed_at').eq('user_id', user.id),
      supabase.from('receipts').select('id,amount,commission,method,mpesa_ref,service,address,generated_at').eq('customer_id', user.id),
      supabase.from('reviews').select('id,rating,comment,reviewee_type,created_at').eq('reviewer_id', user.id),
      supabase.from('support_tickets').select('id,subject,category,status,priority,created_at,resolved_at').eq('user_id', user.id),
    ]);

    const bundle = {
      exported_at: new Date().toISOString(),
      account: { id: user.id, email: user.email, ...profile },
      bookings: bookings || [],
      receipts: receipts || [],
      reviews: reviews || [],
      support_tickets: tickets || [],
    };

    return res.status(200).json(bundle);
  } catch (e) {
    console.error('export-data error:', e.message);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
