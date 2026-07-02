// ============================================================
//  Fixera Promo Validation — Vercel Serverless Function
//  Validates a promo code and returns the discount amount
//  server-side so clients cannot spoof discount values.
//
//  Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ============================================================
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from './_auth.js';
import { rateLimit } from './_rateLimit.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await requireAuth(req, res);
  if (!auth) return;

  // Rate limit — prevents promo-code brute forcing
  const allowed = await rateLimit(req, res, supabase, `validate-promo:${auth.user.id}`, { max: 15, windowSeconds: 60 });
  if (!allowed) return;

  const { code, orderAmount, service } = req.body || {};
  const userId = auth.user.id;
  if (!code || !orderAmount) {
    return res.status(400).json({ valid: false, message: 'code and orderAmount required' });
  }

  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    return res.status(200).json({ valid: false, message: 'Invalid promo code.' });
  }

  const now = new Date();
  if (data.valid_from  && new Date(data.valid_from)  > now) return res.status(200).json({ valid: false, message: 'This code is not active yet.' });
  if (data.valid_until && new Date(data.valid_until) < now) return res.status(200).json({ valid: false, message: 'This promo code has expired.' });
  if (data.max_uses    && data.used_count >= data.max_uses)  return res.status(200).json({ valid: false, message: 'This promo code has reached its usage limit.' });
  if (data.min_order   && orderAmount < data.min_order)      return res.status(200).json({ valid: false, message: `Minimum order of KSh ${data.min_order.toLocaleString()} required.` });

  if (data.target_service && service && !service.toLowerCase().includes(data.target_service.toLowerCase())) {
    return res.status(200).json({ valid: false, message: `This code is only valid for ${data.target_service} services.` });
  }

  // Check per-user usage
  if (userId) {
    const { data: existing } = await supabase
      .from('promo_code_uses')
      .select('id')
      .eq('code_id', data.id)
      .eq('user_id', userId)
      .maybeSingle();
    if (existing) return res.status(200).json({ valid: false, message: 'You have already used this promo code.' });
  }

  let discount = 0;
  if (data.discount_type === 'percent') {
    discount = (orderAmount * data.discount_value) / 100;
    if (data.max_discount) discount = Math.min(discount, data.max_discount);
  } else {
    discount = data.discount_value;
  }
  discount = Math.min(Math.round(discount), orderAmount);

  return res.status(200).json({
    valid:       true,
    code:        { id: data.id, code: data.code, discount_type: data.discount_type, discount_value: data.discount_value },
    discount,
    finalAmount: orderAmount - discount,
  });
}
