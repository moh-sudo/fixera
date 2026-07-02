import { supabase } from '../supabase';

// ── Banners ──────────────────────────────────────────────────────
export async function getActiveBanners() {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .lte('valid_from', now)
    .or(`valid_until.is.null,valid_until.gt.${now}`)
    .order('sort_order');
  return data || [];
}

export async function listAllBanners() {
  const { data, error } = await supabase.from('banners').select('*').order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function saveBanner(banner) {
  if (banner.id) {
    const { id, ...patch } = banner;
    const { data, error } = await supabase.from('banners').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('banners').insert([banner]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBanner(id) {
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) throw error;
}

// ── FAQs ─────────────────────────────────────────────────────────
export async function getFAQs(audience = 'customers') {
  const targets = audience === 'customers' ? ['customers', 'all'] : ['partners', 'all'];
  const { data } = await supabase
    .from('faqs')
    .select('*')
    .eq('is_active', true)
    .in('audience', targets)
    .order('category')
    .order('sort_order');
  return data || [];
}

export async function listAllFAQs() {
  const { data, error } = await supabase.from('faqs').select('*').order('category').order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function saveFAQ(faq) {
  if (faq.id) {
    const { id, ...patch } = faq;
    const { data, error } = await supabase.from('faqs').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('faqs').insert([faq]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteFAQ(id) {
  const { error } = await supabase.from('faqs').delete().eq('id', id);
  if (error) throw error;
}

export const FAQ_CATEGORIES = ['general', 'booking', 'payment', 'partner', 'safety'];
