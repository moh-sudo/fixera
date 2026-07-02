import { supabase } from '../supabase';

// ─────────────────────────────────────────────────────────────
//  Rider Dispatch Engine
//  - Vendor "Ready" creates a RETURN leg (vendor → customer)
//  - Offered to the ORIGINAL rider first (15-min exclusive window)
//  - Then opens to all online riders, ranked by distance
// ─────────────────────────────────────────────────────────────

const PREFERRED_WINDOW_MIN = 15;   // original rider's head start
export const NEARBY_KM      = 8;    // "around the area" radius
const OFFER_SECONDS        = 120;  // exclusive offer window per rider before it opens up

function offerExpiry() { return new Date(Date.now() + OFFER_SECONDS * 1000).toISOString(); }

export function haversineKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some(v => v == null)) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ── Rider broadcasts location while online ─────────────────
export async function updateRiderLocation(riderId, lat, lng) {
  const { error } = await supabase
    .from('workers')
    .update({ last_lat: lat, last_lng: lng, last_location_at: new Date().toISOString() })
    .eq('id', riderId);
  if (error) console.warn('rider location update failed:', error);
}

// ── Supplier marks Ready → create a delivery leg (supplier → customer) ──
export async function createSupplierDeliveryLeg(order, supplierProfile) {
  const { data, error } = await supabase
    .from('delivery_tracking')
    .insert({
      supplier_order_id: order.id,
      leg_type:          'return',
      status:            'pending',
      rider_id:          null,
      pickup_address:    supplierProfile?.business_name
        ? `${supplierProfile.business_name}${supplierProfile.area ? ', ' + supplierProfile.area : ''}`
        : (supplierProfile?.area || 'Supplier'),
      pickup_lat:        supplierProfile?.last_lat || null,
      pickup_lng:        supplierProfile?.last_lng || null,
      dropoff_address:   order.delivery_address || null,
      dropoff_lat:       order.delivery_lat || null,
      dropoff_lng:       order.delivery_lng || null,
      vendor_id:         supplierProfile?.id || order.supplier_id || null,
      customer_name:     order.customer_name || null,
      amount:            300,
      preferred_rider_id: order.assigned_rider_id || null,
      offered_at:        order.assigned_rider_id ? new Date().toISOString() : null,
      offered_to:        order.assigned_rider_id || null,
      offer_expires_at:  order.assigned_rider_id ? offerExpiry() : null,
      declined_by:       [],
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Vendor marks Ready → create the return delivery leg ────
export async function createReturnLeg(booking, vendorProfile) {
  // Offer to the rider who owns this order first
  const preferredRiderId = booking.assigned_rider_id || null;

  const { data, error } = await supabase
    .from('delivery_tracking')
    .insert({
      booking_id:         booking.id,
      leg_type:           'return',
      status:             'pending',
      rider_id:           null,
      pickup_address:     vendorProfile?.business_name
        ? `${vendorProfile.business_name}${vendorProfile.area ? ', ' + vendorProfile.area : ''}`
        : (vendorProfile?.area || 'Vendor'),
      pickup_lat:         vendorProfile?.last_lat || null,
      pickup_lng:         vendorProfile?.last_lng || null,
      dropoff_address:    booking.address || null,
      vendor_id:          vendorProfile?.id || booking.assigned_vendor_id || null,
      customer_name:      booking.customer_name || null,
      amount:             300,
      preferred_rider_id: preferredRiderId,
      offered_at:         preferredRiderId ? new Date().toISOString() : null,
      offered_to:         preferredRiderId || null,
      offer_expires_at:   preferredRiderId ? offerExpiry() : null,
      declined_by:        [],
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── List jobs a rider can see, ranked by distance ─────────
// Offer model: a leg is offered to ONE rider at a time (offered_to) with a
// short exclusive countdown (offer_expires_at). Decline/timeout opens it to
// the nearby pool. Riders who declined never see it again.
// riderLoc: { lat, lng } | null
export async function listRiderJobs(riderId, riderLoc) {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('delivery_tracking')
    .select('*, bookings(*)')
    .is('rider_id', null)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(40);
  if (error) throw error;

  const visible = (data || []).filter(job => {
    const declined = Array.isArray(job.declined_by) ? job.declined_by : [];
    if (declined.includes(riderId)) return false;        // I declined → never show
    const exclusiveActive = job.offered_to && job.offer_expires_at && job.offer_expires_at > nowIso;
    if (exclusiveActive) return job.offered_to === riderId; // only the offered rider sees it
    return true;                                          // open pool (no offer / expired)
  });

  return visible.map(job => {
    const distKm = riderLoc && job.pickup_lat != null
      ? haversineKm(riderLoc.lat, riderLoc.lng, Number(job.pickup_lat), Number(job.pickup_lng))
      : null;
    const exclusiveActive = job.offered_to === riderId && job.offer_expires_at && job.offer_expires_at > nowIso;
    return {
      ...job,
      _distanceKm: distKm,
      _reservedForMe: exclusiveActive,
      _offerSecsLeft: exclusiveActive ? Math.max(0, Math.round((new Date(job.offer_expires_at) - Date.now()) / 1000)) : null,
    };
  }).sort((a, b) => {
    if (a._reservedForMe !== b._reservedForMe) return a._reservedForMe ? -1 : 1;
    if (a._distanceKm == null) return 1;
    if (b._distanceKm == null) return -1;
    return a._distanceKm - b._distanceKm;
  });
}

// ── Rider declines an offer → exclude them, open to the pool ──
export async function declineLeg(legId, riderId) {
  const { data: leg } = await supabase
    .from('delivery_tracking').select('declined_by').eq('id', legId).single();
  const declined = Array.isArray(leg?.declined_by) ? leg.declined_by : [];
  if (!declined.includes(riderId)) declined.push(riderId);

  const { error } = await supabase
    .from('delivery_tracking')
    .update({ declined_by: declined, offered_to: null, offer_expires_at: null })
    .eq('id', legId);
  if (error) throw error;
}

// ── Rider accepts a leg ────────────────────────────────────
// riderInfo: { name, phone, vehicle } — snapshotted onto the order so the
// vendor/supplier can see who is collecting.
export async function acceptLeg(legId, riderId, bookingId, supplierOrderId = null, riderInfo = {}) {
  const { data, error } = await supabase
    .from('delivery_tracking')
    .update({ rider_id: riderId, status: 'rider_assigned' })
    .eq('id', legId)
    .is('rider_id', null)               // race-safe
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('Another rider already took this job.');

  const snap = {
    assigned_rider_id: riderId,
    rider_name:    riderInfo.name    || null,
    rider_phone:   riderInfo.phone   || null,
    rider_vehicle: riderInfo.vehicle || null,
  };

  // Tag the order with the owning rider + snapshot (vendor/supplier can see it)
  if (bookingId) {
    await supabase.from('bookings').update(snap).eq('id', bookingId);
  }
  if (supplierOrderId || data.supplier_order_id) {
    await supabase.from('supplier_orders').update(snap).eq('id', supplierOrderId || data.supplier_order_id);
  }
  return data;
}

// ── Advance a leg's status; sync the linked order ─────────
export async function advanceLeg(leg, nextStatus) {
  await supabase.from('delivery_tracking').update({ status: nextStatus }).eq('id', leg.id);

  // Supplier order leg
  if (leg.supplier_order_id) {
    if (nextStatus === 'out_for_delivery') {
      await supabase.from('supplier_orders').update({ status: 'out_for_delivery', fulfillment_stage: 'out_for_delivery' }).eq('id', leg.supplier_order_id);
    } else if (nextStatus === 'delivered') {
      await supabase.from('supplier_orders').update({
        status: 'delivered', fulfillment_stage: 'delivered', delivered_at: new Date().toISOString(),
      }).eq('id', leg.supplier_order_id);
    }
    return;
  }

  if (!leg.booking_id) return;
  // Keep the vendor order's fulfillment_stage in sync with the rider
  if (leg.leg_type === 'return') {
    if (nextStatus === 'out_for_delivery') {
      await supabase.from('bookings').update({ fulfillment_stage: 'out_for_delivery' }).eq('id', leg.booking_id);
    } else if (nextStatus === 'delivered') {
      await supabase.from('bookings').update({
        fulfillment_stage: 'delivered', status: 'completed',
      }).eq('id', leg.booking_id);
    }
  } else if (leg.leg_type === 'pickup' && nextStatus === 'delivered') {
    // Pickup leg done = items dropped at vendor
    await supabase.from('bookings').update({ fulfillment_stage: 'received' }).eq('id', leg.booking_id);
  }
}
