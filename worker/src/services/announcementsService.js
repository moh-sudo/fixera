import { supabase } from '../supabase';

// Targets that apply to a given audience
const CUSTOMER_TARGETS  = ['all', 'customers'];
const PARTNER_TARGETS   = ['all', 'partners'];
const ROLE_TARGETS = (role) => ['all', 'partners', role];

export async function getActiveAnnouncements(audience) {
  // audience: 'customers' | a partner role string
  let targets;
  if (audience === 'customers') {
    targets = CUSTOMER_TARGETS;
  } else {
    targets = ROLE_TARGETS(audience);
  }

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .in('target', targets)
    .lte('publish_at', new Date().toISOString())
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('is_pinned', { ascending: false })
    .order('publish_at', { ascending: false });

  if (error) { console.error(error); return []; }
  return data || [];
}

// Admin: all announcements including expired/scheduled
export async function listAllAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createAnnouncement(payload) {
  const { data, error } = await supabase
    .from('announcements')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAnnouncement(id, patch) {
  const { data, error } = await supabase
    .from('announcements')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAnnouncement(id) {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw error;
}

// ── Per-user read tracking ────────────────────────────────────────

export async function getReadIds(userId) {
  if (!userId) return [];
  const { data } = await supabase
    .from('announcement_reads')
    .select('announcement_id')
    .eq('user_id', userId);
  return (data || []).map(r => r.announcement_id);
}

export async function markAnnouncementRead(userId, announcementId) {
  if (!userId || !announcementId) return;
  await supabase
    .from('announcement_reads')
    .upsert({ user_id: userId, announcement_id: announcementId }, { onConflict: 'user_id,announcement_id' });
}

export const TYPE_META = {
  info:        { label: 'Info',        color: '#4A90D9', bg: '#EBF4FF', icon: 'ℹ️' },
  warning:     { label: 'Warning',     color: '#E69900', bg: '#FFF8E1', icon: '⚠️' },
  promotion:   { label: 'Promotion',   color: '#C9A020', bg: '#FFFBEB', icon: '🎉' },
  maintenance: { label: 'Maintenance', color: '#718096', bg: '#F7FAFC', icon: '🔧' },
};

export const TARGET_LABELS = {
  all:           'Everyone (customers + partners)',
  customers:     'Customers only',
  partners:      'All partners',
  worker:        'Service Workers',
  rider:         'Riders',
  vendor:        'Vendors',
  supplier:      'Suppliers',
  mover:         'Movers',
  water_carrier: 'Water Carriers',
};
