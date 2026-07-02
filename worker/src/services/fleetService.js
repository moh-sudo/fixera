import { supabase } from '../supabase';

// ── Vehicle type catalog ─────────────────────────────────
export const VEHICLE_TYPES = [
  { id: 'pickup',    label: 'Pickup Truck', icon: '🛻', capacityTons: 1,    suitable: 'Studio / few items',     color: '#48BB78' },
  { id: 'van',       label: 'Van',          icon: '🚐', capacityTons: 1.5,  suitable: 'Studio – 1 BR',          color: '#4A90D9' },
  { id: 'truck-3t',  label: '3-Ton Truck',  icon: '🚚', capacityTons: 3,    suitable: '1 – 2 BR apartment',     color: '#F6AD55' },
  { id: 'truck-5t',  label: '5-Ton Truck',  icon: '🚛', capacityTons: 5,    suitable: '2 – 3 BR / house',       color: '#FC8A4D' },
  { id: 'truck-10t', label: '10-Ton Truck', icon: '🚛', capacityTons: 10,   suitable: 'Office / warehouse',     color: '#9F7AEA' },
];

export function vehicleTypeMeta(id) {
  return VEHICLE_TYPES.find(v => v.id === id) || { label: id, icon: '🚚', color: '#9F7AEA' };
}

// ── Upload helpers ──────────────────────────────────────
async function uploadFile(moverId, file, subdir) {
  const path = `${moverId}/${subdir}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage
    .from('mover-vehicles')
    .upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('mover-vehicles').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadVehiclePhotos(moverId, files) {
  return Promise.all(files.map(f => uploadFile(moverId, f, 'photos')));
}

export async function uploadLogbook(moverId, file) {
  return uploadFile(moverId, file, 'logbooks');
}

export async function uploadInsuranceDoc(moverId, file) {
  return uploadFile(moverId, file, 'insurance');
}

// ── CRUD ────────────────────────────────────────────────
export async function listFleet(moverUserId) {
  const { data, error } = await supabase
    .from('mover_vehicles')
    .select('*')
    .eq('mover_user_id', moverUserId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Used by quote form — only vehicles eligible for active quoting
export async function listActiveFleet(moverUserId) {
  const { data, error } = await supabase
    .from('mover_vehicles')
    .select('*')
    .eq('mover_user_id', moverUserId)
    .eq('status', 'active')
    .order('vehicle_type', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addVehicle(moverUserId, payload) {
  const { data, error } = await supabase
    .from('mover_vehicles')
    .insert({
      mover_user_id:           moverUserId,
      vehicle_type:            payload.vehicle_type,
      plate_number:            payload.plate_number,
      make:                    payload.make           || null,
      model:                   payload.model          || null,
      year:                    payload.year           || null,
      color:                   payload.color          || null,
      capacity_tons:           payload.capacity_tons  || null,
      photo_urls:              payload.photo_urls     || [],
      logbook_url:             payload.logbook_url    || null,
      insurance_provider:      payload.insurance_provider      || null,
      insurance_policy_number: payload.insurance_policy_number || null,
      insurance_expiry:        payload.insurance_expiry        || null,
      insurance_doc_url:       payload.insurance_doc_url       || null,
      notes:                   payload.notes          || null,
      status:                  'active',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateVehicle(vehicleId, payload) {
  const { data, error } = await supabase
    .from('mover_vehicles')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', vehicleId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setVehicleStatus(vehicleId, status) {
  const { error } = await supabase
    .from('mover_vehicles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', vehicleId);
  if (error) throw error;
}

export async function deleteVehicle(vehicleId) {
  const { error } = await supabase
    .from('mover_vehicles')
    .delete()
    .eq('id', vehicleId);
  if (error) throw error;
}

// ── Insurance expiry helpers ────────────────────────────
export function insuranceDaysLeft(expiryDate) {
  if (!expiryDate) return null;
  const today = new Date();
  const exp = new Date(expiryDate);
  return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
}

export function insuranceStatus(expiryDate) {
  const days = insuranceDaysLeft(expiryDate);
  if (days === null)   return { tone: 'unknown', label: 'No insurance on file', color: '#FC8181' };
  if (days < 0)        return { tone: 'expired', label: `Expired ${-days}d ago`,  color: '#FC8181' };
  if (days < 30)       return { tone: 'expiring', label: `Expires in ${days}d`,    color: '#F6AD55' };
  return { tone: 'valid', label: `Valid · ${days}d left`, color: '#48BB78' };
}
