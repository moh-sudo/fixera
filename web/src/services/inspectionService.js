// ─────────────────────────────────────────────
//  Inspection & Quotation Service — Supabase
// ─────────────────────────────────────────────
import { supabase } from '../supabase';

// ── Photo upload ─────────────────────────────
async function uploadPhotos(userId, files) {
  const urls = await Promise.all(files.map(async (file) => {
    const path = `inspections/${userId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from('inspection-photos')
      .upload(path, file);
    if (error) throw error;

    const { data } = supabase.storage
      .from('inspection-photos')
      .getPublicUrl(path);
    return data.publicUrl;
  }));
  return urls;
}

// ── Inspections ──────────────────────────────

export async function createInspection(userId, data, photoFiles = []) {
  const photoURLs = photoFiles.length > 0
    ? await uploadPhotos(userId, photoFiles)
    : [];

  const { data: row, error } = await supabase
    .from('inspections')
    .insert({
      ...data,
      user_id:    userId,
      photo_urls: photoURLs,
      status:     'under_review',
    })
    .select()
    .single();
  if (error) throw error;
  return row.id;
}

export async function getUserInspections(userId) {
  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getInspection(inspectionId) {
  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('id', inspectionId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateInspectionStatus(inspectionId, status) {
  const { error } = await supabase
    .from('inspections')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', inspectionId);
  if (error) throw error;
}

// ── Quotations ───────────────────────────────

export async function createQuotation(inspectionId, data) {
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: row, error } = await supabase
    .from('quotations')
    .insert({
      ...data,
      inspection_id: inspectionId,
      status:        'pending_approval',
      expires_at:    expiresAt,
    })
    .select()
    .single();
  if (error) throw error;

  await updateInspectionStatus(inspectionId, 'quotation_ready');
  return row.id;
}

export async function getQuotation(quotationId) {
  const { data, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', quotationId)
    .single();
  if (error) throw error;
  return data;
}

export async function respondToQuotation(quotationId, inspectionId, approved, declineReason = '') {
  const status = approved ? 'approved' : 'declined';
  const { error } = await supabase
    .from('quotations')
    .update({ status, decline_reason: approved ? '' : declineReason })
    .eq('id', quotationId);
  if (error) throw error;
  await updateInspectionStatus(inspectionId, approved ? 'approved' : 'declined');
}
