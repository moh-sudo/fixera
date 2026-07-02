import { supabase } from '../supabase';

// ── Categories ───────────────────────────────────────────────────
export async function getCategories() {
  const { data } = await supabase.from('service_categories').select('*').eq('is_active', true).order('sort_order');
  return data || [];
}

export async function listAllCategories() {
  const { data, error } = await supabase.from('service_categories').select('*').order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function saveCategory(cat) {
  if (cat.id) {
    const { id, ...patch } = cat;
    const { data, error } = await supabase.from('service_categories').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('service_categories').insert([cat]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('service_categories').delete().eq('id', id);
  if (error) throw error;
}

// ── Services ─────────────────────────────────────────────────────
export async function getServicesForCategory(categoryId) {
  const { data } = await supabase.from('services').select('*').eq('category_id', categoryId).eq('is_active', true).order('sort_order');
  return data || [];
}

export async function listAllServices(categoryId) {
  let q = supabase.from('services').select('*, service_categories(name, icon)').order('sort_order');
  if (categoryId) q = q.eq('category_id', categoryId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function saveService(svc) {
  if (svc.id) {
    const { id, ...patch } = svc;
    const { data, error } = await supabase.from('services').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('services').insert([svc]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteService(id) {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
}
