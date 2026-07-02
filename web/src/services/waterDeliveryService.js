import { supabase } from '../supabase';

// ── Read a single water delivery booking ────────────────
export async function getWaterDelivery(id) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ── Customer cancels a water delivery ───────────────────
// Water-specific policy (per design decision):
//   - status 'pending' (no carrier yet) → free cancel
//   - status 'confirmed' or 'loading' → KSh 100 fee
//   - status 'on_the_way' / 'arrived' → no cancel (call carrier)
export function calcCancellationFee(status) {
  if (status === 'pending')                    return 0;
  if (['confirmed', 'loading'].includes(status)) return 100;
  return null; // disallowed
}

export async function cancelDelivery(id, reason, fee = 0) {
  const { error } = await supabase
    .from('bookings')
    .update({
      status:              'cancelled',
      cancellation_reason: reason,
      cancellation_fee:    fee,
    })
    .eq('id', id);
  if (error) throw error;
}

// ── Customer confirms receipt at delivery ──────────────
export async function confirmReceipt(id) {
  const { error } = await supabase
    .from('bookings')
    .update({
      status:       'completed',
      delivered_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

// ── One-tap reorder (same items, same carrier, fresh booking) ──
export async function reorderSame(originalBookingId, userId) {
  const orig = await getWaterDelivery(originalBookingId);
  if (!orig) throw new Error('Original booking not found');

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      user_id:      userId,
      service_id:   orig.service_id,
      category_id:  orig.category_id,
      sub_service:  orig.sub_service,
      quantity:     orig.quantity,
      price:        orig.price,
      address:      orig.address,
      latitude:     orig.latitude,
      longitude:    orig.longitude,
      notes:        orig.notes,
      status:       'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Live location subscription via Supabase Realtime ───
// Generic: column is 'booking_id' (water) or 'moving_request_id' (movers).
// Returns the channel so caller can unsubscribe in cleanup.
export function subscribeToLocationFor(column, id, onUpdate) {
  // Get last known location immediately, then subscribe to new pings
  supabase
    .from('live_locations')
    .select('*')
    .eq(column, id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .then(({ data }) => { if (data && data[0]) onUpdate(data[0]); });

  const channel = supabase
    .channel(`live_loc_${column}_${id}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'live_locations', filter: `${column}=eq.${id}` },
      payload => onUpdate(payload.new)
    )
    .subscribe();

  return channel;
}

export function subscribeToLocation(bookingId, onUpdate) {
  return subscribeToLocationFor('booking_id', bookingId, onUpdate);
}

// ── Haversine for distance / ETA estimate ─────────────
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Rough urban ETA (assumes ~25 km/h avg city speed)
export function etaMinutes(distanceKm, speedKmh = 25) {
  if (!distanceKm) return null;
  return Math.max(1, Math.round((distanceKm / speedKmh) * 60));
}

// ── Status helpers ─────────────────────────────────────
export const STATUS_FLOW = ['pending', 'confirmed', 'loading', 'on_the_way', 'arrived', 'delivered', 'completed'];

export function isBowserService(subServiceId) {
  return /bowser|tank-filling/i.test(subServiceId || '');
}
