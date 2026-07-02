import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FixeraLogo from './FixeraLogo';

const ROLE_MEDIA = {
  worker: {
    type: 'cycle',
    slides: [
      { img: '/services/clean-deep.webp',     caption: 'Professional cleaning services' },
      { img: '/services/paint-interior.webp', caption: 'Expert interior painting' },
      { img: '/services/clean-house.webp',    caption: 'Home cleaning specialists' },
      { img: '/services/paint-exterior.webp', caption: 'Quality exterior finishing' },
    ],
    quotes: [
      'Your skills build homes and livelihoods.',
      'Every job you finish is a family served.',
      'Skilled hands create beautiful spaces.',
      'Your craft is your superpower — own it.',
    ],
  },
  rider: {
    type: 'cycle',
    slides: [
      { img: '/services/motobike.png',        caption: 'Fast motorbike delivery' },
      { img: '/services/van-delivery-2.webp', caption: 'Reliable van delivery' },
    ],
    quotes: [
      'Every delivery counts. Every km earns.',
      'Speed, reliability — that\'s your brand.',
      'Nairobi moves because you do.',
      'On time, every time — that\'s your promise.',
    ],
  },
  vendor: {
    type: 'static',
    img: '/services/vendor-hero.jpg',
    caption: 'Scale your business with Fixera',
    quotes: [
      'Your shop, Nairobi\'s favourite.',
      'More orders. More growth. More impact.',
      'Fixera brings customers to your door.',
      'Run your business smarter, not harder.',
    ],
  },
  supplier: {
    type: 'static',
    img: '/services/supplier-hero.webp',
    caption: 'Supply the city, grow your reach',
    quotes: [
      'The city runs on what you supply.',
      'Quality products, trusted by professionals.',
      'Your stock keeps Nairobi building.',
      'Great work starts with great materials — that\'s you.',
    ],
  },
  mover: {
    type: 'video',
    src: '/services/movers-video.mp4',
    caption: 'Move Nairobi forward',
    quotes: [
      'You carry dreams from one home to the next.',
      'Every move is a new beginning you make possible.',
      'Trust, strength, and reliability — that\'s your team.',
      'Nairobi relocates because you show up.',
    ],
  },
  water_carrier: {
    type: 'static',
    img: '/services/water-carrier.png',
    caption: 'Keep Nairobi flowing',
    quotes: [
      'You keep Nairobi hydrated and thriving.',
      'Clean water delivered — lives changed daily.',
      'Your service is essential. Your impact is real.',
      'Where taps fall short, you show up.',
    ],
  },
};

const ROLE_LABELS = {
  worker: 'Service Worker', rider: 'Rider / Courier', vendor: 'Business / Vendor',
  supplier: 'Supplier', mover: 'Mover', water_carrier: 'Water Carrier',
};

function MediaPanel({ role }) {
  const media = ROLE_MEDIA[role] || ROLE_MEDIA.worker;
  const [idx, setIdx] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    if (media.type !== 'cycle') return;
    const t = setInterval(() => setIdx(i => (i + 1) % media.slides.length), 3500);
    return () => clearInterval(t);
  }, [media]);

  useEffect(() => {
    const quotes = media.quotes || [];
    if (quotes.length < 2) return;
    const t = setInterval(() => setQuoteIdx(i => (i + 1) % quotes.length), 6000);
    return () => clearInterval(t);
  }, [media]);

  const caption = media.type === 'cycle' ? media.slides[idx]?.caption : media.caption;
  const quote   = (media.quotes || [])[quoteIdx] || '';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#0A1628' }}>

      {/* Static image */}
      {media.type === 'static' && (
        <img src={media.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
      )}

      {/* Cycling images */}
      {media.type === 'cycle' && (
        <AnimatePresence mode="wait">
          <motion.img key={idx} src={media.slides[idx].img} alt=""
            initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        </AnimatePresence>
      )}

      {/* Video */}
      {media.type === 'video' && (
        <video autoPlay muted loop playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(1.15) contrast(1.08) saturate(1.1)' }}>
          <source src={media.src} type="video/mp4" />
          <source src="/services/movers-video2.mp4" type="video/mp4" />
        </video>
      )}

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,22,40,0.4) 0%, rgba(10,22,40,0.3) 40%, rgba(10,22,40,0.9) 100%)' }} />

      {/* Content */}
      <div style={{ position: 'absolute', inset: 0, padding: '44px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ filter: 'drop-shadow(0 0 18px rgba(201,160,32,0.75)) drop-shadow(0 0 6px rgba(201,160,32,0.5))' }}>
            <FixeraLogo size={48} showText={false} forceDark={true} />
          </div>
          <div>
            <div style={{ color: '#C9A020', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Partner Portal</div>
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 800, marginTop: 1 }}>{ROLE_LABELS[role]}</div>
          </div>
        </div>

        {/* Bottom section */}
        <div>
          <div style={{ color: '#C9A020', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>Fixera Partner</div>

          {/* Caption */}
          <AnimatePresence mode="wait">
            <motion.p key={caption} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              style={{ margin: '0 0 16px', color: '#fff', fontSize: 26, fontWeight: 800, lineHeight: 1.3, maxWidth: 320 }}>
              {caption}
            </motion.p>
          </AnimatePresence>

          {/* Motivational quote */}
          {quote && (
            <AnimatePresence mode="wait">
              <motion.div key={quoteIdx}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.5 }}
                style={{ borderLeft: '3px solid #C9A020', paddingLeft: 14, marginBottom: 16 }}>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.82)', fontSize: 13, fontStyle: 'italic', lineHeight: 1.6 }}>
                  "{quote}"
                </p>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Dots for cycling */}
          {media.type === 'cycle' && (
            <div style={{ display: 'flex', gap: 6 }}>
              {media.slides.map((_, i) => (
                <div key={i} onClick={() => setIdx(i)}
                  style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, background: i === idx ? '#C9A020' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.3s' }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PartnerAuthLayout({ role, children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .partner-auth-photo { flex: 1.3; position: relative; }
        .partner-auth-form  { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 24px; background: #F7F8FA; overflow-y: auto; }
        @media (max-width: 860px) {
          .partner-auth-photo { display: none; }
          .partner-auth-form  { padding: 32px 20px; }
        }
      `}</style>
      <div className="partner-auth-photo">
        <MediaPanel role={role} />
      </div>
      <div className="partner-auth-form">
        {children}
      </div>
    </div>
  );
}
