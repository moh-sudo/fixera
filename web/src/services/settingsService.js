import { supabase } from '../supabase';

// ── Platform settings (single row id=1), cached ──
let _cache = null;
export async function getSettings(force = false) {
  if (_cache && !force) return _cache;
  const { data } = await supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle();
  _cache = data || {};
  return _cache;
}
export async function updateSettings(patch) {
  const { data, error } = await supabase
    .from('platform_settings').update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', 1).select().single();
  if (error) throw error;
  _cache = data;
  return data;
}

// ── Uploads ──
export async function uploadBranding(file, name = 'logo') {
  const path = `${name}_${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from('branding').upload(path, file, { upsert: true });
  if (error) throw error;
  return supabase.storage.from('branding').getPublicUrl(path).data.publicUrl;
}
export async function uploadAvatar(userId, file) {
  const path = `avatars/${userId}_${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from('branding').upload(path, file, { upsert: true });
  if (error) throw error;
  return supabase.storage.from('branding').getPublicUrl(path).data.publicUrl;
}

// ── My profile (auth + profiles row) ──
export async function updateProfile(userId, { full_name, phone, avatar_url }) {
  const patch = {};
  if (full_name !== undefined) patch.full_name = full_name;
  if (phone !== undefined)     patch.phone = phone;
  if (avatar_url !== undefined) patch.avatar_url = avatar_url;
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
}
export async function changeEmail(newEmail) {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;   // Supabase emails a confirmation link
}
export async function changePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// ── 2FA / MFA (TOTP) via Supabase ──
export async function listFactors() {
  const { data } = await supabase.auth.mfa.listFactors();
  return data?.totp || [];
}
export async function enrollTotp() {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
  if (error) throw error;
  return data; // { id, totp: { qr_code, secret, uri } }
}
export async function verifyTotp(factorId, code) {
  const ch = await supabase.auth.mfa.challenge({ factorId });
  if (ch.error) throw ch.error;
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.data.id, code });
  if (error) throw error;
}
export async function unenrollTotp(factorId) {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}

// ── Admin team ──
export async function listAdmins() {
  const { data } = await supabase.from('profiles').select('id, full_name, email, phone, is_admin').eq('is_admin', true);
  return data || [];
}
export async function grantAdminByEmail(email) {
  const { data: prof } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
  if (!prof) throw new Error('No user found with that email. They must sign up first.');
  const { error } = await supabase.from('profiles').update({ is_admin: true }).eq('id', prof.id);
  if (error) throw error;
}
export async function revokeAdmin(userId) {
  const { error } = await supabase.from('profiles').update({ is_admin: false }).eq('id', userId);
  if (error) throw error;
}

// ── Audit log ──
export async function logAction(actor, action, detail = '') {
  try {
    await supabase.from('admin_audit_log').insert({
      actor_id: actor?.id || null, actor_name: actor?.full_name || actor?.email || 'Admin', action, detail,
    });
  } catch (_) { /* non-blocking */ }
}
export async function listAudit(limit = 50) {
  const { data } = await supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(limit);
  return data || [];
}
