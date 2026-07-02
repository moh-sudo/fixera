import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { subscribeToLocationFor, haversineKm, etaMinutes } from '../services/waterDeliveryService';

const NAIROBI     = [-1.2864, 36.8172]; // [lat, lng] storage format
const NAIROBI_C   = [36.8172, -1.2864]; // [lng, lat] for MapLibre center

// [lat, lng] → [lng, lat] for MapLibre
const ll = ([lat, lng]) => [lng, lat];

const MAP_STYLE = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 512,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> © <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'carto-dark', type: 'raster', source: 'carto' }],
};

async function geocodeAddress(address) {
  if (!address) return NAIROBI;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ', Nairobi, Kenya')}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'FixeraWeb/1.0' } }
    );
    const data = await res.json();
    if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch (_) {}
  return NAIROBI;
}

// Movement thresholds (Uber/Bolt-style)
const STOP_SPEED_KMH  = 3;
const STOP_MOVE_M     = 25;
const STOP_ALERT_SECS = 40;
const ARRIVED_M       = 90;

function makeDriverEl(vehicleIcon, color, glow) {
  const el = document.createElement('div');
  el.style.cssText = 'width:42px;height:42px;';
  const inner = document.createElement('div');
  inner.style.cssText = `
    width:42px;height:42px;border-radius:50%;
    background:${color};
    border:3px solid rgba(255,255,255,0.95);
    box-shadow:0 0 0 7px ${glow},0 4px 18px rgba(0,0,0,0.5);
    display:flex;align-items:center;justify-content:center;
    font-size:21px;transition:background 0.3s,box-shadow 0.3s;
  `;
  inner.textContent = vehicleIcon;
  el.appendChild(inner);
  return el;
}

function makeDestEl() {
  const el = document.createElement('div');
  el.style.cssText = 'width:40px;height:40px;';
  el.innerHTML = `<div style="
    width:40px;height:40px;border-radius:50%;
    background:linear-gradient(135deg,#00B5D8,#38BDF8);
    border:3px solid rgba(255,255,255,0.95);
    box-shadow:0 0 0 5px rgba(0,181,216,0.25),0 4px 16px rgba(0,0,0,0.45);
    display:flex;align-items:center;justify-content:center;font-size:20px;
  ">🏠</div>`;
  return el;
}

