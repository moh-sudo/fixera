import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Store } from 'lucide-react';
import { SERVICES } from '../../data/services';
import { getCategories } from '../../services/catalogService';
import { PRODUCT_CATEGORIES } from '../../services/supplierShopService';
import { useAuth } from '../../hooks/useAuth';
import { useUserLocation } from '../../hooks/useUserLocation';
import { supabase } from '../../supabase';
import AnnouncementBanner from '../../components/AnnouncementBanner';

import { useCL } from '../../hooks/useCL';

// Hero banner — every service we offer, with real photos + valid routes
const SERVICE_SLIDES = [
  { name: 'Plumbing',       tagline: 'Leaks, installs & repairs',    img: '/services/plumbing.webp',   route: '/service/plumbing' },
  { name: 'Electrical',     tagline: 'Wiring, sockets & safe fixes', img: '/services/electrical.webp', route: '/service/electrical' },
  { name: 'Cleaning',       tagline: 'Deep cleans & home upkeep',    img: '/services/cleaning.webp',   route: '/service/cleaning' },
  { name: 'Painting',       tagline: 'Interior & exterior finishes', img: '/services/painting.webp',   route: '/service/painting' },
  { name: 'Movers',         tagline: 'Home & office relocation',     img: '/services/movers.webp',     route: '/movers' },
  { name: 'Water Delivery', tagline: 'Clean water to your door',     img: '/services/water.webp',      route: '/service/water-carriers' },
];

const SERVICE_PHOTO = {
  plumbing: '/services/plumbing.webp', electrical: '/services/electrical.webp',
  cleaning: '/services/cleaning.webp', painting: '/services/painting.webp',
  movers: '/services/movers.webp', 'water-carriers': '/services/water.webp',
};

