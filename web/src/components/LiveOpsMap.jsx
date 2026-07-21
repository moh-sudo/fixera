import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '../supabase';

const NAIROBI = [36.8219, -1.2921]; // [lng, lat]

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
      attribution: '© OpenStreetMap © CARTO',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'carto-light', type: 'raster', source: 'carto' }],
};

const ROLE_META = {
  worker:        { color: '#4A90D9', label: 'Workers',       icon: '🔧' },
  rider:         { color: '#16A34A', label: 'Riders',        icon: '🚗' },
  mover:         { color: '#7C6CF0', label: 'Movers',        icon: '🚚' },
  water_carrier: { color: '#00B5D8', label: 'Water Carriers',icon: '🚰' },
  vendor:        { color: '#F59E0B', label: 'Vendors',       icon: '🏪' },
  supplier:      { color: '#EF4444', label: 'Suppliers',     icon: '📦' },
};

const STATUS_META = {
  on_way:      { label: 'On the way',   color: '#16A34A' },
  in_progress: { label: 'On a job',     color: '#C9A020' },
  confirmed:   { label: 'Assigned',     color: '#3B82F6' },
  available:   { label: 'Available',    color: '#7A8699' },
  offline:     { label: 'Offline',      color: '#B7BFCC' },
};

function partnersToGeoJSON(partners) {
  return {
    type: 'FeatureCollection',
    features: partners
      .filter(p => p.current_lat && p.current_lng)
      .map(p => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.current_lng, p.current_lat] },
        properties: {
          id:       p.id,
          name:     p.full_name || 'Partner',
          role:     p.partner_role || 'worker',
          status:   p.status || 'available',
          rating:   p.rating || 0,
          color:    ROLE_META[p.partner_role]?.color || '#C9A020',
          isActive: ['on_way', 'in_progress'].includes(p.status),
        },
      })),
  };
}

