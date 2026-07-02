import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const NAIROBI = [-1.2921, 36.8219]; // [lat, lng]
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

async function geocode(address) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Nairobi, Kenya')}&limit=1`,
      { headers: { 'User-Agent': 'FixeraWorker/1.0' } }
    );
    const data = await res.json();
    if (data[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {}
  return null;
}

function createPinEl() {
  const el = document.createElement('div');
  el.style.cssText = 'display:inline-block;';
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:48px;height:48px;border-radius:50%;
        background:linear-gradient(135deg,#C9A020,#D4B033);
        display:flex;align-items:center;justify-content:center;font-size:24px;
        border:3px solid #fff;
        box-shadow:0 4px 20px rgba(201,160,32,0.68),0 0 0 6px rgba(201,160,32,0.18);
      ">🏠</div>
      <div style="
        width:0;height:0;margin-top:-1px;
        border-left:7px solid transparent;
        border-right:7px solid transparent;
        border-top:12px solid #C9A020;
      "></div>
    </div>`;
  return el;
}

export default function JobMap({ address }) {
  const divRef    = useRef(null);
  const mapRef    = useRef(null);
  const markerRef = useRef(null);

  // ── Init map ────────────────────────────────────────────────
  useEffect(() => {
    if (!divRef.current || mapRef.current) return;
    mapRef.current = new maplibregl.Map({
      container: divRef.current,
      style: MAP_STYLE,
      center: ll(NAIROBI),
      zoom: 13,
      attributionControl: false,
    });
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // ── Geocode address → drop pin ──────────────────────────────
  useEffect(() => {
    if (!address || !mapRef.current) return;
    geocode(address).then(coords => {
      if (!coords || !mapRef.current) return;
      mapRef.current.easeTo({ center: ll(coords), zoom: 15 });
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = new maplibregl.Marker({ element: createPinEl(), anchor: 'bottom' })
        .setLngLat(ll(coords))
        .addTo(mapRef.current);
    });
  }, [address]);

  return <div ref={divRef} style={{ width: '100%', height: '100%' }} />;
}
