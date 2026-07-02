import { supabase } from '../supabase';

// Browse supplier catalog (in-stock products) for the estimate builder
export async function listCatalog(category = null) {
  let q = supabase
    .from('vendor_products')
    .select('*, supplier:business_id(full_name, business_name, area)')
    .eq('in_stock', true)
    .eq('status', 'approved')        // painter estimates only from approved catalog
    .order('name', { ascending: true });
  if (category) q = q.eq('category', category);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

// Worker submits a materials estimate for an active job.
// cartItems: [{ id, name, price, qty, business_id }]
// All items must be from ONE supplier (we use the first item's supplier).
export async function submitEstimate(workerId, booking, cartItems) {
  const supplierId = cartItems[0]?.business_id;
  if (!supplierId) throw new Error('No supplier products selected.');
  if (cartItems.some(i => i.business_id !== supplierId)) {
    throw new Error('All materials must be from one supplier.');
  }

  const items = cartItems.map(i => ({ product_id: i.id, name: i.name, price: i.price, qty: i.qty }));
  const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  const { data, error } = await supabase
    .from('supplier_orders')
    .insert({
      customer_id:        booking.user_id,
      supplier_id:        supplierId,
      parent_booking_id:  booking.id,
      estimated_by_worker: workerId,
      items,
      total,
      customer_name:    booking.customer_name || null,
      delivery_address: booking.address || null,
      notes:            `Materials for job #${String(booking.id).slice(0,8).toUpperCase()}`,
      status:           'estimate',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Worker checks if an estimate already exists for this job
export async function getEstimateForJob(bookingId) {
  const { data } = await supabase
    .from('supplier_orders')
    .select('*')
    .eq('parent_booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0] || null;
}
