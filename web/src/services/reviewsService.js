import { supabase } from '../supabase';

export async function submitReview({ bookingId, orderId, orderType, revieweeId, revieweeType, rating, comment }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('reviews').insert([{
    booking_id:    bookingId || null,
    order_id:      orderId   || null,
    order_type:    orderType || 'booking',
    reviewer_id:   user.id,
    reviewee_id:   revieweeId,
    reviewee_type: revieweeType,
    rating,
    comment: comment?.trim() || null,
  }]).select().single();
  if (error) throw error;
  return data;
}

export async function getReviewsForPartner(partnerId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('reviewee_id', partnerId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function hasReviewed(bookingId, userId) {
  const { data } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('reviewer_id', userId)
    .maybeSingle();
  return !!data;
}

export async function getRatingForPartner(partnerId) {
  const { data } = await supabase
    .from('partner_ratings')
    .select('avg_rating, total_reviews')
    .eq('reviewee_id', partnerId)
    .maybeSingle();
  return data || { avg_rating: 0, total_reviews: 0 };
}

// Admin
export async function listAllReviews({ status = 'all', limit = 100 } = {}) {
  let q = supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(limit);
  if (status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function moderateReview(id, status, adminNote) {
  const { error } = await supabase.from('reviews').update({ status, admin_note: adminNote || null }).eq('id', id);
  if (error) throw error;
}
