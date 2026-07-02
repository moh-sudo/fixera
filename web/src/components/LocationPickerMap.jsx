import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const DEFAULT_POS = [-1.2864, 36.8172]; // [lat, lng]
const ll = ([lat, lng]) => [lng, lat];   // → [lng, lat] for MapLibre

const MAP_STYLE = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 512,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> © <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'carto-light', type: 'raster', source: 'carto' }],
};

async function reverseGeocode(lat, lng, setLoading) {
  setLoading(true);
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const data = await res.json();
    const r    = data.address || {};
    const parts = [
      r.road || r.pedestrian || r.footway,
      r.suburb || r.neighbourhood || r.quarter,
      r.city || r.town || r.village || 'Nairobi',
    ].filter(Boolean);
    return parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } finally {
    setLoading(false);
  }
}

function createPinEl() {
  const el = document.createElement('div');
  el.style.cssText = 'cursor:grab;display:inline-block;';
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:52px;height:52px;border-radius:50%;
        background:linear-gradient(135deg,#C9A020,#D4B033);
        display:flex;align-items:center;justify-content:center;font-size:26px;
        border:3px solid rgba(255,255,255,0.95);
        box-shadow:0 4px 22px rgba(201,160,32,0.72),0 0 0 7px rgba(201,160,32,0.18);
        transition:transform 0.15s;
      ">📍</div>
      <div style="
        width:0;height:0;margin-top:-1px;
        border-left:7px solid transparent;
        border-right:7px solid transparent;
        border-top:12px solid #C9A020;
      "></div>
    </div>`;
  return el;
}

export default function LocationPickerMap({ onLocationSelect, initialLat, initialLng, initialAddress }) {
  const mapRef         = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef      = useRef(null);
  const [address, setAddress] = useState(initialAddress || '');
  const [loading, setLoading] = useState(false);

  const startPos = (initialLat && initialLng) ? [initialLat, initialLng] : DEFAULT_POS;

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: MAP_STYLE,
      center: ll(startPos),
      zoom: 15,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      const pinEl  = createPinEl();
      const marker = new maplibregl.Marker({ element: pinEl, draggable: true, anchor: 'bottom' })
        .setLngLat(ll(startPos))
        .addTo(map);
      markerRef.current = marker;

      marker.on('dragstart', () => { pinEl.style.cursor = 'grabbing'; });
      marker.on('dragend', async () => {
        pinEl.style.cursor = 'grab';
        const { lng, lat } = marker.getLngLat();
        map.panTo([lng, lat]);
        const addr = await reverseGeocode(lat, lng, setLoading);
        setAddress(addr);
        onLocationSelect?.(addr, lat, lng);
      });

      map.on('click', async (e) => {
        const { lng, lat } = e.lngLat;
        marker.setLngLat([lng, lat]);
        map.panTo([lng, lat]);
        const addr = await reverseGeocode(lat, lng, setLoading);
        setAddress(addr);
        onLocationSelect?.(addr, lat, lng);
      });
    });

    mapInstanceRef.current = map;
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #E8EAED', position: 'relative', boxShadow: '0 2px 12px rgba(10,22,40,0.08)' }}>

      <div ref={mapRef} style={{ width: '100%', height: 240 }} />

      {/* Top label */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '5px 11px', border: '1px solid #E8EAED', color: '#0A1628', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, pointerEvents: 'none' }}>
        📍 Pin your location
      </div>

      {/* Bottom address bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(10px)', borderTop: '1px solid #E8EAED', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
        <span style={{ fontSize: 14 }}>📍</span>
        <span style={{ color: loading ? '#9AA0A6' : address ? '#0A1628' : '#9AA0A6', fontSize: 12, fontWeight: address ? 600 : 400 }}>
          {loading ? 'Finding address...' : address || 'Tap map or drag pin to set location'}
        </span>
      </div>
    </div>
  );
}
