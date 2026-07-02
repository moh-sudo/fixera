import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../theme';
import { SERVICES } from '../../data/services';
import { getCategories } from '../../services/catalogService';
import { useAuth } from '../../hooks/useAuth';
import { useUserLocation } from '../../hooks/useUserLocation';
import { supabase } from '../../supabase';
import AnnouncementBanner from '../../components/AnnouncementBanner';
import { getActiveBanners } from '../../services/contentService';

const FALLBACK_PROMOS = [
  { id:1, bg:'linear-gradient(135deg,#C9A020,#D4B033)', text_color:'#0A0E1A', tag:'LIMITED OFFER', title:'First Booking Free!', subtitle:'Use code FIXERA1 at checkout', promo_code:'FIXERA1', emoji:'🎉' },
  { id:2, bg:'linear-gradient(135deg,#4A90D9,#63A8E8)', text_color:'#fff', tag:'NEW SERVICE', title:'Laundry & Ironing', subtitle:'From KSh 500 · Book in 60 seconds', promo_code:null, emoji:'👕' },
  { id:3, bg:'linear-gradient(135deg,#4FD1C5,#38B2AC)', text_color:'#fff', tag:'POPULAR', title:'Deep Cleaning Deal', subtitle:'Full home clean · Vetted pros', promo_code:'CLEAN20', emoji:'✨' },
  { id:4, bg:'linear-gradient(135deg,#9B59B6,#8E44AD)', text_color:'#fff', tag:'WEEKEND SPECIAL', title:'Electrician On Call', subtitle:'Same-day response guaranteed', promo_code:null, emoji:'⚡' },
];

const RECENT = [
  { id:1, service:'Deep House Cleaning', date:'May 12, 2026', worker:'Amina J.', rating:5, status:'Completed', icon:'✨', color:'#4FD1C5' },
  { id:2, service:'Pipe Leak Repair', date:'May 5, 2026', worker:'James M.', rating:4, status:'Completed', icon:'💧', color:'#4A90D9' },
];

