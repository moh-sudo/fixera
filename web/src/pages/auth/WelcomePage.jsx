import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import FixeraLogo from '../../components/FixeraLogo';
import GuestContactModal from '../../components/GuestContactModal';
import { useAuth } from '../../hooks/useAuth';
import { requestUserLocation } from '../../hooks/useUserLocation';

const TYPE_WHITE = 'Your home, in ';
const TYPE_GOLD = 'expert hands';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { continueAsGuest } = useAuth();
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [imgOk, setImgOk] = useState(true);

  // Typewriter — starts immediately, no delay
  const [white, setWhite] = useState('');
  const [gold, setGold] = useState('');
  const [typingDone, setTypingDone] = useState(false);

  useEffect(() => {
    let i = 0, j = 0, timer;
    function typeGold() {
      if (j <= TYPE_GOLD.length) {
        setGold(TYPE_GOLD.slice(0, j));
        j += 1;
        timer = setTimeout(typeGold, 70);
      } else {
        setTypingDone(true);
      }
    }
    function typeWhite() {
      if (i <= TYPE_WHITE.length) {
        setWhite(TYPE_WHITE.slice(0, i));
        i += 1;
        timer = setTimeout(typeWhite, 60);
      } else {
        typeGold();
      }
    }
    typeWhite(); // immediate
    return () => clearTimeout(timer);
  }, []);

  const handleGuestContinue = async (contact) => {
    await continueAsGuest(contact);
    requestUserLocation();
    navigate('/home');
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0A1628', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,600&display=swap');
        @keyframes fxBlink { 50% { opacity: 0; } }
      `}</style>

      {/* Background photo */}
      {imgOk && (
        <img
          src="/services/welcome.webp"
          alt=""
          onError={() => setImgOk(false)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 28%' }}
        />
      )}
      {/* Gradient overlay for legibility */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,22,40,0.25) 0%, rgba(10,22,40,0.45) 40%, rgba(10,22,40,0.96) 100%)' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 460, margin: '0 auto', padding: '0 28px' }}>

        {/* Logo top */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ paddingTop: 64, display: 'flex', justifyContent: 'center' }}
        >
          <FixeraLogo size={78} showText={true} showTagline={false} forceDark={true} />
        </motion.div>

        {/* Bottom block */}
        <div style={{ marginTop: 'auto', paddingBottom: 44, textAlign: 'center' }}>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ margin: '0 0 12px', fontSize: 13, color: '#C9A020', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}
          >
            Welcome to Fixera
          </motion.p>

          {/* Typewriter headline */}
          <p style={{ margin: '0 0 14px', fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 30, fontWeight: 600, color: '#fff', lineHeight: 1.25, minHeight: 78 }}>
            <span>{white}</span>
            <span style={{ color: '#C9A020' }}>{gold}</span>
            {!typingDone && (
              <span style={{ display: 'inline-block', width: 2, height: 26, background: '#C9A020', marginLeft: 3, verticalAlign: 'middle', animation: 'fxBlink 0.8s step-end infinite' }} />
            )}
          </p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{ margin: '0 0 26px', fontSize: 14, color: '#cfd6df', lineHeight: 1.6, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}
          >
            Verified professionals for every home need — one call and we fix it all.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/signup')}
            style={{ width: '100%', padding: '17px 0', borderRadius: 12, background: '#C9A020', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 10px 30px rgba(201,160,32,0.35)' }}
          >
            Get started
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            style={{ margin: '16px 0 0', fontSize: 14, color: '#cfd6df' }}
          >
            Already have an account?{' '}
            <span onClick={() => navigate('/login')} style={{ color: '#C9A020', fontWeight: 700, cursor: 'pointer' }}>Log in</span>
          </motion.p>

          <p
            onClick={() => setShowGuestModal(true)}
            style={{ margin: '14px 0 0', fontSize: 13, color: '#9AA6B5', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(154,166,181,0.4)' }}
          >
            Just browsing? Continue as guest
          </p>
        </div>
      </div>

      {showGuestModal && (
        <GuestContactModal onContinue={handleGuestContinue} onClose={() => setShowGuestModal(false)} />
      )}
    </div>
  );
}