function addRouteLayers(map) {
  map.addSource('route', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
  });
  map.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#9F7AEA', 'line-width': 18, 'line-blur': 14, 'line-opacity': 0.16 } });
  map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#9F7AEA', 'line-width': 4, 'line-opacity': 0.9 } });
  map.addLayer({ id: 'route-tick', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#fff', 'line-width': 1.5, 'line-dasharray': [3, 7], 'line-opacity': 0.28 } });
}

export default function LiveMap({
  bookingId, movingRequestId, supplierOrderId,
  vehicleIcon = '🚐', vehicleLabel = 'driver',
  destinationAddress, destinationCoords,
  onEtaChange, height = 280,
}) {
  const containerRef    = useRef(null);
  const mapRef          = useRef(null);
  const mapLoadedRef    = useRef(false);
  const driverMarkerRef = useRef(null);
  const destMarkerRef   = useRef(null);
  const channelRef      = useRef(null);
  const lastPingRef     = useRef(null);
  const stoppedSinceRef = useRef(null);

  const [driverPos, setDriverPos] = useState(null);
  const [destPos, setDestPos]     = useState(destinationCoords || null);
  const [info, setInfo]           = useState({ etaMin: null, distanceKm: null, speedKmh: null });
  const [motion, setMotion]       = useState({ state: 'waiting', stoppedSecs: 0 });

  // ── 1. Init MapLibre map ─────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: NAIROBI_C,
      zoom: 13,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.on('load', () => {
      mapLoadedRef.current = true;
      addRouteLayers(map);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      mapLoadedRef.current = false;
    };
  }, []);

  // ── 2. Geocode destination if only address given ─────────────
  useEffect(() => {
    let cancelled = false;
    if (!destPos && destinationAddress) {
      geocodeAddress(destinationAddress).then(pos => { if (!cancelled) setDestPos(pos); });
    }
    return () => { cancelled = true; };
  }, [destinationAddress, destPos]);

  // ── 3. Destination marker ─────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !destPos) return;
    if (destMarkerRef.current) destMarkerRef.current.remove();
    destMarkerRef.current = new maplibregl.Marker({ element: makeDestEl(), anchor: 'center' })
      .setLngLat(ll(destPos))
      .addTo(mapRef.current);
  }, [destPos]);

  // ── 4. Subscribe to live locations ────────────────────────────
  useEffect(() => {
    const column = movingRequestId ? 'moving_request_id' : supplierOrderId ? 'supplier_order_id' : 'booking_id';
    const id     = movingRequestId || supplierOrderId || bookingId;
    if (!id) return;
    const channel = subscribeToLocationFor(column, id, (loc) => {
      const lat = Number(loc.lat), lng = Number(loc.lng);
      const now = Date.now();
      const gpsSpeedKmh = loc.speed != null ? Number(loc.speed) * 3.6 : null;
      const prev = lastPingRef.current;
      let movedM = null;
      if (prev) movedM = haversineKm(prev.lat, prev.lng, lat, lng) * 1000;
      const looksStopped =
        (gpsSpeedKmh != null && gpsSpeedKmh < STOP_SPEED_KMH) ||
        (movedM != null && movedM < STOP_MOVE_M);
      if (looksStopped) { if (!stoppedSinceRef.current) stoppedSinceRef.current = now; }
      else stoppedSinceRef.current = null;
      lastPingRef.current = { lat, lng, t: now };
      setDriverPos([lat, lng]);
      if (gpsSpeedKmh != null) setInfo(p => ({ ...p, speedKmh: Math.round(gpsSpeedKmh) }));
    });
    channelRef.current = channel;
    return () => { if (channel) channel.unsubscribe(); };
  }, [bookingId, movingRequestId, supplierOrderId]);

  // ── 5. Motion-state evaluator (ticks every second) ───────────
  useEffect(() => {
    const t = setInterval(() => {
      if (!driverPos) { setMotion({ state: 'waiting', stoppedSecs: 0 }); return; }
      if (destPos) {
        const distM = haversineKm(driverPos[0], driverPos[1], destPos[0], destPos[1]) * 1000;
        if (distM < ARRIVED_M) { setMotion({ state: 'arrived', stoppedSecs: 0 }); return; }
      }
      if (stoppedSinceRef.current) {
        const secs = Math.floor((Date.now() - stoppedSinceRef.current) / 1000);
        setMotion({ state: secs >= STOP_ALERT_SECS ? 'stopped' : 'moving', stoppedSecs: secs });
      } else {
        setMotion({ state: 'moving', stoppedSecs: 0 });
      }
    }, 1000);
    return () => clearInterval(t);
  }, [driverPos, destPos]);

  // ── 6. Update driver marker + route + ETA ────────────────────
  useEffect(() => {
    if (!mapRef.current || !driverPos) return;

    const markerColor = motion.state === 'stopped' ? '#F6AD55'
      : motion.state === 'arrived' ? '#48BB78' : '#9F7AEA';
    const glowColor = motion.state === 'stopped' ? 'rgba(246,173,85,0.35)'
      : motion.state === 'arrived' ? 'rgba(72,187,120,0.35)' : 'rgba(159,122,234,0.35)';

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat(ll(driverPos));
      const inner = driverMarkerRef.current.getElement()?.firstChild;
      if (inner) {
        inner.style.background = markerColor;
        inner.style.boxShadow = `0 0 0 7px ${glowColor},0 4px 18px rgba(0,0,0,0.5)`;
      }
    } else {
      const el = makeDriverEl(vehicleIcon, markerColor, glowColor);
      driverMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(ll(driverPos))
        .addTo(mapRef.current);
    }

    if (destPos && mapLoadedRef.current) {
      const src = mapRef.current.getSource('route');
      if (src) {
        src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [ll(driverPos), ll(destPos)] } });
      }
      const distanceKm = haversineKm(driverPos[0], driverPos[1], destPos[0], destPos[1]);
      const etaMin     = etaMinutes(distanceKm, info.speedKmh || 25);
      setInfo(p => ({ ...p, etaMin, distanceKm: distanceKm.toFixed(1) }));
      if (onEtaChange) onEtaChange({ etaMin, distanceKm, speedKmh: info.speedKmh });

      const bounds = new maplibregl.LngLatBounds();
      bounds.extend(ll(driverPos));
      bounds.extend(ll(destPos));
      mapRef.current.fitBounds(bounds, { padding: 64, maxZoom: 16, animate: true });
    } else {
      mapRef.current.easeTo({ center: ll(driverPos), zoom: 15 });
    }
  }, [driverPos, destPos, motion.state]);

  const fmtStopped = (s) => s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height, borderRadius: 14, overflow: 'hidden', background: '#0A0E1A' }} />

      {/* Waiting overlay */}
      {!driverPos && (
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', color: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: 12, textAlign: 'center', fontWeight: 600, pointerEvents: 'none' }}>
          📡 Waiting for {vehicleLabel} location…
        </div>
      )}

      {/* Status pill */}
      {driverPos && motion.state !== 'waiting' && (
        <div style={{ position: 'absolute', top: 12, left: 12, background: motion.state === 'stopped' ? 'rgba(246,173,85,0.95)' : motion.state === 'arrived' ? 'rgba(72,187,120,0.95)' : 'rgba(159,122,234,0.95)', color: '#fff', padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, boxShadow: '0 2px 10px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
          {motion.state === 'moving'  && <>🟢 Moving</>}
          {motion.state === 'stopped' && <>🟡 Stopped</>}
          {motion.state === 'arrived' && <>📍 Arrived</>}
        </div>
      )}

      {/* Stop alert banner */}
      {motion.state === 'stopped' && (
        <div style={{ position: 'absolute', top: 48, left: 12, right: 12, background: 'rgba(246,173,85,0.97)', color: '#1a1205', padding: '9px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, boxShadow: '0 4px 14px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span>Your {vehicleLabel} has stopped — stationary for {fmtStopped(motion.stoppedSecs)}</span>
        </div>
      )}

      {/* ETA banner */}
      {driverPos && info.etaMin != null && motion.state !== 'arrived' && (
        <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, background: motion.state === 'stopped' ? 'rgba(246,173,85,0.95)' : 'rgba(0,181,216,0.95)', color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.35)', pointerEvents: 'none' }}>
          <span>{vehicleIcon} {motion.state === 'stopped' ? 'Paused' : `Arriving in ${info.etaMin} min`}</span>
          <span style={{ fontSize: 11, opacity: 0.9, fontWeight: 600 }}>{info.distanceKm} km · {info.speedKmh || 0} km/h</span>
        </div>
      )}

      {/* Arrived banner */}
      {motion.state === 'arrived' && (
        <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, background: 'rgba(72,187,120,0.96)', color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 800, textAlign: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.35)', pointerEvents: 'none' }}>
          📍 Your {vehicleLabel} has arrived
        </div>
      )}
    </div>
  );
}