const FEATURED_WORKERS = [
  { name:'Amina Juma', role:'Cleaning', rating:4.9, jobs:142, emoji:'👩', color:'#4FD1C5' },
  { name:'James Mwangi', role:'Plumbing', rating:4.8, jobs:98, emoji:'👨', color:'#4A90D9' },
  { name:'Grace Odhiambo', role:'Painting', rating:4.9, jobs:76, emoji:'👩', color:'#FC8A4D' },
  { name:'Ali Hassan', role:'Electrical', rating:4.7, jobs:114, emoji:'👨', color:'#F6C90E' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const displayName = profile?.fullName || profile?.full_name || user?.displayName || user?.email?.split('@')[0] || 'There';
  const rawFirst = displayName.split(' ')[0];
  const firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const userLocation = useUserLocation();
  const [promoIdx, setPromoIdx] = useState(0);
  const [promos,   setPromos]   = useState(FALLBACK_PROMOS);
  const [search, setSearch] = useState('');
  const touchStartX = useRef(0);
  const touchEndX   = useRef(0);

  // Load banners from DB, fall back to hardcoded if none active
  useEffect(() => {
    getActiveBanners().then(data => {
      if (data && data.length > 0) setPromos(data);
    }).catch(() => {});
  }, []);

  // Auto-rotate banner every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIdx(i => (i + 1) % promos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [promos.length]);

  const [dbServices, setDbServices] = useState([]);

  // Load service categories from DB — fall back to hardcoded SERVICES if DB is empty
  useEffect(() => {
    getCategories().then(data => {
      if (data && data.length > 0) setDbServices(data);
    }).catch(() => {});
  }, []);

  const [receipts, setReceipts] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('receipts')
      .select('*')
      .eq('customer_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(3)
      .then(({ data, error }) => { if (!error) setReceipts(data || []); });
  }, [user]);

  // Use DB categories if available, otherwise fall back to hardcoded SERVICES
  const serviceSource = dbServices.length > 0
    ? dbServices.map(d => ({ id: d.slug, name: d.name, icon: d.icon, color: d.color, description: d.description }))
    : SERVICES;

  const filtered = serviceSource.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding:'0 0 40px', minHeight:'100vh', background: C.navy }}>
      <style>{`
        .svc-card:hover { transform:translateY(-4px) !important; box-shadow:0 12px 32px rgba(0,0,0,0.4) !important; border-color:#C9A02040 !important; }
        .worker-card:hover { transform:translateY(-3px) !important; border-color:#C9A02040 !important; }
        .recent-card:hover { border-color:#C9A02055 !important; }
        .promo-dot { transition:all 0.25s ease; cursor:pointer; }
        .rebook-btn:hover { opacity:0.85; }
      `}</style>

      {/* ── Top Bar ── */}
      <div style={{ padding:'28px 32px 0', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ color: C.textMuted, fontSize:13, marginBottom:3 }}>👋 {greeting},</div>
          <div style={{ color:C.textPrimary, fontSize:26, fontWeight:800, letterSpacing:-0.5 }}>{firstName}</div>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:7 }}>
            <span style={{ fontSize:13 }}>📍</span>
            <span style={{ color:C.textSec, fontSize:13 }}>{userLocation ? userLocation.full : 'Detecting location...'}</span>
            <span style={{ color:C.gold, fontSize:11, cursor:'pointer', marginLeft:2 }}>▼</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <div style={{
            width:44, height:44, borderRadius:13, background:C.navyLight,
            border:`1px solid ${C.navyBorder}`, display:'flex', alignItems:'center',
            justifyContent:'center', cursor:'pointer', fontSize:19, position:'relative',
          }}>
            🔔
            <div style={{ position:'absolute', top:9, right:9, width:7, height:7, borderRadius:'50%', background:'#FC8181', border:`2px solid ${C.navy}` }} />
          </div>
          <div style={{
            width:44, height:44, borderRadius:13,
            background:`linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:21, cursor:'pointer',
          }} onClick={() => navigate('/profile')}>👤</div>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ padding:'18px 32px 0' }}>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', fontSize:16, opacity:0.4 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search "Deep Cleaning", "Electrician"...'
            style={{
              width:'100%', padding:'15px 44px 15px 44px', borderRadius:14,
              border:`1px solid ${C.navyBorder}`, background:C.navyLight,
              color:C.textPrimary, fontSize:14, fontFamily:'inherit',
              outline:'none', boxSizing:'border-box', transition:'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#C9A02060'}
            onBlur={e => e.target.style.borderColor = C.navyBorder}
          />
          {search && (
            <span onClick={() => setSearch('')} style={{
              position:'absolute', right:16, top:'50%', transform:'translateY(-50%)',
              cursor:'pointer', color:C.textMuted, fontSize:20, lineHeight:1,
            }}>×</span>
          )}
        </div>
      </div>

      {/* ── Promo Carousel ── */}
      {!search && (
        <div style={{ padding:'22px 32px 0' }}>
          <div
            onClick={() => setPromoIdx(i => (i + 1) % promos.length)}
            onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
              touchEndX.current = e.changedTouches[0].clientX;
              const diff = touchStartX.current - touchEndX.current;
              if (Math.abs(diff) > 40) {
                if (diff > 0) setPromoIdx(i => (i + 1) % promos.length);
                else setPromoIdx(i => (i - 1 + promos.length) % promos.length);
              }
            }}
            style={{
              borderRadius:22, padding:'22px 26px', background:promos[promoIdx]?.bg,
              color:promos[promoIdx]?.text_color, position:'relative', overflow:'hidden',
              transition:'background 0.5s ease', cursor:'pointer', minHeight:108,
              userSelect: 'none',
            }}
          >
            <div style={{ position:'absolute', right:-8, top:-8, fontSize:80, opacity:0.12, lineHeight:1 }}>
              {promos[promoIdx]?.emoji}
            </div>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:2.5, opacity:0.65, marginBottom:5 }}>{promos[promoIdx]?.tag}</div>
            <div style={{ fontSize:21, fontWeight:900, marginBottom:4 }}>{promos[promoIdx]?.title}</div>
            <div style={{ fontSize:13, opacity:0.7, marginBottom: promos[promoIdx]?.promo_code ? 12 : 0 }}>{promos[promoIdx]?.subtitle}</div>
            {promos[promoIdx]?.promo_code && (
              <div style={{ display:'inline-block', background:'rgba(0,0,0,0.18)', borderRadius:8, padding:'4px 14px', fontSize:12, fontWeight:800, letterSpacing:2 }}>
                {promos[promoIdx].promo_code}
              </div>
            )}
            {promos[promoIdx]?.link_path && (
              <button onClick={e => { e.stopPropagation(); navigate(promos[promoIdx].link_path); }}
                style={{ display:'block', marginTop:10, background:'rgba(0,0,0,0.18)', border:'none', borderRadius:8, padding:'5px 14px', fontSize:12, fontWeight:700, color:'inherit', cursor:'pointer', fontFamily:'inherit' }}>
                Learn more →
              </button>
            )}
            <div style={{ position:'absolute', bottom:14, right:18, display:'flex', gap:6 }}>
              {promos.map((_, i) => (
                <div key={i} className="promo-dot" onClick={e => { e.stopPropagation(); setPromoIdx(i); }} style={{
                  width: i === promoIdx ? 22 : 6, height:6, borderRadius:3,
                  background: i === promoIdx ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.18)',
                }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Announcements ── */}
      <div style={{ padding:'16px 32px 0' }}>
        <AnnouncementBanner audience="customers" />
      </div>

      {/* ── Services ── */}
      <div style={{ padding:'10px 32px 0' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ color:C.textPrimary, fontSize:18, fontWeight:800 }}>
            {search ? `Results for "${search}"` : 'Our Services'}
          </div>
          {!search && <span style={{ color:C.gold, fontSize:13, fontWeight:600, cursor:'pointer' }}>See all →</span>}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'36px 0', color:C.textMuted, fontSize:14 }}>
            😕 No services found for "{search}"
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:14 }}>
            {filtered.map(svc => (
              <div
                key={svc.id}
                className="svc-card"
                onClick={() => navigate(svc.id === 'movers' ? '/movers' : `/service/${svc.id}`)}
                style={{
                  background:C.navyLight, border:`1px solid ${C.navyBorder}`,
                  borderRadius:20, padding:'22px 16px', textAlign:'center',
                  cursor:'pointer', transition:'all 0.2s ease',
                  boxShadow:'0 4px 14px rgba(0,0,0,0.15)',
                }}
              >
                <div style={{
                  width:60, height:60, borderRadius:18,
                  background:`${svc.color}18`, border:`1px solid ${svc.color}30`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:30, margin:'0 auto 14px',
                }}>{svc.icon}</div>
                <div style={{ color:C.textPrimary, fontSize:14, fontWeight:800, marginBottom:5 }}>{svc.name}</div>
                <div style={{ color:C.textMuted, fontSize:11 }}>
                  {svc.categories?.length || 0} categories
                </div>
                <div style={{ marginTop:12, background:`${svc.color}20`, border:`1px solid ${svc.color}30`, borderRadius:20, padding:'4px 12px', display:'inline-block', color:svc.color, fontSize:11, fontWeight:700 }}>
                  Book →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Shop banner ── */}
      {!search && (
        <div style={{ padding:'20px 32px 0' }}>
          <div onClick={() => navigate('/shop')} style={{
            background:'linear-gradient(135deg, rgba(201,160,32,0.15), rgba(246,173,85,0.08))',
            border:'1px solid rgba(201,160,32,0.35)', borderRadius:20, padding:'18px 20px',
            display:'flex', alignItems:'center', gap:16, cursor:'pointer',
          }}>
            <div style={{ fontSize:36 }}>🛒</div>
            <div style={{ flex:1 }}>
              <div style={{ color:C.textPrimary, fontSize:16, fontWeight:800 }}>Supplies Shop</div>
              <div style={{ color:C.textMuted, fontSize:12, marginTop:2 }}>Paint, cleaning, tools, plumbing & electrical — delivered to you</div>
            </div>
            <div style={{ color:C.gold, fontSize:20, fontWeight:800 }}>→</div>
          </div>
        </div>
      )}

      {/* ── Top Professionals ── */}
      {!search && (
        <div style={{ padding:'26px 32px 0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ color:C.textPrimary, fontSize:18, fontWeight:800 }}>Top Professionals</div>
            <span style={{ color:C.gold, fontSize:13, fontWeight:600, cursor:'pointer' }}>View all →</span>
          </div>
          <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:6 }}>
            {FEATURED_WORKERS.map((w, i) => (
              <div key={i} className="worker-card" style={{
                background:C.navyLight, border:`1px solid ${C.navyBorder}`,
                borderRadius:18, padding:'18px 18px', minWidth:145,
                textAlign:'center', cursor:'pointer', transition:'all 0.2s ease', flexShrink:0,
              }}>
                <div style={{
                  width:50, height:50, borderRadius:'50%',
                  background:`${w.color}18`, border:`2px solid ${w.color}35`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:24, margin:'0 auto 10px',
                }}>{w.emoji}</div>
                <div style={{ color:C.textPrimary, fontSize:13, fontWeight:700 }}>{w.name}</div>
                <div style={{ color:C.textMuted, fontSize:11, marginTop:3 }}>{w.role}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginTop:9, background:`${w.color}10`, borderRadius:8, padding:'4px 0' }}>
                  <span style={{ color:C.gold, fontSize:12 }}>⭐ {w.rating}</span>
                  <span style={{ color:C.textMuted, fontSize:11 }}>· {w.jobs} jobs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Book Again ── */}
      {!search && RECENT.length > 0 && (
        <div style={{ padding:'26px 32px 0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ color:C.textPrimary, fontSize:18, fontWeight:800 }}>Book Again</div>
            <span onClick={() => navigate('/history')} style={{ color:C.gold, fontSize:13, fontWeight:600, cursor:'pointer' }}>Full history →</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
            {RECENT.map(r => (
              <div key={r.id} className="recent-card" style={{
                background:C.navyLight, border:`1px solid ${C.navyBorder}`,
                borderRadius:16, padding:'15px 18px',
                display:'flex', alignItems:'center', justifyContent:'space-between',
                cursor:'pointer', transition:'border-color 0.2s ease',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:13 }}>
                  <div style={{
                    width:44, height:44, borderRadius:12,
                    background:`${r.color}16`, border:`1px solid ${r.color}28`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
                  }}>{r.icon}</div>
                  <div>
                    <div style={{ color:C.textPrimary, fontSize:14, fontWeight:700 }}>{r.service}</div>
                    <div style={{ color:C.textMuted, fontSize:12, marginTop:2 }}>
                      {r.worker} · {r.date} · {'⭐'.repeat(r.rating)}
                    </div>
                  </div>
                </div>
                <button className="rebook-btn" style={{
                  padding:'8px 16px', borderRadius:10,
                  background:`linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                  border:'none', color:'#0A0E1A', fontSize:12, fontWeight:800,
                  cursor:'pointer', transition:'opacity 0.15s', whiteSpace:'nowrap',
                }}>Rebook</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── My Receipts ── */}
      {!search && receipts.length > 0 && (
        <div style={{ padding:'26px 32px 0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ color:C.textPrimary, fontSize:18, fontWeight:800 }}>My Receipts 📄</div>
            <span onClick={() => navigate('/history')} style={{ color:C.gold, fontSize:13, fontWeight:600, cursor:'pointer' }}>See all →</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {receipts.map(r => (
              <div key={r.id} style={{
                background:C.navyLight, border:`1px solid ${C.navyBorder}`,
                borderRadius:14, padding:'14px 18px',
                display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:'rgba(72,187,120,0.1)', border:'1px solid rgba(72,187,120,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                    📄
                  </div>
                  <div>
                    <div style={{ color:C.textPrimary, fontSize:14, fontWeight:700 }}>{r.sub_service || r.service}</div>
                    <div style={{ color:C.textSec, fontSize:12, marginTop:2 }}>
                      {r.receipt_no} · {new Date(r.generated_at).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ color:'#48BB78', fontSize:13, fontWeight:800 }}>KSh {(r.amount || 0).toLocaleString()}</span>
                  <button
                    onClick={() => navigate(`/receipt/${r.booking_id}`)}
                    style={{ padding:'6px 14px', borderRadius:8, background:'rgba(72,187,120,0.1)', border:'1px solid rgba(72,187,120,0.3)', color:'#48BB78', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Emergency Banner ── */}
      {!search && (
        <div style={{ padding:'24px 32px 0' }}>
          <div style={{
            background:'linear-gradient(135deg, #7B0000 0%, #9B1111 100%)',
            borderRadius:20, padding:'20px 24px',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            cursor:'pointer',
          }}>
            <div>
              <div style={{ color:'#FFA0A0', fontSize:10, fontWeight:800, letterSpacing:2.5, marginBottom:4 }}>🚨 24/7 EMERGENCY</div>
              <div style={{ color:'#fff', fontSize:17, fontWeight:800 }}>Need urgent help?</div>
              <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, marginTop:3 }}>Priority dispatch · Under 30 minutes</div>
            </div>
            <button style={{
              padding:'11px 20px', borderRadius:12, border:'none',
              background:'#fff', color:'#7B0000', fontSize:13, fontWeight:800,
              cursor:'pointer', whiteSpace:'nowrap',
            }}>Call Now</button>
          </div>
        </div>
      )}
    </div>
  );
}
