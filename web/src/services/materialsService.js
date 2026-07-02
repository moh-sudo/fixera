import { supabase } from '../supabase';

// Customer: find a materials estimate the worker created for this job
export async function getEstimateForBooking(bookingId) {
  const { data } = await supabase
    .from('supplier_orders')
    .select('*, supplier:supplier_id(business_name, full_name)')
    .eq('parent_booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0] || null;
}

// Customer adjusts quantities + confirms → estimate becomes a real order
// (status 'pending') which enters the supplier → rider → delivery flow.
export async function confirmEstimate(estimateId, items) {
  const total = items.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
  const { data, error } = await supabase
    .from('supplier_orders')
    .update({ items, total, status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', estimateId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function declineEstimate(estimateId) {
  const { error } = await supabase
    .from('supplier_orders')
    .update({ status: 'cancelled' })
    .eq('id', estimateId);
  if (error) throw error;
}
