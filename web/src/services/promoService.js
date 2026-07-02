import { supabase } from '../supabase';

export async function validatePromoCode(code, orderAmount, service) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/validate-promo', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
    },
    body:    JSON.stringify({ code, orderAmount, service }),
  });

  if (!res.ok) return { valid: false, message: 'Could not validate promo code. Try again.' };
  return res.json();
}

export async function applyPromoCode(codeId, paymentId, discountApplied) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('promo_code_uses').insert([{ code_id: codeId, user_id: user.id, payment_id: paymentId, discount_applied: discountApplied }]);
  await supabase.rpc('increment_promo_use', { code_id: codeId });
}

// Admin
export async function listPromoCodes() {
  const { data, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createPromoCode(payload) {
  const { data, error } = await supabase.from('promo_codes').insert([{ ...payload, code: payload.code.toUpperCase().trim() }]).select().single();
  if (error) throw error;
  return data;
}

export async function updatePromoCode(id, patch) {
  const { data, error } = await supabase.from('promo_codes').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePromoCode(id) {
  const { error } = await supabase.from('promo_codes').delete().eq('id', id);
  if (error) throw error;
}

export async function getPromoUses(codeId) {
  const { data } = await supabase.from('promo_code_uses').select('*').eq('code_id', codeId).order('used_at', { ascending: false });
  return data || [];
}
