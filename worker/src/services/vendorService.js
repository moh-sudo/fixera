import { supabase } from '../supabase';
import { createReturnLeg } from './dispatchService';

// Vendor order fulfillment lifecycle.
// Coarse bookings.status: pending → confirmed → active → completed
// Detailed fulfillment_stage: received → preparing → ready → out_for_delivery → delivered

export const FULFILLMENT_STEPS = [
  { id: 'received',         label: 'Received',     icon: '📥', desc: 'Items received from customer' },
  { id: 'preparing',        label: 'Preparing',    icon: '🧼', desc: 'Cleaning / processing' },
  { id: 'ready',            label: 'Ready',        icon: '✅', desc: 'Ready for return delivery' },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: '🚗', desc: 'Rider returning to customer' },
  { id: 'delivered',        label: 'Delivered',    icon: '🎉', desc: 'Back with the customer' },
];

export function stageIndex(stage) {
  return FULFILLMENT_STEPS.findIndex(s => s.id === stage);
}

export async function getVendorOrder(id) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, profiles:user_id(full_name, phone)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// Vendor accepts a new order
export async function acceptOrder(id) {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', id);
  if (error) throw error;
}

// Advance the fulfillment stage (vendor controls received → preparing → ready)
// When the vendor marks "ready", auto-dispatch the return delivery leg.
export async function setStage(id, stage, vendorProfile = null) {
  const stamp = {};
  if (stage === 'received')  stamp.received_at = new Date().toISOString();
  if (stage === 'preparing') stamp.prep_started_at = new Date().toISOString();
  if (stage === 'ready')     stamp.ready_at = new Date().toISOString();

  const update = { fulfillment_stage: stage, ...stamp };
  // Keep coarse status in sync
  if (stage === 'received' || stage === 'preparing') update.status = 'active';
  if (stage === 'delivered') update.status = 'completed';

  const { error } = await supabase.from('bookings').update(update).eq('id', id);
  if (error) throw error;

  // ── Auto-dispatch return leg when items are ready ──
  if (stage === 'ready') {
    try {
      const { data: booking } = await supabase.from('bookings').select('*').eq('id', id).single();
      if (booking) await createReturnLeg(booking, vendorProfile);
    } catch (e) {
      console.warn('return-leg dispatch failed (non-fatal):', e);
    }
  }
}

// Upload before/after proof photos
export async function uploadPrepPhotos(vendorId, orderId, files) {
  const urls = await Promise.all(files.map(async (f) => {
    const path = `${vendorId}/${orderId}/prep_${Date.now()}_${f.name}`;
    const { error } = await supabase.storage.from('moving-photos').upload(path, f);
    if (error) throw error;
    const { data } = supabase.storage.from('moving-photos').getPublicUrl(path);
    return data.publicUrl;
  }));

  const { data: existing } = await supabase
    .from('bookings').select('prep_photos').eq('id', orderId).single();
  const combined = [...(existing?.prep_photos || []), ...urls];

  const { error } = await supabase
    .from('bookings').update({ prep_photos: combined }).eq('id', orderId);
  if (error) throw error;
  return combined;
}

// ── Vendor availability ──────────────────────────────────
export async function setOpen(vendorId, isOpen) {
  const { error } = await supabase
    .from('workers')
    .update({ is_open: isOpen, status: isOpen ? 'online' : 'offline' })
    .eq('id', vendorId);
  if (error) throw error;
}

export async function setBusinessHours(vendorId, hours) {
  const { error } = await supabase
    .from('workers')
    .update({ business_hours: hours })
    .eq('id', vendorId);
  if (error) throw error;
}
