import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '../supabase';

const NAIROBI_CENTER = [36.8167, -1.2833];

const NEIGHBOURHOODS = [
  { name: 'Westlands',     lat: -1.2676, lng: 36.8087 },
  { name: 'Kilimani',      lat: -1.2924, lng: 36.7821 },
  { name: 'Karen',         lat: -1.3183, lng: 36.6876 },
  { name: 'Lavington',     lat: -1.2836, lng: 36.7724 },
  { name: 'Parklands',     lat: -1.2602, lng: 36.8144 },
  { name: 'Kasarani',      lat: -1.2217, lng: 36.8918 },
  { name: 'Kileleshwa',    lat: -1.2784, lng: 36.7830 },
  { name: 'Gigiri',        lat: -1.2330, lng: 36.8120 },
  { name: 'Runda',         lat: -1.2233, lng: 36.8100 },
  { name: 'Muthaiga',      lat: -1.2428, lng: 36.8358 },
  { name: 'Spring Valley', lat: -1.2578, lng: 36.7780 },
  { name: 'Upperhill',     lat: -1.2938, lng: 36.8170 },
  { name: 'CBD',           lat: -1.2833, lng: 36.8167 },
  { name: 'Eastleigh',     lat: -1.2750, lng: 36.8470 },
  { name: 'South B',       lat: -1.3200, lng: 36.8340 },
  { name: 'South C',       lat: -1.3225, lng: 36.8200 },
  { name: 'Langata',       lat: -1.3433, lng: 36.7485 },
  { name: 'Dagoretti',     lat: -1.2940, lng: 36.7530 },
  { name: 'Roysambu',      lat: -1.2186, lng: 36.8745 },
  { name: 'Ruiru',         lat: -1.1441, lng: 36.9601 },
  { name: 'Thika Road',    lat: -1.2144, lng: 36.8918 },
  { name: 'Embakasi',      lat: -1.3200, lng: 36.8920 },
  { name: 'Buruburu',      lat: -1.2952, lng: 36.8657 },
  { name: 'Donholm',       lat: -1.3003, lng: 36.8819 },
  { name: 'Ruaka',         lat: -1.2076, lng: 36.7777 },
  { name: 'Kikuyu',        lat: -1.2474, lng: 36.6635 },
  { name: 'Rongai',        lat: -1.3944, lng: 36.7459 },
  { name: 'Ngong',         lat: -1.3577, lng: 36.6594 },
  { name: 'Syokimau',      lat: -1.3570, lng: 36.9030 },
  { name: 'Kitengela',     lat: -1.4747, lng: 36.9622 },
];

function matchNeighbourhood(address) {
  if (!address) return null;
  const addr = address.toLowerCase();
  for (const n of NEIGHBOURHOODS) {
    if (addr.includes(n.name.toLowerCase())) return n;
  }
  return null;
}

