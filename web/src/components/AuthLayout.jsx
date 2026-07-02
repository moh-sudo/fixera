import { useState, useEffect } from 'react';
import FixeraLogo from './FixeraLogo';
import { useCL } from '../hooks/useCL';

const TAGLINES = [
  'Trusted pros, right at your door',
  'Verified, rated & reliable',
  'One call. We fix it all.',
  'Plumbing, cleaning, electrical & more',
];

// Looping typewriter — types a line, pauses, deletes, moves to the next, forever.
function LoopingTypewriter() {
  const [text, setText] = useState('');
  const [lineIdx, setLineIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = TAGLINES[lineIdx];
    let timeout;
    if (!deleting && text.length < current.length) {
      timeout = setTimeout(() => setText(current.slice(0, text.length + 1)), 55);
    } else if (!deleting && text.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 1900);
    } else if (deleting && text.length > 0) {
      timeout = setTimeout(() => setText(current.slice(0, text.length - 1)), 28);
    } else {
      setDeleting(false);
      setLineIdx(i => (i + 1) % TAGLINES.length);
    }
    return () => clearTimeout(timeout);
  }, [text, deleting, lineIdx]);

  return (
    <span style={{ color: '#fff', fontSize: 26, fontWeight: 700, lineHeight: 1.3 }}>
      {text}
      <span style={{ display: 'inline-block', width: 2, height: 24, background: '#C9A020', marginLeft: 3, verticalAlign: 'middle', animation: 'authBlink 0.8s step-end infinite' }} />
    </span>
  );
}

export default function AuthLayout({ children }) {
  const CL = useCL();
  return (
    <div className="auth-split" style={{ background: CL.bg }}>
      <style>{`
        @keyframes authBlink { 50% { opacity: 0; } }
        .auth-split { display: flex; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .auth-photo { flex: 1.35; position: relative; overflow: hidden; }
        .auth-form-area { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
        .auth-form-logo { display: none; }
        @media (max-width: 900px) {
          .auth-photo { display: none; }
          .auth-form-logo { display: block; }
        }
      `}</style>

      {/* Photo panel (desktop only) */}
      <div className="auth-photo">
        <img src="/services/welcome.webp" alt="" fetchpriority="high" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,22,40,0.55) 0%, rgba(10,22,40,0.45) 45%, rgba(10,22,40,0.92) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, padding: '48px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ filter: 'drop-shadow(0 0 18px rgba(201,160,32,0.75)) drop-shadow(0 0 6px rgba(201,160,32,0.5))' }}>
            <FixeraLogo size={48} showText={true} showTagline={false} forceDark={true} />
          </div>
          <div>
            <p style={{ margin: '0 0 10px', color: '#C9A020', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Fixera Home Services</p>
            <div style={{ minHeight: 70 }}><LoopingTypewriter /></div>
            <p style={{ margin: '12px 0 0', color: '#cfd6df', fontSize: 14, lineHeight: 1.6, maxWidth: 360 }}>
              Book verified professionals for plumbing, cleaning, electrical, painting, movers and more.
            </p>
          </div>
        </div>
      </div>

      {/* Form area */}
      <div className="auth-form-area">
        {children}
      </div>
    </div>
  );
}
