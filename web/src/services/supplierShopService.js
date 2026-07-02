import { supabase } from '../supabase';
import { ensurePayment } from './paymentService';

export const PRODUCT_CATEGORIES = [
  { id: 'paint',      label: 'Paint & Finishes',    icon: '🎨' },
  { id: 'cleaning',   label: 'Cleaning Supplies',   icon: '🧴' },
  { id: 'tools',      label: 'Tools & Equipment',   icon: '🔨' },
  { id: 'plumbing',   label: 'Plumbing Materials',  icon: '🪠' },
  { id: 'electrical', label: 'Electrical Materials', icon: '💡' },
];

// ── Browse in-stock products (optionally by category) ──────
export async function listProducts(category = null) {
  let q = supabase
    .from('vendor_products')
    .select('*, supplier:business_id(full_name, business_name, area, verification_status)')
    .eq('in_stock', true)
    .eq('status', 'approved')        // only Fixera-approved products reach customers
    .order('created_at', { ascending: false });
  if (category) q = q.eq('category', category);
  const { data, error } = await q;
  if (error) throw error;
  // Only show products from approved suppliers (when known)
  return (data || []).filter(p => !p.supplier || p.supplier.verification_status !== 'rejected');
}

// ── Place an order (one supplier per order) ────────────────
export async function placeOrder(customerId, supplierId, cartItems, delivery) {
  const items = cartItems.map(i => ({
    product_id: i.id, name: i.name, price: i.price, qty: i.qty,
  }));
  const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  const { data, error } = await supabase
    .from('supplier_orders')
    .insert({
      customer_id:      customerId,
      supplier_id:      supplierId,
      items,
      total,
      customer_name:    delivery.name || null,
      customer_phone:   delivery.phone || null,
      delivery_address: delivery.address || null,
      delivery_lat:     delivery.lat || null,
      delivery_lng:     delivery.lng || null,
      notes:            delivery.notes || null,
      status:           'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSupplierOrder(id) {
  const { data, error } = await supabase
    .from('supplier_orders')
    .select('*, supplier:supplier_id(full_name, business_name, area, phone)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function markOrderDelivered(orderId) {
  const { data: order, error } = await supabase
    .from('supplier_orders')
    .update({ status: 'delivered', delivered_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;

  try {
    await ensurePayment('supplier_order', orderId, {
      customerId: order.customer_id,
      payeeId:    order.supplier_id,
      payeeRole:  'supplier',
      amount:     order.total,
      method:     'cash',
      status:     'paid',
    });
  } catch (_) {
    // Payment recording failure must not block delivery status update
  }

  return order;
}

export async function listMyOrders(customerId) {
  const { data, error } = await supabase
    .from('supplier_orders')
    .select('*, supplier:supplier_id(business_name, full_name)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