export default function BookingHeatmap() {
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const mapLoaded = useRef(false);
  const [rankings,      setRankings]      = useState([]);
  const [underServed,   setUnderServed]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [totalMapped,   setTotalMapped]   = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);

  const buildGeoJSON = (countsMap) => {
    const features = [];
    Object.values(countsMap).forEach(n => {
      for (let i = 0; i < n.count; i++) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [n.lng, n.lat] },
          properties: {},
        });
      }
    });
    return { type: 'FeatureCollection', features };
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('bookings')
      .select('address,status,created_at')
      .gte('created_at', since);

    const counts = {};
    let mapped = 0;
    (data || []).forEach(b => {
      const n = matchNeighbourhood(b.address);
      if (!n) return;
      mapped++;
      if (!counts[n.name]) counts[n.name] = { ...n, count: 0, completed: 0 };
      counts[n.name].count++;
      if (b.status === 'completed') counts[n.name].completed++;
    });

    const ranked = Object.values(counts).sort((a, b) => b.count - a.count);
    const served = new Set(ranked.map(r => r.name));
    const under  = NEIGHBOURHOODS.filter(n => !served.has(n.name));

    setRankings(ranked);
    setUnderServed(under.slice(0, 8));
    setTotalMapped(mapped);
    setTotalBookings(data?.length || 0);

    if (mapLoaded.current && mapInst.current) {
      const src = mapInst.current.getSource('bookings-heat');
      if (src) src.setData(buildGeoJSON(counts));
    }

    setLoading(false);
    return buildGeoJSON(counts);
  }, []);

  useEffect(() => {
    let geoData = { type: 'FeatureCollection', features: [] };

    loadData().then(geo => { geoData = geo; });

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: NAIROBI_CENTER,
      zoom: 11,
      attributionControl: false,
    });
    mapInst.current = map;

    map.on('load', () => {
      mapLoaded.current = true;

      map.addSource('bookings-heat', {
        type: 'geojson',
        data: geoData,
      });

      map.addLayer({
        id: 'bookings-heatmap',
        type: 'heatmap',
        source: 'bookings-heat',
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 9, 1, 14, 3],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,    'rgba(0,0,255,0)',
            0.15, 'rgba(0,135,200,0.6)',
            0.35, 'rgba(65,182,196,0.8)',
            0.55, 'rgba(199,233,180,0.9)',
            0.75, 'rgba(253,174,97,1)',
            1,    'rgba(215,25,28,1)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 9, 22, 14, 50],
          'heatmap-opacity': 0.88,
        },
      });

      // Refresh data into source now that map is ready
      loadData();
    });

    return () => {
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
      mapLoaded.current = false;
    };
  }, []);

  const maxCount = rankings[0]?.count || 1;

  const barColor = (pct) => {
    if (pct >= 75) return '#e74a3b';
    if (pct >= 40) return '#F6AD55';
    if (pct >= 15) return '#48BB78';
    return '#4A90D9';
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden', background: '#0A0E1A' }}>
      {/* Sidebar */}
      <div style={{ width: 290, flexShrink: 0, background: '#0F1420', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ color: '#C9A020', fontSize: 11, fontWeight: 800, letterSpacing: 2, marginBottom: 2 }}>BOOKING HEATMAP</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Last 90 days</div>
          {!loading && (
            <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
              <div>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>{totalMapped}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>MAPPED</div>
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: 800 }}>{totalBookings - totalMapped}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>UNMATCHED</div>
              </div>
              <div>
                <div style={{ color: '#48BB78', fontSize: 18, fontWeight: 800 }}>{rankings.length}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>AREAS</div>
              </div>
            </div>
          )}
        </div>

        {/* Rankings */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', paddingTop: 40 }}>Loading bookings…</div>
          ) : (
            <>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>TOP NEIGHBOURHOODS</div>
              {rankings.map((n, i) => {
                const pct = Math.round((n.count / maxCount) * 100);
                const completionPct = n.count > 0 ? Math.round((n.completed / n.count) * 100) : 0;
                const color = barColor(pct);
                return (
                  <div key={n.name} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                        <span style={{ color: 'rgba(255,255,255,0.25)', marginRight: 6, fontSize: 10 }}>#{i + 1}</span>
                        {n.name}
                      </span>
                      <span style={{ color, fontSize: 12, fontWeight: 800 }}>{n.count}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 3 }}>
                      {completionPct}% completion · {n.count - n.completed} still open
                    </div>
                  </div>
                );
              })}

              {/* Under-served */}
              {underServed.length > 0 && (
                <div style={{ marginTop: 18, padding: '10px 12px', background: 'rgba(231,74,59,0.08)', border: '1px solid rgba(231,74,59,0.18)', borderRadius: 8 }}>
                  <div style={{ color: '#e74a3b', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, marginBottom: 8 }}>UNDER-SERVED — 0 BOOKINGS</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginBottom: 4 }}>Recruit partners in these areas:</div>
                  {underServed.map(n => (
                    <div key={n.name} style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 3 }}>· {n.name}</div>
                  ))}
                </div>
              )}

              {/* Legend */}
              <div style={{ marginTop: 18, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>HEAT SCALE</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'linear-gradient(to right, rgba(0,135,200,0.6), rgba(65,182,196,0.8), rgba(199,233,180,0.9), rgba(253,174,97,1), rgba(215,25,28,1))' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>Low</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>High</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ flex: 1 }} />
    </div>
  );
}
