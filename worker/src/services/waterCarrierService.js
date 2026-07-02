import { supabase } from '../supabase';

// ── Open orders (broadcast queue) — any online water carrier can claim ──
export async function listOpenOrders() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('service_id', 'water-carriers')
    .eq('status', 'pending')
    .is('carrier_user_id', null)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

// ── My active + history ─────────────────────────────────
export async function listMyDeliveries(carrierUserId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('service_id', 'water-carriers')
    .eq('carrier_user_id', carrierUserId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function getOrder(id) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ── Claim an open order (first carrier to accept wins) ──
export async function acceptOrder(orderId, carrierUserId, driverSnapshot) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      carrier_user_id: carrierUserId,
      status:          'confirmed',
      confirmed_at:    new Date().toISOString(),
      driver_snapshot: driverSnapshot,
    })
    .eq('id', orderId)
    .eq('status', 'pending')        // safety: only claim if still open
    .is('carrier_user_id', null)
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('Order was already taken by another carrier.');
  return data;
}

// ── State transitions ──────────────────────────────────
export async function startLoading(orderId) {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'loading' })
    .eq('id', orderId);
  if (error) throw error;
}

export async function markDeparted(orderId) {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'on_the_way', departed_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) throw error;
}

export async function markArrived(orderId) {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'arrived', arrived_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) throw error;
}

export async function markDelivered(orderId) {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'delivered' })
    .eq('id', orderId);
  if (error) throw error;
}

// ── Delivery photo upload ──────────────────────────────
export async function uploadDeliveryPhotos(carrierUserId, orderId, files) {
  const urls = await Promise.all(files.map(async (f) => {
    const path = `${carrierUserId}/${orderId}/${Date.now()}_${f.name}`;
    const { error } = await supabase.storage
      .from('moving-photos')   // reuse existing public bucket; OK for water delivery proof
      .upload(path, f);
    if (error) throw error;
    const { data } = supabase.storage.from('moving-photos').getPublicUrl(path);
    return data.publicUrl;
  }));

  // Merge into existing array on the booking
  const { data: existing } = await supabase
    .from('bookings')
    .select('delivery_photo_urls')
    .eq('id', orderId)
    .single();
  const combined = [...(existing?.delivery_photo_urls || []), ...urls];

  const { error } = await supabase
    .from('bookings')
    .update({ delivery_photo_urls: combined })
    .eq('id', orderId);
  if (error) throw error;

  return combined;
}

// ── Live location ping ─────────────────────────────────
export async function pingLocation(carrierUserId, bookingId, { lat, lng, accuracy, heading, speed }) {
  const { error } = await supabase
    .from('live_locations')
    .insert({
      booking_id:      bookingId,
      partner_user_id: carrierUserId,
      lat, lng, accuracy, heading, speed,
    });
  if (error) console.warn('live location ping failed:', error);
}
