import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '../supabase';

const NAIROBI = [-1.2864, 36.8172]; // [lat, lng]
const ll = ([lat, lng]) => [lng, lat]; // → [lng, lat] for MapLibre

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
  if (!address || address === '—') return NAIROBI;
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

function simulatedWorkerPos(status, customerPos) {
  const [clat, clng] = customerPos;
  switch (status) {
    case 'confirmed':   return [clat - 0.025, clng - 0.020];
    case 'on_way':      return [clat - 0.010, clng - 0.008];
    case 'arrived':
    case 'in_progress':
    case 'completed':   return [clat + 0.0002, clng + 0.0002];
    default:            return [clat - 0.025, clng - 0.020];
  }
}

function statusLabel(status) {
  return {
    confirmed:   'Heading to you soon',
    on_way:      '🚗 On the way!',
    arrived:     '📍 Arrived at your location',
    in_progress: '🔧 Working on your job',
    completed:   '✅ Job completed',
  }[status] || 'Assigned';
}

function addRouteLayers(map) {
  map.addSource('route', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
  });
  map.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#C9A020', 'line-width': 18, 'line-blur': 14, 'line-opacity': 0.18 } });
  map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#C9A020', 'line-width': 4, 'line-opacity': 0.9 } });
  map.addLayer({ id: 'route-tick', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#fff', 'line-width': 1.5, 'line-dasharray': [3, 7], 'line-opacity': 0.3 } });
}

function setRouteData(map, from, to) {
  const src = map.getSource('route');
  if (src) src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [from, to] } });
}

export default function TrackingMap({
  address      = '',
  workerStatus = 'confirmed',
  workerName   = 'Worker',
  workerId     = null,
}) {
  const mapRef          = useRef(null);
  const mapInstanceRef  = useRef(null);
  const workerMarkerRef = useRef(null);
  const channelRef      = useRef(null);

  const [customerPos, setCustomerPos] = useState(NAIROBI);
  const [geocoded,    setGeocoded]    = useState(false);
  const [workerPos,   setWorkerPos]   = useState(null);

  // ── 1. Geocode customer address ─────────────────────────────
  useEffect(() => {
    geocodeAddress(address).then(pos => { setCustomerPos(pos); setGeocoded(true); });
  }, [address]);

  // ── 2. Load real worker GPS + subscribe to realtime ─────────
  useEffect(() => {
    if (!workerId) return;
    const isMoving = ['on_way', 'arrived'].includes(workerStatus);
    if (!isMoving) {
      setWorkerPos(null);
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
      return;
    }
    supabase.from('workers').select('current_lat,current_lng').eq('id', workerId).single()
      .then(({ data }) => {
        if (data?.current_lat && data?.current_lng) setWorkerPos([data.current_lat, data.current_lng]);
      });
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase
      .channel(`wloc-${workerId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'workers', filter: `id=eq.${workerId}` },
        ({ new: w }) => { if (w.current_lat && w.current_lng) setWorkerPos([w.current_lat, w.current_lng]); })
      .subscribe();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [workerId, workerStatus]);

  // ── 3. Build / rebuild map when geocoding completes ─────────
  useEffect(() => {
    if (!geocoded || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      workerMarkerRef.current = null;
    }

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: MAP_STYLE,
      center: ll(customerPos),
      zoom: 15,
      attributionControl: false,
    });
    map.scrollZoom.disable();

    map.on('load', () => {
      addRouteLayers(map);

      // Customer marker — gold home pin
      const custEl = document.createElement('div');
      custEl.style.cssText = 'width:44px;height:44px;';
      custEl.innerHTML = `<div style="
        width:44px;height:44px;border-radius:50%;
        background:linear-gradient(135deg,#C9A020,#D4B033);
        display:flex;align-items:center;justify-content:center;
        font-size:22px;border:3px solid #fff;
        box-shadow:0 4px 16px rgba(201,160,32,0.7),0 0 0 5px rgba(201,160,32,0.18);
      ">🏠</div>`;
      new maplibregl.Marker({ element: custEl, anchor: 'center' }).setLngLat(ll(customerPos)).addTo(map);

      // Worker marker — blue worker pin (simulated position initially)
      const initWPos = simulatedWorkerPos(workerStatus, customerPos);
      const workerEl = document.createElement('div');
      workerEl.style.cssText = 'width:44px;height:44px;';
      workerEl.innerHTML = `<div class="worker-dot" style="
        width:44px;height:44px;border-radius:50%;
        background:linear-gradient(135deg,#4A90D9,#63B3ED);
        display:flex;align-items:center;justify-content:center;
        font-size:22px;border:3px solid #fff;
        box-shadow:0 4px 16px rgba(74,144,217,0.7),0 0 0 5px rgba(74,144,217,0.18);
        ${workerStatus === 'on_way' ? 'animation:wPulse 1.8s ease-in-out infinite;' : ''}
      ">👷</div>`;
      const wMarker = new maplibregl.Marker({ element: workerEl, anchor: 'center' }).setLngLat(ll(initWPos)).addTo(map);
      workerMarkerRef.current = wMarker;

      setRouteData(map, ll(initWPos), ll(customerPos));

      if (!['arrived', 'in_progress', 'completed'].includes(workerStatus)) {
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend(ll(initWPos));
        bounds.extend(ll(customerPos));
        map.fitBounds(bounds, { padding: 64, maxZoom: 16 });
      }
    });

    mapInstanceRef.current = map;
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        workerMarkerRef.current = null;
      }
    };
  }, [geocoded, customerPos]);

  // ── 4. Update worker marker when real GPS or status changes ──
  useEffect(() => {
    if (!workerMarkerRef.current || !mapInstanceRef.current) return;
    const pos = workerPos || simulatedWorkerPos(workerStatus, customerPos);
    workerMarkerRef.current.setLngLat(ll(pos));
    setRouteData(mapInstanceRef.current, ll(pos), ll(customerPos));

    if (workerPos && workerStatus === 'on_way') {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend(ll(customerPos));
      bounds.extend(ll(pos));
      mapInstanceRef.current.fitBounds(bounds, { padding: 64, maxZoom: 16 });
    }
  }, [workerStatus, workerPos, customerPos, workerName]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <style>{`
        @keyframes wPulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
        @keyframes spin    { to { transform: rotate(360deg); } }
      `}</style>

      {!geocoded && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,14,26,0.82)', borderRadius: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(201,160,32,0.3)', borderTopColor: '#C9A020', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
            <div style={{ color: '#C9A020', fontSize: 12 }}>Locating address...</div>
          </div>
        </div>
      )}

      {/* Live GPS badge */}
      {workerPos && ['on_way', 'arrived'].includes(workerStatus) && (
        <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 1000, background: 'rgba(72,187,120,0.9)', borderRadius: 20, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'wPulse 1.4s infinite' }} />
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>REAL-TIME GPS</span>
        </div>
      )}

      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 16 }} />
    </div>
  );
}
