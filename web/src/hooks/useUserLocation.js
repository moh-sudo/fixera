// ─────────────────────────────────────────────
//  useUserLocation — auto-detects user's GPS
//  position and reverse-geocodes to an address.
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react';

// Module-level cache so we only request once per session
let cachedLocation = null;
let listeners = [];

function notify(loc) {
  cachedLocation = loc;
  listeners.forEach(fn => fn(loc));
}

async function reverseGeocode(lat, lng) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    const r    = data.address || {};
    const city = r.city || r.town || r.suburb || r.county || 'Nairobi';
    const road = r.road || r.pedestrian || r.neighbourhood || '';
    const full = [road, r.suburb || r.neighbourhood, city]
      .filter(Boolean).join(', ');
    return { city, full, lat, lng };
  } catch {
    return { city: 'Nairobi', full: 'Nairobi, Kenya', lat, lng };
  }
}

export function requestUserLocation() {
  if (cachedLocation) return Promise.resolve(cachedLocation);

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      const fallback = { city: 'Nairobi', full: 'Nairobi, Kenya', lat: -1.2864, lng: 36.8172 };
      notify(fallback);
      return resolve(fallback);
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const loc = await reverseGeocode(coords.latitude, coords.longitude);
        notify(loc);
        resolve(loc);
      },
      () => {
        // Permission denied or error — fall back to Nairobi
        const fallback = { city: 'Nairobi', full: 'Nairobi, Kenya', lat: -1.2864, lng: 36.8172 };
        notify(fallback);
        resolve(fallback);
      },
      { timeout: 8000, maximumAge: 300000, enableHighAccuracy: true }
    );
  });
}

export function useUserLocation() {
  const [location, setLocation] = useState(cachedLocation);

  useEffect(() => {
    // Subscribe to future updates
    listeners.push(setLocation);

    // If already have it, use it immediately
    if (cachedLocation) {
      setLocation(cachedLocation);
    } else {
      requestUserLocation();
    }

    return () => {
      listeners = listeners.filter(fn => fn !== setLocation);
    };
  }, []);

  return location;
}
