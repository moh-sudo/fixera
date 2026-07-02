import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';

// Generic location ping — targets a water booking, moving request, or supplier order.
async function pingLocation(userId, target, { lat, lng, accuracy, heading, speed }) {
  const { error } = await supabase
    .from('live_locations')
    .insert({
      booking_id:        target.bookingId        || null,
      moving_request_id: target.movingRequestId  || null,
      supplier_order_id: target.supplierOrderId  || null,
      partner_user_id:   userId,
      lat, lng, accuracy, heading, speed,
    });
  if (error) console.warn('live location ping failed:', error);
}

// Live GPS streaming hook for partners during active deliveries / moves.
// Pings the live_locations table every ~10s while `active` is true.
//
// Usage (water):  useLiveLocation({ userId, bookingId: order.id,      active: ... })
// Usage (mover):  useLiveLocation({ userId, movingRequestId: req.id,  active: ... })
export default function useLiveLocation({ userId, bookingId, movingRequestId, supplierOrderId, active, pingIntervalMs = 10000 }) {
  const watchIdRef = useRef(null);
  const lastPingAtRef = useRef(0);
  const [lastCoord, setLastCoord] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!active || !userId || (!bookingId && !movingRequestId && !supplierOrderId)) return;
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported on this device.');
      return;
    }

    const onPosition = (pos) => {
      const { latitude, longitude, accuracy, heading, speed } = pos.coords;
      setLastCoord({ lat: latitude, lng: longitude, accuracy, heading, speed });
      // Throttle DB writes — don't ping more often than pingIntervalMs
      const now = Date.now();
      if (now - lastPingAtRef.current < pingIntervalMs) return;
      lastPingAtRef.current = now;
      pingLocation(userId, { bookingId, movingRequestId, supplierOrderId }, {
        lat: latitude, lng: longitude,
        accuracy: accuracy ?? null,
        heading:  heading  ?? null,
        speed:    speed    ?? null,
      });
    };

    const onError = (err) => { setError(err.message || 'GPS error'); };

    watchIdRef.current = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      maximumAge:         5000,
      timeout:            15000,
    });

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [active, userId, bookingId, movingRequestId, supplierOrderId, pingIntervalMs]);

  return { active: !!watchIdRef.current, lastCoord, error };
}
