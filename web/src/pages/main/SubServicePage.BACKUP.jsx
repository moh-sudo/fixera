import { useNavigate, useParams } from 'react-router-dom';
import { C, PRICING_COLORS } from '../../theme';
import { SERVICES, formatPrice } from '../../data/services';

export default function SubServicePage() {
  const { serviceId, categoryId } = useParams();
  const navigate = useNavigate();
  const svc = SERVICES.find(s => s.id === serviceId);
  const cat = svc?.categories?.find(c => c.id === categoryId);

  if (!svc || !cat) return (
    <div style={{ padding:32, color:C.textMuted, textAlign:'center' }}>Category not found.</div>
  );

  return (
    <div style={{ padding:32, minHeight:'100vh', background:C.navy }}>
      <style>{`
        .sub-card:hover { border-color:#C9A02055 !important; transform:translateY(-2px) !important; }
        .book-btn:hover { opacity:0.88 !important; transform:translateY(-1px) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28 }}>
        <button onClick={() => navigate(`/service/${serviceId}`)} style={{
          width:40, height:40, borderRadius:12, border:`1px solid ${C.navyBorder}`,
          background:C.navyLight, color:C.textPrimary, fontSize:18, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>←</button>
        <div>
          <div style={{ color:C.textMuted, fontSize:12, marginBottom:3 }}>{svc.name} › {cat.name}</div>
          <div style={{ color:C.textPrimary, fontSize:22, fontWeight:900 }}>{cat.name}</div>
          <div style={{ color:C.textMuted, fontSize:13 }}>{cat.services?.length || 0} services available</div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        background:C.navyLight, border:`1px solid ${C.navyBorder}`,
        borderRadius:16, padding:'14px 20px', marginBottom:24,
        display:'flex', gap:24, flexWrap:'wrap',
      }}>
        {[
          { label:'Services', val: cat.services?.length || 0 },
          { label:'Avg Rating', val: '4.8 ⭐' },
          { label:'Response Time', val: '< 2 hrs' },
          { label:'Availability', val: '24/7' },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ color:C.gold, fontSize:16, fontWeight:800 }}>{s.val}</div>
            <div style={{ color:C.textMuted, fontSize:11, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Services list */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {cat.services?.map(sub => {
          const priceColor = PRICING_COLORS[sub.pricingType] || C.gold;
          return (
            <div key={sub.id} className="sub-card" style={{
              background:C.navyLight, border:`1px solid ${C.navyBorder}`,
              borderRadius:18, padding:'18px 20px',
              display:'flex', alignItems:'center', justifyContent:'space-between',
              gap:16, cursor:'pointer', transition:'all 0.2s ease',
            }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                  <div style={{ color:C.textPrimary, fontSize:15, fontWeight:800 }}>{sub.name}</div>
                  {sub.emergency && (
                    <span style={{ background:'rgba(255,80,80,0.15)', border:'1px solid rgba(255,100,100,0.3)', color:'#FFA0A0', fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:20, letterSpacing:1 }}>🚨 EMERGENCY</span>
                  )}
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span style={{ background:C.navyMid, color:C.textSec, fontSize:11, padding:'4px 12px', borderRadius:20 }}>⏱ {sub.duration}</span>
                  <span style={{ background:`${priceColor}15`, border:`1px solid ${priceColor}30`, color:priceColor, fontSize:11, padding:'4px 12px', borderRadius:20 }}>
                    {sub.pricingType}
                  </span>
                  <span style={{ background:'rgba(201,160,32,0.1)', color:C.gold, fontSize:11, padding:'4px 12px', borderRadius:20 }}>💰 {formatPrice(sub)}</span>
                </div>
              </div>
              <button
                className="book-btn"
                onClick={() => navigate(`/book/${serviceId}/${categoryId}/${sub.id}`)}
                style={{
                  padding:'11px 22px', borderRadius:12, border:'none',
                  background:`linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                  color:'#0A0E1A', fontSize:13, fontWeight:800,
                  cursor:'pointer', whiteSpace:'nowrap',
                  boxShadow:`0 4px 14px rgba(201,160,32,0.25)`,
                  transition:'all 0.15s ease',
                }}
              >Book →</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
