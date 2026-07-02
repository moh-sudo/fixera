import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  {
    img: '/services/plumbing.webp',
    role: 'Service Worker',
    caption: 'Turn your skills into steady income',
  },
  {
    img: '/services/motobike.png',
    role: 'Rider / Courier',
    caption: 'Fast motorbike delivery',
  },
  {
    img: '/services/riders.webp',
    role: 'Rider / Courier',
    caption: 'Every delivery is a new earning',
  },
  {
    img: '/services/vendor-hero.jpg',
    role: 'Vendor',
    caption: 'Scale your business with Fixera',
  },
  {
    img: '/services/supplier-hero.webp',
    role: 'Supplier',
    caption: 'Supply the city, grow your reach',
  },
  {
    img: '/services/movers.webp',
    role: 'Mover',
    caption: 'Move Nairobi forward',
  },
  {
    img: '/services/water.webp',
    role: 'Water Carrier',
    caption: 'Keep Nairobi flowing',
  },
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % SLIDES.length), 1800);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[idx];

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0A1628', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes fxBlink { 50% { opacity: 0; } }`}</style>

      {/* Cycling background photos */}
      <AnimatePresence mode="wait">
        <motion.img
          key={idx}
          src={slide.img}
          alt=""
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
        />
      </AnimatePresence>

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,22,40,0.3) 0%, rgba(10,22,40,0.45) 35%, rgba(10,22,40,0.97) 100%)' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 460, margin: '0 auto', padding: '0 28px' }}>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ paddingTop: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
        >
          <img src="/logo-mark.png" alt="Fixera" style={{ height: 72, width: 'auto' }} />
          <div style={{ color: '#C9A020', fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Partner Portal</div>
        </motion.div>

        {/* Bottom block */}
        <div style={{ marginTop: 'auto', paddingBottom: 48, textAlign: 'center' }}>

          {/* Role pill */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`role-${idx}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'inline-block', background: 'rgba(201,160,32,0.15)', border: '1px solid rgba(201,160,32,0.4)', color: '#C9A020', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20, marginBottom: 14 }}
            >
              {slide.role}
            </motion.div>
          </AnimatePresence>

          {/* Caption */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`caption-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              style={{ margin: '0 0 10px', fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.25, minHeight: 76 }}
            >
              {slide.caption}
            </motion.p>
          </AnimatePresence>

          <p style={{ margin: '0 0 30px', fontSize: 14, color: '#cfd6df', lineHeight: 1.6, maxWidth: 340, marginLeft: 'auto', marginRight: 'auto' }}>
            Join thousands of verified partners earning with Fixera across Nairobi.
          </p>

          {/* Dot indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
            {SLIDES.map((_, i) => (
              <div
                key={i}
                onClick={() => setIdx(i)}
                style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, background: i === idx ? '#C9A020' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.3s' }}
              />
            ))}
          </div>

          {/* CTA buttons */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/register')}
            style={{ width: '100%', padding: '17px 0', borderRadius: 12, background: '#C9A020', border: 'none', color: '#0A1628', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 10px 30px rgba(201,160,32,0.35)', marginBottom: 12 }}
          >
            Become a Partner
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/signin')}
            style={{ width: '100%', padding: '16px 0', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Sign In
          </motion.button>
        </div>
      </div>
    </div>
  );
}
