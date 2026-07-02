import { supabase } from '../supabase';

export async function getReviewsForPartner(partnerId) {
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('worker_id', partnerId)
    .order('created_at', { ascending: false });
  return data || [];
}