const FEATURED_WORKERS = [
  { name: 'Amina Juma',     role: 'Cleaning',   rating: 4.9, jobs: 142, color: '#4FD1C5' },
  { name: 'James Mwangi',   role: 'Plumbing',   rating: 4.8, jobs: 98,  color: '#4A90D9' },
  { name: 'Grace Odhiambo', role: 'Painting',   rating: 4.9, jobs: 76,  color: '#FC8A4D' },
  { name: 'Ali Hassan',     role: 'Electrical', rating: 4.7, jobs: 114, color: '#F6C90E' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' } }),
};

export default function HomePage() {
  const CL = useCL();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const displayName = profile?.fullName || profile?.full_name || user?.displayName || user?.email?.split('@')[0] || 'There';
  const rawFirst = displayName.split(' ')[0];
  const firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const userLocation = useUserLocation();

  const [slide, setSlide] = useState(0);
  const [search, setSearch] = useState('');
  const [dbServices, setDbServices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const touchStartX = useRef(0);

  // Preload all banner + service grid images immediately on mount
  useEffect(() => {
    const allImgs = [
      ...SERVICE_SLIDES.map(s => s.img),
      ...Object.values(SERVICE_PHOTO),
    ];
    const seen = new Set();
    allImgs.forEach(src => {
      if (seen.has(src)) return;
      seen.add(src);
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Auto-rotate hero every 4s
  useEffect(() => {
    const t = setInterval(() => setSlide(i => (i + 1) % SERVICE_SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Load DB categories (fallback to hardcoded)
  useEffect(() => {
    getCategories().then(data => { if (data && data.length > 0) setDbServices(data); }).catch(() => {});
  }, []);

  // Load distinct supplier stores
  useEffect(() => {
    supabase
      .from('vendor_products')
      .select('business_id, category, supplier:business_id(full_name, business_name, area, verification_status)')
      .eq('in_stock', true)
      .eq('status', 'approved')
      .then(({ data }) => {
        const map = {};
        (data || []).forEach(p => {
          if (!p.supplier || p.supplier.verification_status === 'rejected') return;
          if (!map[p.business_id]) map[p.business_id] = { id: p.business_id, ...p.supplier, categories: [] };
          if (p.category && !map[p.business_id].categories.includes(p.category))
            map[p.business_id].categories.push(p.category);
        });
        setSuppliers(Object.values(map));
      });
  }, []);

  // Load receipts
  useEffect(() => {
    if (!user) return;
    supabase.from('receipts').select('*').eq('customer_id', user.id)
      .order('generated_at', { ascending: false }).limit(3)
      .then(({ data, error }) => { if (!error) setReceipts(data || []); });
  }, [user]);

  // Always show all 6 hardcoded services — DB only provides name/icon/color overrides
  const serviceSource = SERVICES.map(s => {
    const dbMatch = dbServices.find(d => d.slug === s.id);
    return dbMatch ? { ...s, name: dbMatch.name, icon: dbMatch.icon, color: dbMatch.color } : s;
  });

  const filtered = serviceSource.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const goService = (id) => navigate(id === 'movers' ? '/movers' : `/service/${id}`);

  return (
    <div style={{ minHeight: '100vh', background: CL.bg, fontFamily: 'Inter, sans-serif', paddingBottom: 40 }}>
      <style>{`
        .h-card:hover { transform: translateY(-4px); box-shadow: 0 14px 32px rgba(10,22,40,0.10); }
        .h-input:focus { border-color: ${CL.gold}; box-shadow: 0 0 0 3px rgba(201,160,32,0.18); }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* Header: greeting + location */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
        style={{ padding: '24px 22px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: CL.muted, fontSize: 13 }}>{greeting},</div>
          <div style={{ color: CL.text, fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>{firstName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
            <span style={{ fontSize: 13 }}>📍</span>
            <span style={{ color: CL.muted, fontSize: 13 }}>{userLocation ? userLocation.full : 'Nairobi, Kenya'}</span>
            <span style={{ color: CL.gold, fontSize: 11, marginLeft: 2 }}>▼</span>
          </div>
        </div>
        <div onClick={() => navigate('/profile')} style={{
          width: 44, height: 44, borderRadius: 14, background: CL.navy,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <User size={20} color="#fff" strokeWidth={1.8} />
        </div>
      </motion.div>

      {/* Search */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" style={{ padding: '16px 22px 0' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.45 }}>🔍</span>
          <input className="h-input" value={search} onChange={e => setSearch(e.target.value)}
            placeholder='Search "Cleaning", "Electrician"...'
            style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 14, border: `1px solid ${CL.border}`,
              background: CL.surface, color: CL.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }} />
          {search && <span onClick={() => setSearch('')} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: CL.light, fontSize: 20 }}>×</span>}
        </div>
      </motion.div>

      {/* HERO: all-services rotating banner */}
      {!search && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" style={{ padding: '18px 22px 0' }}>
          <div
            onClick={() => navigate(SERVICE_SLIDES[slide].route)}
            onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
              const diff = touchStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 40) setSlide(i => diff > 0 ? (i + 1) % SERVICE_SLIDES.length : (i - 1 + SERVICE_SLIDES.length) % SERVICE_SLIDES.length);
            }}
            style={{ position: 'relative', height: 'clamp(180px, 22vw, 340px)', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 10px 28px rgba(10,22,40,0.12)', userSelect: 'none' }}>
            <AnimatePresence>
              <motion.div key={slide}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{ position: 'absolute', inset: 0, background: '#0A1628' }}>
                <img src={SERVICE_SLIDES[slide].img} alt={SERVICE_SLIDES[slide].name}
                  fetchpriority={slide === 0 ? 'high' : 'auto'}
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,22,40,0.85) 0%, rgba(10,22,40,0.5) 55%, rgba(10,22,40,0.15) 100%)' }} />
                <div style={{ position: 'absolute', left: 22, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '72%' }}>
                  <span style={{ color: CL.gold, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Book trusted services</span>
                  <span style={{ color: '#fff', fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>{SERVICE_SLIDES[slide].name}</span>
                  <span style={{ color: '#cfd6df', fontSize: 13, marginTop: 5 }}>{SERVICE_SLIDES[slide].tagline}</span>
                  <span style={{ marginTop: 12, background: CL.gold, color: '#fff', fontSize: 13, fontWeight: 700, padding: '9px 18px', borderRadius: 10, alignSelf: 'flex-start' }}>Book now</span>
                </div>
              </motion.div>
            </AnimatePresence>
            <div style={{ position: 'absolute', bottom: 12, right: 16, display: 'flex', gap: 6, zIndex: 2 }}>
              {SERVICE_SLIDES.map((_, i) => (
                <div key={i} onClick={e => { e.stopPropagation(); setSlide(i); }} style={{
                  width: i === slide ? 20 : 6, height: 6, borderRadius: 3, cursor: 'pointer', transition: 'all 0.25s',
                  background: i === slide ? CL.gold : 'rgba(255,255,255,0.55)' }} />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Announcements */}
      <div style={{ padding: '14px 22px 0' }}>
        <AnnouncementBanner audience="customers" />
      </div>

      {/* Service categories */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" style={{ padding: '16px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ color: CL.text, fontSize: 17, fontWeight: 800 }}>{search ? `Results for "${search}"` : 'Our services'}</div>
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: CL.light, fontSize: 14 }}>😕 No services found</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
            {filtered.map(svc => (
              <div key={svc.id} className="h-card" onClick={() => goService(svc.id)}
                style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 4px 14px rgba(10,22,40,0.05)' }}>
                <div style={{ position: 'relative', height: 96, background: `${svc.color || CL.gold}15` }}>
                  {SERVICE_PHOTO[svc.id] ? (
                    <img src={SERVICE_PHOTO[svc.id]} alt={svc.name} loading="lazy" decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>{svc.icon}</div>
                  )}
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ color: CL.text, fontSize: 14, fontWeight: 700 }}>{svc.name}</div>
                  <div style={{ color: CL.gold, fontSize: 12, fontWeight: 700, marginTop: 6 }}>Book →</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Suppliers & Vendors */}
      {!search && suppliers.length > 0 && (
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" style={{ padding: '20px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ color: CL.text, fontSize: 17, fontWeight: 800 }}>Suppliers & Vendors</div>
            <span onClick={() => navigate('/shop')} style={{ color: CL.gold, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Browse all →</span>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {suppliers.slice(0, 8).map(s => (
              <div key={s.id} onClick={() => navigate('/shop')} className="h-card"
                style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '14px 14px 12px', minWidth: 155, flexShrink: 0, cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 4px 14px rgba(10,22,40,0.05)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: CL.goldSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Store size={20} color={CL.gold} strokeWidth={2} />
                </div>
                <div style={{ color: CL.text, fontSize: 13, fontWeight: 700, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.business_name || s.full_name}</div>
                <div style={{ color: CL.muted, fontSize: 11, marginBottom: 8 }}>{s.area || 'Nairobi'}</div>
                {s.categories.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {s.categories.slice(0, 2).map(cat => {
                      const label = PRODUCT_CATEGORIES.find(c => c.id === cat)?.label || cat;
                      return (
                        <span key={cat} style={{ background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 8, padding: '2px 7px', fontSize: 9, color: CL.muted, whiteSpace: 'nowrap' }}>
                          {label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Supplies shop */}
      {!search && (
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show" style={{ padding: '18px 22px 0' }}>
          <div onClick={() => navigate('/shop')} style={{
            background: CL.goldSoft, border: `1px solid ${CL.gold}40`, borderRadius: 18, padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
            <div style={{ fontSize: 32 }}>🛒</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: CL.text, fontSize: 15, fontWeight: 800 }}>Supplies Shop</div>
              <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>Paint, cleaning, tools & more — delivered to you</div>
            </div>
            <div style={{ color: CL.gold, fontSize: 20, fontWeight: 800 }}>→</div>
          </div>
        </motion.div>
      )}

      {/* Top professionals */}
      {!search && (
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show" style={{ padding: '24px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ color: CL.text, fontSize: 17, fontWeight: 800 }}>Top professionals</div>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
            {FEATURED_WORKERS.map((w, i) => (
              <div key={i} className="h-card" style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '16px', minWidth: 150, textAlign: 'center', cursor: 'pointer', transition: 'all 0.25s', flexShrink: 0, boxShadow: '0 4px 14px rgba(10,22,40,0.05)' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: `${w.color}20`, border: `2px solid ${w.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <User size={22} color={w.color} strokeWidth={1.8} />
                </div>
                <div style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>{w.name}</div>
                <div style={{ color: CL.muted, fontSize: 11, marginTop: 3 }}>{w.role}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 9, background: CL.goldSoft, borderRadius: 8, padding: '4px 10px' }}>
                  <span style={{ color: CL.gold, fontSize: 12, fontWeight: 700 }}>★ {w.rating}</span>
                  <span style={{ color: CL.muted, fontSize: 11 }}>· {w.jobs} jobs</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* My receipts */}
      {!search && receipts.length > 0 && (
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show" style={{ padding: '24px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ color: CL.text, fontSize: 17, fontWeight: 800 }}>My receipts</div>
            <span onClick={() => navigate('/history')} style={{ color: CL.gold, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>See all →</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {receipts.map(r => (
              <div key={r.id} style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: CL.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📄</div>
                  <div>
                    <div style={{ color: CL.text, fontSize: 14, fontWeight: 700 }}>{r.sub_service || r.service}</div>
                    <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>{r.receipt_no} · {new Date(r.generated_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: CL.success, fontSize: 13, fontWeight: 800 }}>KSh {(r.amount || 0).toLocaleString()}</span>
                  <button onClick={() => navigate(`/receipt/${r.booking_id}`)} style={{ padding: '6px 14px', borderRadius: 8, background: CL.successBg, border: `1px solid ${CL.success}40`, color: CL.success, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View</button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Emergency banner */}
      {!search && (
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show" style={{ padding: '24px 22px 0' }}>
          <div style={{ background: 'linear-gradient(135deg, #B3261E 0%, #D14438 100%)', borderRadius: 18, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: '#FFD7D2', fontSize: 10, fontWeight: 800, letterSpacing: 2, marginBottom: 4 }}>🚨 24/7 EMERGENCY</div>
              <div style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>Need urgent help?</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 3 }}>Priority dispatch · Under 30 minutes</div>
            </div>
            <button style={{ padding: '11px 20px', borderRadius: 12, border: 'none', background: '#fff', color: '#B3261E', fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>Call now</button>
          </div>
        </motion.div>
      )}
      </div>
    </div>
  );
}
