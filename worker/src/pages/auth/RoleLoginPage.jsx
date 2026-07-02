import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

const ROLES = [
  { id: 'worker',        label: 'Service Worker',    desc: 'Plumber, Electrician, Painter, Cleaner',           img: '/services/clean-house.webp' },
  { id: 'vendor',        label: 'Business / Vendor', desc: 'Laundry, Carpet Washing, Cleaning Station',        img: '/services/vendor-hero.jpg' },
  { id: 'rider',         label: 'Rider / Courier',   desc: 'Pickup & Delivery for laundry, carpets, products', img: '/services/motobike.png' },
  { id: 'supplier',      label: 'Supplier',          desc: 'Paint, Cleaning Products, Tools & Materials',      img: '/services/supplier-hero.webp' },
  { id: 'mover',         label: 'Mover',             desc: 'House moves, office relocation, item transport',   img: '/services/movers.webp' },
  { id: 'water_carrier', label: 'Water Carrier',     desc: 'Jerrycan, bulk water & bowser delivery',           img: '/services/water-carrier.png' },
];

const CL = { bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0', text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020' };

export default function RoleLoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [hovered, setHovered] = useState('');

  return (
    <div style={{ minHeight: '100vh', background: CL.bg, fontFamily: 'Inter, sans-serif', padding: '24px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Navy header */}
        <div style={{ background: '#0A1628', borderRadius: 20, padding: '28px 28px 24px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(201,160,32,0.08)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, position: 'relative' }}>
            <button onClick={() => navigate('/welcome')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: '6px 12px' }}>
              <ChevronLeft size={15} /> Back
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <img src="/logo-mark.png" alt="Fixera" style={{ height: 44, width: 'auto' }} />
            <div>
              <div style={{ color: '#C9A020', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Partner Portal</div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 800, marginTop: 2 }}>Who are you signing in as?</div>
            </div>
          </div>
        </div>

        <p style={{ color: CL.muted, fontSize: 14, marginBottom: 20, marginTop: 0 }}>Select your partner type to continue</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
          {ROLES.map(r => {
            const sel = role === r.id;
            return (
              <motion.div key={r.id}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onClick={() => setRole(r.id)}
                onMouseEnter={() => setHovered(r.id)}
                onMouseLeave={() => setHovered('')}
                style={{ borderRadius: 16, cursor: 'pointer', overflow: 'hidden', position: 'relative', height: 130,
                  border: `3px solid ${sel ? CL.gold : hovered === r.id ? 'rgba(201,160,32,0.4)' : 'transparent'}`,
                  boxShadow: sel ? '0 6px 24px rgba(201,160,32,0.25)' : '0 2px 8px rgba(10,22,40,0.08)',
                  transition: 'border 0.2s, box-shadow 0.2s' }}>
                <img src={r.img} alt={r.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,22,40,0.88) 0%, rgba(10,22,40,0.3) 100%)' }} />
                {sel && (
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: CL.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: sel ? '#C9A020' : '#fff', marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>{r.desc}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate(`/login/${role}`)} disabled={!role}
          style={{ width: '100%', padding: '15px 0', borderRadius: 12, border: 'none', fontFamily: 'inherit',
            background: role ? '#0A1628' : CL.border, color: role ? '#fff' : CL.muted,
            fontSize: 15, fontWeight: 700, cursor: role ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
          Continue as {ROLES.find(r => r.id === role)?.label || '…'}
        </motion.button>

        <p style={{ textAlign: 'center', marginTop: 18, color: CL.muted, fontSize: 14 }}>
          New here?{' '}
          <span onClick={() => navigate('/register')} style={{ color: CL.gold, fontWeight: 700, cursor: 'pointer' }}>Become a Partner</span>
        </p>
      </div>
    </div>
  );
}
