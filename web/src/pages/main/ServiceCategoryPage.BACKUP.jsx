import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { C } from '../../theme';
import { SERVICES } from '../../data/services';
import { getCategories } from '../../services/catalogService';

const MODE_STYLE = {
  'nearest':         { bg: 'rgba(72,187,120,0.12)',  border: 'rgba(72,187,120,0.35)',  color: '#68D391', label: '📍 Nearest Match' },
  'pickup-delivery': { bg: 'rgba(66,153,225,0.12)',  border: 'rgba(66,153,225,0.35)',  color: '#63B3ED', label: '🚚 Pickup & Delivery' },
  'hybrid':          { bg: 'rgba(237,137,54,0.12)',  border: 'rgba(237,137,54,0.35)',  color: '#F6AD55', label: '🔄 Onsite or Pickup' },
  'onsite':          { bg: 'rgba(159,122,234,0.12)', border: 'rgba(159,122,234,0.35)', color: '#B794F4', label: '🏠 Onsite Service' },
};

export default function ServiceCategoryPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [dbCategories, setDbCategories] = useState([]);
  useEffect(() => {
    getCategories().then(data => { if (data?.length) setDbCategories(data); }).catch(() => {});
  }, []);

  if (serviceId === 'movers') { navigate('/movers', { replace: true }); return null; }

  // Try DB first (match by slug), fall back to hardcoded
  const dbMatch = dbCategories.find(c => c.slug === serviceId);
  const svc = dbMatch
    ? { id: dbMatch.slug, name: dbMatch.name, icon: dbMatch.icon, color: dbMatch.color, description: dbMatch.description, categories: [] }
    : SERVICES.find(s => s.id === serviceId);

  if (!svc) return (
    <div style={{ padding:32, color:C.textMuted, textAlign:'center' }}>Service not found.</div>
  );

  return (
    <div style={{ padding:32, minHeight:'100vh', background:C.navy }}>
      <style>{`
        .cat-card:hover { transform:translateY(-4px) !important; border-color:#8DB83A50 !important; box-shadow:0 14px 36px rgba(0,0,0,0.4) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28 }}>
        <button onClick={() => navigate('/home')} style={{
          width:40, height:40, borderRadius:12, border:`1px solid ${C.navyBorder}`,
          background:C.navyLight, color:C.textPrimary, fontSize:18, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>←</button>
        <div style={{
          width:52, height:52, borderRadius:16,
          background:`${svc.color}20`, border:`1px solid ${svc.color}35`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:28,
        }}>{svc.icon}</div>
        <div>
          <div style={{ color:C.textPrimary, fontSize:22, fontWeight:900 }}>{svc.name}</div>
          <div style={{ color:C.textMuted, fontSize:13, marginTop:2 }}>{svc.categories?.length || 0} categories available</div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background:C.navyLight, border:`1px solid ${C.navyBorder}`, borderRadius:16, padding:'14px 22px', marginBottom:24, display:'flex', gap:28, flexWrap:'wrap' }}>
        {[
          { label:'Categories', val: svc.categories?.length || 0 },
          { label:'Avg Rating', val: '4.8 ⭐' },
          { label:'Response', val: '< 2 hrs' },
          { label:'Availability', val: '24/7' },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ color:C.gold, fontSize:17, fontWeight:800 }}>{s.val}</div>
            <div style={{ color:C.textMuted, fontSize:11, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Not Sure Banner */}
      <div
        onClick={() => navigate('/inspection')}
        style={{
          background: 'linear-gradient(135deg, rgba(201,160,32,0.12), rgba(201,160,32,0.06))',
          border: `1px solid ${C.gold}40`, borderRadius: 16, padding: '16px 20px',
          marginBottom: 18, cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold + '80'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.gold + '40'; e.currentTarget.style.transform = 'none'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 30 }}>🤔</div>
          <div>
            <div style={{ color: C.gold, fontSize: 14, fontWeight: 800 }}>Not Sure About The Problem?</div>
            <div style={{ color: C.textSec, fontSize: 12, marginTop: 2 }}>Request an inspection — describe & upload photos, we'll send a quotation</div>
          </div>
        </div>
        <div style={{ background: C.gold, color: '#0A0E1A', fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
          Request Inspection →
        </div>
      </div>

      {/* Category grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:14 }}>
        {svc.categories?.map(cat => {
          const isEmergency = cat.emergency;
          const mode = cat.serviceMode ? MODE_STYLE[cat.serviceMode] : null;

          // Smart services get their own dedicated routes
          const handleClick = () => {
            if (cat.specialRoute) return navigate(cat.specialRoute);
            navigate(`/service/${serviceId}/${cat.id}`);
          };

          return (
            <div
              key={cat.id}
              className="cat-card"
              onClick={handleClick}
              style={{
                background: isEmergency ? 'rgba(80,0,0,0.4)' : C.navyLight,
                border: isEmergency ? '1px solid rgba(255,100,100,0.3)' : `1px solid ${C.navyBorder}`,
                borderRadius:18, padding:'22px 18px', cursor:'pointer',
                transition:'all 0.2s ease', boxShadow:'0 4px 14px rgba(0,0,0,0.2)',
                position:'relative', overflow:'hidden',
              }}
            >
              {isEmergency && (
                <div style={{
                  position:'absolute', top:12, right:12,
                  background:'rgba(200,50,50,0.8)', color:'#fff',
                  fontSize:9, fontWeight:800, letterSpacing:1.5,
                  padding:'3px 8px', borderRadius:20,
                }}>🚨 EMERGENCY</div>
              )}
              <div style={{
                width:54, height:54, borderRadius:15,
                background: isEmergency ? 'rgba(255,80,80,0.15)' : `${svc.color}18`,
                border: isEmergency ? '1px solid rgba(255,100,100,0.3)' : `1px solid ${svc.color}28`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:26, marginBottom:14,
              }}>{cat.icon || svc.icon}</div>
              <div style={{ color:C.textPrimary, fontSize:14, fontWeight:800, marginBottom:4 }}>{cat.name}</div>
              {cat.description && (
                <div style={{ color:C.textMuted, fontSize:11, marginBottom:8, lineHeight:1.4 }}>{cat.description}</div>
              )}
              {!cat.description && (
                <div style={{ color:C.textMuted, fontSize:12, marginBottom:8 }}>
                  {cat.services?.length || 0} services
                </div>
              )}
              {/* Service mode badge */}
              {mode && !isEmergency && (
                <div style={{ display:'inline-flex', alignItems:'center', gap:4, background: mode.bg, border:`1px solid ${mode.border}`, borderRadius:20, padding:'3px 10px', marginBottom:10 }}>
                  <span style={{ color: mode.color, fontSize:10, fontWeight:700 }}>{mode.label}</span>
                </div>
              )}
              <div style={{ display:'inline-block', background: isEmergency ? 'rgba(200,50,50,0.2)' : C.goldDim, border:`1px solid ${isEmergency ? 'rgba(200,50,50,0.4)' : C.gold+'40'}`, borderRadius:20, padding:'4px 12px', color: isEmergency ? '#FC8181' : C.gold, fontSize:11, fontWeight:700 }}>
                {isEmergency ? 'Call Now →' : cat.specialRoute ? 'Find Nearest →' : 'View Services →'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
