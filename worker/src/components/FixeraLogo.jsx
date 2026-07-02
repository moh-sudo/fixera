// CSS recreation of the Fixera logo:
// Gold ring → house roof → silver/gold F letter → FIXERA text

export default function FixeraLogo({ size = 56, showText = true, showTagline = false, forceDark = false }) {
  const s = size;
  const ring = s;
  const fontSize = s * 0.28;
  // Unique gradient IDs so multiple logos on same page don't clash
  const uid = forceDark ? 'fd' : 'fl';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: showText ? 6 : 0 }}>
      {/* ── Icon mark ── */}
      <div style={{ position: 'relative', width: ring, height: ring }}>
        {/* Outer gold ring */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: `${s * 0.045}px solid transparent`,
          background: `linear-gradient(135deg, #C9A020, #D4B033, #8A6A10, #C9A020) border-box`,
          WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'destination-out',
          maskComposite: 'exclude',
        }} />
        {/* Simpler gold ring */}
        <svg width={ring} height={ring} viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0 }}>
          {/* Gold ring with gap at top-right (like the logo) */}
          <circle cx="50" cy="50" r="44" fill="none"
            stroke={`url(#goldGrad-${uid})`} strokeWidth="5"
            strokeDasharray="240 40" strokeDashoffset="-10"
            strokeLinecap="butt"
          />
          {/* House roof shape */}
          <polyline points="20,52 50,22 80,52"
            fill="none" stroke={`url(#goldGrad-${uid})`} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"
          />
          {/* F letter — silver/white */}
          <text x="34" y="78" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="38"
            fill={`url(#silverGrad-${uid})`} letterSpacing="-1"
          >F</text>

          <defs>
            <linearGradient id={`goldGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#C9A020" />
              <stop offset="50%"  stopColor="#E8C84A" />
              <stop offset="100%" stopColor="#A07810" />
            </linearGradient>
            <linearGradient id={`silverGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor={forceDark ? '#E8E8E8' : 'var(--f-letter-start, #E8E8E8)'} />
              <stop offset="50%"  stopColor={forceDark ? '#FFFFFF' : 'var(--f-letter-mid,   #FFFFFF)'} />
              <stop offset="100%" stopColor={forceDark ? '#A8B0C0' : 'var(--f-letter-end,   #A8B0C0)'} />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ── FIXERA text ── */}
      {showText && (
        <div style={{ textAlign: 'center' }}>
          <div
            className={forceDark ? '' : 'fixera-logo-text'}
            style={{
              fontSize: fontSize * 1.1,
              fontWeight: 900,
              letterSpacing: fontSize * 0.18,
              lineHeight: 1,
              background: 'linear-gradient(135deg, #E8E8E8 0%, #FFFFFF 40%, #C9A020 60%, #D4B033 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>FIXERA</div>
          <div style={{
            fontSize: fontSize * 0.38,
            fontWeight: 700,
            letterSpacing: fontSize * 0.2,
            color: '#C9A020',
            marginTop: 2,
          }}>PARTNER PORTAL</div>
          {showTagline && (
            <div style={{
              fontSize: fontSize * 0.3,
              color: '#7A8BA0',
              letterSpacing: fontSize * 0.12,
              marginTop: 4,
              fontWeight: 600,
            }}>ONE CALL. WE FIX IT ALL.</div>
          )}
        </div>
      )}
    </div>
  );
}
