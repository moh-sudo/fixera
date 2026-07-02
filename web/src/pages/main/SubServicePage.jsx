import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, AlertTriangle, Tag, ChevronRight } from 'lucide-react';
import { SERVICES, formatPrice } from '../../data/services';

import { useCL } from '../../hooks/useCL';

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

const SERVICE_PHOTOS = {
  plumbing:         '/services/plumbing.webp',
  electrical:       '/services/electrical.webp',
  cleaning:         '/services/cleaning.webp',
  painting:         '/services/painting.webp',
  movers:           '/services/movers.webp',
  'water-carriers': '/services/water.webp',
};

const PRICING_COLOR = {
  Fixed:     { bg: '#E7F6EE', text: '#1E9E5A', border: '#9AE6B4' },
  Quotation: { bg: '#EBF4FF', text: '#2B6CB0', border: '#90CDF4' },
  Priority:  { bg: '#FFF5F5', text: '#C53030', border: '#FEB2B2' },
  'Per KM':  { bg: '#F5F0FF', text: '#553C9A', border: '#B794F4' },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.05, ease: 'easeOut' } }),
};

export default function SubServicePage() {
  const CL = useCL();
  const { serviceId, categoryId } = useParams();
  const navigate = useNavigate();

  const svc = SERVICES.find(s => s.id === serviceId);
  const cat = svc?.categories?.find(c => c.id === categoryId);

  if (!svc || !cat) return (
    <div style={{ padding: 32, color: CL.muted, textAlign: 'center' }}>Category not found.</div>
  );

  const heroPhoto = CAT_PHOTOS[categoryId] || SERVICE_PHOTOS[serviceId];

  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>

      {/* ── Hero ── */}
      <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
        {heroPhoto && (
          <img src={heroPhoto} alt={cat.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,22,40,0.42) 0%, rgba(10,22,40,0.86) 100%)' }} />

        <div style={{ position: 'absolute', inset: 0, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <motion.button
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(`/service/${serviceId}`)}
            style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(10px)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={18} />
          </motion.button>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 3 }}>{svc.name}</div>
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>{cat.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>{cat.services?.length || 0} services available</div>
          </motion.div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
        style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '12px 0', display: 'flex' }}
      >
        {[
          { val: cat.services?.length || 0, label: 'Services' },
          { val: '4.8★',    label: 'Avg Rating' },
          { val: '< 2 hrs', label: 'Response' },
          { val: '24/7',    label: 'Available' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? `1px solid ${CL.border}` : 'none' }}>
            <div style={{ color: CL.navy, fontSize: 15, fontWeight: 800 }}>{s.val}</div>
            <div style={{ color: CL.muted, fontSize: 10, marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* ── Services list ── */}
      <div style={{ padding: '14px 14px 100px' }}>
        {cat.services?.map((sub, i) => {
          const pc = PRICING_COLOR[sub.pricingType] || PRICING_COLOR.Fixed;
          return (
            <motion.div
              key={sub.id} custom={i} variants={fadeUp} initial="hidden" animate="show"
              style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '15px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <span style={{ color: CL.navy, fontSize: 14, fontWeight: 800 }}>{sub.name}</span>
                  {sub.emergency && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 20, padding: '2px 7px' }}>
                      <AlertTriangle size={9} color="#E53E3E" />
                      <span style={{ color: '#E53E3E', fontSize: 9, fontWeight: 800 }}>EMERGENCY</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 20, padding: '3px 9px' }}>
                    <Clock size={10} color={CL.muted} />
                    <span style={{ color: CL.muted, fontSize: 10 }}>{sub.duration}</span>
                  </div>
                  <div style={{ background: pc.bg, border: `1px solid ${pc.border}`, borderRadius: 20, padding: '3px 9px' }}>
                    <span style={{ color: pc.text, fontSize: 10, fontWeight: 700 }}>{sub.pricingType}</span>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: CL.goldSoft, border: `1px solid ${CL.gold}30`, borderRadius: 20, padding: '3px 9px' }}>
                    <Tag size={10} color={CL.gold} />
                    <span style={{ color: CL.gold, fontSize: 10, fontWeight: 700 }}>{formatPrice(sub)}</span>
                  </div>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/book/${serviceId}/${categoryId}/${sub.id}`)}
                style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: CL.navy, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(10,22,40,0.18)', flexShrink: 0 }}
              >
                Book
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
