import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FixeraLogo from '../../components/FixeraLogo';
import GuestContactModal from '../../components/GuestContactModal';
import { useAuth } from '../../hooks/useAuth';
import { requestUserLocation } from '../../hooks/useUserLocation';

const SLIDES = [
  {
    title: 'Welcome aboard!',
    subtitle: "Get ready for the perfect home service experience. We'll match you with trusted professionals near you. Swipe to learn how! 👉",
    phone: (
      <div style={{ position:'relative', width:'100%', height:'100%', background:'linear-gradient(160deg,#0A0E1A,#111827)', borderRadius:28, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, padding:16 }}>
        <div style={{ filter:'drop-shadow(0 0 14px rgba(201,160,32,0.5))' }}>
          <FixeraLogo size={72} showText={true} showTagline={true} forceDark={true} />
        </div>
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          {['💧','⚡','✨','🎨'].map((ic,i) => (
            <div key={i} style={{ width:36, height:36, borderRadius:10, background:'rgba(201,160,32,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{ic}</div>
          ))}
        </div>
        <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:6, width:'80%' }}>
          {['Plumbing','Electrical','Cleaning','Painting'].map((s,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.06)', borderRadius:8, height:8, width:`${[100,85,95,70][i]}%` }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Track Your Booking',
    subtitle: "We'll keep you updated on your appointment progress and pair you with the best skilled professionals in real time. 🔔",
    phone: (
      <div style={{ position:'relative', width:'100%', height:'100%', background:'#f8faff', borderRadius:28, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, padding:18 }}>
        <div style={{ fontSize:52 }}>🔔</div>
        {[
          { label:'Booking Confirmed', color:'#4FD1C5', done:true },
          { label:'Professional Assigned', color:'#4A90D9', done:true },
          { label:'On Their Way', color:'#C9A020', done:false },
          { label:'Job Completed', color:'#8892A4', done:false },
        ].map((s,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, width:'90%' }}>
            <div style={{ width:24, height:24, borderRadius:'50%', background: s.done ? s.color : '#E0E0E0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#fff', fontWeight:900, flexShrink:0 }}>
              {s.done ? '✓' : i+1}
            </div>
            <div style={{ flex:1, height:7, borderRadius:4, background: s.done ? s.color : '#E0E0E0' }} />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Choose Your Professional',
    subtitle: 'Pick from our top-rated verified workers. See their ratings, experience and availability before you book. 👷',
    phone: (
      <div style={{ position:'relative', width:'100%', height:'100%', background:'#f8faff', borderRadius:28, padding:16, display:'flex', flexDirection:'column', gap:10, justifyContent:'center' }}>
        {[
          { name:'Amina J.', role:'Cleaning', rating:'4.9', emoji:'👩', color:'#4FD1C5', selected:true },
          { name:'James M.', role:'Plumbing', rating:'4.8', emoji:'👨', color:'#4A90D9', selected:false },
          { name:'Grace O.', role:'Painting', rating:'4.9', emoji:'👩', color:'#FC8A4D', selected:false },
        ].map((w,i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
            borderRadius:14, background: w.selected ? 'rgba(201,160,32,0.1)' : '#fff',
            border: w.selected ? '2px solid #C9A020' : '1px solid #E0E0E0',
          }}>
            <div style={{ width:38, height:38, borderRadius:'50%', background:`${w.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{w.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:13, color:'#0A0E1A' }}>{w.name}</div>
              <div style={{ fontSize:11, color:'#8892A4' }}>{w.role} · ⭐ {w.rating}</div>
            </div>
            {w.selected && <div style={{ width:20, height:20, borderRadius:'50%', background:'#C9A020', display:'flex', alignItems:'center', justifyContent:'center', color:'#0A0E1A', fontSize:11, fontWeight:900 }}>✓</div>}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Location Services',
    subtitle: "Fixera uses your location to find nearby professionals and give you accurate arrival times. We only check while you're in the app. 😊",
    phone: (
      <div style={{ position:'relative', width:'100%', height:'100%', background:'#e8f4fd', borderRadius:28, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {/* Map grid */}
        <div style={{ position:'absolute', inset:0 }}>
          {[20,40,60,80].map(pct => (
            <div key={pct} style={{ position:'absolute', left:0, right:0, top:`${pct}%`, height:1, background:'rgba(74,144,217,0.2)' }} />
          ))}
          {[20,40,60,80].map(pct => (
            <div key={pct} style={{ position:'absolute', top:0, bottom:0, left:`${pct}%`, width:1, background:'rgba(74,144,217,0.2)' }} />
          ))}
        </div>
        {/* Roads */}
        <div style={{ position:'absolute', left:0, right:0, top:'38%', height:12, background:'rgba(255,255,255,0.7)', borderRadius:2 }} />
        <div style={{ position:'absolute', top:0, bottom:0, left:'42%', width:12, background:'rgba(255,255,255,0.7)', borderRadius:2 }} />
        {/* Pin */}
        <div style={{ position:'relative', zIndex:2, textAlign:'center' }}>
          <div style={{ fontSize:52 }}>📍</div>
          <div style={{ background:'#C9A020', color:'#0A0E1A', fontSize:11, fontWeight:800, padding:'4px 12px', borderRadius:20, marginTop:4, whiteSpace:'nowrap' }}>
            Professional nearby
          </div>
        </div>
      </div>
    ),
  },
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const { continueAsGuest } = useAuth();
  const [slide, setSlide] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [splashOut, setSplashOut] = useState(false);
  const [fading, setFading] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  const handleGuestContinue = async (contact) => {
    await continueAsGuest(contact);
    requestUserLocation(); // start in background
    navigate('/home');
  };

  useEffect(() => {
    const t1 = setTimeout(() => setSplashOut(true), 1700);
    const t2 = setTimeout(() => setShowSplash(false), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const changeSlide = (i) => {
    setFading(true);
    setTimeout(() => { setSlide(i); setFading(false); }, 220);
  };

  const goNext = () => {
    if (slide < SLIDES.length - 1) changeSlide(slide + 1);
    else navigate('/signup');
  };

  /* ── SPLASH ── */
  if (showSplash) {
    return (
      <div style={{
        width:'100vw', height:'100vh',
        background:'linear-gradient(145deg,#0A0E1A 0%,#111827 100%)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        opacity: splashOut ? 0 : 1, transition:'opacity 0.4s ease',
      }}>
        <style>{`
          @keyframes splashPop { 0%{transform:scale(0.6);opacity:0} 70%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
          @keyframes splashSub { 0%{opacity:0;transform:translateY(12px)} 100%{opacity:1;transform:translateY(0)} }
        `}</style>
        <div style={{ textAlign:'center', animation:'splashPop 0.65s ease both' }}>
          <FixeraLogo size={100} showText={true} showTagline={true} forceDark={true} />
        </div>
      </div>
    );
  }

  const s = SLIDES[slide];

  /* ── ONBOARDING ── */
  return (
    <div style={{
      width:'100vw', height:'100vh',
      background:'var(--bg)',
      display:'flex', flexDirection:'column',
      alignItems:'center',
      fontFamily:'Inter, sans-serif',
      overflow:'hidden',
    }}>
      <style>{`
        @keyframes fadeUp { 0%{opacity:0;transform:translateY(18px)} 100%{opacity:1;transform:translateY(0)} }
        .next-btn:hover { opacity:0.88; transform:translateY(-2px); }
        .skip-btn:hover { color:var(--text-primary) !important; }
      `}</style>

      {/* ── Top: Logo + Skip ── */}
      <div style={{ width:'100%', maxWidth:440, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'32px 28px 0' }}>
        <FixeraLogo size={36} showText={true} showTagline={false} forceDark={false} />
        <button className="skip-btn" onClick={() => navigate('/login')} style={{
          background:'none', border:'none', color:'#7A8BA0', fontSize:14,
          cursor:'pointer', fontFamily:'inherit', fontWeight:600, transition:'color 0.15s',
        }}>Skip</button>
      </div>

      {/* ── Phone Mockup ── */}
      <div style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        width:'100%', maxWidth:440, padding:'24px 40px 0',
      }}>
        <div style={{
          width:220, height:380,
          borderRadius:36, background:'#2C2C2E',
          padding:6, boxShadow:'0 24px 64px rgba(0,0,0,0.18)',
          opacity: fading ? 0 : 1,
          transform: fading ? 'translateY(12px)' : 'translateY(0)',
          transition:'opacity 0.22s ease, transform 0.22s ease',
        }}>
          {/* Notch */}
          <div style={{ position:'relative', background:'#2C2C2E', borderRadius:'28px 28px 0 0', height:28, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'#1C1C1E', borderRadius:10, width:90, height:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:8, fontWeight:700, letterSpacing:1 }}>FIXERA</div>
            </div>
          </div>
          {/* Screen */}
          <div style={{ width:'100%', height:320, borderRadius:'0 0 28px 28px', overflow:'hidden' }}>
            {s.phone}
          </div>
        </div>
      </div>

      {/* ── Bottom content ── */}
      <div style={{
        width:'100%', maxWidth:440, padding:'28px 32px 40px',
        display:'flex', flexDirection:'column', alignItems:'center', gap:16,
        opacity: fading ? 0 : 1, transition:'opacity 0.22s ease',
      }}>
        {/* Title */}
        <div style={{ color:'var(--text-primary)', fontSize:26, fontWeight:900, textAlign:'center', lineHeight:1.2 }}>
          {s.title}
        </div>

        {/* Subtitle */}
        <div style={{ color:'var(--text-sec)', fontSize:14, lineHeight:1.75, textAlign:'center', maxWidth:340 }}>
          {s.subtitle}
        </div>

        {/* Dots */}
        <div style={{ display:'flex', gap:8, alignItems:'center', margin:'4px 0' }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => changeSlide(i)} style={{
              width: i === slide ? 28 : 8, height:8, borderRadius:4,
              background: i === slide ? '#C9A020' : 'rgba(201,160,32,0.2)',
              cursor:'pointer', transition:'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Next button */}
        <button className="next-btn" onClick={goNext} style={{
          width:'100%', padding:'18px 0', borderRadius:100,
          background:'linear-gradient(135deg, #C9A020, #D4B033)',
          border:'none', color:'#0A0E1A', fontSize:17, fontWeight:800,
          cursor:'pointer', letterSpacing:0.2,
          boxShadow:'0 8px 28px rgba(201,160,32,0.4)',
          transition:'all 0.15s ease',
        }}>
          {slide < SLIDES.length - 1 ? 'Next' : 'Get Started 🚀'}
        </button>

        {/* Login + Guest links */}
        {slide === SLIDES.length - 1 && (
          <>
            <div style={{ color:'#7A8BA0', fontSize:14 }}>
              Already have an account?{' '}
              <span onClick={() => navigate('/login')} style={{ color:'#C9A020', fontWeight:700, cursor:'pointer' }}>
                Log In
              </span>
            </div>
            <div
              onClick={() => setShowGuestModal(true)}
              style={{ color:'#7A8BA0', fontSize:13, cursor:'pointer', textDecoration:'underline', textDecorationColor:'rgba(122,139,160,0.4)' }}
            >
              👋 Just browsing? Continue as Guest
            </div>
          </>
        )}
      </div>

      {showGuestModal && (
        <GuestContactModal
          onContinue={handleGuestContinue}
          onClose={() => setShowGuestModal(false)}
        />
      )}
    </div>
  );
}
