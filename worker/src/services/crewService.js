import { supabase } from '../supabase';

// ── Photo upload ─────────────────────────────────────────
async function uploadCrewPhoto(partnerId, file) {
  const path = `${partnerId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage
    .from('crew-photos')
    .upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('crew-photos').getPublicUrl(path);
  return data.publicUrl;
}

// ── CRUD ─────────────────────────────────────────────────
export async function listCrew(partnerUserId) {
  const { data, error } = await supabase
    .from('partner_crew_members')
    .select('*')
    .eq('partner_user_id', partnerUserId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCrewMember(partnerUserId, partnerType, payload, photoFile) {
  let photo_url = null;
  if (photoFile) photo_url = await uploadCrewPhoto(partnerUserId, photoFile);

  const { data, error } = await supabase
    .from('partner_crew_members')
    .insert({
      partner_user_id:  partnerUserId,
      partner_type:     partnerType,
      full_name:        payload.full_name,
      national_id:      payload.national_id,
      phone:            payload.phone || null,
      photo_url,
      default_position: payload.default_position,
      notes:            payload.notes || null,
      status:           'active',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCrewMember(crewId, partnerUserId, payload, photoFile) {
  const patch = { ...payload, updated_at: new Date().toISOString() };
  if (photoFile) patch.photo_url = await uploadCrewPhoto(partnerUserId, photoFile);

  const { data, error } = await supabase
    .from('partner_crew_members')
    .update(patch)
    .eq('id', crewId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setCrewStatus(crewId, status) {
  const { error } = await supabase
    .from('partner_crew_members')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', crewId);
  if (error) throw error;
}

export async function deleteCrewMember(crewId) {
  const { error } = await supabase
    .from('partner_crew_members')
    .delete()
    .eq('id', crewId);
  if (error) throw error;
}

// ── Position options per partner type ────────────────────
export const POSITION_OPTIONS = {
  mover: [
    { id: 'team_leader', label: 'Team Leader / Supervisor', icon: '⭐' },
    { id: 'driver',      label: 'Driver',                    icon: '🚗' },
    { id: 'loader',      label: 'Loader',                    icon: '💪' },
    { id: 'packer',      label: 'Packer',                    icon: '📦' },
  ],
  vendor: [
    { id: 'supervisor',  label: 'Supervisor',                icon: '⭐' },
    { id: 'technician',  label: 'Technician',                icon: '🔧' },
    { id: 'washer',      label: 'Washer / Cleaner',          icon: '🫧' },
    { id: 'ironer',      label: 'Ironer / Finisher',         icon: '👕' },
    { id: 'delivery',    label: 'Delivery',                  icon: '🛵' },
  ],
  water_carrier: [
    { id: 'supervisor',         label: 'Supervisor',         icon: '⭐' },
    { id: 'driver',             label: 'Driver',             icon: '🚛' },
    { id: 'loader',             label: 'Loader',             icon: '💪' },
    { id: 'delivery_attendant', label: 'Delivery Attendant', icon: '🚰' },
  ],
  supplier: [
    { id: 'supervisor', label: 'Supervisor', icon: '⭐' },
    { id: 'warehouse',  label: 'Warehouse',  icon: '🏭' },
    { id: 'driver',     label: 'Driver',     icon: '🚚' },
    { id: 'loader',     label: 'Loader',     icon: '💪' },
  ],
};

export function positionLabel(partnerType, positionId) {
  const opts = POSITION_OPTIONS[partnerType] || [];
  return opts.find(o => o.id === positionId)?.label || positionId;
}

export function positionIcon(partnerType, positionId) {
  const opts = POSITION_OPTIONS[partnerType] || [];
  return opts.find(o => o.id === positionId)?.icon || '👤';
}
