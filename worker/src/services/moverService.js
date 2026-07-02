import { supabase } from '../supabase';

// ── Browse open requests ────────────────────────────────
export async function listOpenMovingRequests() {
  const { data, error } = await supabase
    .from('moving_requests')
    .select('*')
    .in('status', ['awaiting_quotes', 'quoted'])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMovingRequest(id) {
  const { data, error } = await supabase
    .from('moving_requests')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ── My quotes (this mover) ─────────────────────────────
export async function listMyQuotes(moverUserId) {
  const { data, error } = await supabase
    .from('moving_quotes')
    .select('*, moving_requests(*)')
    .eq('mover_id', moverUserId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ── Submit a quote ─────────────────────────────────────
export async function submitQuote(requestId, moverUserId, payload) {
  const { data, error } = await supabase
    .from('moving_quotes')
    .insert({
      request_id:    requestId,
      mover_id:      moverUserId,
      mover_name:    payload.mover_name,
      mover_rating:  payload.mover_rating || 0,
      price:         payload.price,
      vehicle_type:  payload.vehicle_type,
      vehicle_plate: payload.vehicle_plate || null,
      num_workers:   payload.num_workers || 2,
      eta:           payload.eta || null,
      message:       payload.message || null,
      status:        'pending',
    })
    .select()
    .single();
  if (error) throw error;

  // Bump request status from awaiting_quotes → quoted
  await supabase
    .from('moving_requests')
    .update({ status: 'quoted', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('status', 'awaiting_quotes');

  return data;
}

// ── Assign team to an accepted job ─────────────────────
// crewSnapshot: [{ name, role, photo_url, phone }]
export async function assignTeam(requestId, payload) {
  const { error } = await supabase
    .from('moving_requests')
    .update({
      assigned_crew:          payload.assigned_crew,
      assigned_vehicle_plate: payload.assigned_vehicle_plate,
      mover_company_name:     payload.mover_company_name,
      mover_phone:            payload.mover_phone,
      updated_at:             new Date().toISOString(),
    })
    .eq('id', requestId);
  if (error) throw error;
}

// ── Loading verification (blueprint §11) ───────────────
// Mover photographs the loaded cargo + truck BEFORE departure.
export async function uploadLoadingPhotos(moverUserId, requestId, files) {
  const urls = await Promise.all(files.map(async (f) => {
    const path = `${moverUserId}/${requestId}/loading_${Date.now()}_${f.name}`;
    const { error } = await supabase.storage.from('moving-photos').upload(path, f);
    if (error) throw error;
    const { data } = supabase.storage.from('moving-photos').getPublicUrl(path);
    return data.publicUrl;
  }));

  const { data: existing } = await supabase
    .from('moving_requests')
    .select('loading_photo_urls')
    .eq('id', requestId)
    .single();
  const combined = [...(existing?.loading_photo_urls || []), ...urls];

  const { error } = await supabase
    .from('moving_requests')
    .update({ loading_photo_urls: combined, updated_at: new Date().toISOString() })
    .eq('id', requestId);
  if (error) throw error;
  return combined;
}

// Starting the move requires loading photos (enforced in UI) — GPS begins.
export async function startMove(requestId) {
  const { error } = await supabase
    .from('moving_requests')
    .update({
      status:     'in_progress',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);
  if (error) throw error;
}

// ── Delivery verification (blueprint §12) ──────────────
export async function uploadDeliveryPhotos(moverUserId, requestId, files) {
  const urls = await Promise.all(files.map(async (f) => {
    const path = `${moverUserId}/${requestId}/delivery_${Date.now()}_${f.name}`;
    const { error } = await supabase.storage.from('moving-photos').upload(path, f);
    if (error) throw error;
    const { data } = supabase.storage.from('moving-photos').getPublicUrl(path);
    return data.publicUrl;
  }));

  const { data: existing } = await supabase
    .from('moving_requests')
    .select('delivery_photo_urls')
    .eq('id', requestId)
    .single();
  const combined = [...(existing?.delivery_photo_urls || []), ...urls];

  const { error } = await supabase
    .from('moving_requests')
    .update({ delivery_photo_urls: combined, updated_at: new Date().toISOString() })
    .eq('id', requestId);
  if (error) throw error;
  return combined;
}

// Mover marks unloaded at destination → customer must now sign off.
export async function markDelivered(requestId) {
  const { error } = await supabase
    .from('moving_requests')
    .update({
      status:       'delivered',
      delivered_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    })
    .eq('id', requestId);
  if (error) throw error;
}

// Legacy direct-complete (kept for admin overrides)
export async function completeMove(requestId) {
  const { error } = await supabase
    .from('moving_requests')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', requestId);
  if (error) throw error;
}