export default function LiveOpsMap() {
  const mapRef       = useRef(null);
  const mapInstance  = useRef(null);
  const mapLoaded    = useRef(false);
  const channelRef   = useRef(null);
  const popupRef     = useRef(null);

  const [partners,    setPartners]    = useState([]);
  const [activeJobs,  setActiveJobs]  = useState([]);
  const [lastUpdate,  setLastUpdate]  = useState(null);
  const [selected,    setSelected]    = useState(null);
  const [loading,     setLoading]     = useState(true);

  // ── Load data ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const [{ data: ws }, { data: jobs }] = await Promise.all([
      supabase
        .from('workers')
        .select('id,full_name,partner_role,status,current_lat,current_lng,rating,city')
        .not('current_lat', 'is', null)
        .not('current_lng', 'is', null),
      supabase
        .from('bookings')
        .select('id,service,address,status,worker_id')
        .in('status', ['confirmed', 'on_way', 'in_progress', 'arrived']),
    ]);
    setPartners(ws || []);
    setActiveJobs(jobs || []);
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  // ── Init map ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: MAP_STYLE,
      center: NAIROBI,
      zoom: 12,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      mapLoaded.current = true;

      // GeoJSON source — all partners with GPS
      map.addSource('partners', {
        type: 'geojson',
        data: partnersToGeoJSON([]),
      });

      // Glow ring for active partners (on_way / in_progress)
      map.addLayer({
        id: 'partners-glow',
        type: 'circle',
        source: 'partners',
        filter: ['==', ['get', 'isActive'], true],
        paint: {
          'circle-radius': 20,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.18,
          'circle-blur': 0.6,
        },
      });

      // Main dot layer
      map.addLayer({
        id: 'partners-dot',
        type: 'circle',
        source: 'partners',
        paint: {
          'circle-radius': ['case', ['==', ['get', 'isActive'], true], 10, 7],
          'circle-color': ['get', 'color'],
          'circle-stroke-width': ['case', ['==', ['get', 'isActive'], true], 2.5, 1.5],
          'circle-stroke-color': '#ffffff',
          'circle-opacity': ['case', ['==', ['get', 'status'], 'offline'], 0.4, 1],
        },
      });

      // Cursor change
      map.on('mouseenter', 'partners-dot', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'partners-dot', () => { map.getCanvas().style.cursor = ''; });

      // Click popup
      map.on('click', 'partners-dot', (e) => {
        const p = e.features[0].properties;
        const roleMeta   = ROLE_META[p.role]   || ROLE_META.worker;
        const statusMeta = STATUS_META[p.status] || STATUS_META.available;

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({ offset: 14, className: 'ops-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="background:#ffffff;border:1px solid #EDF0F5;border-radius:10px;padding:12px 14px;min-width:180px;font-family:-apple-system,sans-serif;box-shadow:0 8px 24px rgba(15,27,45,0.12);">
              <div style="font-size:14px;font-weight:800;color:#0F1B2D;margin-bottom:4px;">${p.name}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
                <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;background:${roleMeta.color}18;color:${roleMeta.color};border:1px solid ${roleMeta.color}40;">${roleMeta.icon} ${roleMeta.label.slice(0,-1)}</span>
                <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;background:${statusMeta.color}18;color:${statusMeta.color};border:1px solid ${statusMeta.color}40;">${statusMeta.label}</span>
              </div>
              ${p.rating ? `<div style="font-size:11px;color:#7A8699;">⭐ ${Number(p.rating).toFixed(1)} rating</div>` : ''}
            </div>
          `)
          .addTo(map);

        setSelected(p);
      });

      // Dismiss popup on map click
      map.on('click', (e) => {
        if (!e.features?.length && popupRef.current) {
          popupRef.current.remove();
          setSelected(null);
        }
      });

      loadData();
    });

    mapInstance.current = map;
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      map.remove();
      mapInstance.current = null;
      mapLoaded.current = false;
    };
  }, []);

  // ── Realtime subscription ──────────────────────────────────
  useEffect(() => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase
      .channel('admin-live-ops')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'workers' }, () => {
        loadData();
      })
      .subscribe();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [loadData]);

  // ── Update map source when partners change ─────────────────
  useEffect(() => {
    if (!mapLoaded.current || !mapInstance.current) return;
    const src = mapInstance.current.getSource('partners');
    if (src) {
      src.setData(partnersToGeoJSON(partners));
      setLastUpdate(new Date());
    }
  }, [partners]);

  // ── Stats ──────────────────────────────────────────────────
  const onlineByRole = Object.entries(ROLE_META).map(([role, meta]) => ({
    ...meta,
    role,
    count: partners.filter(p => p.partner_role === role).length,
    active: partners.filter(p => p.partner_role === role && ['on_way', 'in_progress'].includes(p.status)).length,
  })).filter(r => r.count > 0);

  const totalOnline = partners.length;
  const totalActive = partners.filter(p => ['on_way', 'in_progress'].includes(p.status)).length;

  const flyTo = (partner) => {
    if (!mapInstance.current || !partner.current_lat) return;
    mapInstance.current.flyTo({ center: [partner.current_lng, partner.current_lat], zoom: 15, speed: 1.4 });
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden', background: '#F5F7FB' }}>

      {/* ── Left stats sidebar ── */}
      <div style={{ width: 260, flexShrink: 0, background: '#FFFFFF', borderRight: '1px solid #EDF0F5', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #EDF0F5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', boxShadow: '0 0 6px rgba(22,163,74,0.5)' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', letterSpacing: 1 }}>LIVE OPERATIONS</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: '#F5F7FB', border: '1px solid #EDF0F5', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0F1B2D' }}>{loading ? '…' : totalOnline}</div>
              <div style={{ fontSize: 10, color: '#7A8699', marginTop: 2 }}>Partners online</div>
            </div>
            <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#16A34A' }}>{loading ? '…' : totalActive}</div>
              <div style={{ fontSize: 10, color: '#7A8699', marginTop: 2 }}>On active jobs</div>
            </div>
          </div>
        </div>

        {/* By role */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #EDF0F5' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#7A8699', letterSpacing: 1, marginBottom: 10 }}>BY ROLE</div>
          {loading ? (
            <div style={{ color: '#7A8699', fontSize: 12 }}>Loading…</div>
          ) : onlineByRole.length === 0 ? (
            <div style={{ color: '#7A8699', fontSize: 12 }}>No partners online with GPS</div>
          ) : onlineByRole.map(r => (
            <div key={r.role} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#334155', flex: 1 }}>{r.icon} {r.label}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#0F1B2D' }}>{r.count}</span>
              {r.active > 0 && <span style={{ fontSize: 10, color: '#16A34A', background: 'rgba(22,163,74,0.1)', padding: '1px 6px', borderRadius: 4 }}>{r.active} active</span>}
            </div>
          ))}
        </div>

        {/* Active jobs */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #EDF0F5' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#7A8699', letterSpacing: 1, marginBottom: 10 }}>
            ACTIVE JOBS ({activeJobs.length})
          </div>
          {activeJobs.length === 0 ? (
            <div style={{ color: '#7A8699', fontSize: 12 }}>No active jobs</div>
          ) : activeJobs.slice(0, 8).map(j => {
            const stMeta = STATUS_META[j.status] || STATUS_META.available;
            return (
              <div key={j.id} style={{ marginBottom: 8, padding: '8px 10px', background: '#F5F7FB', border: '1px solid #EDF0F5', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0F1B2D', marginBottom: 2 }}>{j.service || 'Service'}</div>
                <div style={{ fontSize: 10, color: '#7A8699', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.address || '—'}</div>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: stMeta.color + '18', color: stMeta.color, border: `1px solid ${stMeta.color}30` }}>{stMeta.label}</span>
              </div>
            );
          })}
          {activeJobs.length > 8 && <div style={{ fontSize: 11, color: '#7A8699', textAlign: 'center', marginTop: 6 }}>+{activeJobs.length - 8} more jobs</div>}
        </div>

        {/* Partner list — click to fly to */}
        <div style={{ padding: '12px 16px', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#7A8699', letterSpacing: 1, marginBottom: 10 }}>PARTNERS ON MAP</div>
          {partners.length === 0 ? (
            <div style={{ color: '#7A8699', fontSize: 12 }}>No GPS data yet</div>
          ) : partners.map(p => {
            const roleMeta   = ROLE_META[p.partner_role] || ROLE_META.worker;
            const statusMeta = STATUS_META[p.status] || STATUS_META.available;
            const isActive   = ['on_way', 'in_progress'].includes(p.status);
            return (
              <div key={p.id} onClick={() => flyTo(p)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px 10px', background: isActive ? 'rgba(22,163,74,0.06)' : '#F5F7FB', border: `1px solid ${isActive ? 'rgba(22,163,74,0.2)' : '#EDF0F5'}`, borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#EDF0F5'}
                onMouseLeave={e => e.currentTarget.style.background = isActive ? 'rgba(22,163,74,0.06)' : '#F5F7FB'}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: roleMeta.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0F1B2D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.full_name || 'Partner'}</div>
                  <div style={{ fontSize: 10, color: statusMeta.color }}>{statusMeta.label}</div>
                </div>
                <span style={{ fontSize: 10, color: roleMeta.color }}>{roleMeta.icon}</span>
              </div>
            );
          })}
        </div>

        {/* Last update */}
        {lastUpdate && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid #EDF0F5', fontSize: 10, color: '#B7BFCC' }}>
            Last updated: {lastUpdate.toLocaleTimeString('en-KE')}
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Legend */}
        <div style={{ position: 'absolute', top: 12, right: 52, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', border: '1px solid #EDF0F5', borderRadius: 10, padding: '10px 14px', zIndex: 10, boxShadow: '0 4px 16px rgba(15,27,45,0.08)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#7A8699', letterSpacing: 1, marginBottom: 8 }}>LEGEND</div>
          {Object.entries(ROLE_META).map(([role, m]) => (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
              <span style={{ fontSize: 10, color: '#334155' }}>{m.icon} {m.label}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #EDF0F5', marginTop: 8, paddingTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(74,144,217,0.2)', border: '2px solid #4A90D9' }} />
              <span style={{ fontSize: 10, color: '#334155' }}>Active (on job)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4A90D9' }} />
              <span style={{ fontSize: 10, color: '#334155' }}>Idle / GPS on</span>
            </div>
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, border: '3px solid rgba(201,160,32,0.3)', borderTopColor: '#C9A020', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
              <div style={{ color: '#C9A020', fontSize: 12 }}>Loading live data…</div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>

      {/* MapLibre popup light theme override */}
      <style>{`
        .ops-popup .maplibregl-popup-content { background: transparent !important; border: none !important; padding: 0 !important; box-shadow: none !important; }
        .ops-popup .maplibregl-popup-tip { display: none !important; }
      `}</style>
    </div>
  );
}
