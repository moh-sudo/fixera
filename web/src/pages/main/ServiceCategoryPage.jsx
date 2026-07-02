import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, AlertTriangle, Search } from 'lucide-react';
import { SERVICES } from '../../data/services';
import { getCategories } from '../../services/catalogService';

import { useCL } from '../../hooks/useCL';

const SERVICE_PHOTOS = {
  plumbing:         '/services/plumbing.webp',
  electrical:       '/services/electrical.webp',
  cleaning:         '/services/cleaning.webp',
  painting:         '/services/painting.webp',
  movers:           '/services/movers.webp',
  'water-carriers': '/services/water.webp',
};

const CAT_PHOTOS = {
  'house-clean':       '/services/sub/clean-house.webp',
  'deep-clean':        '/services/sub/clean-deep.webp',
  'sofa':              '/services/sub/clean-sofa.webp',
  'carpet':            '/services/sub/clean-carpet.webp',
  'mattress':          '/services/sub/clean-mattress.webp',
  'windows':           '/services/sub/clean-windows.webp',
  'move-clean':        '/services/sub/clean-movein.webp',
  'post-const':        '/services/sub/clean-postconstruction.webp',
  'interior':          '/services/sub/paint-interior.webp',
  'exterior':          '/services/sub/paint-exterior.webp',
  'decorative':        '/services/sub/paint-decorative.webp',
  'wood-metal':        '/services/sub/paint-woodmetal.webp',
  'movein-paint':      '/services/sub/paint-movein.webp',
  'house-moving':      '/services/sub/move-house.webp',
  'office-moving':     '/services/sub/move-office.webp',
  'item-transport':    '/services/sub/move-item.webp',
  'packing-labor':     '/services/sub/move-packing.webp',
  'bulk-water':        '/services/sub/water-tanker.webp',
  'jerrycan-delivery': '/services/sub/water-jerrycan.webp',
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.06, ease: 'easeOut' } }),
};

export default function ServiceCategoryPage() {
  const CL = useCL();
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [dbCategories, setDbCategories] = useState([]);

  useEffect(() => {
    getCategories().then(d => { if (d?.length) setDbCategories(d); }).catch(() => {});
  }, []);

  if (serviceId === 'movers') { navigate('/movers', { replace: true }); return null; }

  const dbMatch = dbCategories.find(c => c.slug === serviceId);
  const hardcoded = SERVICES.find(s => s.id === serviceId);
  // Always use hardcoded categories — DB only provides name/icon/color overrides
  const svc = hardcoded
    ? { ...hardcoded, name: dbMatch?.name || hardcoded.name, icon: dbMatch?.icon || hardcoded.icon, color: dbMatch?.color || hardcoded.color }
    : null;

  if (!svc) return (
    <div style={{ padding: 32, color: CL.muted, textAlign: 'center' }}>Service not found.</div>
  );

  const heroPhoto = SERVICE_PHOTOS[serviceId];

  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>

      {/* ── Hero ── */}
      <div style={{ position: 'relative', height: 210, overflow: 'hidden' }}>
        {heroPhoto && (
          <img src={heroPhoto} alt={svc.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,22,40,0.45) 0%, rgba(10,22,40,0.82) 100%)' }} />

        <div style={{ position: 'absolute', inset: 0, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <motion.button
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/home')}
            style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(10px)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={18} />
          </motion.button>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              {svc.categories?.length || 0} categories
            </div>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>{svc.name}</div>
          </motion.div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
        style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '12px 0', display: 'flex' }}
      >
        {[
          { val: svc.categories?.length || 0, label: 'Categories' },
          { val: '4.8★',   label: 'Avg Rating' },
          { val: '< 2 hrs', label: 'Response' },
          { val: '24/7',   label: 'Available' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? `1px solid ${CL.border}` : 'none' }}>
            <div style={{ color: CL.navy, fontSize: 15, fontWeight: 800 }}>{s.val}</div>
            <div style={{ color: CL.muted, fontSize: 10, marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      <div style={{ padding: '14px 14px 100px' }}>

        {/* ── Inspection banner ── */}
        <motion.div
          custom={0} variants={fadeUp} initial="hidden" animate="show"
          onClick={() => navigate('/inspection')}
          whileTap={{ scale: 0.98 }}
          style={{ background: CL.goldSoft, border: `1px solid ${CL.gold}35`, borderRadius: 14, padding: '13px 16px', marginBottom: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${CL.gold}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={18} color={CL.gold} />
            </div>
            <div>
              <div style={{ color: CL.navy, fontSize: 13, fontWeight: 800 }}>Not Sure About The Problem?</div>
              <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>Request an inspection — we'll send a quotation</div>
            </div>
          </div>
          <ChevronRight size={16} color={CL.gold} />
        </motion.div>

        {/* ── Category grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 11 }}>
          {svc.categories?.map((cat, i) => {
            const photo = CAT_PHOTOS[cat.id];
            const isEmergency = cat.emergency;

            const handleClick = () => {
              if (cat.specialRoute) return navigate(cat.specialRoute);
              navigate(`/service/${serviceId}/${cat.id}`);
            };

            /* Photo card */
            if (photo && !isEmergency) {
              return (
                <motion.div
                  key={cat.id} custom={i + 1} variants={fadeUp} initial="hidden" animate="show"
                  onClick={handleClick} whileTap={{ scale: 0.96 }}
                  style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', position: 'relative', height: 148, boxShadow: '0 3px 14px rgba(0,0,0,0.12)' }}
                >
                  <img src={photo} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,22,40,0.88) 0%, rgba(10,22,40,0.08) 55%)' }} />

                  {cat.serviceMode && (
                    <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '3px 8px' }}>
                      <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>{cat.badge || cat.serviceMode}</span>
                    </div>
                  )}

                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 11px' }}>
                    <div style={{ color: '#fff', fontSize: 12, fontWeight: 800, marginBottom: 1 }}>{cat.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{cat.services?.length || 0} services</div>
                  </div>

                  <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 20, background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={12} color="#fff" />
                  </div>
                </motion.div>
              );
            }

            /* Icon card (plumbing, electrical, emergency) */
            return (
              <motion.div
                key={cat.id} custom={i + 1} variants={fadeUp} initial="hidden" animate="show"
                onClick={handleClick} whileTap={{ scale: 0.96 }}
                style={{ background: isEmergency ? '#FFF5F5' : CL.surface, border: `1px solid ${isEmergency ? '#FEB2B2' : CL.border}`, borderRadius: 16, padding: '16px 14px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', minHeight: 148, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  {isEmergency && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FED7D7', borderRadius: 20, padding: '2px 8px', marginBottom: 10 }}>
                      <AlertTriangle size={9} color="#E53E3E" />
                      <span style={{ color: '#E53E3E', fontSize: 9, fontWeight: 800, letterSpacing: 0.4 }}>EMERGENCY</span>
                    </div>
                  )}
                  <div style={{ fontSize: 30, marginBottom: 8 }}>{cat.icon || svc.icon}</div>
                  <div style={{ color: isEmergency ? '#C53030' : CL.navy, fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{cat.name}</div>
                  <div style={{ color: CL.muted, fontSize: 11 }}>{cat.services?.length || 0} services</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 10 }}>
                  <span style={{ color: isEmergency ? '#E53E3E' : CL.gold, fontSize: 11, fontWeight: 700 }}>
                    {isEmergency ? 'Call Now' : cat.specialRoute ? 'Find Nearest' : 'View Services'}
                  </span>
                  <ChevronRight size={12} color={isEmergency ? '#E53E3E' : CL.gold} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
