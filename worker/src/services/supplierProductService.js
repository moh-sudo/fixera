import { supabase } from '../supabase';

export async function listMyProducts(supplierId) {
  const { data, error } = await supabase
    .from('vendor_products')
    .select('*')
    .eq('business_id', supplierId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// New product → goes to 'pending' (hidden from customers until approved)
export async function addProduct(supplierId, category, payload) {
  const { error } = await supabase.from('vendor_products').insert({
    business_id: supplierId,
    name: payload.name,
    description: payload.description,
    price: parseFloat(payload.price) || 0,
    unit: payload.unit,
    category,
    in_stock: payload.in_stock !== false,
    status: 'pending',
    submitted_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// Price change → store as pending_price; live price unchanged until approved
export async function proposePrice(productId, newPrice) {
  const { error } = await supabase
    .from('vendor_products')
    .update({ pending_price: parseFloat(newPrice) || 0, submitted_at: new Date().toISOString() })
    .eq('id', productId);
  if (error) throw error;
}

// Edit non-price details (name/description/unit) — also re-queues for approval
export async function editDetails(productId, payload) {
  const { error } = await supabase
    .from('vendor_products')
    .update({
      name: payload.name, description: payload.description, unit: payload.unit,
      status: 'pending', submitted_at: new Date().toISOString(),
    })
    .eq('id', productId);
  if (error) throw error;
}

// Stock availability — INSTANT, no approval (only on approved products)
export async function toggleStock(productId, inStock) {
  const { error } = await supabase
    .from('vendor_products')
    .update({ in_stock: inStock })
    .eq('id', productId);
  if (error) throw error;
}

export async function deleteProduct(productId) {
  const { error } = await supabase.from('vendor_products').delete().eq('id', productId);
  if (error) throw error;
}
